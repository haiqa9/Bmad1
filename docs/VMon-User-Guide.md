# Enterprise VM Portal — User Guide

## What Is This Tool?

The **Enterprise VM Portal** is a simple desktop application for finding and controlling virtual machines (VMs) across multiple data centers. It allows you to:

- **Search** for VMs by name or IP address
- **Power on** VMs that are turned off
- **Shut down** VMs that are running

All from a single, easy-to-use window — no command line or complex vSphere Client required.

---

## Getting Started

### Opening the Application

1. Locate the **`VMon.ps1`** file on your computer (usually at `D:\Bmad\VMon.ps1`).
2. Right-click the file and choose **Run with PowerShell**.
3. The application window will appear in the center of your screen.

> **Note:** The first time you open the tool, it takes a few seconds to connect to the data centers and load the VM list. You will see **"SYSTEM BOOTING..."** during this time.

When ready, the info box will display something like:

```
READY.
[150] VMs Cached.
Type a name and hit ENTER to Search.
```

This means the tool is loaded and ready to use.

---

## How to Search for a VM

1. Click inside the **Search VM** text box (top-left).
2. Type part of the VM's name or its IP address.
   - You only need to type **2 or more characters**.
   - Example: typing `web` will find `WebServer01`, `Web-Prod-02`, `Test-Web`, etc.
3. Press **ENTER** on your keyboard (or click the **SEARCH** button).

---

## Understanding Search Results

After you search, one of three things will happen:

### 1. One VM Found (Auto-Selected)

If only one VM matches your search, it is selected automatically. You will see:

```
SELECTED: WebServer01
STATUS: PoweredOn
VCENTER: 192.168.1.240

Choose action below:
```

The **POWER ON** or **SHUTDOWN** button will become active depending on the VM's current status.

### 2. Multiple VMs Found

If several VMs match, you will see a numbered list like this:

```
Multiple matches found. Type the number and press ENTER to select:
1. WebServer01 [192.168.1.10]
2. WebServer02 [192.168.1.11]
3. Web-Dev-01 [No IP]
```

**To select a VM:**
1. Type the number (for example, type `2` for WebServer02).
2. Press **ENTER**.
3. The VM will be selected, and the action buttons will activate.

> **Tip:** If the list is too long, type more characters to narrow your search.

### 3. No VM Found

If no VM matches your search, you will see:

```
No VM found in cache.
```

Try checking your spelling or searching with a different term.

---

## How to Power On a VM

1. Search for and **select the VM** (see above).
2. Make sure the VM status shows **`PoweredOff`** or similar.
3. Click the **POWER ON** button (the green button on the left).
4. The info box will confirm:
   ```
   Powering ON: WebServer01
   ```
5. The VM will start up. This may take a few minutes depending on the VM.

> **Note:** The **POWER ON** button is only enabled when the VM is currently off. If it is grayed out, the VM is already running.

---

## How to Shut Down a VM

1. Search for and **select the VM** (see above).
2. Make sure the VM status shows **`PoweredOn`**.
3. Click the **SHUTDOWN** button (the orange button on the right).
4. The info box will confirm:
   ```
   Shutting Down: WebServer01
   ```
5. The VM will receive a shutdown signal. The guest operating system will close programs and power off gracefully.

> **Important:**
> - The **SHUTDOWN** button only works if VMware Tools is installed inside the VM.
> - If the button is grayed out, the VM is already off.
> - Always notify users before shutting down their VMs.

---

## Starting a New Search

At any time, you can clear the current selection and start fresh:

1. Click the **NEW SEARCH** button at the bottom.
2. The search box is cleared.
3. The info box resets to the ready state.
4. You can now search for a different VM.

Alternatively, simply type a new search term and press **ENTER**.

---

## Status & Color Guide

The info box uses colors to help you understand what's happening:

| Color | Meaning |
|-------|---------|
| **Green** | VM is currently running (`PoweredOn`) |
| **Red** | VM is currently off (`PoweredOff`) |
| **Blue** | Informational — match found or list displayed |
| **Black** | Normal / ready state |
| **Dark Red** | Error — something went wrong (check the message) |

---

## Quick Reference Card

| Step | Action | Result |
|------|--------|--------|
| Open app | Right-click → Run with PowerShell | Window appears |
| Search | Type name/IP (2+ chars) + **ENTER** | VM found or list shown |
| Select from list | Type number + **ENTER** | VM is selected |
| Power on | Click **POWER ON** (green) | VM starts |
| Shut down | Click **SHUTDOWN** (orange) | VM shuts down gracefully |
| Reset search | Click **NEW SEARCH** | Ready for new search |

---

## Common Questions

### Why do I see "No VM found in cache"?
Either:
- The VM name was spelled incorrectly.
- The VM was created very recently and the tool needs to be restarted to see it.
- You do not have access to that VM's data center.

### Why are the POWER ON / SHUTDOWN buttons grayed out?
You haven't selected a VM yet, or the selected VM is already in that state (e.g., you can't power on a VM that's already on).

### Why did the shutdown fail?
Common reasons:
- VMware Tools is not installed or not running inside the VM.
- The guest OS is frozen or unresponsive.
- You don't have permission to perform that action.

### Can I restart a VM?
Currently, this tool supports **Power On** and **Shutdown** only. To restart, shut down the VM first, wait for it to fully power off, then power it back on.

### How often is the VM list updated?
The VM list is loaded once when the application starts. If a new VM was created after you opened the tool, close and reopen it to see the new VM.

### Can I search by IP address?
Yes. Type a partial or full IP address (e.g., `192.168.1`) instead of a name.

---

## Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|----------|
| Search using part of the VM name | Don't shut down production VMs without approval |
| Confirm the VM name before powering on/off | Don't type random numbers when selecting from a list |
| Use NEW SEARCH to clear and start over | Don't close the window during a power operation |
| Notify users before shutting down their VMs | Don't share your login credentials |

---

## Need Help?

If you experience issues:

1. Check the info box for error messages.
2. Try searching with a simpler or shorter term.
3. Close and reopen the application to refresh the VM list.
4. Contact your system administrator if connections fail or you see repeated errors.

---

*Document Version: 1.0*  
*Last Updated: 2026-05-12*
