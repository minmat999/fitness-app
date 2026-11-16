# =====================================================================
#  Fitness Tracker - publikavimas (ir perpublikavimas) i Azure App Service
#  Paleidimas (PowerShell, projekto saknyje):   .\deploy.ps1
#  Ka daro:
#    1. Sukompiliuoja React frontend'a i backend/public
#    2. Supakuoja backend'a i deploy.zip (be node_modules ir .env)
#    3. Ikelia deploy.zip i Azure - Azure pats paleidzia "npm install" ir "npm start"
# =====================================================================

# --- PAKEISK SIUOS DU PAVADINIMUS PAGAL SAVO AZURE (DEPLOY.md 3 zingsnis) ---
$ResourceGroup = "fitness-tracker-rg"
$AppName       = "fitness-tracker-app"
# ----------------------------------------------------------------------

# Klaidas tikriname patys (Check), nes npm/az ispejimai rasomi i stderr ir neturi stabdyti skripto.
$ErrorActionPreference = "Continue"
$Root = $PSScriptRoot

function Check($step) {
  if ($LASTEXITCODE -ne 0) { Write-Host "KLAIDA: $step nepavyko" -ForegroundColor Red; exit 1 }
}

# Ar prisijungta prie Azure? Jei ne - atidaromas narsykles prisijungimo langas.
az account show *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Prisijungiama prie Azure..." -ForegroundColor Yellow
  az login | Out-Null; Check "az login"
}

Write-Host "1/3 Kompiliuojamas frontend..." -ForegroundColor Cyan
Push-Location "$Root\frontend"
npm install; Check "npm install (frontend)"
npm run build; Check "npm run build (frontend)"
Pop-Location

Write-Host "2/3 Pakuojamas backend i deploy.zip..." -ForegroundColor Cyan
$Zip = "$Root\deploy.zip"
if (Test-Path $Zip) { Remove-Item $Zip }
# tar.exe yra Windows 10/11 sudetyje; -a pagal .zip pletini sukuria ZIP archyva.
# Imami tik reikalingi failai: node_modules Azure isidiegs pats, .env nekeliamas (raktai nustatomi Azure portale).
tar.exe -a -c -f $Zip -C "$Root\backend" src docs scripts public package.json package-lock.json; Check "zip kurimas"

Write-Host "3/3 Keliama i Azure ($AppName)... (gali uztrukti 2-5 min.)" -ForegroundColor Cyan
az webapp deploy --resource-group $ResourceGroup --name $AppName --src-path $Zip --type zip; Check "az webapp deploy"

Remove-Item $Zip
# Tikras programos adresas (jei Azure pridejo atsitiktine galune - bus parodyta ir ji).
$HostName = az webapp show --resource-group $ResourceGroup --name $AppName --query defaultHostName -o tsv
Write-Host ""
Write-Host "Baigta! Programa: https://$HostName" -ForegroundColor Green
Write-Host "API patikrinimas: https://$HostName/api/health" -ForegroundColor Green
