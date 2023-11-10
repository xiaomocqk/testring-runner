import * as vscode from 'vscode';
import * as fs from 'fs';
import { isFileExist } from './utils';
import * as babel from '@babel/parser';

const FILE_MATCH_REG = /\.testdata\.json$/;
const FILE_MATCH_REG_1 = /__1(?=\.testdata\.json$)/;

export class CodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        // Only *.testdata.json
        if (!FILE_MATCH_REG.test(document.fileName)) {
            return [];
        }
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        let test = document.fileName.replace(FILE_MATCH_REG, '.js');
        let testName = test.match(/[^/]+(?=.js$)/)![0]
        const AST = babel.parseExpression(text) as any
        const testData = AST.properties.find((p: any) => p.key.value === 'testData')
        let testCounts = testData.value.elements.length;
        const isCurrentWiredFile = FILE_MATCH_REG_1.test(document.fileName)
        let extraCounts = 0;

        // When *__1.testdata.json
        {
            const wiredFile = document.fileName.replace(/(__1)?(?=\.testdata\.json$)/, '__1');
            if (isFileExist(wiredFile)) {
                let file;
                // When current file is *__1.testdata.json
                if (isCurrentWiredFile) {
                    const normalFile = document.fileName.replace('__1', '');
                    file = normalFile;
                } else {
                    file = wiredFile;
                }
                const content = fs.readFileSync(file);
                const meta = JSON.parse(content.toString());
                extraCounts = meta.testData.length;
            }
        }

        for (let i = 0; i < testCounts; i++) {
            const item = testData.value.elements[i];
            let targetRow = item.properties.find((p: any) => p.key.value === 'tags');
            // When #No_Brands_Run
            if (!targetRow || item.properties.length === 0) {
                targetRow = item;
            }

            const { start, end } = targetRow.loc;
            const startPosition = document.positionAt(start.index);
            const endPosition = document.positionAt(end.index);
            const range = new vscode.Range(startPosition, endPosition);
            const index = i + (isCurrentWiredFile ? extraCounts : 0);

            const tooltip = new vscode.CodeLens(range, {
                title: `#${index + 1} of ${testCounts + extraCounts}`,
                command: '',
            });
            const runCodeLens = new vscode.CodeLens(range, {
                title: '$(testing-run-icon) Run',
                command: 'testring.runTest',
                arguments: [{ test, index, testName }],
            });
            const debugCodeLens = new vscode.CodeLens(range, {
                title: '$(testing-debug-icon) Debug',
                command: 'testring.debugTest',
                arguments: [{ test, index, testName }],
            });

            codeLenses.push(tooltip, runCodeLens, debugCodeLens);
        }

        return codeLenses;
    }
}