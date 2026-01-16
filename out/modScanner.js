"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModScanner = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
class ModScanner {
    constructor(outputChannel, configManager) {
        this.outputChannel = outputChannel;
        this.configManager = configManager;
    }
    async scanWorkspace() {
        // User Requirement: Scan "only the main folder of the workspace".
        let rootPath = '';
        if (vscode.workspace.workspaceFile) {
            rootPath = path.dirname(vscode.workspace.workspaceFile.fsPath);
            this.outputChannel.appendLine(`Scanning Workspace File Directory: ${rootPath}`);
        }
        else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            this.outputChannel.appendLine(`Scanning First Workspace Folder: ${rootPath}`);
        }
        else {
            const config = this.configManager.getConfig();
            rootPath = config.sourcePath;
            this.outputChannel.appendLine(`Scanning Configured Source Path (Fallback): ${rootPath}`);
        }
        if (!rootPath || !fs.existsSync(rootPath)) {
            this.outputChannel.appendLine(`Scan Path not found: ${rootPath}`);
            return [];
        }
        const candidates = [];
        await this.scanFolderRecursively(rootPath, candidates);
        this.outputChannel.appendLine(`Scan complete. Found ${candidates.length} candidates.`);
        return candidates;
    }
    async scanFolderRecursively(folderPath, candidates) {
        const baseName = path.basename(folderPath);
        // Skip hidden/system folders
        if (baseName.startsWith('.') || baseName === 'node_modules' || baseName === 'media' || baseName === 'out')
            return;
        // 1. Check if this folder is a PBO Root (has config.cpp)
        if (await this.hasConfig(folderPath)) {
            const pboName = await this.extractPboName(folderPath);
            // this.outputChannel.appendLine(`Found Mod: ${pboName} at ${folderPath}`);
            // Check for changes
            const lastMod = this.getLatestMtime(folderPath);
            let needsBuild = false;
            let status = 'pending';
            // Resolve PBO destination path
            const config = this.configManager.getConfig();
            let pboPath = "";
            if (config.outputPath && config.outputPath.trim().length > 0) {
                // User configured output path
                // Logic must match pboBuilder.ts: OutputPath/ModFolderName/Addons/PboName.pbo
                // Determine Mod Folder Name
                let modFolderName = config.modFolderNameOverride;
                if (!modFolderName || modFolderName.trim() === "") {
                    if (vscode.workspace.name) {
                        modFolderName = vscode.workspace.name.replace(' (Workspace)', '').trim();
                    }
                    else {
                        modFolderName = "DayZMod";
                    }
                }
                if (!modFolderName.startsWith('@')) {
                    modFolderName = `@${modFolderName}`;
                }
                pboPath = path.join(config.outputPath, modFolderName, 'addons', `${pboName}.pbo`);
            }
            else {
                // Default Mikero/Legacy structure: P:\@ModName\addons\ModName.pbo
                const drive = path.parse(config.sourcePath).root || "P:\\";
                const modFolderName = config.modFolderNameOverride || `@${path.basename(folderPath)}`;
                pboPath = path.join(drive, modFolderName, 'addons', `${pboName}.pbo`);
            }
            // Check if PBO exists and compare time
            let pboTime = 0;
            if (fs.existsSync(pboPath)) {
                try {
                    const stat = fs.statSync(pboPath);
                    pboTime = stat.mtimeMs;
                }
                catch (e) { }
            }
            needsBuild = lastMod > pboTime;
            if (pboTime === 0) {
                status = 'pending'; // No PBO found
            }
            else if (needsBuild) {
                status = 'modified';
                // this.outputChannel.appendLine(`  [MODIFIED] Needs Build: Source > PBO`);
            }
            else {
                status = 'ok';
            }
            candidates.push({
                name: pboName,
                path: folderPath,
                hasConfig: true,
                needsBuild: needsBuild,
                status: status,
                lastModified: lastMod,
                pboPath: pboPath
            });
            // STOP recursion here. 
            return;
        }
        // 2. If not a PBO, recurse into children
        try {
            const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    await this.scanFolderRecursively(path.join(folderPath, entry.name), candidates);
                }
            }
        }
        catch (e) {
            this.outputChannel.appendLine(`Error scanning ${folderPath}: ${e}`);
        }
    }
    async hasConfig(dirPath) {
        return fs.existsSync(path.join(dirPath, 'config.cpp')) || fs.existsSync(path.join(dirPath, 'config.bin'));
    }
    async extractPboName(dirPath) {
        // Default to folder name if parsing fails
        let pboName = path.basename(dirPath);
        try {
            const cppPath = path.join(dirPath, 'config.cpp');
            if (fs.existsSync(cppPath)) {
                const content = await fs.promises.readFile(cppPath, 'utf8');
                // Regex to find class CfgPatches -> class NAME
                const match = content.match(/class\s+CfgPatches\s*\{[\s\S]*?class\s+([a-zA-Z0-9_]+)/);
                if (match && match[1]) {
                    pboName = match[1];
                }
            }
        }
        catch (e) {
            this.outputChannel.appendLine(`  Error parsing config.cpp in ${dirPath}: ${e}`);
        }
        return pboName;
    }
    getLatestMtime(dirPath) {
        let maxTime = 0;
        try {
            const stats = fs.statSync(dirPath);
            maxTime = stats.mtimeMs;
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.name.startsWith('.') || entry.name === '.git')
                    continue;
                if (entry.isDirectory()) {
                    const t = this.getLatestMtime(fullPath);
                    if (t > maxTime)
                        maxTime = t;
                }
                else {
                    const s = fs.statSync(fullPath);
                    if (s.mtimeMs > maxTime)
                        maxTime = s.mtimeMs;
                }
            }
        }
        catch (e) {
            // ignore errors during scan
        }
        return maxTime;
    }
}
exports.ModScanner = ModScanner;
//# sourceMappingURL=modScanner.js.map