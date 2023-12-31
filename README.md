# Sec Buddy - Your new cyber security assistant

This project has been created as part of my studies in cyber security. I have a passion for programming and wanted to make an accessable tool that can parse code in real time to detect potential security threats.
I will be periodically updating this program for the remainder of the year (2023). This extension will work with C and Python.

Currently, the extension is capable of parsing C files for known vulnerable functions, such as strcpy(), and recommends replacement functions that are not vulnerable. It can also search for common python vulnerabilities, as well as known vulnerable packages based on the python version (which can be set in settings for the application). The python database was built primarily using https://python-security.readthedocs.io/vulnerabilities.html, which contains extension information on past python issues. When one of the vulnerable packages are found in a python file, the error message also provides the Common Vulnerabilities and Exposures (CVE) identifier, which can be used to gather more information on the vulnerability.

The current implementation of this plugin utilizes a built-in language server, which may end up getting ported over to other IDE's in the future (this project has been made for Visual Studio Code). This is being built upon the lsp-sample provided by Visual Studio.

## Known Issues
### C

Occasionally the settings for specific C vulernabilities are read as false, even though they are set to true. After turning them off and on they function as normal. Fixed?

## Links
[Gantt Chart outlining my desired timeline](https://docs.google.com/spreadsheets/d/1GuXvdTbiaAUqEo6yg0PqPoB8BL2E7ebxp7SBiiyEnoo/edit?usp=sharing)

[Product Backlog](https://docs.google.com/document/d/1ajQbIBILqC7eJM0Bc9Ylj9J7tyNvx90QQ41-XbVyMLs/edit?usp=sharing)

## Currently Handled CVE's

[CVE-2023-27043](https://nvd.nist.gov/vuln/detail/cve-2023-27043)

[CVE-2023-24329](https://nvd.nist.gov/vuln/detail/cve-2023-24329)

[CVE-2022-37454](https://nvd.nist.gov/vuln/detail/cve-2022-37454)

[CVE-2022-45061](https://nvd.nist.gov/vuln/detail/cve-2022-45061)

[CVE-2022-42919](https://nvd.nist.gov/vuln/detail/cve-2022-42919)

[CVE-2020-10735](https://nvd.nist.gov/vuln/detail/cve-2020-10735)

[CVE-2018-25032](https://nvd.nist.gov/vuln/detail/cve-2018-25032)

[CVE-2016-3189](https://nvd.nist.gov/vuln/detail/cve-2016-3189)

[CVE-2019-12900](https://nvd.nist.gov/vuln/detail/cve-2019-12900)

[CVE-2013-0340](https://nvd.nist.gov/vuln/detail/cve-2013-0340)

[CVE-2021-3737](https://nvd.nist.gov/vuln/detail/cve-2021-3737)