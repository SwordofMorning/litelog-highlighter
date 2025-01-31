import * as vscode from 'vscode';

// Define decorators and states
let highlightDecorator: vscode.TextEditorDecorationType;
let filteredDocumentProvider: FilteredDocumentProvider;

// Log level state
interface LogLevelState {
    [key: string]: boolean;
}

let logLevelState: LogLevelState = {
    F: true, E: true, W: true, N: true,
    I: true, D: true, T: true, K: true
};

// Virtual document provider
class FilteredDocumentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _originalUri: vscode.Uri | undefined;
    private _content: string = '';

    onDidChange = this._onDidChange.event;

    provideTextDocumentContent(_uri: vscode.Uri): string {
        return this._content;
    }

    update(content: string, originalUri: vscode.Uri) {
        this._content = content;
        this._originalUri = originalUri;
        this._onDidChange.fire(this.getUri());
    }

    getUri(): vscode.Uri {
        return vscode.Uri.parse('filtered-view.log://authority/filtered-view.log');
    }

    getOriginalUri(): vscode.Uri | undefined {
        return this._originalUri;
    }
}

// Parse log line
function parseLogLine(line: string): { level: string; valid: boolean } {
    const match = line.match(/\[\d+\]\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]\[([FEWNIDTK])\]/);
    return {
        level: match ? match[1] : '',
        valid: !!match
    };
}

// Create filtered content
function createFilteredContent(document: vscode.TextDocument): string {
    const lines = document.getText().split('\n');
    const filteredLines = lines.filter(line => {
        const { level, valid } = parseLogLine(line);
        return !valid || logLevelState[level];
    });
    return filteredLines.join('\n');
}

// Show filtered view
async function showFilteredView(editor: vscode.TextEditor) {
    const filteredContent = createFilteredContent(editor.document);
    filteredDocumentProvider.update(filteredContent, editor.document.uri);

    const doc = await vscode.workspace.openTextDocument(filteredDocumentProvider.getUri());
    await vscode.window.showTextDocument(doc, {
        viewColumn: editor.viewColumn,
        preview: false
    });
}

// Show original view
async function showOriginalView() {
    const originalUri = filteredDocumentProvider.getOriginalUri();
    if (originalUri) {
        const doc = await vscode.workspace.openTextDocument(originalUri);
        await vscode.window.showTextDocument(doc);
    }
}

// Highlight function to reuse logic
async function performHighlight(pattern: string, editor: vscode.TextEditor, isRegex: boolean = false) {
    try {
        const regexPattern = isRegex ? pattern : pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regexp = new RegExp(regexPattern);
        const document = editor.document;
        const decorationsArray: vscode.Range[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            if (line.text.match(regexp)) {
                decorationsArray.push(line.range);
            }
        }

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

function getLevelName(level: string): string {
    const names: { [key: string]: string } = {
        'F': 'Fatal',
        'E': 'Error',
        'W': 'Warning',
        'N': 'Notice',
        'I': 'Info',
        'D': 'Debug',
        'T': 'Trace',
        'K': 'Kernel'
    };
    return names[level] || level;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('LiteLog Highlighter is now active!');

    // Initialize document provider
    filteredDocumentProvider = new FilteredDocumentProvider();
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider('filtered-view.log', filteredDocumentProvider)
    );

    // Initialize decorator
    highlightDecorator = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
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

    // Register toggle log level command
    let toggleLogLevelCommand = vscode.commands.registerCommand(
        'litelog-highlighter.toggleLogLevel',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const quickPick = vscode.window.createQuickPick();
            quickPick.items = Object.entries(logLevelState).map(([level, enabled]) => ({
                label: `${level} - ${getLevelName(level)}`,
                picked: enabled,
                level
            }));
            quickPick.canSelectMany = true;
            quickPick.selectedItems = quickPick.items.filter(item => 
                logLevelState[(item as any).level]);

            quickPick.onDidAccept(async () => {
                const selectedLevels = new Set(quickPick.selectedItems.map(item => 
                    (item as any).level));
                Object.keys(logLevelState).forEach(level => {
                    logLevelState[level] = selectedLevels.has(level);
                });
                quickPick.hide();

                if (editor.document.uri.scheme === 'filtered-view.log') {
                    const filteredContent = createFilteredContent(
                        await vscode.workspace.openTextDocument(
                            filteredDocumentProvider.getOriginalUri()!
                        )
                    );
                    filteredDocumentProvider.update(
                        filteredContent,
                        filteredDocumentProvider.getOriginalUri()!
                    );
                } else {
                    await showFilteredView(editor);
                }
            });

            quickPick.show();
        }
    );

    // Register toggle view command
    let toggleViewCommand = vscode.commands.registerCommand(
        'litelog-highlighter.toggleView',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            if (editor.document.uri.scheme === 'filtered-view.log') {
                await showOriginalView();
            } else {
                await showFilteredView(editor);
            }
        }
    );

    // Register commands
    context.subscriptions.push(highlightPatternCommand);
    context.subscriptions.push(highlightRegexCommand);
    context.subscriptions.push(highlightSelectedCommand);
    context.subscriptions.push(clearHighlightCommand);
    context.subscriptions.push(toggleLogLevelCommand);
    context.subscriptions.push(toggleViewCommand);
}

export function deactivate() {
    if (highlightDecorator) {
        highlightDecorator.dispose();
    }
}