# VMon-Logic.ps1
# Shared VM management logic for VMon-Web
# This file contains credentials, connection logic, search, and VM actions.
# It is dot-sourced by both VMon.ps1 (WinForms UI) and server.ps1 (Pode web server).

# --- 0. IMPORT POWERCLI ---
# Explicitly import the module so cmdlets are available in Pode runspaces
# and other constrained execution contexts.
$powerCliMod = Get-Module VMware.VimAutomation.Core -ErrorAction SilentlyContinue
if (-not $powerCliMod) {
    Import-Module VMware.VimAutomation.Core -ErrorAction Stop
}

# --- 1. SETTINGS & CREDENTIALS ---
$vCenterGroup1 = "192.168.1.240", "192.168.2.250"
$user1 = "haiqa@vsphere.local"
$pass1 = 'Expert@ef4' | ConvertTo-SecureString -AsPlainText -Force
$cred1 = New-Object System.Management.Automation.PSCredential($user1, $pass1)

$vCenterGroup2 = "192.168.1.241"
$user2 = "administrator@vsphere.local"
$pass2 = 'Experts@0ffice' | ConvertTo-SecureString -AsPlainText -Force
$cred2 = New-Object System.Management.Automation.PSCredential($user2, $pass2)

# --- 2. STATE VARIABLES ---
$global:VMonVMCache       = @()
$script:SelectedVM        = $null
$script:SearchResults     = @()
$script:ResultsDisplay    = ""
$script:AwaitingSelection = $false
$global:VMonConnectionErrors = @()

# --- 3. CONNECTION ---
function Connect-VMonServers {
    <#
    .SYNOPSIS
        Connects to all configured vCenter servers and rebuilds the VM cache.
    .DESCRIPTION
        Connects to each vCenter individually with per-server error handling.
        Only queries VMs if at least one connection succeeded.
        Returns a hashtable with detailed status.
    #>
    param(
        [switch]$Silent
    )

    $log = { param([string]$msg, [string]$color)
        if (-not $Silent) {
            if ($color) { Write-Host $msg -ForegroundColor $color }
            else        { Write-Host $msg }
        }
    }

    # Configure PowerCLI for this session
    try {
        Set-PowerCLIConfiguration -Scope Session -ParticipateInCEIP $false -InvalidCertificateAction Ignore -Confirm:$false | Out-Null
        & $log "PowerCLI session configured." "Gray"
    }
    catch {
        & $log "WARNING: Set-PowerCLIConfiguration failed: $($_.Exception.Message)" "Yellow"
    }

    $global:VMonConnectionErrors = @()
    $connectedServers = @()

    # --- Connect Group 1 ---
    foreach ($server in $vCenterGroup1) {
        try {
            & $log "Connecting to $server (Group 1)..." "Cyan"
            $session = Connect-VIServer -Server $server -Credential $cred1 -ErrorAction Stop
            $connectedServers += $server
            & $log "  OK: $server connected." "Green"
        }
        catch {
            $err = "FAILED: $server - $($_.Exception.Message)"
            $global:VMonConnectionErrors += $err
            & $log "  $err" "Red"
        }
    }

    # --- Connect Group 2 ---
    foreach ($server in $vCenterGroup2) {
        try {
            & $log "Connecting to $server (Group 2)..." "Cyan"
            $session = Connect-VIServer -Server $server -Credential $cred2 -ErrorAction Stop
            $connectedServers += $server
            & $log "  OK: $server connected." "Green"
        }
        catch {
            $err = "FAILED: $server - $($_.Exception.Message)"
            $global:VMonConnectionErrors += $err
            & $log "  $err" "Red"
        }
    }

    # --- Build Cache ---
    $vmCount = 0
    if ($connectedServers.Count -gt 0) {
        try {
            & $log "Building VM cache from $($connectedServers.Count) server(s)..." "Gray"
            $global:VMonVMCache = Get-VM | Select-Object Name, Id, @{N='IP'; E={$_.Guest.IPAddress[0]}}, @{N='vCenter'; E={$_.Uid.Split('@')[1].Split(':')[0]}}, @{N='PowerState'; E={$_.PowerState}}
            $vmCount = $global:VMonVMCache.Count
            & $log "Cache built: $vmCount VMs." "Green"
        }
        catch {
            $err = "FAILED: Get-VM cache build - $($_.Exception.Message)"
            $global:VMonConnectionErrors += $err
            $global:VMonVMCache = @()
            & $log "  $err" "Red"
        }
    }
    else {
        $global:VMonVMCache = @()
        & $log "No vCenter connections established. Cache is empty." "Yellow"
    }

    return @{
        ConnectedServers = $connectedServers
        VMCount          = $vmCount
        Errors           = $global:VMonConnectionErrors
        TotalServers     = ($vCenterGroup1.Count + $vCenterGroup2.Count)
    }
}

function Reconnect-VMonServers {
    <#
    .SYNOPSIS
        Disconnects all vCenter sessions and reconnects from scratch.
    #>
    try {
        Disconnect-VIServer -Server * -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
    }
    catch {}
    $global:VMonVMCache = @()
    return Connect-VMonServers
}

function Get-VMonStatus {
    $connected = ($global:DefaultVIServers.Count -gt 0)
    return @{
        Connected = $connected
        VMCount   = $global:VMonVMCache.Count
        Servers   = @($global:DefaultVIServers | Select-Object -ExpandProperty Name)
        Errors    = $global:VMonConnectionErrors
    }
}

# --- 4. SEARCH ---
function Search-VMonCache {
    param([string]$SearchTerm)

    $term = $SearchTerm.Trim()

    # Reset state for new search (matches original VMon.ps1 behavior)
    $script:SearchResults = @()
    $script:ResultsDisplay = ""
    $script:AwaitingSelection = $false

    if ([string]::IsNullOrWhiteSpace($term)) {
        Clear-VMonSelection
        return @{ Type = 'empty'; Results = @(); Message = 'Please enter a search term.' }
    }
    if ($term.Length -lt 2) {
        Clear-VMonSelection
        return @{ Type = 'tooshort'; Results = @(); Message = 'Please enter at least 2 characters to search.' }
    }

    $results = @($global:VMonVMCache | Where-Object {
        ($_.Name -like "*$term*") -or ($_.IP -match [regex]::Escape($term))
    })

    Write-Host "Search for '$term' returned $($results.Count) result(s)." -ForegroundColor Cyan

    if ($results.Count -eq 0) {
        Clear-VMonSelection
        return @{ Type = 'none'; Results = @(); Message = 'No VM found in cache.' }
    }
    elseif ($results.Count -eq 1) {
        $vm = $results[0]
        return @{
            Type    = 'single'
            Results = @($vm)
            Message = "MATCH FOUND: $($vm.Name)`nIP: $(if ($vm.IP) { $vm.IP } else { 'No IP' })`nSelecting this VM..."
        }
    }
    else {
        $script:SearchResults = $results
        $script:AwaitingSelection = $true
        $lines = @("Multiple matches found. Type the number and press ENTER to select:")
        for ($i = 0; $i -lt $results.Count -and $i -lt 20; $i++) {
            $vm = $results[$i]
            $ip = if ($vm.IP) { $vm.IP } else { "No IP" }
            $lines += "$($i+1). $($vm.Name) [$ip]"
        }
        if ($results.Count -gt 20) {
            $lines += "... ($($results.Count - 20) more - narrow your search)"
        }
        $script:ResultsDisplay = $lines -join "`n"
        return @{ Type = 'multiple'; Results = $results; Message = $script:ResultsDisplay }
    }
}

function Set-VMonSelection {
    param([Parameter(Mandatory=$true)] $Match)
    $script:SelectedVM = Get-VM -Id $Match.Id -ErrorAction Stop
    $script:SearchResults = @()
    $script:ResultsDisplay = ""
    $script:AwaitingSelection = $false
    return $script:SelectedVM
}

function Clear-VMonSelection {
    $script:SelectedVM = $null
    $script:AwaitingSelection = $false
}

# --- 5. VM ACTIONS ---
function Start-VMonVM {
    param([string]$VMId)
    $vm = Get-VM -Id $VMId -ErrorAction Stop
    Start-VM -VM $vm -Confirm:$false -RunAsync -ErrorAction Stop | Out-Null
    return $vm
}

function Stop-VMonVMGuest {
    param([string]$VMId)
    $vm = Get-VM -Id $VMId -ErrorAction Stop
    Stop-VMGuest -VM $vm -Confirm:$false -ErrorAction Stop
    return $vm
}
