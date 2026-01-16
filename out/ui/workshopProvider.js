"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkshopProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const workshopScanner_1 = require("../workshopScanner");
class WorkshopProvider {
    constructor(configManager, outputChannel) {
        this.configManager = configManager;
        this.outputChannel = outputChannel;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.scanner = new workshopScanner_1.WorkshopScanner(outputChannel);
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.name);
        treeItem.description = element.appId;
        const config = this.configManager.getConfig();
        const serverDir = config.dayzServerPath;
        const safeName = this.sanitizeModName(element.name);
        const symlinkPath = path.join(serverDir, `@${safeName}`);
        // Check if symlink/folder exists
        const isEnabled = fs.existsSync(symlinkPath);
        treeItem.checkboxState = isEnabled
            ? vscode.TreeItemCheckboxState.Checked
            : vscode.TreeItemCheckboxState.Unchecked;
        treeItem.contextValue = 'workshopMod';
        treeItem.tooltip = `AppID: ${element.appId}\nPath: ${element.path}`;
        return treeItem;
    }
    async getChildren(element) {
        if (element)
            return [];
        const config = this.configManager.getConfig();
        const mods = await this.scanner.scan(config.workshopPath);
        // Sort by name
        return mods.sort((a, b) => a.name.localeCompare(b.name));
    }
    async toggleMods(mods, enable) {
        const config = this.configManager.getConfig();
        const serverDir = config.dayzServerPath;
        for (const mod of mods) {
            const safeName = this.sanitizeModName(mod.name);
            const symlinkPath = path.join(serverDir, `@${safeName}`);
            if (enable) {
                if (!fs.existsSync(symlinkPath)) {
                    try {
                        // Create Junction (requires absolute paths)
                        await fs.promises.symlink(mod.path, symlinkPath, 'junction');
                        this.outputChannel.appendLine(`Enabled mod: ${mod.name} -> ${symlinkPath}`);
                    }
                    catch (e) {
                        vscode.window.showErrorMessage(`Failed to link ${mod.name}: ${e.message}`);
                    }
                }
            }
            else {
                if (fs.existsSync(symlinkPath)) {
                    try {
                        // unlink works for symlinks/junctions usually
                        await fs.promises.unlink(symlinkPath);
                        this.outputChannel.appendLine(`Disabled mod: ${mod.name}`);
                    }
                    catch (e) {
                        // Fallback for directory/junction if unlink fails
                        try {
                            await fs.promises.rm(symlinkPath, { recursive: true, force: true });
                        }
                        catch (e2) {
                            vscode.window.showErrorMessage(`Failed to unlink ${mod.name}: ${e2.message}`);
                        }
                    }
                }
            }
        }
        this.refresh();
    }
    sanitizeModName(name) {
        // Replace chars invalid for filesystem
        return name.replace(/[<>:"/\\|?*]/g, '_');
    }
}
exports.WorkshopProvider = WorkshopProvider;
//# sourceMappingURL=workshopProvider.js.map