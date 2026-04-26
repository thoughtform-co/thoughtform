# Unpack the creative-tech showcase share into public/showcase/creative-tech/.
# Keeps only assets/ + screenshots/ so the public bundle stays small and the
# files map cleanly to /showcase/creative-tech/{assets,screenshots}/...
# Idempotent: safe to re-run.

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path "$PSScriptRoot\.."
$zipPath = "C:\Users\buyss\Downloads\creative-tech-showcase-share-2026-04-23.zip"
$dest = Join-Path $repoRoot "public\showcase\creative-tech"

if (-not (Test-Path $zipPath)) {
    Write-Error "Zip not found: $zipPath"
    exit 1
}

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

# Only extract the asset and screenshot trees; ignore the standalone HTML/CSS/JS
# share bundle and the bundled font files.
$wantedPrefixes = @(
    "showcase/assets/",
    "showcase/screenshots/"
)

$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    foreach ($entry in $zip.Entries) {
        $rel = $entry.FullName
        # Strip the top-level zip folder.
        $parts = $rel -split "/", 2
        if ($parts.Length -lt 2) { continue }
        $relInside = $parts[1]
        if ([string]::IsNullOrWhiteSpace($relInside)) { continue }

        $matched = $false
        foreach ($prefix in $wantedPrefixes) {
            if ($relInside.StartsWith($prefix)) {
                $matched = $true
                break
            }
        }
        if (-not $matched) { continue }

        # Drop the redundant `showcase/` prefix so files land under
        # public/showcase/creative-tech/{assets,screenshots}/... directly.
        $finalRel = $relInside.Substring("showcase/".Length)
        if ([string]::IsNullOrWhiteSpace($finalRel)) { continue }

        $target = Join-Path $dest ($finalRel -replace "/", "\")

        if ($entry.Length -eq 0 -and $rel.EndsWith("/")) {
            if (-not (Test-Path $target)) {
                New-Item -ItemType Directory -Path $target -Force | Out-Null
            }
            continue
        }

        if ([System.IO.Path]::GetFileName($target) -eq ".gitkeep") { continue }

        $targetDir = Split-Path -Parent $target
        if ($targetDir -and -not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }

        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true) | Out-Null
    }
} finally {
    $zip.Dispose()
}

Write-Output "Unpacked to: $dest"
Get-ChildItem $dest -Recurse -File | Select-Object FullName
