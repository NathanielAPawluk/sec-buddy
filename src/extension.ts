import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Sec-Buddy is now active');

	// Intro command to introduce the user to the plugin
	context.subscriptions.push(vscode.commands.registerCommand('sec-buddy.greeting', async () => {
		const response = await vscode.window.showInformationMessage(
			'Hello! I am Sec Buddy, your new assistant for keeping your code secure! Check out the progress of the plugin using the links below!',
			'Plans',
			'GitHub Page');
		
		if(response === 'Plans'){
			vscode.env.openExternal(vscode.Uri.parse('https://docs.google.com/document/d/1ajQbIBILqC7eJM0Bc9Ylj9J7tyNvx90QQ41-XbVyMLs/edit?usp=sharing'));	
		} else if(response === 'GitHub Page'){
			vscode.env.openExternal(vscode.Uri.parse('https://github.com/NathanielAPawluk/sec-buddy')); 
		}

	}));

	context.subscriptions.push(vscode.commands.registerCommand('sec-buddy.progress', () => {
		vscode.env.openExternal(vscode.Uri.parse('https://docs.google.com/spreadsheets/d/1GuXvdTbiaAUqEo6yg0PqPoB8BL2E7ebxp7SBiiyEnoo/edit?usp=sharing'))
	}));
	
}

export function deactivate() {}
