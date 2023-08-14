import * as vscode from 'vscode'
import * as fs from 'fs'


export function fn(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('extension.config', () => {
        const panel = vscode.window.createWebviewPanel(
            'customDialog', // Identifies the type of the webview
            'Custom Dialog', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the webview in
            {
                enableScripts: true // Enable JavaScript in the webview
            }
        );

        // Load the HTML content from a file
        panel.webview.html = getWebviewContent();
    });

    context.subscriptions.push(disposable);

    function getWebviewContent() {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Setting</title>
        </head>
        <body>
            <input type="text" id="inputField" placeholder="Enter something">
            <button id="submitButton">Submit</button>
            <script src="./index.js"></script>
        </body>
        </html>`
    }
}