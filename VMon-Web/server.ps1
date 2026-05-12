# server.ps1
# Pode-based web server for VMon-Web
# Serves a REST API and a browser-based frontend for VM search and power management.

# --- 0. CHECK PREREQUISITES ---
if (-not (Get-Module -ListAvailable Pode)) {
    Write-Error "The Pode module is not installed. Install it with: Install-Module Pode -Scope CurrentUser -Force"
    exit 1
}

if (-not (Get-Module -ListAvailable VMware.VimAutomation.Core)) {
    Write-Error "The VMware PowerCLI module is not installed."
    exit 1
}

Import-Module Pode

# Capture script root so it's available inside Start-PodeServer's runspace
$script:ServerRoot = $PSScriptRoot

# --- 1. START PODE SERVER ---
Start-PodeServer -Threads 1 {

    # Import shared logic INSIDE Pode's runspace so functions are visible to route handlers
    $logicPath = Join-Path $script:ServerRoot 'VMon-Logic.ps1'
    if (Test-Path $logicPath) {
        . $logicPath
        Write-PodeHost "Loaded VMon-Logic.ps1 from: $logicPath"
    } else {
        Write-PodeHost "FATAL: VMon-Logic.ps1 not found at: $logicPath"
        exit 1
    }

    # Listen on all interfaces so LAN clients can reach us
    Add-PodeEndpoint -Address 0.0.0.0 -Port 8080 -Protocol Http
    Write-PodeHost "Pode endpoint added: 0.0.0.0:8080"

    # Enable CORS so browsers don't block fetch() when testing locally
    Add-PodeMiddleware -Name 'Cors' -ScriptBlock {
        Add-PodeHeader -Name 'Access-Control-Allow-Origin' -Value '*'
        Add-PodeHeader -Name 'Access-Control-Allow-Methods' -Value 'GET, POST, OPTIONS'
        Add-PodeHeader -Name 'Access-Control-Allow-Headers' -Value 'Content-Type'
        return $true
    }

    # Explicit CORS preflight handler for all paths
    Add-PodeRoute -Method Options -Path '*' -ScriptBlock {
        Set-PodeResponseStatus -Code 204
    }

    # --- 2. CONNECT TO VCENTER ON STARTUP ---
    try {
        $cachedCount = Connect-VMonServers
        Write-PodeHost "vCenter connections established. $cachedCount VMs cached."
    }
    catch {
        Write-PodeHost "WARNING: Failed to connect to vCenter servers: $($_.Exception.Message)"
    }

    # --- 3. DEBUG / TEST ROUTE ---
    Add-PodeRoute -Method Get -Path '/api/test' -ScriptBlock {
        try {
            Write-PodeHost "DEBUG: /api/test hit from $($WebEvent.Request.RemoteEndPoint)"
            Write-PodeJsonResponse -Value @{
                test      = 'hello'
                timestamp = (Get-Date -Format 'o')
                server    = $env:COMPUTERNAME
            }
        }
        catch {
            Write-PodeHost "ERROR in /api/test: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = $_.Exception.Message }
        }
    }

    # --- 4. API ROUTES ---

    # Health / Status
    Add-PodeRoute -Method Get -Path '/api/status' -ScriptBlock {
        try {
            Write-PodeHost "DEBUG: /api/status hit"
            $status = Get-VMonStatus
            Write-PodeHost "DEBUG: Get-VMonStatus returned Connected=$($status.Connected) VMCount=$($status.VMCount)"
            Write-PodeJsonResponse -Value @{
                connected = $status.Connected
                vmCount   = $status.VMCount
                servers   = $status.Servers
            }
        }
        catch {
            Write-PodeHost "ERROR in /api/status: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = $_.Exception.Message }
        }
    }

    # Search VMs
    Add-PodeRoute -Method Get -Path '/api/search' -ScriptBlock {
        try {
            Write-PodeHost "DEBUG: /api/search hit"
            $q = $WebEvent.Query['q']
            if ($q -is [array]) { $q = $q[0] }

            if ([string]::IsNullOrWhiteSpace($q) -or ([string]$q).Length -lt 2) {
                Set-PodeResponseStatus -Code 400
                Write-PodeJsonResponse -Value @{ error = 'Query must be at least 2 characters' }
                return
            }

            $status = Get-VMonStatus
            if (-not $status.Connected) {
                Set-PodeResponseStatus -Code 503
                Write-PodeJsonResponse -Value @{ error = 'Not connected to vCenter' }
                return
            }

            $result = Search-VMonCache -SearchTerm $q

            # Flatten results for JSON serialization
            $output = @($result.Results | ForEach-Object {
                @{
                    name       = $_.Name
                    id         = $_.Id
                    ip         = $_.IP
                    vcenter    = $_.vCenter
                    powerState = $_.PowerState
                }
            })

            Write-PodeJsonResponse -Value @{
                query   = $q
                count   = $output.Count
                results = $output
            }
        }
        catch {
            Write-PodeHost "ERROR in /api/search: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = $_.Exception.Message }
        }
    }

    # Power On
    Add-PodeRoute -Method Post -Path '/api/power-on' -ScriptBlock {
        try {
            Write-PodeHost "DEBUG: /api/power-on hit"
            $body = $WebEvent.Data
            if ($body -is [string]) {
                try {
                    $body = $body | ConvertFrom-Json
                } catch {
                    Set-PodeResponseStatus -Code 400
                    Write-PodeJsonResponse -Value @{ error = 'Invalid JSON in request body' }
                    return
                }
            }
            $vmId = $body.id

            if ([string]::IsNullOrWhiteSpace($vmId)) {
                Set-PodeResponseStatus -Code 400
                Write-PodeJsonResponse -Value @{ error = 'VM ID is required in request body' }
                return
            }

            $status = Get-VMonStatus
            if (-not $status.Connected) {
                Set-PodeResponseStatus -Code 503
                Write-PodeJsonResponse -Value @{ error = 'Not connected to vCenter' }
                return
            }

            # Validate VM exists before attempting power action
            $vm = $null
            try {
                $vm = Get-VM -Id $vmId -ErrorAction Stop
            } catch {
                Set-PodeResponseStatus -Code 404
                Write-PodeJsonResponse -Value @{ success = $false; error = 'VM not found' }
                return
            }

            Start-VM -VM $vm -Confirm:$false -RunAsync -ErrorAction Stop | Out-Null
            Write-PodeJsonResponse -Value @{
                success = $true
                message = "Powering ON: $($vm.Name)"
            }
        }
        catch {
            Write-PodeHost "ERROR in /api/power-on: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{
                success = $false
                error   = $_.Exception.Message
            }
        }
    }

    # Shutdown (graceful guest OS shutdown)
    Add-PodeRoute -Method Post -Path '/api/shutdown' -ScriptBlock {
        try {
            Write-PodeHost "DEBUG: /api/shutdown hit"
            $body = $WebEvent.Data
            if ($body -is [string]) {
                try {
                    $body = $body | ConvertFrom-Json
                } catch {
                    Set-PodeResponseStatus -Code 400
                    Write-PodeJsonResponse -Value @{ error = 'Invalid JSON in request body' }
                    return
                }
            }
            $vmId = $body.id

            if ([string]::IsNullOrWhiteSpace($vmId)) {
                Set-PodeResponseStatus -Code 400
                Write-PodeJsonResponse -Value @{ error = 'VM ID is required in request body' }
                return
            }

            $status = Get-VMonStatus
            if (-not $status.Connected) {
                Set-PodeResponseStatus -Code 503
                Write-PodeJsonResponse -Value @{ error = 'Not connected to vCenter' }
                return
            }

            # Validate VM exists before attempting shutdown
            $vm = $null
            try {
                $vm = Get-VM -Id $vmId -ErrorAction Stop
            } catch {
                Set-PodeResponseStatus -Code 404
                Write-PodeJsonResponse -Value @{ success = $false; error = 'VM not found' }
                return
            }

            Stop-VMGuest -VM $vm -Confirm:$false -ErrorAction Stop
            Write-PodeJsonResponse -Value @{
                success = $true
                message = "Shutting Down: $($vm.Name)"
            }
        }
        catch {
            Write-PodeHost "ERROR in /api/shutdown: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{
                success = $false
                error   = $_.Exception.Message
            }
        }
    }

    # --- 5. SERVE FRONTEND ---
    # Use an explicit route for '/' instead of a catch-all static route.
    # This prevents any risk of the static route intercepting API requests.
    Add-PodeRoute -Method Get -Path '/' -ScriptBlock {
        $htmlPath = Join-Path $script:ServerRoot 'views/index.html'
        if (Test-Path $htmlPath) {
            $html = Get-Content -Raw -Path $htmlPath
            Write-PodeHtmlResponse -Value $html
        } else {
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = 'index.html not found' }
        }
    }

    Write-PodeHost "Server ready. API routes registered."
}
