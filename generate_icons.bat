@echo off
setlocal enabledelayedexpansion

set "SOURCE_DIR=.\icon"
set "DEST_DIR=.\public\icon"
set "DEFAULT_DIR=%DEST_DIR%\default"
set "PROCESSING_DIR=%DEST_DIR%\processing"
set "DISABLED_DIR=%DEST_DIR%\disabled"

:: Check if ImageMagick is installed
where magick >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ImageMagick is not installed!
    echo Please install ImageMagick from https://imagemagick.org/script/download.php#windows
    echo After installation, run this script again.
    exit /b 1
)

:: Clean and recreate directories
if exist "%DEFAULT_DIR%" rd /s /q "%DEFAULT_DIR%"
if exist "%PROCESSING_DIR%" rd /s /q "%PROCESSING_DIR%"
if exist "%DISABLED_DIR%" rd /s /q "%DISABLED_DIR%"
mkdir "%DEFAULT_DIR%"
mkdir "%PROCESSING_DIR%"
mkdir "%DISABLED_DIR%"

:: Resize for Chrome Web Store
magick "%SOURCE_DIR%\Chrome Web Store.png" -resize 128x128 "%DEFAULT_DIR%\128.png"
if %ERRORLEVEL% neq 0 (
    echo Failed to save to default folder
    exit /b 1
)

magick "%SOURCE_DIR%\Chrome Web Store.png" -resize 128x128 "%PROCESSING_DIR%\128.png"
if %ERRORLEVEL% neq 0 (
    echo Failed to save to processing folder
    exit /b 1
)

:: Resize for manage extensions page
set "sizes=48 96"
for %%s in (%sizes%) do (
    magick "%SOURCE_DIR%\Manage Extensions.png" -resize %%sx%%s "%DEFAULT_DIR%\%%s.png"
    if !ERRORLEVEL! neq 0 (
        echo Failed to save %%s.png to default folder
        exit /b 1
    )

    magick "%SOURCE_DIR%\Manage Extensions.png" -resize %%sx%%s "%PROCESSING_DIR%\%%s.png"
    if !ERRORLEVEL! neq 0 (
        echo Failed to save %%s.png to processing folder
        exit /b 1
    )
)

echo Successfully resized Chrome Web Store.png to 128x128 in both default and processing folders

:: Resize Default.png to multiple sizes and save to default folder
for %%s in (16 19 38) do (
    magick "%SOURCE_DIR%\Default.png" -resize %%sx%%s "%DEFAULT_DIR%\%%s.png"
    if !ERRORLEVEL! neq 0 (
        echo Failed to save %%s.png to default folder
        exit /b 1
    )
)

echo Successfully resized Default.png to multiple sizes in default folder

:: Resize Processing.png to multiple sizes and save to processing folder
for %%s in (16 19 38) do (
    magick "%SOURCE_DIR%\Processing.png" -resize %%sx%%s "%PROCESSING_DIR%\%%s.png"
    if !ERRORLEVEL! neq 0 (
        echo Failed to save %%s.png to processing folder
        exit /b 1
    )
)

echo Successfully resized Processing.png to multiple sizes in processing folder

:: Resize Disabled.png to multiple sizes and save to disabled folder
for %%s in (16 19 38 48 96 128) do (
    magick "%SOURCE_DIR%\Disabled.png" -resize %%sx%%s "%DISABLED_DIR%\%%s.png"
    if !ERRORLEVEL! neq 0 (
        echo Failed to save %%s.png to disabled folder
        exit /b 1
    )
)

echo Successfully resized Disabled.png to multiple sizes in disabled folder
