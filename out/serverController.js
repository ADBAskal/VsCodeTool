"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerController = void 0;
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const fs = require("fs");
class ServerController {
    constructor(configManager, outputChannel) {
        this.configManager = configManager;
        this.outputChannel = outputChannel;
    }
    isRunning() {
        return this.process !== undefined && !this.process.killed;
    }
    async start() {
        if (this.isRunning()) {
            vscode.window.showInformationMessage('Server is already running.');
            return;
        }
        const config = this.configManager.getConfig();
        const serverDir = config.dayzServerPath;
        let exePath = "";
        let cwd = "";
        if (serverDir.toLowerCase().endsWith('.exe')) {
            exePath = serverDir;
            cwd = path.dirname(serverDir);
        }
        else {
            exePath = path.join(serverDir, 'DayZServer_x64.exe');
            cwd = serverDir;
        }
        if (!fs.existsSync(exePath)) {
            vscode.window.showErrorMessage(`Server executable not found at: ${exePath}`);
            return;
        }
        this.outputChannel.appendLine(`Starting DayZ Server from: ${exePath}`);
        const args = [];
        if (fs.existsSync(path.join(cwd, 'serverDZ.cfg'))) {
            args.push('-config=serverDZ.cfg');
        }
        try {
            this.outputChannel.appendLine(`Scanning for mods in: ${cwd}`);
            const entries = await fs.promises.readdir(cwd, { withFileTypes: true });
            const modNames = entries
                .filter(e => e.name.startsWith('@') && (e.isDirectory() || e.isSymbolicLink()))
                .map(e => e.name);
            if (modNames.length > 0) {
                args.push(`-mod=${modNames.join(';')}`);
                this.outputChannel.appendLine(`Auto-detected Mods: ${modNames.join(';')}`);
            }
            else {
                this.outputChannel.appendLine('No mods detected in server directory.');
            }
        }
        catch (e) {
            this.outputChannel.appendLine(`Error detecting mods: ${e}`);
        }
        args.push('-profiles=profiles');
        this.outputChannel.appendLine(`Launching Server with args: ${args.join(' ')}`);
        try {
            this.process = cp.spawn(exePath, args, { cwd: cwd });
            this.process.stdout?.on('data', (data) => {
                this.outputChannel.append(`[Server]: ${data}`);
            });
            this.process.stderr?.on('data', (data) => {
                this.outputChannel.append(`[Server Error]: ${data}`);
            });
            this.process.on('close', (code) => {
                this.outputChannel.appendLine(`[Server] Exited with code ${code}`);
                this.process = undefined;
                vscode.window.showInformationMessage('DayZ Server stopped.');
            });
            vscode.window.showInformationMessage('DayZ Server started!');
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to start server: ${e.message}`);
        }
    }
    stop() {
        if (this.process) {
            this.process.kill();
            this.process = undefined;
            this.outputChannel.appendLine('Server stopped by user.');
        }
        else {
            vscode.window.showInformationMessage('Server is not running.');
        }
    }
    async restart() {
        this.stop();
        setTimeout(() => this.start(), 2000);
    }
    async startClient() {
        if (!this.configManager)
            return;
        const config = this.configManager.getConfig();
        const exePath = path.join(config.dayzClientPath, 'DayZ_x64.exe');
        if (!fs.existsSync(exePath)) {
            vscode.window.showErrorMessage(`DayZ Client executable not found at: ${exePath}`);
            return;
        }
        const args = [
            `-connect=${config.serverIP}`,
            `-port=${config.serverPort}`,
            `-profiles=profiles_client`,
            '-battleye=0',
            '-nolauncher',
            '-window'
        ];
        try {
            const serverDir = config.dayzServerPath;
            if (fs.existsSync(serverDir)) {
                const entries = await fs.promises.readdir(serverDir, { withFileTypes: true });
                const modNames = entries
                    .filter(e => e.name.startsWith('@') && (e.isDirectory() || e.isSymbolicLink()))
                    .map(e => e.name);
                if (modNames.length > 0) {
                    args.push(`"-mod=${modNames.join(';')}"`);
                }
            }
        }
        catch (e) {
            this.outputChannel.appendLine(`Error scanning for client mods: ${e}`);
        }
        this.outputChannel.appendLine(`Launching Client: ${exePath} ${args.join(' ')}`);
        const clientProcess = cp.spawn(exePath, args, {
            cwd: config.dayzClientPath,
            detached: true,
            stdio: 'ignore'
        });
        clientProcess.unref();
        vscode.window.showInformationMessage('DayZ Client Launched!');
    }
    killClient() {
        cp.exec('taskkill /im DayZ_x64.exe /F', (err, stdout, stderr) => {
            if (err) {
                this.outputChannel.appendLine(`Client Kill: ${err.message}`);
            }
            else {
                this.outputChannel.appendLine('DayZ Client killed.');
            }
        });
    }
    async restartClient() {
        this.killClient();
        setTimeout(() => this.startClient(), 2000);
    }
    startAutoMode() {
        this.outputChannel.appendLine('--- Starting Auto Mode ---');
        this.start();
        const delay = 15000;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Auto Mode: Server Starting...",
            cancellable: false
        }, async (progress) => {
            let remaining = delay / 1000;
            const interval = setInterval(() => {
                remaining--;
                progress.report({ message: `Launching Client in ${remaining}s` });
            }, 1000);
            return new Promise(resolve => {
                setTimeout(() => {
                    clearInterval(interval);
                    this.startClient();
                    resolve();
                }, delay);
            });
        });
    }
    stopAll() {
        this.stop();
        this.killClient();
        vscode.window.showInformationMessage('Stopped All (Server & Client).');
    }
    async restartAll() {
        this.stopAll();
        setTimeout(() => this.startAutoMode(), 3000);
    }
}
exports.ServerController = ServerController;
//# sourceMappingURL=serverController.js.map