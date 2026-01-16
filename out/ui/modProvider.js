"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModTreeItem = exports.ModTreeDataProvider = void 0;
const vscode = require("vscode");
const path = require("path");
const modScanner_1 = require("../modScanner");
class ModTreeDataProvider {
    constructor(outputChannel, configManager) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.scanner = new modScanner_1.ModScanner(outputChannel, configManager);
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]); // No children for now (flat list of mods)
        }
        else {
            return this.getMods();
        }
    }
    async getMods() {
        const candidates = await this.scanner.scanWorkspace();
        return candidates.map(c => new ModTreeItem(c.name, c.path, vscode.TreeItemCollapsibleState.None, c.needsBuild, c.pboPath));
    }
}
exports.ModTreeDataProvider = ModTreeDataProvider;
class ModTreeItem extends vscode.TreeItem {
    constructor(label, modPath, collapsibleState, needsBuild = false, pboPath) {
        super(label, collapsibleState);
        this.label = label;
        this.modPath = modPath;
        this.collapsibleState = collapsibleState;
        this.needsBuild = needsBuild;
        this.pboPath = pboPath;
        this.tooltip = `Source: ${this.modPath}\nTarget PBO: ${this.pboPath || 'Unknown'}`;
        this.description = path.basename(path.dirname(modPath)); // Show parent folder as description
        // Icon
        this.iconPath = new vscode.ThemeIcon('package');
        if (needsBuild) {
            this.description += " (Modified)";
            this.tooltip += "\n\n[!] Source is newer than PBO (or PBO missing)";
            this.iconPath = new vscode.ThemeIcon('diff-modified', new vscode.ThemeColor('charts.orange'));
            this.contextValue = 'modItem:dirty';
        }
        else {
            this.contextValue = 'modItem';
        }
    }
}
exports.ModTreeItem = ModTreeItem;
//# sourceMappingURL=modProvider.js.map