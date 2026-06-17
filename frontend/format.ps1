#!/usr/bin/env pwsh
# Format and lint the frontend code

Write-Host "Formatting frontend code..." -ForegroundColor Cyan

# Format with Prettier
Write-Host "`nRunning Prettier..." -ForegroundColor Yellow
npm run format

# Fix ESLint issues
Write-Host "`nRunning ESLint with auto-fix..." -ForegroundColor Yellow
npm run lint:fix

# Show remaining issues (if any)
Write-Host "`nChecking for remaining ESLint issues..." -ForegroundColor Yellow
npm run lint

Write-Host "`n[OK] Frontend formatting complete!" -ForegroundColor Green
