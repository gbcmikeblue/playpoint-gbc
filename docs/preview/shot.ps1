# 重新生成 README 里的界面截图：用无头 Chrome/Edge 渲染 screens.html
# 用法（仓库根目录）：powershell -NoProfile -ExecutionPolicy Bypass -File docs/preview/shot.ps1
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$outDir = Join-Path $repoRoot 'docs\screenshots'
$html = Join-Path $repoRoot 'docs\preview\screens.html'

$browser = @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw '未找到 Chrome 或 Edge，无法渲染截图' }

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$base = ([uri]$html).AbsoluteUri + '?shot=1&screen='

foreach ($s in 'home', 'city', 'detail', 'cashier', 'ticket-list', 'ticket-detail') {
  & $browser --headless=new --disable-gpu --hide-scrollbars --window-size=750,1624 "--screenshot=$outDir\$s.png" "$base$s" 2>$null
  Start-Sleep -Milliseconds 400
}

Write-Host "截图已更新：$outDir"
