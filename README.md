# Sec Buddy - Your new cyber security assistant

This project has been created as part of my studies in cyber security. I have a passion for programming and wanted to make an accessable tool that can parse code in real time to detect potential security threats.
I will be periodically updating this program for the remainder of the year (2023). This extension will work with C and Python.


## Testing

The current implementation of this plugin utilizes a built-in language server, which may end up getting ported over to other IDE's in the future (this project has been made for Visual Studio Code). This is being built upon the lsp-sample provided by Visual Studio.

This has not yet been released publicly. If you want to test it out, use the following commands:

```
git clone https://github.com/NathanielAPawluk/sec-buddy
cd sec-buddy
npm install
npm run compile
code .
```

Once this has been done, you can open it in Visual Studio Code. Build the application by pressing Ctrl+Shift+B. Once it has finished running, press F5 to open the test build. 

Currently, this works for C and Python files, locating known vulnerable functions. This also comes with a few built-in commands that can redirect you to important links regarding the project. You can also find them at the end of this document.

The plugin features an extensive list of settings, allowing users to disable errors for functions that they want to ignore. This is not advised, but has been made available for accessibility. 

## Known Issues
### C
Vulnerable functions need updated pattern checking for vulnerable functions. It currently starts the pattern check from anywhere in a line, so a function such as fgets() gets flagged for the gets() vulnerability.

vsprintf() gets caught with both the sprintf() and vsprintf() vulnerabilites, labeling it twice.

Occasionally the settings for specific C vulernabilities are read as false, even though they are set to true. After turning them off and on they function as normal.

### Python
Python vulnerabilities that are handled by true/false settings also fail to work properly until turned off and on again.


## Links
[Gantt Chart outlining my desired timeline](https://docs.google.com/spreadsheets/d/1GuXvdTbiaAUqEo6yg0PqPoB8BL2E7ebxp7SBiiyEnoo/edit?usp=sharing)

[Product Backlog](https://docs.google.com/document/d/1ajQbIBILqC7eJM0Bc9Ylj9J7tyNvx90QQ41-XbVyMLs/edit?usp=sharing)

