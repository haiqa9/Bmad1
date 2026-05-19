# server.ps1
# Pode-based web server for VMon-Web
#
# Uses Set-PodeState / Get-PodeState for all shared data so routes
# can access VM cache and connection state regardless of runspace.

# --- 0. PREREQUISITES ---
if (-not (Get-Module -ListAvailable Pode)) {
    Write-Error "Pode module not installed. Run: Install-Module Pode -Scope CurrentUser -Force"
    exit 1
}
if (-not (Get-Module -ListAvailable VMware.VimAutomation.Core)) {
    Write-Error "VMware PowerCLI not installed."
    exit 1
}

Import-Module Pode

$env:VMonWebRoot = $PSScriptRoot

# =====================================================================
# 1. PODE SERVER
# =====================================================================
Start-PodeServer -Threads 1 {

    Import-Module VMware.VimAutomation.Core -ErrorAction Stop

    # -- Credentials (local to this runspace) --
    $vCenterGroup1 = "192.168.1.240", "192.168.2.250"
    $user1 = "haiqa@vsphere.local"
    $pass1 = 'Expert@ef4' | ConvertTo-SecureString -AsPlainText -Force
    $cred1 = New-Object System.Management.Automation.PSCredential($user1, $pass1)

    $vCenterGroup2 = "192.168.1.241"
    $user2 = "administrator@vsphere.local"
    $pass2 = 'Experts@0ffice' | ConvertTo-SecureString -AsPlainText -Force
    $cred2 = New-Object System.Management.Automation.PSCredential($user2, $pass2)

    # -- Helper: write shared state via Pode's state API --
    function Set-VMonState {
        param([string]$Name, [object]$Value)
        Set-PodeState -Name $Name -Value $Value | Out-Null
    }
    function Get-VMonState {
        param([string]$Name)
        return (Get-PodeState -Name $Name)
    }

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

        Set-VMonState -Name 'VMonConnectionErrors' -Value @()
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
                $errs = @(Get-VMonState -Name 'VMonConnectionErrors')
                $errs += $err
                Set-VMonState -Name 'VMonConnectionErrors' -Value $errs
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
                $errs = @(Get-VMonState -Name 'VMonConnectionErrors')
                $errs += $err
                Set-VMonState -Name 'VMonConnectionErrors' -Value $errs
                & $log "  $err" "Red"
            }
        }

        $vmCount = 0
        if ($connectedServers.Count -gt 0) {
            try {
                & $log "Building VM cache from $($connectedServers.Count) server(s)..." "Gray"
                $cache = Get-VM | Select-Object Name, Id, @{N='IP'; E={$_.Guest.IPAddress[0]}}, @{N='vCenter'; E={$_.Uid.Split('@')[1].Split(':')[0]}}, @{N='PowerState'; E={$_.PowerState}}
                Set-VMonState -Name 'VMonVMCache' -Value $cache
                Set-VMonState -Name 'VMonConnectedServers' -Value $connectedServers
                $vmCount = $cache.Count
                & $log "Cache built: $vmCount VMs." "Green"
            }
            catch {
                $err = "FAILED: Get-VM cache build - $($_.Exception.Message)"
                $errs = @(Get-VMonState -Name 'VMonConnectionErrors')
                $errs += $err
                Set-VMonState -Name 'VMonConnectionErrors' -Value $errs
                Set-VMonState -Name 'VMonVMCache' -Value @()
                Set-VMonState -Name 'VMonConnectedServers' -Value @()
                & $log "  $err" "Red"
            }
        }
        else {
            Set-VMonState -Name 'VMonVMCache' -Value @()
            Set-VMonState -Name 'VMonConnectedServers' -Value @()
            & $log "No vCenter connections established. Cache is empty." "Yellow"
        }

        return @{
            ConnectedServers = $connectedServers
            VMCount          = $vmCount
            Errors           = (Get-VMonState -Name 'VMonConnectionErrors')
        }
    }

    function Reconnect-VMonServers {
        try { Disconnect-VIServer -Server * -Confirm:$false -ErrorAction SilentlyContinue | Out-Null }
        catch {}
        Set-VMonState -Name 'VMonVMCache' -Value @()
        Set-VMonState -Name 'VMonConnectedServers' -Value @()
        return Connect-VMonServers
    }

    function Get-VMonStatus {
        $servers = Get-VMonState -Name 'VMonConnectedServers'
        if ($null -eq $servers) { $servers = @() }
        $cache = Get-VMonState -Name 'VMonVMCache'
        if ($null -eq $cache) { $cache = @() }
        $errors = Get-VMonState -Name 'VMonConnectionErrors'
        if ($null -eq $errors) { $errors = @() }
        return @{
            Connected = ($servers.Count -gt 0)
            VMCount   = $cache.Count
            Servers   = $servers
            Errors    = $errors
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
        $cache = Get-VMonState -Name 'VMonVMCache'
        if ($null -eq $cache) { $cache = @() }
        $results = @($cache | Where-Object {
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

    # --- Initialize empty state ---
    Set-VMonState -Name 'VMonVMCache' -Value @()
    Set-VMonState -Name 'VMonConnectedServers' -Value @()
    Set-VMonState -Name 'VMonConnectionErrors' -Value @()

    # --- Connect to vCenter ---
    Write-Host "`n--- STARTING CONNECTION SEQUENCE ---" -ForegroundColor Cyan
    $startupResult = Connect-VMonServers
    Write-Host "VERIFIED CONNECTIONS: $($startupResult.ConnectedServers -join ', ')" -ForegroundColor Green
    Write-Host "CACHED VMs: $($startupResult.VMCount)" -ForegroundColor Green
    foreach ($err in $startupResult.Errors) {
        Write-Host "ERROR: $err" -ForegroundColor Red
    }

    # =====================================================================
    # 2. ENDPOINT & ROUTES
    # =====================================================================
    Add-PodeEndpoint -Address 127.0.0.1 -Port 8080 -Protocol Http
    Write-PodeHost "[VMon] Listening on http://127.0.0.1:8080"

    # CORS middleware
    Add-PodeMiddleware -Name 'Cors' -ScriptBlock {
        Add-PodeHeader -Name 'Access-Control-Allow-Origin' -Value '*'
        Add-PodeHeader -Name 'Access-Control-Allow-Methods' -Value 'GET, POST, OPTIONS'
        Add-PodeHeader -Name 'Access-Control-Allow-Headers' -Value 'Content-Type'
        return $true
    }

    Add-PodeRoute -Method Options -Path '*' -ScriptBlock {
        Set-PodeResponseStatus -Code 204
    }

    # --- API: STATUS ---
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
            Write-PodeHost "[VMon] /api/status ERROR: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = $_.Exception.Message }
        }
    }

    # --- API: RECONNECT ---
    Add-PodeRoute -Method Post -Path '/api/reconnect' -ScriptBlock {
        try {
            Write-PodeHost "[VMon] Reconnect requested"
            $result = Reconnect-VMonServers
            Write-PodeJsonResponse -Value @{
                success          = ($result.ConnectedServers.Count -gt 0)
                connectedServers = $result.ConnectedServers
                vmCount          = $result.VMCount
                errors           = $result.Errors
            }
        }
        catch {
            Write-PodeHost "[VMon] /api/reconnect ERROR: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = $_.Exception.Message }
        }
    }

    # --- API: SEARCH ---
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
            Write-PodeHost "[VMon] /api/search ERROR: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ error = $_.Exception.Message }
        }
    }

    # --- API: POWER ON ---
    Add-PodeRoute -Method Post -Path '/api/power-on' -ScriptBlock {
        try {
            $body = $WebEvent.Data
            if ($body -is [string]) {
                try { $body = $body | ConvertFrom-Json } catch {
                    Set-PodeResponseStatus -Code 400
                    Write-PodeJsonResponse -Value @{ error = 'Invalid JSON' }
                    return
                }
            }
            $vmId = $body.id
            if ([string]::IsNullOrWhiteSpace($vmId)) {
                Set-PodeResponseStatus -Code 400
                Write-PodeJsonResponse -Value @{ error = 'VM ID required' }
                return
            }

            $status = Get-VMonStatus
            if (-not $status.Connected) {
                Set-PodeResponseStatus -Code 503
                Write-PodeJsonResponse -Value @{ error = 'Not connected to vCenter' }
                return
            }

            $vm = Get-VM -Id $vmId -ErrorAction Stop
            Start-VM -VM $vm -Confirm:$false -RunAsync -ErrorAction Stop | Out-Null
            Write-PodeJsonResponse -Value @{
                success = $true
                message = "Powering ON: $($vm.Name)"
            }
        }
        catch [VMware.VimAutomation.ViCore.Types.V1.ErrorHandling.VimException] {
            if ($_.Exception.Message -match 'not found') {
                Set-PodeResponseStatus -Code 404
                Write-PodeJsonResponse -Value @{ success = $false; error = 'VM not found' }
            } else {
                Write-PodeHost "[VMon] /api/power-on ERROR: $($_.Exception.Message)"
                Set-PodeResponseStatus -Code 500
                Write-PodeJsonResponse -Value @{ success = $false; error = $_.Exception.Message }
            }
        }
        catch {
            Write-PodeHost "[VMon] /api/power-on ERROR: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ success = $false; error = $_.Exception.Message }
        }
    }

    # --- API: SHUTDOWN ---
    Add-PodeRoute -Method Post -Path '/api/shutdown' -ScriptBlock {
        try {
            $body = $WebEvent.Data
            if ($body -is [string]) {
                try { $body = $body | ConvertFrom-Json } catch {
                    Set-PodeResponseStatus -Code 400
                    Write-PodeJsonResponse -Value @{ error = 'Invalid JSON' }
                    return
                }
            }
            $vmId = $body.id
            if ([string]::IsNullOrWhiteSpace($vmId)) {
                Set-PodeResponseStatus -Code 400
                Write-PodeJsonResponse -Value @{ error = 'VM ID required' }
                return
            }

            $status = Get-VMonStatus
            if (-not $status.Connected) {
                Set-PodeResponseStatus -Code 503
                Write-PodeJsonResponse -Value @{ error = 'Not connected to vCenter' }
                return
            }

            $vm = Get-VM -Id $vmId -ErrorAction Stop
            Stop-VMGuest -VM $vm -Confirm:$false -ErrorAction Stop
            Write-PodeJsonResponse -Value @{
                success = $true
                message = "Shutting Down: $($vm.Name)"
            }
        }
        catch [VMware.VimAutomation.ViCore.Types.V1.ErrorHandling.VimException] {
            if ($_.Exception.Message -match 'not found') {
                Set-PodeResponseStatus -Code 404
                Write-PodeJsonResponse -Value @{ success = $false; error = 'VM not found' }
            } else {
                Write-PodeHost "[VMon] /api/shutdown ERROR: $($_.Exception.Message)"
                Set-PodeResponseStatus -Code 500
                Write-PodeJsonResponse -Value @{ success = $false; error = $_.Exception.Message }
            }
        }
        catch {
            Write-PodeHost "[VMon] /api/shutdown ERROR: $($_.Exception.Message)"
            Set-PodeResponseStatus -Code 500
            Write-PodeJsonResponse -Value @{ success = $false; error = $_.Exception.Message }
        }
    }

    # --- FRONTEND ---
    Add-PodeRoute -Method Get -Path '/' -ScriptBlock {
        $file = Join-Path $env:VMonWebRoot 'views/index.html'
        Write-PodeFileResponse -Path $file
    }

    Write-PodeHost "[VMon] Server ready. Routes registered."
}
