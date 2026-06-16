# Rewire the Claude-workshop fork of the V7 prototype HTML.
# Encoding-safe: script source is pure ASCII; Unicode chars are built at runtime via [char] casts.
$ErrorActionPreference = 'Stop'

$path = (Resolve-Path -LiteralPath "public/prototypes/v7/landing-claude-workshop.html").Path
$content = [System.IO.File]::ReadAllText($path)
$origLen = $content.Length

# Unicode building blocks (avoid embedding non-ASCII in this script file).
$EQ = ([string][char]0x2550) * 11   # eleven box-drawings double horizontal characters
$DOT = [string][char]0x00B7         # middle dot used in HUD/banner copy

# --- Step 1: extract the about block via regex (anchored on its banner comment) ---
# Right boundary is the next station's banner ("06 CONTACT") so trailing whitespace
# between sections is preserved exactly.
$aboutLeftAnchor  = "  <!-- $EQ 05 ABOUT $DOT VINCE BUYSSENS // VOIDWALKER $EQ -->"
$contactAnchor    = "  <!-- $EQ 06 CONTACT $EQ -->"

$startIdx = $content.IndexOf($aboutLeftAnchor)
$endIdx   = $content.IndexOf($contactAnchor)
if ($startIdx -lt 0) { throw "About banner anchor not found (already rewired?)" }
if ($endIdx   -lt 0) { throw "Contact banner anchor not found" }
if ($endIdx -le $startIdx) { throw "Contact banner found before About banner; aborting" }

$aboutBlock = $content.Substring($startIdx, $endIdx - $startIdx)

# Transform: rebrand banner header + screen label
$bioLeftAnchor = "  <!-- $EQ 02 BIO $DOT VINCE BUYSSENS // VOIDWALKER $EQ -->"
$bioBlock = $aboutBlock.Replace($aboutLeftAnchor, $bioLeftAnchor).Replace('data-screen-label="09 About"', 'data-screen-label="02 Bio"')

# Splice: remove from original location, insert before the "02 THOUGHTFORM" banner.
$content = $content.Remove($startIdx, $endIdx - $startIdx)

$thoughtformAnchor = "  <!-- $EQ 02 THOUGHTFORM"
$insertIdx = $content.IndexOf($thoughtformAnchor)
if ($insertIdx -lt 0) { throw "Thoughtform banner anchor not found" }
$content = $content.Insert($insertIdx, $bioBlock)

# --- Step 2: renumber data-screen-label values for sections after the new Bio ---
$labelMap = [ordered]@{
  'data-screen-label="02 Thoughtform"'        = 'data-screen-label="03 Thoughtform"'
  'data-screen-label="03 Missing layer"'      = 'data-screen-label="04 Missing layer"'
  'data-screen-label="04 Intelligence layer"' = 'data-screen-label="05 Intelligence layer"'
  'data-screen-label="05 Continuum"'          = 'data-screen-label="06 Continuum"'
  'data-screen-label="06 Practice"'           = 'data-screen-label="07 Practice"'
  'data-screen-label="06.5 Axiom"'            = 'data-screen-label="07.5 Axiom"'
  'data-screen-label="07 Build"'              = 'data-screen-label="08 Build"'
  'data-screen-label="08 Services"'           = 'data-screen-label="09 Services"'
}
foreach ($k in $labelMap.Keys) {
  if (-not $content.Contains($k)) { throw "Screen label not found: $k" }
  $content = $content.Replace($k, $labelMap[$k])
}

# --- Step 3: rewrite the HUD nav block ---
$oldNav = @"
        <a href="#hero" data-station="hero" class="is-active"><span class="num">01</span>Interface</a>
        <a href="#definition" data-station="definition"><span class="num">02</span>Thoughtform</a>
        <a href="#missing-layer" data-station="missingLayer"><span class="num">03</span>Missing layer</a>
        <a href="#intelligence-layer" data-station="intelligenceLayer"><span class="num">04</span>Intelligence layer</a>
        <a href="#continuum" data-station="continuum"><span class="num">05</span>Continuum</a>
        <a href="#practice" data-station="practice"><span class="num">06</span>Practice</a>
        <a href="#build" data-station="build"><span class="num">07</span>Build</a>
        <a href="#services" data-station="services"><span class="num">08</span>Services</a>
        <a href="#about" data-station="about"><span class="num">09</span>About</a>
        <a href="#contact" data-station="contact"><span class="num">10</span>Contact</a>
"@

$newNav = @"
        <a href="#hero" data-station="hero" class="is-active"><span class="num">01</span>Interface</a>
        <a href="#about" data-station="about"><span class="num">02</span>Bio</a>
        <a href="#definition" data-station="definition"><span class="num">03</span>Thoughtform</a>
        <a href="#missing-layer" data-station="missingLayer"><span class="num">04</span>Missing layer</a>
        <a href="#intelligence-layer" data-station="intelligenceLayer"><span class="num">05</span>Intelligence layer</a>
        <a href="#continuum" data-station="continuum"><span class="num">06</span>Continuum</a>
        <a href="#practice" data-station="practice"><span class="num">07</span>Practice</a>
        <a href="#build" data-station="build"><span class="num">08</span>Build</a>
        <a href="#services" data-station="services"><span class="num">09</span>Services</a>
        <a href="#contact" data-station="contact"><span class="num">10</span>Contact</a>
"@

# The here-strings above may be LF-only (script file written cross-platform) or CRLF
# (Windows-native). The source HTML may be either. Normalise both forms and try each.
$oldNavLf   = $oldNav   -replace "`r`n", "`n"
$oldNavCrlf = $oldNavLf -replace "`n",   "`r`n"
$newNavLf   = $newNav   -replace "`r`n", "`n"
$newNavCrlf = $newNavLf -replace "`n",   "`r`n"

if ($content.Contains($oldNavCrlf)) {
  $content = $content.Replace($oldNavCrlf, $newNavCrlf)
} elseif ($content.Contains($oldNavLf)) {
  $content = $content.Replace($oldNavLf, $newNavLf)
} else {
  throw "HUD nav block not found in either CRLF or LF form"
}

# --- Write back, preserving UTF-8 (no BOM) to match the original file ---
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)

Write-Host ("Rewired. Size delta: {0} -> {1} ({2:+#;-#;0} chars)" -f $origLen, $content.Length, ($content.Length - $origLen))
