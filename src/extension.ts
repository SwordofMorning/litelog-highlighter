import * as vscode from 'vscode';

// Define decorator
let highlightDecorator: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    console.log('LiteLog Highlighter is now active!');

    // Initialize decorator
    highlightDecorator = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)', // Yellow background
        isWholeLine: true,
        overviewRulerColor: 'rgba(255, 255, 0, 0.5)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
    });

    // Register highlight pattern command
    let highlightPatternCommand = vscode.commands.registerCommand(
        'litelog-highlighter.highlightPattern',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('Please open a log file');
                return;
            }

            // Get user input for pattern matching
            const pattern = await vscode.window.showInputBox({
                placeHolder: "Enter text or regex pattern to match",
                prompt: "Will highlight all lines containing this pattern"
            });

            if (!pattern) {
                return; // User cancelled input
            }

            try {
                const regexp = new RegExp(pattern);
                const document = editor.document;
                const decorationsArray: vscode.Range[] = [];

                // Iterate through all lines to find matches
                for (let i = 0; i < document.lineCount; i++) {
                    const line = document.lineAt(i);
                    if (line.text.match(regexp)) {
                        decorationsArray.push(line.range);
                    }
                }

                // Apply highlights
                editor.setDecorations(highlightDecorator, decorationsArray);
                vscode.window.showInformationMessage(
                    `Highlighted ${decorationsArray.length} matching lines`
                );
            } catch (e) {
                vscode.window.showErrorMessage(
                    `Invalid regular expression: ${e instanceof Error ? e.message : String(e)}`
                );
            }
        }
    );

    // Register clear highlight command
    let clearHighlightCommand = vscode.commands.registerCommand(
        'litelog-highlighter.clearHighlight',
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            // Clear all highlights
            editor.setDecorations(highlightDecorator, []);
            vscode.window.showInformationMessage('All highlights cleared');
        }
    );

    // Register commands
    context.subscriptions.push(highlightPatternCommand);
    context.subscriptions.push(clearHighlightCommand);
}

export function deactivate() {
    if (highlightDecorator) {
        highlightDecorator.dispose();
    }
}