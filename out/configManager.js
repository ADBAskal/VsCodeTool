"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
class ConfigManager {
    getConfig() {
        const config = vscode.workspace.getConfiguration('dayzTool');
        return {
            sourcePath: config.get('sourcePath', 'P:/'),
            outputPath: config.get('outputPath', ''),
            keyPath: config.get('keyPath', ''),
            dayzServerPath: config.get('dayzServerPath', ''),
            dayzClientPath: config.get('dayzClientPath', '')
        };
    }
    async getPboProjectPath() {
        // Registry key: Computador\HKEY_CURRENT_USER\SOFTWARE\Mikero\pboProject (Valor: exe)
        return new Promise((resolve) => {
            const command = 'reg query "HKEY_CURRENT_USER\\SOFTWARE\\Mikero\\pboProject" /v exe';
            cp.exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.warn('Registry query for PboProject failed:', error.message);
                    resolve(undefined);
                    return;
                }
                // Parse output: 
                //     exe    REG_SZ    C:\Path\To\pboProject.exe
                const match = stdout.match(/exe\s+REG_SZ\s+(.*)/);
                if (match && match[1]) {
                    resolve(match[1].trim());
                }
                else {
                    resolve(undefined);
                }
            });
        });
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
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=configManager.js.map