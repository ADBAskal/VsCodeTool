import * as vscode from 'vscode';
import { ConfigManager } from './configManager';
// import { ModTreeDataProvider, ModTreeItem } from './ui/modProvider';
import { PboBuilder } from './pboBuilder';
import { ServerController } from './serverController';
import { ServerProvider, ModItem as ServerModItem } from './ui/serverProvider';
import { ModScanner, ModCandidate } from './modScanner';

export function activate(context: vscode.ExtensionContext) {
    console.log('DayZ Mod Tool is now active!');
    vscode.window.showInformationMessage("DayZ Tool v0.0.36 ACTIVE - Checkboxes Removed & Debug Mode ON");

    const outputChannel = vscode.window.createOutputChannel("DayZ Mod Tool");

    const configManager = new ConfigManager();
    const pboBuilder = new PboBuilder(configManager, outputChannel);
    // Mod Provider
    // Mod Provider (Obsolete - Unified into ServerProvider)
    // const modProvider = new ModTreeDataProvider(outputChannel, configManager);
    const serverController = new ServerController(configManager, outputChannel);
    const serverProvider = new ServerProvider(serverController, configManager, outputChannel);

    // Register Server Tree View with Checkbox support
    const serverTreeView = vscode.window.createTreeView('dayzServerControl', {
        treeDataProvider: serverProvider,
        canSelectMany: true
    });

    // Handle Checkbox Toggles
    serverTreeView.onDidChangeCheckboxState(async (event) => {
        // We only care about ModItems
        for (const [item, state] of event.items) {
            if (item instanceof ServerModItem) {
                const enable = (state === vscode.TreeItemCheckboxState.Checked);
                await serverProvider.toggleMod(item, enable);
            }
        }
    });

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('dayz-mod-tool.refreshMods', () => {
            // modProvider.refresh();
            serverProvider.refresh();
        }),
        vscode.commands.registerCommand('dayz-mod-tool.buildMod', async (node: ServerModItem | undefined) => {
            // Handle ModItem types from ServerProvider (Unified View)
            if (node) {
                // If it's a ModItem, it has a path property.
                // Checking types strictly might be tricky if we removed Imports.
                // Just use the property.
                const path = node.path;
                await pboBuilder.buildMod(path);
            } else {
                vscode.window.showInformationMessage('Please select a mod to build.');
            }
        }),
        vscode.commands.registerCommand('dayz-mod-tool.buildPending', async (group: any) => {
            // Logic: Scan again and build only those with needsBuild
            const scanner = new ModScanner(outputChannel, configManager);
            const candidates = await scanner.scanWorkspace();
            const pending = candidates.filter(c => c.needsBuild);

            if (pending.length === 0) {
                vscode.window.showInformationMessage("No pending builds detected.");
                return;
            }

            vscode.window.showInformationMessage(`Starting build for ${pending.length} pending mods...`);
            for (const mod of pending) {
                await pboBuilder.buildMod(mod.path);
            }
            vscode.window.showInformationMessage("Pending builds complete.");
            // Refresh views
            vscode.commands.executeCommand('dayz-mod-tool.refreshMods');
        }),
        vscode.commands.registerCommand('dayz-mod-tool.buildAll', async (group: any) => {
            const scanner = new ModScanner(outputChannel, configManager);
            const candidates = await scanner.scanWorkspace();

            if (candidates.length === 0) {
                vscode.window.showWarningMessage("No mods found to build.");
                return;
            }

            const choice = await vscode.window.showInformationMessage(`Build ALL ${candidates.length} mods? This may take time.`, "Yes", "No");
            if (choice !== "Yes") return;

            for (const mod of candidates) {
                await pboBuilder.buildMod(mod.path);
            }
            vscode.window.showInformationMessage("Build All complete.");
            vscode.commands.executeCommand('dayz-mod-tool.refreshMods');
        }),
        vscode.commands.registerCommand('dayz-mod-tool.startServer', () => {
            serverController.start();
            serverProvider.refresh();
        }),
        vscode.commands.registerCommand('dayz-mod-tool.startClient', () => {
            serverController.startClient();
        }),
        vscode.commands.registerCommand('dayz-mod-tool.killClient', () => {
            serverController.killClient();
        }),
        vscode.commands.registerCommand('dayz-mod-tool.restartClient', () => {
            serverController.restartClient();
        }),
        vscode.commands.registerCommand('dayz-mod-tool.startAutoMode', () => {
            serverController.startAutoMode();
        }),
        vscode.commands.registerCommand('dayz-mod-tool.stopAll', () => {
            serverController.stopAll();
        }),
        vscode.commands.registerCommand('dayz-mod-tool.restartAll', () => {
            serverController.restartAll();
        }),
        vscode.commands.registerCommand('dayz-mod-tool.stopServer', () => {
            serverController.stop();
            serverProvider.refresh();
        }),
        vscode.commands.registerCommand('dayz-mod-tool.restartServer', () => {
            serverController.restart();
            serverProvider.refresh();
        }),
        vscode.commands.registerCommand('dayz-mod-tool.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'dayzTool');
        })
    );

    context.subscriptions.push({
        dispose: () => serverController.stop()
    });
}

export function deactivate() { }
