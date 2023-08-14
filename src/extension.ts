import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { EnvProvider } from './EnvProvider';
import { CodeLensProvider } from './CodeLensProvider';
import { Model, type ITestArgs } from './Model';
import {fn} from './setting/index';

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  const workspace = workspaceFolder?.uri;

  if (!workspace?.path) {
    return;
  }

  const env = new EnvProvider(context, workspace)
  const model = new Model(env)
  const codeLens = new CodeLensProvider()
  
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: 'file', language: 'json' }, codeLens),
    vscode.commands.registerCommand('extension.runTest', (args: ITestArgs) => model.runTest(args)),
    vscode.commands.registerCommand('extension.debugTest', (args: ITestArgs) => model.debugTest(args)),
  );
  fn(context)
}
