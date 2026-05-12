Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- 1. SETTINGS & CREDENTIALS ---
$vCenterGroup1 = "192.168.1.240", "192.168.2.250"
$user1 = "haiqa@vsphere.local" 
$pass1 = 'Expert@ef4' | ConvertTo-SecureString -AsPlainText -Force
$cred1 = New-Object System.Management.Automation.PSCredential($user1, $pass1)

$vCenterGroup2 = "192.168.1.241"
$user2 = "administrator@vsphere.local" 
$pass2 = 'Experts@0ffice' | ConvertTo-SecureString -AsPlainText -Force
$cred2 = New-Object System.Management.Automation.PSCredential($user2, $pass2)

$script:LocalCache      = @()
$script:SelectedVM      = $null
$script:SearchResults   = @()
$script:ResultsDisplay  = ""
$script:AwaitingSelection = $false

# --- 2. GUI DESIGN ---
$form = New-Object System.Windows.Forms.Form
$form.Text = "Enterprise VM Portal (High-Speed)"; $form.Size = New-Object System.Drawing.Size(500,480); $form.StartPosition = "CenterScreen"

$labelSearch = New-Object System.Windows.Forms.Label
$labelSearch.Text = "Search VM:"
$labelSearch.Location = New-Object System.Drawing.Point(30,20)
$labelSearch.Size = New-Object System.Drawing.Size(100,20)
$form.Controls.Add($labelSearch)

$inputBox = New-Object System.Windows.Forms.TextBox; $inputBox.Location = New-Object System.Drawing.Point(30,45); $inputBox.Size = New-Object System.Drawing.Size(330,25); $form.Controls.Add($inputBox)

$infoBox = New-Object System.Windows.Forms.Label; $infoBox.Text = "SYSTEM BOOTING..."; $infoBox.Location = New-Object System.Drawing.Point(30,85); $infoBox.Size = New-Object System.Drawing.Size(420,150); $infoBox.BorderStyle = "Fixed3D"; $infoBox.TextAlign = "TopLeft"; $form.Controls.Add($infoBox)

$btnSearch = New-Object System.Windows.Forms.Button; $btnSearch.Text = "SEARCH"; $btnSearch.Location = New-Object System.Drawing.Point(370, 43); $btnSearch.Size = New-Object System.Drawing.Size(80, 28)
$form.Controls.Add($btnSearch)

$btnOn = New-Object System.Windows.Forms.Button; $btnOn.Text = "POWER ON"; $btnOn.Location = New-Object System.Drawing.Point(30,250); $btnOn.Size = New-Object System.Drawing.Size(195,60); $btnOn.BackColor = "LightGreen"; $btnOn.Enabled = $false
$form.Controls.Add($btnOn)

$btnOff = New-Object System.Windows.Forms.Button; $btnOff.Text = "SHUTDOWN"; $btnOff.Location = New-Object System.Drawing.Point(255,250); $btnOff.Size = New-Object System.Drawing.Size(195,60); $btnOff.BackColor = "Orange"; $btnOff.Enabled = $false
$form.Controls.Add($btnOff)

$btnReset = New-Object System.Windows.Forms.Button; $btnReset.Text = "NEW SEARCH"; $btnReset.Location = New-Object System.Drawing.Point(30,320); $btnReset.Size = New-Object System.Drawing.Size(420,30)
$form.Controls.Add($btnReset)

# --- 3. HELPERS ---
function Set-VMSelection {
    param([Parameter(Mandatory=$true)] $Match)
    try {
        $script:SelectedVM = Get-VM -Id $Match.Id -ErrorAction Stop
    } catch {
        $infoBox.Text = "ERROR: VM no longer available.`n$($_.Exception.Message)"
        $infoBox.ForeColor = "DarkRed"
        $script:SelectedVM = $null
        $btnOn.Enabled = $false
        $btnOff.Enabled = $false
        $script:AwaitingSelection = $false
        $labelSearch.Text = "Search VM:"
        return
    }
    $status = $script:SelectedVM.PowerState
    $infoBox.Text = "SELECTED: $($script:SelectedVM.Name)`nSTATUS: $status`nVCENTER: $($Match.vCenter)`n`nChoose action below:"
    $infoBox.ForeColor = if ($status -eq "PoweredOn") { "Green" } else { "Red" }
    $btnOn.Enabled  = ($status -ne "PoweredOn")
    $btnOff.Enabled = ($status -eq "PoweredOn")
    $script:SearchResults = @()
    $script:ResultsDisplay = ""
    $script:AwaitingSelection = $false
    $inputBox.Text = ""
    $labelSearch.Text = "Search VM:"
}

function Clear-VMSelection {
    $script:SelectedVM = $null
    $btnOn.Enabled = $false
    $btnOff.Enabled = $false
    $script:AwaitingSelection = $false
    $labelSearch.Text = "Search VM:"
}

# --- 4. SEARCH & SELECT LOGIC ---
$searchVM = {
    $searchTerm = $inputBox.Text.Trim()

    # If awaiting selection and numeric input, treat as VM selection
    if ($script:AwaitingSelection -and $searchTerm -match '^\d+$') {
        $index = [int]$searchTerm - 1
        if ($index -ge 0 -and $index -lt $script:SearchResults.Count) {
            Set-VMSelection -Match $script:SearchResults[$index]
        } else {
            $infoBox.Text = "Invalid selection: $searchTerm`nValid: 1-$($script:SearchResults.Count)`n`n$script:ResultsDisplay"
            $infoBox.ForeColor = "DarkRed"
            Clear-VMSelection
            $script:AwaitingSelection = $true
        }
        return
    }

    # Reset state for new search
    $script:AwaitingSelection = $false
    $script:SearchResults = @()
    $script:ResultsDisplay = ""

    if ([string]::IsNullOrWhiteSpace($searchTerm)) { return }
    if ($searchTerm.Length -lt 2) {
        $infoBox.Text = "Please enter at least 2 characters to search."
        $infoBox.ForeColor = "Black"
        Clear-VMSelection
        return
    }

    # Fuzzy search: match partial name or IP (wrap in @() to guarantee array)
    $script:SearchResults = @($script:LocalCache | Where-Object {
        ($_.Name -like "*$searchTerm*") -or ($_.IP -match [regex]::Escape($searchTerm))
    })

    Write-Host "Search for '$searchTerm' returned $($script:SearchResults.Count) result(s)." -ForegroundColor Cyan

    if ($script:SearchResults.Count -eq 1) {
        $vm = $script:SearchResults[0]
        $ip = if ($vm.IP) { $vm.IP } else { "No IP" }
        $infoBox.Text = "MATCH FOUND: $($vm.Name)`nIP: $ip`n`nSelecting this VM..."
        $infoBox.ForeColor = "Blue"
        Set-VMSelection -Match $vm
    } elseif ($script:SearchResults.Count -gt 1) {
        $lines = @("Multiple matches found. Type the number and press ENTER to select:")
        for ($i = 0; $i -lt $script:SearchResults.Count -and $i -lt 20; $i++) {
            $vm = $script:SearchResults[$i]
            $ip = if ($vm.IP) { $vm.IP } else { "No IP" }
            $lines += "$($i+1). $($vm.Name) [$ip]"
        }
        if ($script:SearchResults.Count -gt 20) {
            $lines += "... ($($script:SearchResults.Count - 20) more - narrow your search)"
        }
        $script:ResultsDisplay = $lines -join "`n"
        $infoBox.Text = $script:ResultsDisplay
        $infoBox.ForeColor = "Blue"
        Clear-VMSelection
        $script:AwaitingSelection = $true
        $labelSearch.Text = "Select #:"
        $inputBox.Text = ""
        $inputBox.Focus()
    } else {
        $infoBox.Text = "No VM found in cache."
        Clear-VMSelection
        $infoBox.ForeColor = "Black"
    }
}

# --- 5. BUTTON HANDLERS ---
$inputBox.Add_KeyDown({ if ($_.KeyCode -eq [System.Windows.Forms.Keys]::Enter) { &$searchVM; $_.SuppressKeyPress = $true } })
$btnSearch.Add_Click({ &$searchVM })

$btnOn.Add_Click({
    if (-not $script:SelectedVM) { return }
    try {
        Start-VM -VM $script:SelectedVM -Confirm:$false -RunAsync -ErrorAction Stop | Out-Null
        $infoBox.Text = "Powering ON: $($script:SelectedVM.Name)"
        $infoBox.ForeColor = "Green"
    } catch {
        $infoBox.Text = "FAILED to power on:`n$($_.Exception.Message)"
        $infoBox.ForeColor = "DarkRed"
    }
})

$btnOff.Add_Click({
    if (-not $script:SelectedVM) { return }
    try {
        Stop-VMGuest -VM $script:SelectedVM -Confirm:$false -ErrorAction Stop
        $infoBox.Text = "Shutting Down: $($script:SelectedVM.Name)"
        $infoBox.ForeColor = "Orange"
    } catch {
        $infoBox.Text = "FAILED to shut down:`n$($_.Exception.Message)"
        $infoBox.ForeColor = "DarkRed"
    }
})

$btnReset.Add_Click({
    $inputBox.Text = ""
    Clear-VMSelection
    $infoBox.Text = "READY.`n$($script:LocalCache.Count) VMs Cached.`nType a name and hit ENTER to Search."
    $infoBox.ForeColor = "Black"
    $inputBox.Focus()
})

# --- 6. STARTUP CONNECTION ---
$form.Add_Shown({
    Write-Host "`n--- STARTING CONNECTION SEQUENCE ---" -ForegroundColor Cyan
    Set-PowerCLIConfiguration -Scope Session -ParticipateInCEIP $false -InvalidCertificateAction Ignore -Confirm:$false | Out-Null
    
    Connect-VIServer -Server $vCenterGroup1 -Credential $cred1 -ErrorAction SilentlyContinue | Out-Null
    Connect-VIServer -Server $vCenterGroup2 -Credential $cred2 -ErrorAction SilentlyContinue | Out-Null
    
    Write-Host "Building Local Cache..." -ForegroundColor Gray
    $script:LocalCache = Get-VM | Select-Object Name, Id, @{N='IP'; E={$_.Guest.IPAddress[0]}}, @{N='vCenter'; E={$_.Uid.Split('@')[1].Split(':')[0]}}
    
    Write-Host "VERIFIED CONNECTIONS: $($global:DefaultVIServers.Name -join ', ')" -ForegroundColor Green
    $infoBox.Text = "READY.`n$($script:LocalCache.Count) VMs Cached.`nType a name and hit ENTER to Search."
    $infoBox.ForeColor = "Black"
})

$form.ShowDialog() | Out-Null
