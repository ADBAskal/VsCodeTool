import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface DayZToolConfig {
    sourcePath: string;
    outputPath: string;
    keyPath: string;
    dayzServerPath: string;
    dayzClientPath: string;
    workshopPath: string;
    modFolderNameOverride: string;
    serverIP: string;
    serverPort: number;
    clientName: string;
    serverConfigFile: string;
}

export class ConfigManager {

    public getConfig(): DayZToolConfig {
        const config = vscode.workspace.getConfiguration('dayzTool');

        let defaultSource = 'P:/';
        if (vscode.workspace.name) {
            // Remove " (Workspace)" suffix if present
            const cleanName = vscode.workspace.name.replace(' (Workspace)', '').trim();
            defaultSource = `P:/${cleanName}`;
        }

        return {
            sourcePath: config.get<string>('sourcePath', defaultSource),
            outputPath: config.get<string>('outputPath', ''),
            keyPath: config.get<string>('keyPath', ''),
            dayzServerPath: config.get<string>('dayzServerPath', ''),
            dayzClientPath: config.get<string>('dayzClientPath', ''),
            workshopPath: config.get<string>('workshopPath', 'C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\content\\221100'),
            modFolderNameOverride: config.get<string>('modFolderNameOverride', ''),
            serverIP: config.get<string>('serverIP', '127.0.0.1'),
            serverPort: config.get<number>('serverPort', 2302),
            clientName: config.get<string>('clientName', 'Askal'),
            serverConfigFile: config.get<string>('serverConfigFile', 'serverDZ.cfg')
        };
    }

    public async getPboProjectPath(): Promise<string | undefined> {
        // 1. Check Registry
        const registryPath = await new Promise<string | undefined>((resolve) => {
            const command = 'reg query "HKEY_CURRENT_USER\\SOFTWARE\\Mikero\\pboProject" /v exe';
            cp.exec(command, (error, stdout, stderr) => {
                if (error) {
                    resolve(undefined);
                    return;
                }
                const match = stdout.match(/exe\s+REG_SZ\s+(.*)/);
                if (match && match[1]) {
                    resolve(match[1].trim());
                } else {
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
            if (fs.existsSync(p)) return p;
        }

        return undefined;
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

    public getDsUtilsTool(toolName: string): string | undefined {
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
