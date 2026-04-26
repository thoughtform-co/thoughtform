# Normalize the creative-tech showcase screenshot filenames to lowercase-
# dashed slugs so they can be referenced from React without URL encoding.
# Idempotent and handles Windows' case-insensitive rename.

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path "$PSScriptRoot\.."
$root = Join-Path $repoRoot "public\showcase\creative-tech\screenshots"

if (-not (Test-Path $root)) {
    Write-Error "Screenshots root not found: $root"
    exit 1
}

function Normalize-Slug {
    param([string]$name)
    $base = [System.IO.Path]::GetFileNameWithoutExtension($name)
    $ext  = [System.IO.Path]::GetExtension($name).ToLowerInvariant()
    $slug = $base.ToLowerInvariant()
    $slug = $slug -replace "[\s_]+", "-"
    $slug = $slug -replace "[^a-z0-9\-]", ""
    $slug = $slug -replace "-+", "-"
    $slug = $slug.Trim('-')
    return "$slug$ext"
}

Get-ChildItem -Path $root -Recurse -File | ForEach-Object {
    $newName = Normalize-Slug $_.Name
    # Case-sensitive equality check (Windows file rename is case-insensitive
    # so we must detour through a temp name when only case differs).
    if ([string]::Equals($newName, $_.Name, [System.StringComparison]::Ordinal)) {
        return
    }

    $tempName = "_norm_" + [guid]::NewGuid().ToString("N") + [System.IO.Path]::GetExtension($_.Name)
    Rename-Item -LiteralPath $_.FullName -NewName $tempName
    $tempPath = Join-Path $_.DirectoryName $tempName
    Rename-Item -LiteralPath $tempPath -NewName $newName
    Write-Output "$($_.Name) -> $newName"
}

Write-Output "Done."
