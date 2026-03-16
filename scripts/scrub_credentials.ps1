$baseDir = "c:\Users\TEMPOCASA\KRONOS\kronosnet\KRONOS-OUTREACH"

$targetFiles = @(
    "workflows\universal_scraper.json",
    "workflows\universal_scorer.json",
    "workflows\lead_scorer.json",
    "workflows\apify_swiss_scraper.json",
    "workflows\kronos_social_video_factory.json",
    "KRONOS_V2_PERFECTED.json",
    "KRONOS_V1_LEGACY.json"
)

$idMap = @(
    ,@("AtP2rrGrxZ5FHBNZ", "YOUR_AIRTABLE_CREDENTIAL_ID")
    ,@("vjJ9PbCDOkVNZZRJ", "YOUR_GOOGLE_SHEETS_CREDENTIAL_ID")
    ,@("SiSYF54ok1YtEZ44", "YOUR_HTTP_HEADER_CREDENTIAL_ID")
    ,@("td3utRybtI5wRRtH", "YOUR_OPENAI_CREDENTIAL_ID")
)

foreach ($relPath in $targetFiles) {
    $fullPath = Join-Path $baseDir $relPath
    if (-not (Test-Path $fullPath)) {
        Write-Host "SKIP: $relPath (not found)"
        continue
    }

    $content = [System.IO.File]::ReadAllText($fullPath)
    $changed = $false

    foreach ($pair in $idMap) {
        $oldVal = $pair[0]
        $newVal = $pair[1]
        if ($content.Contains($oldVal)) {
            $content = $content.Replace($oldVal, $newVal)
            $changed = $true
            Write-Host "  Replaced $oldVal -> $newVal"
        }
    }

    if ($changed) {
        [System.IO.File]::WriteAllText($fullPath, $content, [System.Text.UTF8Encoding]::new($false))
        Write-Host "SANITIZED: $relPath"
    }
    else {
        Write-Host "CLEAN: $relPath"
    }
}

Write-Host ""
Write-Host "Credential scrub complete."
