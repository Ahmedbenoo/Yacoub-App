$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
if (-not $env:JAVA_HOME) { $env:JAVA_HOME = "D:\Java\jdk-17.0.20.1+1" }
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "D:\Android\Sdk" }
if (-not $env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME }
# Always use the short cache. A pre-set home under AppData exceeds Windows' 260-character path limit in Ninja.
$env:GRADLE_USER_HOME = "D:\.gradle"

$metroTmp = "D:\.metro-apk"
New-Item -ItemType Directory -Force -Path $metroTmp | Out-Null
$env:TEMP = $metroTmp
$env:TMP = $metroTmp
$env:NODE_ENV = "production"
$env:EXPO_NO_METRO_LAZY = "1"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

if (-not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
  throw "JAVA_HOME is missing java.exe: $env:JAVA_HOME"
}

if (-not (Test-Path "$env:ANDROID_HOME\platforms\android-36")) {
  throw "Android SDK platform 36 is not installed at $env:ANDROID_HOME"
}

Set-Location $root

if (-not (Test-Path "$root\android\gradlew.bat")) {
  $env:CI = "1"
  npx expo prebuild --platform android
}

$sdkDir = ($env:ANDROID_HOME -replace '\\', '/')
Set-Content -Path "$root\android\local.properties" -Value "sdk.dir=$sdkDir" -Encoding ascii

# Windows Ninja cannot Stat CMake object paths longer than 260 characters.
# Build through a short junction so autolinked C++ object names stay short.
$shortRoot = "D:\p"
if (-not (Test-Path "$shortRoot\android\gradlew.bat")) {
  if (Test-Path $shortRoot) {
    throw "Short build path $shortRoot already exists and is not this project"
  }
  cmd /c "mklink /J `"$shortRoot`" `"$root`""
  if ($LASTEXITCODE -ne 0) {
    throw "Could not create junction $shortRoot -> $root"
  }
}

$cxxDir = "$shortRoot\android\app\.cxx"
if ($env:CLEAN_CXX -eq "1" -and (Test-Path $cxxDir)) {
  cmd /c "rmdir /s /q \\?\$cxxDir"
}

$generatedJs = "$shortRoot\android\app\build\generated"
if (Test-Path $generatedJs) {
  Remove-Item -Recurse -Force $generatedJs
}
Get-ChildItem $metroTmp -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Set-Location "$shortRoot\android"
& .\gradlew.bat assembleRelease --no-daemon
if ($LASTEXITCODE -ne 0) {
  throw "Gradle assembleRelease failed with exit code $LASTEXITCODE"
}

$apk = Get-ChildItem "$shortRoot\android\app\build\outputs\apk\release\*.apk" | Select-Object -First 1
if (-not $apk) {
  throw "Release APK was not produced"
}

New-Item -ItemType Directory -Force -Path "$root\dist" | Out-Null
$dest = "$root\dist\clinsync-release.apk"
Copy-Item $apk.FullName $dest -Force
Write-Host "APK ready: $dest"
Write-Host "Size: $([math]::Round($apk.Length / 1MB, 1)) MB"
