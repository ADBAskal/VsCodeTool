import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface LocalMod {
    name: string;
    path: string;
}

export class LocalModScanner {
    constructor(private outputChannel: vscode.OutputChannel) { }

    public async scan(scanPath: string): Promise<LocalMod[]> {
        if (!scanPath || !fs.existsSync(scanPath)) {
            // this.outputChannel.appendLine(`LocalModScanner: Path not found - ${scanPath}`);
            return [];
        }

        const mods: LocalMod[] = [];

        try {
            const entries = await fs.promises.readdir(scanPath, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory() && entry.name.startsWith('@')) {
                    mods.push({
                        name: entry.name,
                        path: path.join(scanPath, entry.name)
                    });
                }
            }
        } catch (e: any) {
            this.outputChannel.appendLine(`LocalModScanner Error: ${e.message}`);
        }

        return mods;
    }
}
