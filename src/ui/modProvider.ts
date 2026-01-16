import * as vscode from 'vscode';
import * as path from 'path';
import { ModScanner, ModCandidate } from '../modScanner';
import { ConfigManager } from '../configManager';

export class ModTreeDataProvider implements vscode.TreeDataProvider<ModTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ModTreeItem | undefined | null | void> = new vscode.EventEmitter<ModTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ModTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private scanner: ModScanner;

    constructor(outputChannel: vscode.OutputChannel, configManager: ConfigManager) {
        this.scanner = new ModScanner(outputChannel, configManager);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: ModTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ModTreeItem): Thenable<ModTreeItem[]> {
        if (element) {
            return Promise.resolve([]); // No children for now (flat list of mods)
        } else {
            return this.getMods();
        }
    }

    private async getMods(): Promise<ModTreeItem[]> {
        const candidates = await this.scanner.scanWorkspace();
        return candidates.map(c => new ModTreeItem(c.name, c.path, vscode.TreeItemCollapsibleState.None, c.needsBuild, c.pboPath));
    }
}

export class ModTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly modPath: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly needsBuild: boolean = false,
        public readonly pboPath?: string
    ) {
        super(label, collapsibleState);

        this.tooltip = `Source: ${this.modPath}\nTarget PBO: ${this.pboPath || 'Unknown'}`;
        this.description = path.basename(path.dirname(modPath)); // Show parent folder as description

        // Icon
        this.iconPath = new vscode.ThemeIcon('package');
        if (needsBuild) {
            this.description += " (Modified)";
            this.tooltip += "\n\n[!] Source is newer than PBO (or PBO missing)";
            this.iconPath = new vscode.ThemeIcon('diff-modified', new vscode.ThemeColor('charts.orange'));
            this.contextValue = 'modItem:dirty';
        } else {
            this.contextValue = 'modItem';
        }
    }
}
