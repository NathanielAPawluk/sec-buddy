/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
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
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});


// Server settings setup
interface c {
	strcpy: boolean
	gets: boolean
	stpcpy: boolean
	strcat: boolean
	strcmp: boolean
	sprintf: boolean
	vsprintf: boolean
}

interface serverSettings {
	maxNumberOfProblems: number;
	c: c;
}

interface vulnerability {
	pattern: RegExp;
	errorMsg: string;
	active: boolean;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: serverSettings = { maxNumberOfProblems: 1000, 
	c: {strcpy: true, gets: true, stpcpy: true, strcat: true, strcmp: true, sprintf: true, vsprintf: true} };
let globalSettings: serverSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<serverSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <serverSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<serverSettings> {
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

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// Get the settings for every run
	const settings = await getDocumentSettings(textDocument.uri);

	// Validation Setup
	const text = textDocument.getText();
	let m: RegExpExecArray | null;
	let problems = 0;
	const diagnostics: Diagnostic[] = [];


	let vulnerabilities = []

	const strcpy: vulnerability = {
		pattern: /\bstrcpy\(*.+?\)\b/g,
		errorMsg: `strcpy() is vulnerable to buffer overflow attacks. Consider using strncpy().`,
		active: settings.c.strcpy
	}
	vulnerabilities.push(strcpy);

	const gets: vulnerability = {
		pattern: /\bgets\(*.+?\)\b/g,
		errorMsg: 'gets() is vulnerable to buffer overflow attacks. Consider using fgets().',
		active: settings.c.gets		
	}
	vulnerabilities.push(gets);

	const stpcpy: vulnerability = {
		pattern: /\bstpcpy\(*.+?\)\b/g,
		errorMsg: 'stpcpy() is vulnerable to buffer overflow attacks. Consider using stpncpy().',
		active: settings.c.stpcpy
	}
	vulnerabilities.push(stpcpy);

	const strcat: vulnerability = {
		pattern: /\bstrcat\(*.+?\)\b/g,
		errorMsg: 'strcat() is vulnerable to buffer overflow attacks. Consider using strncat().',
		active: settings.c.strcat
	}
	vulnerabilities.push(strcat);

	const strcmp: vulnerability = {
		pattern: /\bstrcmp\(*.+?\)\b/g,
		errorMsg: 'strcmp() is vulnerable to buffer overflow attacks. Consider using strncmp().',
		active: settings.c.strcmp
	}
	vulnerabilities.push(strcmp);

	const sprintf: vulnerability = {
		pattern: /\bsprintf\(*.+?\)\b/g,
		errorMsg: 'sprintf() is vulnerable to buffer overflow attacks. Consider using snprintf().',
		active: settings.c.sprintf
	}
	vulnerabilities.push(sprintf);

	const vsprintf: vulnerability = {
		pattern: /\bvsprintf\(*.+?\)\b/g,
		errorMsg: 'vsprintf() is vulnerable to buffer overflow attacks. Consider using snprintf().',
		active: settings.c.vsprintf
	}
	vulnerabilities.push(vsprintf);
	
	for (let i = 0; i < vulnerabilities.length; i++){
		while ((m = vulnerabilities[i].pattern.exec(text)) && problems < settings.maxNumberOfProblems && vulnerabilities[i].active) {
			problems++;
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Warning,
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
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
