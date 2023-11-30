import * as path from 'path';
import * as vscode from 'vscode';
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let cclient: LanguageClient;
let pyclient: LanguageClient;

export function activate(context: ExtensionContext) {
	console.log('Sec-Buddy is now active');

	// Intro command to introduce the user to the plugin
	context.subscriptions.push(vscode.commands.registerCommand('sec-buddy.greeting', async () => {
		const response = await vscode.window.showInformationMessage(
			'Hello! I am Sec Buddy, your new assistant for keeping your code secure! Check out the progress of the plugin using the links below!',
			'Plans',
			'GitHub Page');
		
		if(response === 'Plans'){
			// Opens Product Backlog in the browser
			vscode.env.openExternal(vscode.Uri.parse('https://docs.google.com/document/d/1ajQbIBILqC7eJM0Bc9Ylj9J7tyNvx90QQ41-XbVyMLs/edit?usp=sharing'));	
		} else if(response === 'GitHub Page'){
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
	const cserverModule = context.asAbsolutePath(
		path.join('cserver', 'out', 'server.js')
	);
	

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const cserverOptions: ServerOptions = {
		run: { module: cserverModule, transport: TransportKind.ipc },
		debug: {
			module: cserverModule,
			transport: TransportKind.ipc,
		}
	};

	// Options to control the language client
	const cclientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'c' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};	

	// Create the language client and start the client.
	cclient = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		cserverOptions,
		cclientOptions
	);

	// The server is implemented in node
	const pyserverModule = context.asAbsolutePath(
		path.join('pyserver', 'out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const pyserverOptions: ServerOptions = {
		run: { module: pyserverModule, transport: TransportKind.ipc },
		debug: {
			module: pyserverModule,
			transport: TransportKind.ipc,
		}
	};

	// Options to control the language client
	const pyclientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'python' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};	

	// Create the language client and start the client.
	pyclient = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		pyserverOptions,
		pyclientOptions
	);

	// Start the client. This will also launch the server
	cclient.start();
	pyclient.start()
}

export function deactivate(): Thenable<void> | undefined {
	if (!cclient) {
		return undefined;
	} else if (!pyclient) {
		return undefined;
	}
	return cclient.stop() && pyclient.stop();
}
