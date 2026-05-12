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

# Capture script root so it's available inside Pode's runspace
$script:ServerRoot = $PSScriptRoot

# --- 1. START PODE SERVER ---
Start-PodeServer -Threads 1 {

    # Import shared logic INSIDE Pode's runspace
    $logicPath = Join-Path $script:ServerRoot 'VMon-Logic.ps1'
    if (Test-Path $logicPath) {
        . $logicPath
        Write-PodeHost "[VMon] Loaded VMon-Logic.ps1 from: $logicPath"
    } else {
        Write-PodeHost "[VMon] FATAL: VMon-Logic.ps1 not found at: $logicPath"
        exit 1
    }

    # Listen on all interfaces so LAN clients can reach us
    Add-PodeEndpoint -Address 0.0.0.0 -Port 8080 -Protocol Http
    Write-PodeHost "[VMon] Pode endpoint added: 0.0.0.0:8080"

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
    Write-PodeHost "[VMon] Starting vCenter connection sequence..."
    $startupResult = Connect-VMonServers -Silent
    Write-PodeHost "[VMon] vCenter startup result:"
    Write-PodeHost "  Connected servers: $($startupResult.ConnectedServers -join ', ')"
    Write-PodeHost "  VM cache count: $($startupResult.VMCount)"
    foreach ($err in $startupResult.Errors) {
        Write-PodeHost "  ERROR: $err"
    }

    # --- 3. API ROUTES ---

    # Health / Status
    Add-PodeRoute -Method Get -Path '/api/status' -ScriptBlock {
        try {
            $status = Get-VMonStatus
            Write-PodeJsonResponse -Value @{
                connected = $status.Connected
                vmCount   = $status.VMCount
                servers   = $status.Servers
                errors    = $status.Errors
            }
        }
        catch {
            Write-PodeHost "[VMon] ERROR in /api/status: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = $_.Exception.Message }
        }
    }

    # Reconnect to vCenters (on-demand refresh)
    Add-PodeRoute -Method Post -Path '/api/reconnect' -ScriptBlock {
        try {
            Write-PodeHost "[VMon] Reconnect requested from $($WebEvent.Request.RemoteEndPoint)"
            $result = Reconnect-VMonServers -Silent
            Write-PodeJsonResponse -Value @{
                success          = ($result.ConnectedServers.Count -gt 0)
                connectedServers = $result.ConnectedServers
                vmCount          = $result.VMCount
                errors           = $result.Errors
            }
        }
        catch {
            Write-PodeHost "[VMon] ERROR in /api/reconnect: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = $_.Exception.Message }
        }
    }

    # Search VMs
    Add-PodeRoute -Method Get -Path '/api/search' -ScriptBlock {
        try {
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
            Write-PodeHost "[VMon] ERROR in /api/search: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = $_.Exception.Message }
        }
    }

    # Power On
    Add-PodeRoute -Method Post -Path '/api/power-on' -ScriptBlock {
        try {
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
            Write-PodeHost "[VMon] ERROR in /api/power-on: $($_.Exception.Message)"
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
            Write-PodeHost "[VMon] ERROR in /api/shutdown: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{
                success = $false
                error   = $_.Exception.Message
            }
        }
    }

    # --- 4. SERVE FRONTEND ---
    # Explicit route for '/' — prevents any risk of API route interception.
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

    Write-PodeHost "[VMon] Server ready. API routes registered."
}
