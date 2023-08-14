import * as vscode from 'vscode';

export class CodeLensProvider implements vscode.CodeLensProvider {
    private _FILE_MATCH_REG = /\.testdata\.json$/
    private _LINE_MATCH_REG = /"tags":\s*\[/g

    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        // handle with "*.testdata.json" only
        if (!this._FILE_MATCH_REG.test(document.fileName)) {
            return [];
        }
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const totalTests = JSON.parse(text).testData.length
        const test = document.fileName.replace(this._FILE_MATCH_REG, '.js');
        const testName = test.match(/[^/]+(?=.js$)/)
        let match: RegExpExecArray | null;
        let runNumber = -2;
        while ((match = this._LINE_MATCH_REG.exec(text)) !== null) {
            if (++runNumber === -1) {
                continue
            }
            const startPosition = document.positionAt(match.index);
            const endPosition = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPosition, endPosition);

            const tooltip = new vscode.CodeLens(range, {
                title: `#${runNumber + 1} of ${totalTests}`,
                command: '',
            });

            const runCodeLens = new vscode.CodeLens(range, {
                title: '$(testing-run-icon) Run',
                command: 'extension.runTest',
                arguments: [{ test, runNumber, testName }],
            });

            const debugCodeLens = new vscode.CodeLens(range, {
                title: '$(testing-debug-icon) Debug',
                command: 'extension.debugTest',
                arguments: [{ test, runNumber, testName }],
            });
            codeLenses.push(tooltip, runCodeLens, debugCodeLens);
        }

        return codeLenses;
    }

    resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
        return codeLens;
    }
}