"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerProvider = exports.ModItem = exports.ConfigItem = exports.GroupItem = exports.ClientLauncherItem = exports.ServerStatusItem = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const workshopScanner_1 = require("../workshopScanner");
const modScanner_1 = require("../modScanner");
const localModScanner_1 = require("../localModScanner");
class ServerStatusItem extends vscode.TreeItem {
    constructor(isRunning) {
        super(`Server: ${isRunning ? 'Running' : 'Stopped'}`);
        this.isRunning = isRunning;
        this.iconPath = new vscode.ThemeIcon(isRunning ? 'pass' : 'circle-slash');
        this.contextValue = 'serverStatus';
        this.command = {
            command: 'dayz-mod-tool.openSettings',
            title: 'Settings'
        };
    }
}
exports.ServerStatusItem = ServerStatusItem;
class ClientLauncherItem extends vscode.TreeItem {
    constructor() {
        super("Launch DayZ Client");
        this.iconPath = new vscode.ThemeIcon('run');
        this.contextValue = 'clientLauncher';
        this.command = {
            command: 'dayz-mod-tool.startClient',
            title: 'Start Client'
        };
    }
}
exports.ClientLauncherItem = ClientLauncherItem;
// Items for new Actions
class SimpleCommandItem extends vscode.TreeItem {
    constructor(label, commandId, icon) {
        super(label);
        this.command = { command: commandId, title: label };
        this.iconPath = new vscode.ThemeIcon(icon);
        this.contextValue = 'commandItem';
    }
}
class GroupItem extends vscode.TreeItem {
    constructor(label, type) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.type = type;
        // Add specific context for dev group to allow inline actions (like Refresh)
        if (type === 'dev') {
            this.contextValue = 'groupSourceAddons';
        }
        else {
            this.contextValue = 'group';
        }
    }
}
exports.GroupItem = GroupItem;
class ConfigItem extends vscode.TreeItem {
    constructor(name, isSelected) {
        super(name);
        this.name = name;
        this.isSelected = isSelected;
        this.contextValue = 'configItem';
        this.iconPath = new vscode.ThemeIcon(isSelected ? 'check' : 'file-code');
        this.description = isSelected ? "(Active)" : "";
        this.command = {
            command: 'dayz-mod-tool.selectServerConfig',
            title: 'Select Config',
            arguments: [this]
        };
    }
}
exports.ConfigItem = ConfigItem;
class ModItem extends vscode.TreeItem {
    constructor(name, path, isEnabled, source, needsBuild = false, status = 'ok') {
        super(name);
        this.name = name;
        this.path = path;
        this.isEnabled = isEnabled;
        this.source = source;
        this.needsBuild = needsBuild;
        this.status = status;
        // Checkboxes only for Workshop and Local mods (Server Control)
        if (source === 'workshop' || source === 'local') {
            this.checkboxState = isEnabled ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
        }
        this.tooltip = path;
        this.contextValue = source === 'dev' ? 'modItemDev' : 'modItemWorkshop'; // 'local' uses modItemWorkshop context (checkbox support)
        if (source === 'dev') {
            // "Source Addons" Status Logic
            if (status === 'modified') {
                this.description = "(Modified)";
                // Orange
                this.iconPath = new vscode.ThemeIcon('diff-modified', new vscode.ThemeColor('charts.orange'));
                this.contextValue = 'modItemDev:dirty';
            }
            else if (status === 'pending') {
                this.description = "(Pending PBO)";
                // Gray/White - 'circle-outline' or 'question'
                this.iconPath = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('disabledForeground'));
                this.contextValue = 'modItemDev:pending';
            }
            else {
                this.description = "(OK)";
                // Green - 'pass' or 'check'
                this.iconPath = new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'));
                this.contextValue = 'modItemDev:ok';
            }
        }
        else if (source === 'local') {
            this.iconPath = new vscode.ThemeIcon('folder-active');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('cloud');
        }
    }
}
exports.ModItem = ModItem;
class ServerProvider {
    constructor(serverController, configManager, outputChannel) {
        this.serverController = serverController;
        this.configManager = configManager;
        this.outputChannel = outputChannel;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.workshopScanner = new workshopScanner_1.WorkshopScanner(outputChannel);
        this.modScanner = new modScanner_1.ModScanner(outputChannel, configManager);
        this.localModScanner = new localModScanner_1.LocalModScanner(outputChannel);
        // Auto-refresh removed as per user request
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            return [
                new GroupItem("Auto Mode", 'auto'),
                new GroupItem("Server Control", 'server'),
                new GroupItem("Server Configs", 'config'), // New Group
                new GroupItem("Client Control", 'client'),
                new GroupItem("Source Addons", 'dev'), // Renamed from Workspace Mods
                new GroupItem("Local Builds (@Mods)", 'local'),
                new GroupItem("Workshop Mods", 'workshop')
            ];
        }
        if (element instanceof GroupItem) {
            const config = this.configManager.getConfig();
            if (element.type === 'auto') {
                return [new SimpleCommandItem("Launch Full Environment", "dayz-mod-tool.startAutoMode", "rocket")];
            }
            if (element.type === 'server') {
                const isRunning = this.serverController.isRunning();
                // Server Status + Controls
                return [
                    new ServerStatusItem(isRunning),
                    new SimpleCommandItem("Start Server", "dayz-mod-tool.startServer", "play"),
                    new SimpleCommandItem("Restart Server", "dayz-mod-tool.restartServer", "debug-restart"),
                    new SimpleCommandItem("Stop Server", "dayz-mod-tool.stopServer", "stop")
                ];
            }
            if (element.type === 'config') {
                const serverPath = config.dayzServerPath;
                if (!serverPath || !fs.existsSync(serverPath)) {
                    return [new vscode.TreeItem("Server path not found")];
                }
                try {
                    const files = await fs.promises.readdir(serverPath);
                    const cfgFiles = files.filter(f => f.toLowerCase().endsWith('.cfg'));
                    const currentConfig = config.serverConfigFile.toLowerCase();
                    return cfgFiles.map(f => {
                        const isSelected = f.toLowerCase() === currentConfig;
                        return new ConfigItem(f, isSelected);
                    });
                }
                catch (e) {
                    return [new vscode.TreeItem("Error scanning configs")];
                }
            }
            if (element.type === 'client') {
                return [
                    new SimpleCommandItem("Start Client", "dayz-mod-tool.startClient", "run"),
                    new SimpleCommandItem("Restart Client", "dayz-mod-tool.restartClient", "debug-restart"),
                    new SimpleCommandItem("Kill Client", "dayz-mod-tool.killClient", "close")
                ];
            }
            if (element.type === 'dev') {
                const scanCandidates = await this.modScanner.scanWorkspace();
                const mods = [];
                for (const candidate of scanCandidates) {
                    // Logic for enabling/detecting symlink is preserved but checkbox is hidden in UI
                    const possibleSymlinkName = candidate.name.startsWith('@') ? candidate.name : '@' + candidate.name;
                    const fullSymlinkPath = path.join(config.dayzServerPath, possibleSymlinkName);
                    const isEnabled = fs.existsSync(fullSymlinkPath);
                    mods.push(new ModItem(candidate.name, candidate.path, isEnabled, 'dev', candidate.needsBuild, candidate.status // Pass status
                    ));
                }
                return mods;
            }
            if (element.type === 'local') {
                const outputPath = config.outputPath || "P:\\";
                // We should ensure we are scanning the right place. 
                // LocalModScanner defaults to treating path as-is.
                const localMods = await this.localModScanner.scan(outputPath);
                return localMods.map(m => {
                    const symlinkPath = path.join(config.dayzServerPath, m.name);
                    const isEnabled = fs.existsSync(symlinkPath);
                    return new ModItem(m.name, m.path, isEnabled, 'local');
                }).sort((a, b) => a.name.localeCompare(b.name));
            }
            if (element.type === 'workshop') {
                const wMods = await this.workshopScanner.scan(config.workshopPath);
                return wMods.map(m => {
                    const safeName = m.name.replace(/[<>:"/\\|?*]/g, '_');
                    const symlinkPath = path.join(config.dayzServerPath, `@${safeName}`);
                    const isEnabled = fs.existsSync(symlinkPath);
                    return new ModItem(m.name, m.path, isEnabled, 'workshop');
                }).sort((a, b) => a.name.localeCompare(b.name));
            }
        }
        return [];
    }
    async toggleMod(item, enable) {
        const config = this.configManager.getConfig();
        const directories = [config.dayzServerPath];
        if (config.dayzClientPath && fs.existsSync(config.dayzClientPath)) {
            directories.push(config.dayzClientPath);
        }
        let symlinkName = "";
        if (item.source === 'workshop' || item.source === 'local') {
            // For workshop/local, we use the folder name as the symlink target name
            // For local, name is already @ModName. For workshop it might be generic, sanitization handled below
            const safeName = item.name.replace(/[<>:"/\\|?*]/g, '_');
            symlinkName = item.name.startsWith('@') ? safeName : `@${safeName}`;
        }
        else {
            symlinkName = item.name;
        }
        for (const dir of directories) {
            const symlinkPath = path.join(dir, symlinkName);
            if (enable) {
                if (!fs.existsSync(symlinkPath)) {
                    try {
                        await fs.promises.symlink(item.path, symlinkPath, 'junction');
                    }
                    catch (e) {
                        vscode.window.showErrorMessage(`Failed to link mod in ${dir}: ${e.message}`);
                    }
                }
            }
            else {
                if (fs.existsSync(symlinkPath)) {
                    try {
                        await fs.promises.unlink(symlinkPath);
                    }
                    catch (e) {
                        try {
                            await fs.promises.rm(symlinkPath, { recursive: true, force: true });
                        }
                        catch (e2) { }
                    }
                }
            }
        }
        this.refresh();
    }
}
exports.ServerProvider = ServerProvider;
//# sourceMappingURL=serverProvider.js.map