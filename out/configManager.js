"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const fs = require("fs");
class ConfigManager {
    getConfig() {
        const config = vscode.workspace.getConfiguration('dayzTool');
        let defaultSource = 'P:/';
        if (vscode.workspace.name) {
            // Remove " (Workspace)" suffix if present
            const cleanName = vscode.workspace.name.replace(' (Workspace)', '').trim();
            defaultSource = `P:/${cleanName}`;
        }
        return {
            sourcePath: config.get('sourcePath', defaultSource),
            outputPath: config.get('outputPath', ''),
            keyPath: config.get('keyPath', ''),
            dayzServerPath: config.get('dayzServerPath', ''),
            dayzClientPath: config.get('dayzClientPath', ''),
            workshopPath: config.get('workshopPath', 'C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\content\\221100'),
            modFolderNameOverride: config.get('modFolderNameOverride', ''),
            serverIP: config.get('serverIP', '127.0.0.1'),
            serverPort: config.get('serverPort', 2302)
        };
    }
    async getPboProjectPath() {
        // 1. Check Registry
        const registryPath = await new Promise((resolve) => {
            const command = 'reg query "HKEY_CURRENT_USER\\SOFTWARE\\Mikero\\pboProject" /v exe';
            cp.exec(command, (error, stdout, stderr) => {
                if (error) {
                    resolve(undefined);
                    return;
                }
                const match = stdout.match(/exe\s+REG_SZ\s+(.*)/);
                if (match && match[1]) {
                    resolve(match[1].trim());
                }
                else {
                    resolve(undefined);
                }
            });
        });
        if (registryPath && fs.existsSync(registryPath)) {
            return registryPath;
        }
        // 2. Fallback: Common Paths (Legacy behavior)
        const commonPaths = [
            "C:\\Program Files (x86)\\Mikero\\DePboTools\\bin\\pboProject.exe",
            "C:\\Program Files\\Mikero\\DePboTools\\bin\\pboProject.exe"
        ];
        for (const p of commonPaths) {
            if (fs.existsSync(p))
                return p;
        }
        return undefined;
    }
    validateSourcePath(providedPath) {
        // User Requirement: "Source Folder : A pasta de arquivos que deve estar obrigatoriamente dentro do P:/"
        const normalized = path.normalize(providedPath).toLowerCase();
        // Check if it starts with P:\ or P:/
        if (normalized.startsWith('p:\\') || normalized.startsWith('p:/')) {
            return true;
        }
        return false;
    }
    ensureSourcePath(cwd) {
        const config = this.getConfig();
        let sourcePath = config.sourcePath;
        if (!sourcePath || sourcePath.trim() === '') {
            sourcePath = 'P:/';
        }
        if (!this.validateSourcePath(sourcePath)) {
            vscode.window.showWarningMessage(`Source Path is configured to '${sourcePath}', but DayZ tools typically require 'P:/'. Please ensure your P drive is mounted.`);
        }
        return sourcePath;
    }
    getDsUtilsTool(toolName) {
        // Typically in: Steam\steamapps\common\DayZ Tools\Bin\DSUtils\toolName.exe
        const config = this.getConfig();
        // Try based on DayZ Server path assumption (often side-by-side)
        // or just hardcoded common paths
        const commonPaths = [
            "C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ Tools\\Bin\\DSUtils",
            "C:\\Program Files\\Steam\\steamapps\\common\\DayZ Tools\\Bin\\DSUtils",
            "D:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ Tools\\Bin\\DSUtils",
            "D:\\SteamLibrary\\steamapps\\common\\DayZ Tools\\Bin\\DSUtils"
            // We could try to deduce from config.dayzServerPath but that might be separate
        ];
        for (const p of commonPaths) {
            const toolExe = path.join(p, toolName);
            if (fs.existsSync(toolExe)) {
                return toolExe;
            }
        }
        return undefined;
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=configManager.js.map