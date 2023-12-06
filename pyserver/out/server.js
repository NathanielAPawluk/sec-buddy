"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager.
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true
            }
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings = { maxNumberOfProblems: 1000, python: { errorMessages: true, inputValidation: true, version: "3.12.0" } };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServerExample || defaultSettings));
    }
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'secbuddy'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
});
async function validateTextDocument(textDocument) {
    // In this simple example we get the settings for every validate run.
    const settings = await getDocumentSettings(textDocument.uri);
    // Validation setup
    const text = textDocument.getText();
    let m;
    let problems = 0;
    const diagnostics = [];
    // Check for anything containing the word "error"
    const errorpattern = /error/gi;
    while ((m = errorpattern.exec(text)) && problems < settings.maxNumberOfProblems && settings.python.errorMessages == true) {
        problems++;
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(m.index),
                end: textDocument.positionAt(m.index + m[0].length)
            },
            message: `Error messages can lead to vulnerabilities if this code is used as part of a client. To turn these messages off, go to the extension\'s settings and disable "Error Message Checks"`,
            source: 'sec-buddy'
        };
        diagnostics.push(diagnostic);
    }
    // Reminder for input validation
    const inputpattern = /input\(*.+?\)/g;
    while ((m = inputpattern.exec(text)) && problems < settings.maxNumberOfProblems && settings.python.inputValidation == true) {
        problems++;
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(m.index),
                end: textDocument.positionAt(m.index + m[0].length)
            },
            message: 'Ensure that there is input validation for this! You can turn these reminders off in the extension\'s settings under "Input Validation"',
            source: 'sec-buddy'
        };
        diagnostics.push(diagnostic);
    }
    // Check for the use of the makefile package
    const makefilepattern = /makefile/g;
    let makefileExists = false;
    while ((m = makefilepattern.exec(text))) {
        makefileExists = true;
    }
    // Check for mktemp()
    const mktemppattern = /mktemp\(*.+?\)/g;
    while ((m = mktemppattern.exec(text)) && problems < settings.maxNumberOfProblems && makefileExists) {
        problems++;
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(m.index),
                end: textDocument.positionAt(m.index + m[0].length)
            },
            message: `${m[0]} can overwrite existing temp files, consider using mkstemp() (CVE-2023-2800)`,
            source: 'sec-buddy'
        };
        diagnostics.push(diagnostic);
    }
    // CVE array that can be looped through for package vulnerabilities
    const currentVersion = settings.python.version;
    const vulnerabilities = [];
    const cve2023_27043 = {
        versions: [/3\.10\./g, /3\.[7-9]\./g],
        pattern: /email\.utils/g,
        errorMsg: `This package is vulnerable in your current version of python. Consider updating or avoid the use of email.utils.parsaddr() and email.utils.getaddresses() (CVE-2023-27043)`
    };
    vulnerabilities.push(cve2023_27043);
    const cve2023_24329 = {
        versions: [/3\.10\./g, /3\.9\./g, /3\.8\./g, /3\.7\./g],
        pattern: /urllib\.parse/g,
        errorMsg: 'This package is vulnerable in your current version of python. Consider updating or avoid the use of urllib.parse.urlparse() (CVE-2023-24329)'
    };
    vulnerabilities.push(cve2023_24329);
    const cve2022_37454 = {
        versions: [/3\.[0-6]\./, /2\.[0-7]\./, /1\.[0-6]\./, /\b3\.[7-9]\.[0-9]\b/, /\b3\.[7-9]\.1[0-5]\b/, /\b3\.10\.[0-8]\b/],
        pattern: /hashlib/g,
        errorMsg: 'This package is vulnerable in your current version of python. Consider updating or avoid the use of hashlib.sha3_224 (CVE-2022-37454)'
    };
    vulnerabilities.push(cve2022_37454);
    const cve2022_45061 = {
        versions: [/3\.[0-6]\./, /2\.[0-7]\./, /1\.[0-6]\./, /\b3\.[7-9]\.[0-9]\b/, /\b3\.[7-9]\.1[0-5]\b/, /\b3\.10\.[0-8]\b/, /\b3\.11\.0\b/],
        pattern: /decode\('idna'\)/g,
        errorMsg: 'This method of decoding uses a quadratic formula and can lead to slow execution time. Consider updating your version (CVE-2022-45061)'
    };
    vulnerabilities.push(cve2022_45061);
    const cve2022_42919 = {
        versions: [/\b3\.9\.[0-9]\b/, /\b3\.9\.1[0-5]\b/, /\b3\.10.[0-8]\b/,],
        pattern: /multiprocessing\.util/g,
        errorMsg: 'This package is vulnerable in your current version of python. Forkserver may allow for privilege escalation attacks when executed on Linux systems (CVE-2022-42919)'
    };
    vulnerabilities.push(cve2022_42919);
    const cve2020_10735 = {
        versions: [/3\.[0-6]\./, /2\.[0-7]\./, /1\.[0-6]\./, /\b3\.[7-9]\.[0-9]\b/, /\b3\.[7-9]\.1[0-3]\b/, /\b3\.10\.[0-6]\b/],
        pattern: /int\("*.+?"\)/g,
        errorMsg: 'This method has a quadratic time formula in your version of python. This can be abused for a DOS attack. Consider updating your version or adding a limit to the amount of characters used by this function (CVE-2020-10735)'
    };
    vulnerabilities.push(cve2020_10735);
    const cve2018_25032 = {
        versions: [/\b3\.[7-9]\.[0-9]\b/, /\b3\.[7-9]\.1[0-3]\b/, /\b3\.[7-8]\.14\b/, /\b3\.10\.[0-4]\b/],
        pattern: /zlib/g,
        errorMsg: 'This package is vulnerable in your current version of python. Zlib contains an out-of-bounds access flaw, which can allow memory corruption (CVE-2018-25032)'
    };
    vulnerabilities.push(cve2018_25032);
    const cve2016_3189 = {
        versions: [/\b3\.[7-9]\.[0-9]\b/, /\b3\.[7-9]\.1[0-1]\b/, /\b3\.[7-8]\.[2-3]\b/, /\b3\.10\.[0-3]\b/],
        pattern: /bz2/g,
        errorMsg: 'This package is vulnerable in your current version of python. This version of bzip2 allows for remote DoS attacks (CVE-2016-3189)'
    };
    vulnerabilities.push(cve2016_3189);
    const cve2019_12900 = {
        versions: [/\b3\.[7-9]\.[0-9]\b/, /\b3\.[7-9]\.1[0-1]\b/, /\b3\.[7-8]\.[2-3]\b/, /\b3\.10\.[0-3]\b/],
        pattern: /bz2/g,
        errorMsg: 'This package is vulnerable in your current version of python. TThis version of bzip allows for out-of-bounds writes when decompressing (CVE-2019-12900)'
    };
    vulnerabilities.push(cve2019_12900);
    const cve2013_0340 = {
        versions: [/\b3\.[6-8].[0-9]\b/, /\b3\.[6-8]\.1[0-2]\b/, /\b3\.6\.1[3-5]\b/, /\b3\.9\.[0-7]\b/],
        pattern: /xml/g,
        errorMsg: 'This package is vulnerable in your current version of python. This package is vulnerable to the XML billion laughs attack when using parser.expat (CVE-2013-0340)'
    };
    vulnerabilities.push(cve2013_0340);
    const cve2021_3737 = {
        versions: [/\b3\.[6-8]\.[0-9]\b/, /\b3\.6\.1[0-4]\b/, /\b3\.[7-8]\.1[0-1]\b/, /\b3\.9\.[0-6]\b/],
        pattern: /\burllib\.request\b/,
        errorMsg: 'This package is vulnerable in your current version of python. HTTP requests can enter an infinite loop (CVE-2021-3737)'
    };
    vulnerabilities.push(cve2021_3737);
    for (let i = 0; i < vulnerabilities.length; i++) {
        let vulnerable = false;
        for (let j = 0; j < vulnerabilities[i].versions.length; j++) {
            if (currentVersion.search(vulnerabilities[i].versions[j]) != -1) {
                vulnerable = true;
            }
        }
        while ((m = vulnerabilities[i].pattern.exec(text)) && problems < settings.maxNumberOfProblems && vulnerable) {
            problems++;
            const diagnostic = {
                severity: node_1.DiagnosticSeverity.Warning,
                range: {
                    start: textDocument.positionAt(m.index),
                    end: textDocument.positionAt(m.index + m[0].length)
                },
                message: vulnerabilities[i].errorMsg,
                source: 'sec-buddy'
            };
            diagnostics.push(diagnostic);
        }
    }
    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VSCode
    connection.console.log('We received an file change event');
});
// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition) => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return [
        {
            label: 'TypeScript',
            kind: node_1.CompletionItemKind.Text,
            data: 1
        },
        {
            label: 'JavaScript',
            kind: node_1.CompletionItemKind.Text,
            data: 2
        }
    ];
});
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    if (item.data === 1) {
        item.detail = 'TypeScript details';
        item.documentation = 'TypeScript documentation';
    }
    else if (item.data === 2) {
        item.detail = 'JavaScript details';
        item.documentation = 'JavaScript documentation';
    }
    return item;
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map