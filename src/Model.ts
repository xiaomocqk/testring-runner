import * as vscode from "vscode";
import { type EnvProvider } from "./EnvProvider";
// @ts-ignore
import * as witch from 'witch';
import { spawn } from "child_process";
// import * as pty from 'node-pty'

export interface ITestArgs {
  test: string;
  runNumber: number;
  testName: string;
}

export class Model {
  private _terminal?: vscode.Terminal;
  private _cacheTerminals: { processId: number, terminal: vscode.Terminal }[] = []

  constructor(private _env: EnvProvider) {
    vscode.debug.onDidStartDebugSession(async (session) => {
      // this._lastSession?.customRequest('disconnect');
      const processId = await vscode.window.activeTerminal!.processId as number;
      if (!this._cacheTerminals.some(t => t.processId === processId)) {
        this._cacheTerminals.push({
          processId,
          terminal: vscode.window.activeTerminal!
        });
      }
      while (this._cacheTerminals.length > 1) {
        const { terminal } = this._cacheTerminals.shift()!;
        terminal.dispose();
      }
      console.log("onDidStartDebugSession");
    });

    vscode.debug.onDidTerminateDebugSession((e) => {
      console.log("onDidTerminateDebugSession");
    });
  }

  runTest({ test, runNumber, testName }: ITestArgs) {
    if (!this._env.selected) {
      vscode.commands.executeCommand(this._env.command);
      return;
    }
    const argsString = this._getArgs({ test, runNumber }).join(" ");
    this._terminal?.dispose();
    this._terminal = vscode.window.createTerminal({
      name: runNumber + 1 + "#" + testName,
    });
    this._terminal.sendText(`node runner.js ${argsString}`);
    this._terminal.show();
  }

  async debugTest({ test, runNumber, testName }: ITestArgs) {
    if (!this._env.selected) {
      vscode.commands.executeCommand(this._env.command);
      return;
    }

    // this._terminal = vscode.window.createTerminal({
    //   name: runNumber + 1 + "#" + testName,
    // });

    // const nodePath = await findNode();
    // https://code.visualstudio.com/docs/nodejs/nodejs-debugging
    const debugConfig: vscode.DebugConfiguration = {
      type: "node",
      // runtimeExecutable: nodePath,
      name: runNumber + 1 + "#" + testName,
      request: "launch",
      console: "integratedTerminal",
      cwd: "${workspaceRoot}",
      // stopOnEntry: true,
      program: `runner.js`,
      sourceMaps: true,
      // remoteRoot: "${workspaceFolder}",
      localRoot: "${workspaceRoot}",
      smartStep: true,
      // "runtimeArgs": ["--preserve-symlinks"],
      // sourceMapPathOverrides: "${workspaceFolder}/tests-src/**/*.js",
      outFiles: [
        // "${workspaceFolder}/flows/**/*.js",
        // "${workspaceFolder}/node_modules/test-framework/dist/**/*.js",
        // "${workspaceFolder}/node_modules/@testring/**/*.js",
        // "${workspaceFolder}/node_modules/@testring-dev/**/*.js",
      ],
      args: this._getArgs({ test, runNumber }),
    };

    vscode.debug.startDebugging(
      vscode.workspace.workspaceFolders?.[0],
      debugConfig
    );
  }


  private _getArgs({ test, runNumber }: Omit<ITestArgs, "testName">) {
    return [
      "run",
      "--config=.testringrc.js",
      "--screenshots=disable",
      "--retry-count=0",
      `--tests=${test}`,
      `--env-config=./configs/${this._env.selected}.json`,
      `--rc.run-number=${runNumber}`,
      // `--rc.hub-url=xmn02-i01-hpc02.lab.nordigy.ru`,
      // `--rc.hub-port=4444`
    ];
  }
}

let pathToNodeJS: string | undefined;

// export async function findNode(): Promise<string> {
//   if (pathToNodeJS)
//     return pathToNodeJS;

//   let node = await witch('node').catch((e: Error) => {
//     console.log(e)
//   });
//   // When extension host boots, it does not have the right env set, so we might need to wait.
//   for (let i = 0; i < 5 && !node; ++i) {
//     await new Promise(f => setTimeout(f, 1000));
//     node = await witch('node').catch((e: Error) => {
//       console.log(e)
//     });
//   }
//   if (!node)
//     throw new Error('Unable to launch `node`, make sure it is in your PATH');
//   pathToNodeJS = node;
//   return node;
// }
