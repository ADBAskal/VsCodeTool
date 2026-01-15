"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const configManager_1 = require("./configManager");
const modProvider_1 = require("./ui/modProvider");
const pboBuilder_1 = require("./pboBuilder");
function activate(context) {
    console.log('DayZ Mod Tool is now active!');
    // Create Output Channel once
    const outputChannel = vscode.window.createOutputChannel("DayZ Mod Tool");
    const configManager = new configManager_1.ConfigManager();
    const pboBuilder = new pboBuilder_1.PboBuilder(configManager, outputChannel);
    const modProvider = new modProvider_1.ModTreeDataProvider(outputChannel);
    // Register Tree Data Provider
    vscode.window.registerTreeDataProvider('dayzModList', modProvider);
    // Command: Refresh
    context.subscriptions.push(vscode.commands.registerCommand('dayz-mod-tool.refreshMods', () => {
        modProvider.refresh();
    }));
    // Command: Build Mod (from Context Menu or Palette)
    context.subscriptions.push(vscode.commands.registerCommand('dayz-mod-tool.buildMod', async (node) => {
        if (node) {
            // Called from Tree View
            await pboBuilder.buildMod(node.modPath);
        }
        else {
            // Called from Command Palette - show picker?
            // For now, let's just show info. Implementing picker would be nice but user asked for "System of scripts / extension".
            // Tree view is the primary way.
            vscode.window.showInformationMessage('Please select a mod from the DayZ Mod List to build.');
        }
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map