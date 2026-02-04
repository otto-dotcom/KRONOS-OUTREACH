#!/usr/bin/env pwsh
Param()

# Creates a private GitHub repo named KRONOS-FAMILY and pushes the current repo.
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "gh CLI not found. Install from https://cli.github.com/"
    exit 1
}

$repoName = "KRONOS-FAMILY"
gh auth status > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "You are not authenticated with gh. Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "Creating private repo '$repoName' and pushing current directory..." -ForegroundColor Cyan
gh repo create $repoName --private --source . --remote origin --push
