import * as vscode from 'vscode';

// 定义装饰器
let highlightDecorator: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    console.log('LiteLog Highlighter is now active!');

    // 初始化装饰器
    highlightDecorator = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)', // 黄色背景
        isWholeLine: true,
        overviewRulerColor: 'rgba(255, 255, 0, 0.5)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
    });

    // 注册高亮模式命令
    let highlightPatternCommand = vscode.commands.registerCommand(
        'litelog-highlighter.highlightPattern',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('请打开一个日志文件');
                return;
            }

            // 获取用户输入的匹配模式
            const pattern = await vscode.window.showInputBox({
                placeHolder: "输入要匹配的文本或正则表达式",
                prompt: "将高亮包含此模式的所有行"
            });

            if (!pattern) {
                return; // 用户取消输入
            }

            try {
                const regexp = new RegExp(pattern);
                const document = editor.document;
                const decorationsArray: vscode.Range[] = [];

                // 遍历所有行查找匹配
                for (let i = 0; i < document.lineCount; i++) {
                    const line = document.lineAt(i);
                    if (line.text.match(regexp)) {
                        decorationsArray.push(line.range);
                    }
                }

                // 应用高亮
                editor.setDecorations(highlightDecorator, decorationsArray);
                vscode.window.showInformationMessage(
                    `已高亮 ${decorationsArray.length} 行匹配内容`
                );
            } catch (e) {
                vscode.window.showErrorMessage(
                    `无效的正则表达式: ${e instanceof Error ? e.message : String(e)}`
                );
            }
        }
    );

    // 注册清除高亮命令
    let clearHighlightCommand = vscode.commands.registerCommand(
        'litelog-highlighter.clearHighlight',
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            // 清除所有高亮
            editor.setDecorations(highlightDecorator, []);
            vscode.window.showInformationMessage('已清除所有高亮');
        }
    );

    // 注册命令
    context.subscriptions.push(highlightPatternCommand);
    context.subscriptions.push(clearHighlightCommand);
}

export function deactivate() {
    if (highlightDecorator) {
        highlightDecorator.dispose();
    }
}