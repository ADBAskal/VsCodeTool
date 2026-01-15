"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModItem = exports.ModTreeDataProvider = void 0;
const vscode = require("vscode");
const path = require("path");
const modScanner_1 = require("../modScanner");
class ModTreeDataProvider {
    constructor(outputChannel) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.scanner = new modScanner_1.ModScanner(outputChannel);
    }
    refresh() {
        this._onDidChangeTreeData.fire();
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
        return candidates.map(c => new ModItem(c.name, c.path, vscode.TreeItemCollapsibleState.None));
    }
}
exports.ModTreeDataProvider = ModTreeDataProvider;
class ModItem extends vscode.TreeItem {
    constructor(label, modPath, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.modPath = modPath;
        this.collapsibleState = collapsibleState;
        this.tooltip = this.modPath;
        this.description = path.basename(path.dirname(modPath)); // Show parent folder as description
        // Icon
        this.iconPath = new vscode.ThemeIcon('package');
        // Context Value for menus
        this.contextValue = 'modItem';
    }
}
exports.ModItem = ModItem;
//# sourceMappingURL=modProvider.js.map