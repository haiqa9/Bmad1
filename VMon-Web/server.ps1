# server.ps1
# Pode-based web server for VMon-Web
# Fully self-contained — all logic defined inside Start-PodeServer to avoid runscope issues.

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
Import-Module VMware.VimAutomation.Core -ErrorAction Stop

# Capture script root before entering Pode
$ServerRoot = $PSScriptRoot

# --- 1. START PODE SERVER ---
Start-PodeServer -Threads 2 {

    # =====================================================================
    # ALL LOGIC DEFINED INLINE — no external dot-sourcing
    # =====================================================================

    # -- Credentials --
    $vCenterGroup1 = "192.168.1.240", "192.168.2.250"
    $user1 = "haiqa@vsphere.local"
    $pass1 = 'Expert@ef4' | ConvertTo-SecureString -AsPlainText -Force
    $cred1 = New-Object System.Management.Automation.PSCredential($user1, $pass1)

    $vCenterGroup2 = "192.168.1.241"
    $user2 = "administrator@vsphere.local"
    $pass2 = 'Experts@0ffice' | ConvertTo-SecureString -AsPlainText -Force
    $cred2 = New-Object System.Management.Automation.PSCredential($user2, $pass2)

    # -- State --
    $script:LocalCache      = @()
    $script:ConnectionErrors = @()

    # -- Connection --
    function Connect-VMonServers {
        param([switch]$Silent)
        $log = { param([string]$msg, [string]$color)
            if (-not $Silent) {
                if ($color) { Write-Host $msg -ForegroundColor $color }
                else        { Write-Host $msg }
            }
        }
        try {
            Set-PowerCLIConfiguration -Scope Session -ParticipateInCEIP $false -InvalidCertificateAction Ignore -Confirm:$false | Out-Null
        }
        catch {
            & $log "WARNING: Set-PowerCLIConfiguration failed: $($_.Exception.Message)" "Yellow"
        }

        $script:ConnectionErrors = @()
        $connectedServers = @()

        foreach ($server in $vCenterGroup1) {
            try {
                & $log "Connecting to $server (Group 1)..." "Cyan"
                Connect-VIServer -Server $server -Credential $cred1 -ErrorAction Stop | Out-Null
                $connectedServers += $server
                & $log "  OK: $server connected." "Green"
            }
            catch {
                $err = "FAILED: $server - $($_.Exception.Message)"
                $script:ConnectionErrors += $err
                & $log "  $err" "Red"
            }
        }

        foreach ($server in $vCenterGroup2) {
            try {
                & $log "Connecting to $server (Group 2)..." "Cyan"
                Connect-VIServer -Server $server -Credential $cred2 -ErrorAction Stop | Out-Null
                $connectedServers += $server
                & $log "  OK: $server connected." "Green"
            }
            catch {
                $err = "FAILED: $server - $($_.Exception.Message)"
                $script:ConnectionErrors += $err
                & $log "  $err" "Red"
            }
        }

        $vmCount = 0
        if ($connectedServers.Count -gt 0) {
            try {
                & $log "Building VM cache from $($connectedServers.Count) server(s)..." "Gray"
                $script:LocalCache = Get-VM | Select-Object Name, Id, @{N='IP'; E={$_.Guest.IPAddress[0]}}, @{N='vCenter'; E={$_.Uid.Split('@')[1].Split(':')[0]}}, @{N='PowerState'; E={$_.PowerState}}
                $vmCount = $script:LocalCache.Count
                & $log "Cache built: $vmCount VMs." "Green"
            }
            catch {
                $err = "FAILED: Get-VM cache build - $($_.Exception.Message)"
                $script:ConnectionErrors += $err
                $script:LocalCache = @()
                & $log "  $err" "Red"
            }
        }
        else {
            $script:LocalCache = @()
            & $log "No vCenter connections established. Cache is empty." "Yellow"
        }

        return @{
            ConnectedServers = $connectedServers
            VMCount          = $vmCount
            Errors           = $script:ConnectionErrors
        }
    }

    function Reconnect-VMonServers {
        try { Disconnect-VIServer -Server * -Confirm:$false -ErrorAction SilentlyContinue | Out-Null }
        catch {}
        $script:LocalCache = @()
        return Connect-VMonServers
    }

    function Get-VMonStatus {
        $connected = ($global:DefaultVIServers.Count -gt 0)
        return @{
            Connected = $connected
            VMCount   = $script:LocalCache.Count
            Servers   = @($global:DefaultVIServers | Select-Object -ExpandProperty Name)
            Errors    = $script:ConnectionErrors
        }
    }

    function Search-VMonCache {
        param([string]$SearchTerm)
        $term = $SearchTerm.Trim()
        if ([string]::IsNullOrWhiteSpace($term)) {
            return @{ Type = 'empty'; Results = @(); Message = 'Please enter a search term.' }
        }
        if ($term.Length -lt 2) {
            return @{ Type = 'tooshort'; Results = @(); Message = 'Please enter at least 2 characters to search.' }
        }
        $results = @($script:LocalCache | Where-Object {
            ($_.Name -like "*$term*") -or ($_.IP -match [regex]::Escape($term))
        })
        Write-Host "Search for '$term' returned $($results.Count) result(s)." -ForegroundColor Cyan
        if ($results.Count -eq 0) {
            return @{ Type = 'none'; Results = @(); Message = 'No VM found in cache.' }
        }
        elseif ($results.Count -eq 1) {
            $vm = $results[0]
            return @{ Type = 'single'; Results = @($vm); Message = "MATCH FOUND: $($vm.Name)" }
        }
        else {
            return @{ Type = 'multiple'; Results = $results; Message = "$($results.Count) matches found." }
        }
    }

    # =====================================================================
    # END INLINE LOGIC
    # =====================================================================

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

    # --- CONNECT TO VCENTER ON STARTUP ---
    Write-PodeHost "[VMon] Starting vCenter connection sequence..."
    $startupResult = Connect-VMonServers -Silent
    Write-PodeHost "[VMon] vCenter startup result:"
    Write-PodeHost "  Connected servers: $($startupResult.ConnectedServers -join ', ')"
    Write-PodeHost "  VM cache count: $($startupResult.VMCount)"
    foreach ($err in $startupResult.Errors) {
        Write-PodeHost "  ERROR: $err"
    }

    # =====================================================================
    # API ROUTES
    # =====================================================================

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
            $result = Reconnect-VMonServers
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

    # =====================================================================
    # SERVE FRONTEND
    # =====================================================================
    Add-PodeRoute -Method Get -Path '/' -ScriptBlock {
        try {
            $root = Get-PodeState -Name 'VMonRoot'
            $htmlPath = Join-Path $root 'views/index.html'
            Write-PodeHost "[VMon] Resolving index.html at: $htmlPath"
            if (Test-Path $htmlPath) {
                $html = Get-Content -Raw -Path $htmlPath -ErrorAction Stop
                Write-PodeHost "[VMon] Serving index.html ($( [System.Text.Encoding]::UTF8.GetByteCount($html) ) bytes)"
                Write-PodeHtmlResponse -Value $html
            } else {
                Write-PodeHost "[VMon] ERROR: index.html not found at $htmlPath"
                Set-PodeResponseStatus -Code 500
                Write-PodeJsonResponse -Value @{ error = 'index.html not found' }
            }
        }
        catch {
            Write-PodeHost "[VMon] ERROR serving /: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = $_.Exception.Message }
        }
    }

    Write-PodeHost "[VMon] Server ready. API routes registered."
}
