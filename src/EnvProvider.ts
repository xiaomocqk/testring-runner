import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

const LAST_SELECTED_ENV = "LAST_SELECTED_ENV";

export class EnvProvider {
  command = "extension.envPick";
  selected: string;

  private _rememberLastEnv = true;
  private _statusBarItem!: vscode.StatusBarItem;

  constructor(private _context: vscode.ExtensionContext, private _workspace: vscode.Uri) {
    this.selected = _context.globalState.get(LAST_SELECTED_ENV) || ''
    this._createStatusBarItem();
    vscode.commands.registerCommand(this.command, () => {
      vscode.window.showQuickPick(this._envs, {
        placeHolder: "Select an environment",
        canPickMany: false,
      })
        .then((selectedItem) => {
          if (selectedItem) {
            this.selected = selectedItem.label;
            this._statusBarItem.text = this._statusBarDisplayName(this.selected);
            this._updateLastSelected(this.selected);
          }
        });
    });
  }

  get _envs(): vscode.QuickPickItem[] {
    const folder = path.join(this._workspace.path, "configs");
    const ignores = ["default.json", "sample.json"];
    const jsonNameReg = /.+(?=.json$)/;
    const list: vscode.QuickPickItem[] = [];

    if (this._workspace.path) {
      try {
        const files = fs.readdirSync(folder);
        for (const filename of files) {
          const label =
            !ignores.includes(filename) && filename.match(jsonNameReg)?.[0];
          if (label) {
            list.push({ label, picked: label === this.selected });
          }
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `Error reading directory: ${err.message}`
        );
      }
    }
    return list;
  }

  /* private methods */

  private _statusBarDisplayName(text: string) {
    return "$(zap) " + (text || "Environments");
  }

  private _updateLastSelected(value: string) {
    if (this._rememberLastEnv) {
      this._context.globalState.update(LAST_SELECTED_ENV, value);
    }
  }

  private _createStatusBarItem() {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    statusBarItem.text = this._statusBarDisplayName(
      this.selected
    );
    statusBarItem.command = this.command;
    statusBarItem.show();
    this._statusBarItem = statusBarItem;
  }
}
