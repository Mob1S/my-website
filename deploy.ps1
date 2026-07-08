# =============================================
# Mob1S Deploy Script
# Usage:
#   .\deploy.ps1              Prepare deploy package to deploy\out\
#   .\deploy.ps1 -Upload user@host   SCP upload to server
#   .\deploy.ps1 -Diff         Show files changed since last deploy
# =============================================
param(
  [switch]$Upload,
  [string]$Server,
  [switch]$Diff
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# --- Config ---
$deployDir = "deploy\out"
$versionFile = "deploy\.version"
$serverRoot = "/www/wwwroot/mob1s"

# --- Deploy file list ---
$deployFiles = @(
  # Core pages
  "index.html",
  "style.css",
  "script.js",
  # Detail pages
  "detail.html",
  "city-detail.html",
  "map-detail.html",
  "gallery.html",
  "credits.html",
  # Purpose pages
  "purpose-about.html",
  "purpose-ai.html",
  "purpose-hobbies.html",
  "purpose-map.html",
  # Other pages
  "f1_preview.html",
  "presentation.html",
  # Data modules
  "map-data.js",
  "gallery-data.js",
  # Assets
  "F1_SVG_wb.svg",
  # Admin panel
  "admin\admin.html",
  "admin\data\city-profiles.json",
  "admin\data\city-images.json",
  "admin\data\district-notes.json",
  "admin\data\district-images.json",
  "admin\data\wishlist-impressions.json",
  "admin\data\person-profiles.json",
  "admin\data\hobby-profiles.json",
  "admin\data\person-images.json",
  "admin\data\hobby-images.json",
  "admin\data\person-meta.json",
  "admin\data\hobby-meta.json",
  "admin\data\traveled-cities.json",
  "admin\data\site-config.json",
  # Production server
  "server.js",
  # Anime.js
  "anime-4.4.1\dist\bundles\anime.esm.min.js",
  # Beian
  "备案图标.png"
)

# --- Version ---
$today = Get-Date -Format "yyyy-MM-dd"

# --- Diff mode ---
if ($Diff) {
  Write-Host "Files changed since last deploy:" -ForegroundColor Cyan
  if (Test-Path $versionFile) {
    $lastDeploy = Get-Content $versionFile -Raw
    Write-Host "  Last deploy: $lastDeploy"
  } else {
    Write-Host "  No previous deploy record"
  }
  Write-Host ""
  Write-Host "Current deploy file list:" -ForegroundColor Yellow
  foreach ($f in $deployFiles) {
    if (Test-Path $f) {
      $hash = (Get-FileHash $f -Algorithm MD5).Hash
      Write-Host "  $f  [$hash]"
    } else {
      Write-Host "  $f  [MISSING]" -ForegroundColor Red
    }
  }
  exit 0
}

# --- Prepare deploy package ---
Write-Host "=== Mob1S Deploy ===" -ForegroundColor Cyan
Write-Host "Version: $today"
Write-Host ""

# Clean output dir
if (Test-Path $deployDir) {
  Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Force $deployDir | Out-Null

# Copy files with version injection
$copied = 0
$injected = 0
$missing = @()

foreach ($f in $deployFiles) {
  $src = Join-Path $scriptDir $f
  $dst = Join-Path $deployDir $f
  $dstParent = Split-Path $dst -Parent

  if (-not (Test-Path $src)) {
    $missing += $f
    continue
  }

  # Ensure destination directory exists
  if (-not (Test-Path $dstParent)) {
    New-Item -ItemType Directory -Force $dstParent | Out-Null
  }

  # For HTML/JS files, inject version
  $ext = [System.IO.Path]::GetExtension($f)
  if ($ext -in '.html', '.js') {
    $content = Get-Content $src -Raw -Encoding UTF8
    if ($content -match '\{\{VERSION\}\}') {
      $content = $content -replace '\{\{VERSION\}\}', $today
      $injected++
    }
    # Write with UTF8 no BOM (matching typical web server expectations)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($dst, $content, $utf8NoBom)
  } else {
    Copy-Item $src $dst -Force
  }

  $copied++
  Write-Host "  OK  $f" -ForegroundColor Green
}

# Report
Write-Host ""
Write-Host "Copied: $copied files" -ForegroundColor Green
if ($injected -gt 0) {
  Write-Host "Version injected: $injected files -> '$today'" -ForegroundColor Yellow
}
if ($missing.Count -gt 0) {
  Write-Host "Missing: $($missing -join ', ')" -ForegroundColor Red
}

# Save version
$today | Out-File $versionFile -Encoding UTF8

# --- Upload mode ---
if ($Upload -and $Server) {
  Write-Host ""
  Write-Host "Uploading to $Server ..." -ForegroundColor Cyan
  # Upload files individually to preserve directory structure
  Push-Location $deployDir
  try {
    # Create tar archive and pipe via SSH
    $tarFile = "..\deploy.tar"
    if (Test-Path $tarFile) { Remove-Item $tarFile -Force }

    # Use SCP for individual files (more reliable on Windows)
    Get-ChildItem -Recurse -File | ForEach-Object {
      $relPath = $_.FullName.Substring((Get-Location).Path.Length + 1) -replace '\\', '/'
      $remotePath = "$serverRoot/$relPath"
      Write-Host "  Uploading: $relPath"
      scp $_.FullName "${Server}:${remotePath}"
    }
    Write-Host ""
    Write-Host "Upload complete!" -ForegroundColor Green
    Write-Host "NOTE: You may need to restart the server: pm2 restart mob1s" -ForegroundColor Yellow
  } finally {
    Pop-Location
  }
} elseif ($Upload) {
  Write-Host "Usage: .\deploy.ps1 -Upload user@your-server" -ForegroundColor Yellow
  Write-Host "Deploy package prepared in: $deployDir" -ForegroundColor Cyan
  Write-Host "You can also manually upload the deploy\out\ folder via Baota panel."
} else {
  Write-Host ""
  Write-Host "Deploy package prepared in: $deployDir" -ForegroundColor Cyan
  Write-Host "Run with -Upload user@host to SCP to server,"
  Write-Host "  or manually upload deploy\out\ folder via Baota panel."
}
