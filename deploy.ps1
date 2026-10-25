# Build and stage a frontend-only release. Mutable content and backend stay on server.
param(
  [switch]$Upload,
  [string]$Server,
  [string]$ServerRoot,
  [switch]$Diff
)
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $scriptDir
if ($Diff) {
  git diff --stat
  exit $LASTEXITCODE
}
if ($Upload -and (-not $Server -or -not $ServerRoot)) {
  throw 'Upload requires -Server user@host and an explicitly verified -ServerRoot /absolute/site/path.'
}
if ($Upload -and ($ServerRoot -notmatch '^/[a-zA-Z0-9_./-]+$' -or $ServerRoot -eq '/' -or $ServerRoot -match '\.\.')) {
  throw 'ServerRoot must be an absolute site directory without traversal or shell characters.'
}
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed. No deployment files were changed.' }
$release = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$stage = Join-Path $scriptDir "deploy/releases/$release"
New-Item -ItemType Directory -Path $stage | Out-Null
Get-ChildItem -LiteralPath (Join-Path $scriptDir 'dist') -Force | Copy-Item -Destination $stage -Recurse
Write-Host "Frontend release: $stage"
Write-Host 'admin/data, images, server source and environment files are excluded.'
if ($Upload) {
  $backup = "$ServerRoot/.frontend-backups/$release"
  & ssh $Server "mkdir -p '$ServerRoot/assets' '$ServerRoot/admin' '$ServerRoot/data' '$backup/admin'; if [ -f '$ServerRoot/index.html' ]; then cp '$ServerRoot/index.html' '$backup/index.html'; fi; if [ -f '$ServerRoot/admin/admin.html' ]; then cp '$ServerRoot/admin/admin.html' '$backup/admin/admin.html'; fi"
  if ($LASTEXITCODE -ne 0) { throw 'Remote directory preparation failed.' }
  # Retain old hashed assets. Upload the HTML entry last so readers see complete assets.
  foreach ($item in Get-ChildItem -LiteralPath $stage | Where-Object Name -ne 'index.html') {
    if (-not $item.PSIsContainer) {
      & ssh $Server "if [ -f '$ServerRoot/$($item.Name)' ]; then cp '$ServerRoot/$($item.Name)' '$backup/$($item.Name)'; fi"
      if ($LASTEXITCODE -ne 0) { throw "Remote backup failed: $($item.Name)" }
    }
    & scp -r $item.FullName "${Server}:$ServerRoot/"
    if ($LASTEXITCODE -ne 0) { throw "Upload failed: $($item.Name). Existing index.html retained." }
  }
  & scp (Join-Path $stage 'index.html') "${Server}:$ServerRoot/index.html.new"
  if ($LASTEXITCODE -ne 0) { throw 'Entry upload failed.' }
  & ssh $Server "mv '$ServerRoot/index.html.new' '$ServerRoot/index.html'"
  if ($LASTEXITCODE -ne 0) { throw 'Entry activation failed.' }
  Write-Host "Published. Previous entry: $backup/index.html; previous hashed assets retained."
}
