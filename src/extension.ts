import * as vscode from 'vscode';

// 定义装饰器
let debugDecorator: vscode.TextEditorDecorationType;
let demoProgramDecorator: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    console.log('LiteLog Highlighter is now active!');

    // 初始化装饰器
    debugDecorator = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)', // 黄色背景
        isWholeLine: true,
        overviewRulerColor: 'rgba(255, 255, 0, 0.5)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
    });

    demoProgramDecorator = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 255, 0, 0.2)', // 绿色背景
        isWholeLine: true,
        overviewRulerColor: 'rgba(0, 255, 0, 0.5)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
    });

    // 注册高亮Debug日志的命令
    let highlightDebugCommand = vscode.commands.registerCommand(
        'litelog-highlighter.highlightDebug', 
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('请打开一个日志文件');
                return;
            }

            const document = editor.document;
            const decorationsArray: vscode.Range[] = [];

            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                if (line.text.match(/\[D\]\[/)) {
                    decorationsArray.push(line.range);
                }
            }

            editor.setDecorations(debugDecorator, decorationsArray);
            vscode.window.showInformationMessage(
                `已高亮 ${decorationsArray.length} 条Debug日志`
            );
        }
    );

    // 注册高亮Demo Program日志的命令
    let highlightDemoProgramCommand = vscode.commands.registerCommand(
        'litelog-highlighter.highlightDemoProgram', 
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('请打开一个日志文件');
                return;
            }

            const document = editor.document;
            const decorationsArray: vscode.Range[] = [];

            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                if (line.text.match(/\[Demo_Program\]/)) {
                    decorationsArray.push(line.range);
                }
            }

            editor.setDecorations(demoProgramDecorator, decorationsArray);
            vscode.window.showInformationMessage(
                `已高亮 ${decorationsArray.length} 条Demo Program日志`
            );
        }
    );

    // 注册命令
    context.subscriptions.push(highlightDebugCommand);
    context.subscriptions.push(highlightDemoProgramCommand);
}

export function deactivate() {
    if (debugDecorator) {
        debugDecorator.dispose();
    }
    if (demoProgramDecorator) {
        demoProgramDecorator.dispose();
    }
}