"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalModScanner = void 0;
const fs = require("fs");
const path = require("path");
class LocalModScanner {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
    }
    async scan(scanPath) {
        if (!scanPath || !fs.existsSync(scanPath)) {
            // this.outputChannel.appendLine(`LocalModScanner: Path not found - ${scanPath}`);
            return [];
        }
        const mods = [];
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
        }
        catch (e) {
            this.outputChannel.appendLine(`LocalModScanner Error: ${e.message}`);
        }
        return mods;
    }
}
exports.LocalModScanner = LocalModScanner;
//# sourceMappingURL=localModScanner.js.map