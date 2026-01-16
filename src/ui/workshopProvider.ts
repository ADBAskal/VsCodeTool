import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { WorkshopScanner, WorkshopMod } from '../workshopScanner';
import { ConfigManager } from '../configManager';

export class WorkshopProvider implements vscode.TreeDataProvider<WorkshopMod> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorkshopMod | undefined | null | void> = new vscode.EventEmitter<WorkshopMod | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorkshopMod | undefined | null | void> = this._onDidChangeTreeData.event;

    private scanner: WorkshopScanner;

    constructor(
        private configManager: ConfigManager,
        private outputChannel: vscode.OutputChannel
    ) {
        this.scanner = new WorkshopScanner(outputChannel);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: WorkshopMod): vscode.TreeItem {
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

    async getChildren(element?: WorkshopMod): Promise<WorkshopMod[]> {
        if (element) return [];

        const config = this.configManager.getConfig();
        const mods = await this.scanner.scan(config.workshopPath);
        // Sort by name
        return mods.sort((a, b) => a.name.localeCompare(b.name));
    }

    public async toggleMods(mods: WorkshopMod[], enable: boolean) {
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
                    } catch (e: any) {
                        vscode.window.showErrorMessage(`Failed to link ${mod.name}: ${e.message}`);
                    }
                }
            } else {
                if (fs.existsSync(symlinkPath)) {
                    try {
                        // unlink works for symlinks/junctions usually
                        await fs.promises.unlink(symlinkPath);
                        this.outputChannel.appendLine(`Disabled mod: ${mod.name}`);
                    } catch (e) {
                        // Fallback for directory/junction if unlink fails
                        try {
                            await fs.promises.rm(symlinkPath, { recursive: true, force: true });
                        } catch (e2: any) {
                            vscode.window.showErrorMessage(`Failed to unlink ${mod.name}: ${e2.message}`);
                        }
                    }
                }
            }
        }
        this.refresh();
    }

    private sanitizeModName(name: string): string {
        // Replace chars invalid for filesystem
        return name.replace(/[<>:"/\\|?*]/g, '_');
    }
}
