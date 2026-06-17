#Requires -Version 5.1
# Voyager local dev launcher for Windows (PowerShell 5.1+).
# Converts the Windows path to a WSL path and delegates everything to WSL.
#
# Usage (from project root):
#   .\scripts\init-local.ps1

$ErrorActionPreference = 'Stop'

function Write-Info { param($msg) Write-Host "[voyager] $msg" -ForegroundColor Cyan }
function Write-Err  { param($msg) Write-Host "[voyager] ERROR: $msg" -ForegroundColor Red }

# --- Check WSL ----------------------------------------------------------------

Write-Info "Checking WSL..."
$null = wsl --list --quiet 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "WSL is not available. Install it with:  wsl --install"
    exit 1
}

# --- Resolve Windows -> WSL path (pure PowerShell, no wslpath round-trip) ----

# Always resolve to project root (parent of scripts directory)
$scriptDir = Split-Path -Parent $PSCommandPath
$winRoot = Split-Path -Parent $scriptDir

# Convert C:\foo\bar  ->  /mnt/c/foo/bar
$driveLetter = $winRoot[0].ToString().ToLower()
$wslRoot = '/mnt/' + $driveLetter + ($winRoot.Substring(2).Replace('\', '/'))
Write-Info "Project root: $winRoot"
Write-Info "WSL path: $wslRoot"

# --- Hand off entirely to WSL ------------------------------------------------

Write-Info "Handing off to WSL: $wslRoot/scripts/init-wsl.sh"
wsl bash -c "chmod +x '$wslRoot/scripts/init-wsl.sh' && bash '$wslRoot/scripts/init-wsl.sh'"
exit $LASTEXITCODE
