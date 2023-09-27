import * as vscode from 'vscode';

export class CodeLensProvider implements vscode.CodeLensProvider {
    private _FILE_MATCH_REG = /\.testdata\.json$/
    private _LINE_MATCH_REG = /"tags":\s*\[/g
    private _LINE_MATCH_API_REG = /"testData":\s*\[\{\}\]/

    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        // handle with "*.testdata.json" only
        if (!this._FILE_MATCH_REG.test(document.fileName)) {
            return [];
        }
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const textParsed = JSON.parse(text)
        const totalTests = textParsed.testData.length
        const test = document.fileName.replace(this._FILE_MATCH_REG, '.js');
        const testName = test.match(/[^/]+(?=.js$)/)
        let match: RegExpExecArray | null;
        let runNumber = -2;
        // API
        const isApiOnly = textParsed.tags.includes('#No_Brands_Run');
        let isContinue = true
    
        while (isContinue && ((match = (isApiOnly ? this._LINE_MATCH_API_REG : this._LINE_MATCH_REG).exec(text)) !== null)) {
            if (isApiOnly) {
                runNumber = -1;
            }
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
            if (isApiOnly) {
                isContinue = false;
            }
        }

        return codeLenses;
    }

    resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
        return codeLens;
    }
}