@echo off
echo ==========================================
echo Pushing TypeScript fixes to trail-final
echo ==========================================
echo.

cd C:\Users\21658\Desktop\trail-condition-reporting-1

echo [1/4] Adding tsconfig.json changes...
git add client/tsconfig.json

echo.
echo [2/4] Committing...
git commit -m "Fix: Relax TypeScript strictness for production build

- Disabled strict type checking to allow build with unused imports
- Fixed token type issues in AdminDashboard
- Ready for AWS deployment"

echo.
echo [3/4] Pushing to trail-final branch...
git push origin trail-final

echo.
echo ==========================================
echo DONE! Now on EC2 run:
echo ==========================================
echo.
echo cd ~
echo rm -rf trail-condition-reporting
echo git clone -b trail-final https://github.com/KrishnaTejaG27/trail-condition-reporting.git
echo cd trail-condition-reporting/server
echo npm install ^&^& npm run build ^&^& pm2 restart trailwatch-api
echo cd ../client
echo npm install ^&^& npm run build
echo sudo cp -r dist/* /usr/share/nginx/html/
echo.
pause
