@echo off
REM Long BAT sample:
REM - args parsing
REM - loops
REM - conditionals
REM - skip rules
REM - counters
REM - delayed expansion

setlocal enabledelayedexpansion

set ROOT=%~1
if "%ROOT%"=="" set ROOT=.

set MAX=%~2
if "%MAX%"=="" set MAX=50

set MODE=%~3
if "%MODE%"=="" set MODE=scan

echo [INFO] ROOT=%ROOT%
echo [INFO] MAX=%MAX%
echo [INFO] MODE=%MODE%

set COUNT=0
set INDEXED=0
set SKIPPED=0

REM helper label for skipping extensions
:scan
for /r "%ROOT%" %%F in (*) do (
  set /a COUNT+=1
  set EXT=%%~xF

  REM skip dirs by path fragments
  echo %%F | findstr /i "\\node_modules\\ \\dist\\ \\build\\ \\.git\\ \\coverage\\" >nul
  if !errorlevel! EQU 0 (
    set /a SKIPPED+=1
    goto :continue
  )

  REM skip extensions
  if /I "!EXT!"==".png" (set /a SKIPPED+=1 & goto :continue)
  if /I "!EXT!"==".jpg" (set /a SKIPPED+=1 & goto :continue)
  if /I "!EXT!"==".jpeg" (set /a SKIPPED+=1 & goto :continue)
  if /I "!EXT!"==".pdf" (set /a SKIPPED+=1 & goto :continue)
  if /I "!EXT!"==".zip" (set /a SKIPPED+=1 & goto :continue)

  REM empty file check
  if %%~zF EQU 0 (
    echo [WARN] empty: %%F
    set /a SKIPPED+=1
    goto :continue
  )

  set /a INDEXED+=1

  REM nested logic
  if /I "%MODE%"=="scan" (
    REM do minimal read
    type "%%F" >nul
  ) else (
    REM placeholder for other modes
    REM echo processing %%F
  )

  if !INDEXED! LEQ %MAX% (
    echo [INFO] indexed: %%F
  )

  if !INDEXED! GEQ %MAX% (
    goto :done
  )

  :continue
)

:done
echo [INFO] summary seen=%COUNT% indexed=%INDEXED% skipped=%SKIPPED%
endlocal
