import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export interface DayZToolConfig {
    sourcePath: string;
    outputPath: string;
    keyPath: string;
    dayzServerPath: string;
    dayzClientPath: string;
}

export class ConfigManager {

    public getConfig(): DayZToolConfig {
        const config = vscode.workspace.getConfiguration('dayzTool');
        return {
            sourcePath: config.get<string>('sourcePath', 'P:/'),
            outputPath: config.get<string>('outputPath', ''),
            keyPath: config.get<string>('keyPath', ''),
            dayzServerPath: config.get<string>('dayzServerPath', ''),
            dayzClientPath: config.get<string>('dayzClientPath', '')
        };
    }

    public async getPboProjectPath(): Promise<string | undefined> {
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
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    public validateSourcePath(providedPath: string): boolean {
        // User Requirement: "Source Folder : A pasta de arquivos que deve estar obrigatoriamente dentro do P:/"
        const normalized = path.normalize(providedPath).toLowerCase();
        // Check if it starts with P:\ or P:/
        if (normalized.startsWith('p:\\') || normalized.startsWith('p:/')) {
            return true;
        }
        return false;
    }

    public ensureSourcePath(cwd: string): string {
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
