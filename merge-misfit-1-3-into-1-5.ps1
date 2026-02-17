# Run this after closing anything that might have backend/logs open
# (e.g. Spring Boot app, IDE log viewer). Then merge misfit-1-3 into misfit-1-5.

Set-Location $PSScriptRoot

$logPath = "backend/logs/spring-boot-failure.log"
if (Test-Path $logPath) {
  Remove-Item -Force $logPath
  if (Test-Path $logPath) { Write-Error "Could not delete $logPath - close the app that is using it and run this again."; exit 1 }
}

git checkout misfit-1-5
git merge misfit-1-3 -m "Merge misfit-1-3 into misfit-1-5 (updated backend and local work)"

Write-Host "Done. misfit-1-5 now has everything from misfit-1-3. Push with: git push origin misfit-1-5"
