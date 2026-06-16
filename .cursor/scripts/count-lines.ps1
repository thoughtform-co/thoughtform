param([string]$Path = ".")
$root = (Resolve-Path $Path).Path
$base = (Get-Location).Path
Get-ChildItem -Path $root -Recurse -File | Sort-Object FullName | ForEach-Object {
  $count = (Get-Content $_.FullName | Measure-Object -Line).Lines
  $rel = $_.FullName.Substring($base.Length + 1)
  '{0,5}  {1}' -f $count, $rel
}
