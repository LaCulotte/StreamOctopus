@echo off
SET /P AREYOUSURE=Link octopus-app dist for web apps (Requires admin)? (Y/[N]) 
IF /I "%AREYOUSURE%" EQU "Y" npm run octopus-app-symlink-ok