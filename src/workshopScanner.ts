import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface WorkshopMod {
    appId: string;
    name: string;
    path: string;
}

export class WorkshopScanner {
    constructor(private outputChannel: vscode.OutputChannel) { }

    public async scan(workshopPath: string): Promise<WorkshopMod[]> {
        const mods: WorkshopMod[] = [];
        if (!fs.existsSync(workshopPath)) {
            this.outputChannel.appendLine(`Workshop path not found: ${workshopPath}`);
            return mods;
        }

        try {
            const entries = await fs.promises.readdir(workshopPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const modPath = path.join(workshopPath, entry.name);
                    const metaPath = path.join(modPath, 'meta.cpp');

                    if (fs.existsSync(metaPath)) {
                        const name = await this.parseModName(metaPath);
                        mods.push({
                            appId: entry.name,
                            name: name || `Unknown Mod (${entry.name})`,
                            path: modPath
                        });
                    }
                }
            }
        } catch (e: any) {
            this.outputChannel.appendLine(`Error scanning workshop: ${e.message}`);
        }
        return mods;
    }

    private async parseModName(metaPath: string): Promise<string | undefined> {
        try {
            const content = await fs.promises.readFile(metaPath, 'utf8');
            // Look for name = "Value";
            const match = content.match(/name\s*=\s*"([^"]+)"/);
            if (match && match[1]) {
                return match[1];
            }
        } catch (e) {
            // ignore
        }
        return undefined;
    }
}
