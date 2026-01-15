import * as vscode from 'vscode';
import * as path from 'path';
import { ModScanner, ModCandidate } from '../modScanner';

export class ModTreeDataProvider implements vscode.TreeDataProvider<ModItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ModItem | undefined | null | void> = new vscode.EventEmitter<ModItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ModItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private scanner: ModScanner;

    constructor(outputChannel: vscode.OutputChannel) {
        this.scanner = new ModScanner(outputChannel);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ModItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ModItem): Thenable<ModItem[]> {
        if (element) {
            return Promise.resolve([]); // No children for now (flat list of mods)
        } else {
            return this.getMods();
        }
    }

    private async getMods(): Promise<ModItem[]> {
        const candidates = await this.scanner.scanWorkspace();
        return candidates.map(c => new ModItem(c.name, c.path, vscode.TreeItemCollapsibleState.None));
    }
}

export class ModItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly modPath: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = this.modPath;
        this.description = path.basename(path.dirname(modPath)); // Show parent folder as description

        // Icon
        this.iconPath = new vscode.ThemeIcon('package');

        // Context Value for menus
        this.contextValue = 'modItem';
    }
}
