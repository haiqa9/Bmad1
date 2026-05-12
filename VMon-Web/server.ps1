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

# --- 1. LOAD SHARED LOGIC ---
. $PSScriptRoot\VMon-Logic.ps1

# --- 2. START PODE SERVER ---
Import-Module Pode

Start-PodeServer -Threads 1 {

    # Listen on all interfaces so LAN clients can reach us
    Add-PodeEndpoint -Address 0.0.0.0 -Port 8080 -Protocol Http

    # Enable CORS so browsers don't block fetch() when testing locally
    Add-PodeMiddleware -Name 'Cors' -ScriptBlock {
        Add-PodeHeader -Name 'Access-Control-Allow-Origin' -Value '*'
        Add-PodeHeader -Name 'Access-Control-Allow-Methods' -Value 'GET, POST, OPTIONS'
        Add-PodeHeader -Name 'Access-Control-Allow-Headers' -Value 'Content-Type'
        return $true
    }

    # --- 3. CONNECT TO VCENTER ON STARTUP ---
    try {
        $cachedCount = Connect-VMonServers
        Write-PodeHost "vCenter connections established. $cachedCount VMs cached."
    }
    catch {
        Write-PodeHost "WARNING: Failed to connect to vCenter servers: $($_.Exception.Message)"
    }

    # --- 4. API ROUTES ---

    # Health / Status
    Add-PodeRoute -Method Get -Path '/api/status' -ScriptBlock {
        $status = Get-VMonStatus
        Write-PodeJsonResponse -Value @{
            connected = $status.Connected
            vmCount   = $status.VMCount
            servers   = $status.Servers
        }
    }

    # Search VMs
    Add-PodeRoute -Method Get -Path '/api/search' -ScriptBlock {
        $q = $WebEvent.Query['q']
        # Pode can return an array if the query param is repeated; take the first element
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

    # Power On
    Add-PodeRoute -Method Post -Path '/api/power-on' -ScriptBlock {
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

        try {
            Start-VM -VM $vm -Confirm:$false -RunAsync -ErrorAction Stop | Out-Null
            Write-PodeJsonResponse -Value @{
                success = $true
                message = "Powering ON: $($vm.Name)"
            }
        }
        catch {
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{
                success = $false
                error   = $_.Exception.Message
            }
        }
    }

    # Shutdown (graceful guest OS shutdown)
    Add-PodeRoute -Method Post -Path '/api/shutdown' -ScriptBlock {
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

        try {
            Stop-VMGuest -VM $vm -Confirm:$false -ErrorAction Stop
            Write-PodeJsonResponse -Value @{
                success = $true
                message = "Shutting Down: $($vm.Name)"
            }
        }
        catch {
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{
                success = $false
                error   = $_.Exception.Message
            }
        }
    }

    # --- 5. STATIC FRONTEND ---
    # Serve index.html (and any future static assets) from ./views
    Add-PodeStaticRoute -Path '/' -Source (Join-Path $PSScriptRoot 'views') -Defaults @('index.html')

}
