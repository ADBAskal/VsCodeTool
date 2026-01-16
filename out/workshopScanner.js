"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkshopScanner = void 0;
const fs = require("fs");
const path = require("path");
class WorkshopScanner {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
    }
    async scan(workshopPath) {
        const mods = [];
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
        }
        catch (e) {
            this.outputChannel.appendLine(`Error scanning workshop: ${e.message}`);
        }
        return mods;
    }
    async parseModName(metaPath) {
        try {
            const content = await fs.promises.readFile(metaPath, 'utf8');
            // Look for name = "Value";
            const match = content.match(/name\s*=\s*"([^"]+)"/);
            if (match && match[1]) {
                return match[1];
            }
        }
        catch (e) {
            // ignore
        }
        return undefined;
    }
}
exports.WorkshopScanner = WorkshopScanner;
//# sourceMappingURL=workshopScanner.js.map