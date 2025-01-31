import * as vscode from 'vscode';

// Define decorator
let highlightDecorator: vscode.TextEditorDecorationType;

// Highlight function to reuse logic
async function performHighlight(pattern: string, editor: vscode.TextEditor, isRegex: boolean = false) {
    try {
        // If not regex, escape special characters
        const regexPattern = isRegex ? pattern : pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regexp = new RegExp(regexPattern);
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

            const pattern = await vscode.window.showInputBox({
                placeHolder: "Enter text pattern to match",
                prompt: "Will highlight all lines containing this text"
            });

            if (!pattern) {
                return;
            }

            await performHighlight(pattern, editor, false);
        }
    );

    // Register highlight regex command
    let highlightRegexCommand = vscode.commands.registerCommand(
        'litelog-highlighter.highlightRegex',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('Please open a log file');
                return;
            }

            const pattern = await vscode.window.showInputBox({
                placeHolder: "Enter regex pattern (e.g., \\d{2}:\\d{2}:\\d{2})",
                prompt: "Will highlight all lines matching this regex"
            });

            if (!pattern) {
                return;
            }

            await performHighlight(pattern, editor, true);
        }
    );

    // Register highlight selected command
    let highlightSelectedCommand = vscode.commands.registerCommand(
        'litelog-highlighter.highlightSelected',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('Please open a log file');
                return;
            }

            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            
            if (!selectedText) {
                vscode.window.showInformationMessage('Please select some text first');
                return;
            }

            await performHighlight(selectedText, editor, false);
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

            editor.setDecorations(highlightDecorator, []);
            vscode.window.showInformationMessage('All highlights cleared');
        }
    );

    // Register commands
    context.subscriptions.push(highlightPatternCommand);
    context.subscriptions.push(highlightRegexCommand);
    context.subscriptions.push(highlightSelectedCommand);
    context.subscriptions.push(clearHighlightCommand);
}

export function deactivate() {
    if (highlightDecorator) {
        highlightDecorator.dispose();
    }
}