@echo off
echo Updating .env.local with new contract addresses...

REM Update Oracle address
powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_SHAHSWAP_ORACLE=.*', 'NEXT_PUBLIC_SHAHSWAP_ORACLE=0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52' | Set-Content .env.local"

REM Update Router address
powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_SHAHSWAP_ROUTER=.*', 'NEXT_PUBLIC_SHAHSWAP_ROUTER=0x20794d26397f2b81116005376AbEc0B995e9D502' | Set-Content .env.local"

REM Enable new features
powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_ENABLE_TWAP=.*', 'NEXT_PUBLIC_ENABLE_TWAP=true' | Set-Content .env.local"
powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_ENABLE_PERMIT=.*', 'NEXT_PUBLIC_ENABLE_PERMIT=true' | Set-Content .env.local"
powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_ENABLE_BATCH_SWAPS=.*', 'NEXT_PUBLIC_ENABLE_BATCH_SWAPS=true' | Set-Content .env.local"

echo Environment variables updated successfully!
echo.
echo New contract addresses:
echo Oracle: 0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52
echo Router: 0x20794d26397f2b81116005376AbEc0B995e9D502
echo.
pause
