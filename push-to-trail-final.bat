@echo off
echo ==========================================
echo TrailWatch - Push to trail-final branch
echo ==========================================
echo.

cd C:\Users\21658\Desktop\trail-condition-reporting-1

echo [1/8] Checking git status...
git status

echo.
echo [2/8] Creating and switching to trail-final branch...
git checkout -b trail-final

echo.
echo [3/8] Removing unnecessary folders...
git rm -rf auth-test backend docs frontend node_modules project-backup trailwatch 2>nul
rmdir /s /q auth-test backend docs frontend node_modules project-backup trailwatch 2>nul

echo.
echo [4/8] Removing test files and old scripts...
git rm simple-auth-server.js working-auth-server.js simple-test.html 2>nul
git rm test-api.js test-auth.json test-login.json test-login-proper.json test-newuser-login.json test-register.json test-report.json test-report-fixed.json 2>nul
git rm register-test.bat run-mock-servers.bat test-working-login.sh 2>nul
git rm MERGE-PLAN.md README-SETUP.md TEST-RESULTS.md test-merged-implementation.js 2>nul
del simple-auth-server.js working-auth-server.js simple-test.html 2>nul
del test-api.js test-auth.json test-login.json test-login-proper.json test-newuser-login.json test-register.json test-report.json test-report-fixed.json 2>nul
del register-test.bat run-mock-servers.bat test-working-login.sh 2>nul
del MERGE-PLAN.md README-SETUP.md TEST-RESULTS.md test-merged-implementation.js 2>nul

echo.
echo [5/8] Keeping important files:
echo - client/ (frontend)
echo - server/ (backend)
echo - AWS-DEPLOYMENT.md
echo - README.md
echo - deploy.sh, update.sh
echo - nginx.conf
echo - .env.example
echo - PRD-v2.1-95percent-MVP.md

echo.
echo [6/8] Adding all remaining changes...
git add -A

echo.
echo [7/8] Committing cleanup...
git commit -m "Clean up: remove unused folders and files, prepare for AWS deployment

- Deleted test folders: auth-test, backend, docs, frontend, node_modules, project-backup
- Deleted old test files and scripts
- Kept only essential files for production deployment
- Ready for AWS EC2 deployment"

echo.
echo [8/8] Pushing to trail-final branch...
git push origin trail-final

echo.
echo ==========================================
echo DONE! Pushed to trail-final branch
echo ==========================================
echo.
echo Now you can deploy on EC2:
echo 1. SSH to your EC2: ssh -i group8.pem ec2-user@35.171.186.209
echo 2. Clone: git clone -b trail-final https://github.com/YOUR_USERNAME/trail-condition-reporting-1.git
echo 3. Follow AWS-DEPLOYMENT.md
echo.
pause
