@echo off

echo ===^> Start building...

echo ===^> Resetting build folder...
mkdir build || del /s / q build\

echo ===^> Copying files...
xcopy "src\*" build\ /E

echo ===^> Compiling stylesheets...
call npx sass src:build --style compressed --source-map

echo  --- Build error from this line is OK to ignore --- 
echo ===^> Compiling scripts...
call npx tsc --project ./tsconfig.json
echo  --- Build error from this line is now NOT OK to ignore --- 

echo ===^> Deleting unused files...
del /s /q build\*.ts
del /s /q build\*.scss
del /s /q build\*.sass

echo ===^> Done!