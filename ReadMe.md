# NoHistory
***When you want to hide something, but don't want to open a private window.***

## What is this?
**NoHistory** is an extension for Firefox created by me to prevent web pages from getting saved from history without opening a private window. It's *free*, *open-source*, and can help you in *certain situations* (See "What situation exactly?" for more info).

## What situation exactly?
 - When you need to access a webpage, but it forces you to log in to use it, it's something that you don't want your parent to know, and you don't feel like typing the login details.

 - And that's it

## So, how to?
 - **Build the project**: Run npm run build in the root directory, and it will generate the necessary file into the build folder.

 - **Build the project for debugging purposes (will require VSCode)**: In the VSCode window, press the key combination: "Ctrl + Shift + B" and this should bring up a list of build options. Select the build option named: "RUN THIS TASK AND ONLY THIS TASK TO BUILD THE REQUIRED FILES" and it will generate the file into the src directory so that you can load the extension with both the generated one and the source file. Also for development purposes, the file will get updated when you save the source file.

 - **Install the required dependencies (which contain type definition)**: Run npm install in the root directory.

> **Important Note**: To build and watch the file, you need to install NodeJS so that the computer can use the Node Package Manager to run the required tool like "sass" or "tsc".

## License
NoHistory is licensed under the [MIT license](LICENSE)