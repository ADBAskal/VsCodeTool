import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ModCandidate {
    name: string;
    path: string;
    hasConfig: boolean;
}

export class ModScanner {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    public async scanWorkspace(): Promise<ModCandidate[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        this.outputChannel.appendLine('Scanning workspace...');

        if (!workspaceFolders) {
            this.outputChannel.appendLine('No workspace folders found.');
            return [];
        }

        const candidates: ModCandidate[] = [];

        for (const folder of workspaceFolders) {
            this.outputChannel.appendLine(`Scanning root folder: ${folder.uri.fsPath}`);
            await this.scanFolder(folder.uri.fsPath, candidates);
        }

        this.outputChannel.appendLine(`Scan complete. Found ${candidates.length} mods.`);
        return candidates;
    }

    private async scanFolder(folderPath: string, candidates: ModCandidate[]): Promise<void> {
        // Avoid scanning node_modules or .git
        if (folderPath.includes('node_modules') || folderPath.includes('.git') || folderPath.includes('.vscode') || folderPath.endsWith('.gemini')) {
            return;
        }

        let entries: string[];
        try {
            entries = await fs.promises.readdir(folderPath);
        } catch (err) {
            console.error(`Failed to read dir: ${folderPath}`, err);
            return;
        }

        // Check if this folder is a mod root (contains config.cpp)
        // Case-insensitive check for config.cpp
        const hasConfig = entries.some(e => e.toLowerCase() === 'config.cpp');

        if (hasConfig) {
            this.outputChannel.appendLine(`Found Mod at ${folderPath}`);
            candidates.push({
                name: path.basename(folderPath),
                path: folderPath,
                hasConfig: true
            });
        }

        for (const entry of entries) {
            const fullPath = path.join(folderPath, entry);
            let stat;
            try {
                stat = await fs.promises.stat(fullPath);
            } catch { continue; }

            if (stat.isDirectory()) {
                await this.scanFolder(fullPath, candidates); // Recursion
            }
        }
    }
}
