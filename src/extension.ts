import * as vscode from 'vscode';
import { ConfigManager } from './configManager';
import { ModTreeDataProvider, ModItem } from './ui/modProvider';
import { PboBuilder } from './pboBuilder';

export function activate(context: vscode.ExtensionContext) {
    console.log('DayZ Mod Tool is now active!');

    // Create Output Channel once
    const outputChannel = vscode.window.createOutputChannel("DayZ Mod Tool");

    const configManager = new ConfigManager();
    const pboBuilder = new PboBuilder(configManager, outputChannel);
    const modProvider = new ModTreeDataProvider(outputChannel);

    // Register Tree Data Provider
    vscode.window.registerTreeDataProvider('dayzModList', modProvider);

    // Command: Refresh
    context.subscriptions.push(
        vscode.commands.registerCommand('dayz-mod-tool.refreshMods', () => {
            modProvider.refresh();
        })
    );

    // Command: Build Mod (from Context Menu or Palette)
    context.subscriptions.push(
        vscode.commands.registerCommand('dayz-mod-tool.buildMod', async (node: ModItem | undefined) => {
            if (node) {
                // Called from Tree View
                await pboBuilder.buildMod(node.modPath);
            } else {
                // Called from Command Palette - show picker?
                // For now, let's just show info. Implementing picker would be nice but user asked for "System of scripts / extension".
                // Tree view is the primary way.
                vscode.window.showInformationMessage('Please select a mod from the DayZ Mod List to build.');
            }
        })
    );
}

export function deactivate() { }
