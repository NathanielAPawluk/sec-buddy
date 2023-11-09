"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = require("path");
const vscode = require("vscode");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    console.log('Sec-Buddy is now active');
    // Intro command to introduce the user to the plugin
    context.subscriptions.push(vscode.commands.registerCommand('sec-buddy.greeting', async () => {
        const response = await vscode.window.showInformationMessage('Hello! I am Sec Buddy, your new assistant for keeping your code secure! Check out the progress of the plugin using the links below!', 'Plans', 'GitHub Page');
        if (response === 'Plans') {
            // Opens Product Backlog in the browser
            vscode.env.openExternal(vscode.Uri.parse('https://docs.google.com/document/d/1ajQbIBILqC7eJM0Bc9Ylj9J7tyNvx90QQ41-XbVyMLs/edit?usp=sharing'));
        }
        else if (response === 'GitHub Page') {
            // Opens the GitHub page in the browser
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/NathanielAPawluk/sec-buddy'));
        }
    }));
    // Progress page commmand
    context.subscriptions.push(vscode.commands.registerCommand('sec-buddy.progress', () => {
        // Opens the Gantt Chart in the browser
        vscode.env.openExternal(vscode.Uri.parse('https://docs.google.com/spreadsheets/d/1GuXvdTbiaAUqEo6yg0PqPoB8BL2E7ebxp7SBiiyEnoo/edit?usp=sharing'));
    }));
    // Bug Report
    context.subscriptions.push(vscode.commands.registerCommand('sec-buddy.bug', () => {
        // Opens the github issues page
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/NathanielAPawluk/sec-buddy/issues'));
    }));
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
        }
    };
    // Options to control the language client
    const clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'c' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient('languageServerExample', 'Language Server Example', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map