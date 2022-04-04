#!/bin/bash

commandExist() {
    if ! [ -x "$(command -v $1)" ]; then
        echo "No"
        #return 1;
    else
        echo "Yes"
        #return 0;
    fi
}

txtblk='\e[0;30m' # Black - Regular
txtred='\e[0;31m' # Red
txtgrn='\e[0;32m' # Green
txtylw='\e[0;33m' # Yellow
txtblu='\e[0;34m' # Blue
txtpur='\e[0;35m' # Purple
txtcyn='\e[0;36m' # Cyan
txtwht='\e[0;37m' # White

isNpxExist=$(commandExist npx)

if [ $isNpxExist = "No" ]; then
    echo "Error: Please install npx"
    exit 1;
fi
echo -e "${txtgrn}===>${txtwht} Start building..."

echo -e "${txtgrn}===>${txtwht} Resetting build folder..."
mkdir build
rm -rfv build/*

echo -e "${txtgrn}===>${txtwht} Copying files..."
cp -R src/* build/

echo -e "${txtgrn}===>${txtwht} Compiling stylesheets..."
npx sass build --style compressed --source-map

echo -e "${txtblu} --- Build error from this line is OK to ignore --- ${txtwht}"
echo -e "${txtgrn}===>${txtwht} Compiling scripts..."
npx tsc --project ./tsconfig.json
echo -e "${txtred} --- Build error from this line is now NOT OK to ignore --- ${txtwht}"

echo -e "${txtgrn}===>${txtwht} Deleting unused files..."
find build -type f \( -iname *.ts -o -iname *.sass -o -iname *.scss \) -exec rm -fv {} \;

echo -e "${txtgrn}===>${txtwht} Done!"
