"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PboBuilder = void 0;
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const fs = require("fs");
class PboBuilder {
    constructor(configManager, outputChannel) {
        this.configManager = configManager;
        this.outputChannel = outputChannel;
    }
    async buildMod(modPath) {
        this.outputChannel.show(true);
        this.outputChannel.appendLine(`Initializing Build for: ${modPath}`);
        const pboProjectExe = await this.configManager.getPboProjectPath();
        if (!pboProjectExe) {
            this.outputChannel.appendLine(`[ERROR] PboProject.exe not found in Registry or Common Paths.`);
            vscode.window.showErrorMessage('PboProject.exe path not found. Please install Mikero Tools.');
            return;
        }
        const config = this.configManager.getConfig();
        // 1. Determine PBO Name (Internal Name)
        let pboName = await this.extractPboName(modPath);
        if (!pboName) {
            pboName = path.basename(modPath);
            this.outputChannel.appendLine(`Using Folder Name for PBO: ${pboName}`);
        }
        else {
            this.outputChannel.appendLine(`Using CfgPatches for PBO: ${pboName}`);
        }
        // Sanitize PBO Name
        pboName = pboName.replace(/[<>:"/\\|?*]/g, '_');
        // 2. Determine Mod Folder Name (Destination Folder, e.g. @MyMod)
        let modFolderName = config.modFolderNameOverride;
        if (!modFolderName || modFolderName.trim() === "") {
            const wsFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(modPath));
            if (wsFolder) {
                modFolderName = wsFolder.name;
                // Remove " (Workspace)" if present
                modFolderName = modFolderName.replace(' (Workspace)', '').trim();
            }
            else {
                modFolderName = "DayZMod";
            }
        }
        // Ensure @ prefix
        if (!modFolderName.startsWith('@')) {
            modFolderName = `@${modFolderName}`;
        }
        // Sanitize Mod Folder Name just in case
        modFolderName = modFolderName.replace(/[<>:"/\\|?*]/g, '_');
        const args = [
            // '-z', 
            '-E=dayz',
            '+H',
            '-P',
            `-L=${pboName}`
        ];
        /*
        // Legacy Tool SIGNED separately using DSSignFile.
        // PboProject -K might be problematic or causing the hang/failure if key is wrong.
        // Disabling -K to match legacy stability for now.
        if (config.keyPath && config.keyPath.trim() !== "") {
            args.push(`-K "${config.keyPath}"`);
        } else {
            vscode.window.showWarningMessage('No private key configured. Mod will not be signed.');
        }
        */
        // Output destination
        let finalOutput = "";
        if (config.outputPath && config.outputPath.trim() !== "") {
            finalOutput = path.join(path.normalize(config.outputPath), modFolderName);
            // Ensure directory exists
            if (!fs.existsSync(finalOutput)) {
                try {
                    fs.mkdirSync(finalOutput, { recursive: true });
                    this.outputChannel.appendLine(`Created output directory: ${finalOutput}`);
                }
                catch (e) {
                    this.outputChannel.appendLine(`[ERROR] Failed to create output directory: ${e}`);
                    vscode.window.showErrorMessage(`Failed to create output directory: ${finalOutput}`);
                    return;
                }
            }
            args.push(`-M="${finalOutput}"`);
        }
        else {
            // If no output path, PboProject defaults to P:\ModName typically?
            // But we should warn or handle defaults.
            // For now, let PboProject decide if no output path.
        }
        const sourceArg = `"${path.normalize(modPath)}"`;
        const command = `"${pboProjectExe}" ${args.join(' ')} ${sourceArg}`;
        this.outputChannel.show(true);
        this.outputChannel.appendLine(`Mod Folder: ${modFolderName}`);
        this.outputChannel.appendLine(`PBO Name: ${pboName}`);
        this.outputChannel.appendLine(`Output Path: ${finalOutput}`);
        this.outputChannel.appendLine(`Executing: ${command}`);
        cp.exec(command, async (error, stdout, stderr) => {
            if (stdout)
                this.outputChannel.append(stdout);
            if (stderr)
                this.outputChannel.append(stderr);
            if (error) {
                this.outputChannel.appendLine(`\n[ERROR] Build Process Exited with Error code: ${error.code}`);
                this.outputChannel.appendLine(`Message: ${error.message}`);
                vscode.window.showErrorMessage(`Build for ${pboName} failed. Check output.`);
            }
            else {
                this.outputChannel.appendLine(`\n[SUCCESS] Build completed.`);
                // --- SIGNING PROCESS ---
                if (finalOutput && config.keyPath && config.keyPath.trim() !== "") {
                    // PboProject with -M typically puts it in Output/@Mod/Addons/Name.pbo
                    const pboFile = path.join(finalOutput, 'Addons', `${pboName}.pbo`);
                    if (fs.existsSync(pboFile)) {
                        this.outputChannel.appendLine(`Signing PBO: ${pboFile}`);
                        const dsSign = this.configManager.getDsUtilsTool('DSSignFile.exe');
                        if (dsSign) {
                            // Sign it: DSSignFile.exe "key" "pbo"
                            const signCmd = `"${dsSign}" "${config.keyPath}" "${pboFile}"`;
                            this.outputChannel.appendLine(`Executing Sign: ${signCmd}`);
                            cp.exec(signCmd, (sErr, sOut, sStdErr) => {
                                if (sOut)
                                    this.outputChannel.append(sOut);
                                if (sErr) {
                                    this.outputChannel.appendLine(`[SIGN ERROR] ${sErr.message}`);
                                }
                                else {
                                    this.outputChannel.appendLine(`[SIGNED] ${pboName}.pbo signed successfully.`);
                                }
                                vscode.window.showInformationMessage(`Build & Sign for ${pboName} complete!`);
                            });
                        }
                        else {
                            this.outputChannel.appendLine(`[WARNING] DSSignFile.exe not found. PBO not signed.`);
                            vscode.window.showWarningMessage('Build complete, but DSSignFile.exe not found. PBO not signed.');
                        }
                    }
                    else {
                        this.outputChannel.appendLine(`[WARNING] Could not find built PBO at ${pboFile} to sign.`);
                        vscode.window.showInformationMessage(`Build for ${pboName} complete (Unsigned - PBO not found)!`);
                    }
                }
                else {
                    vscode.window.showInformationMessage(`Build for ${pboName} complete!`);
                }
                // Refresh the view to update "Needs Build" status
                vscode.commands.executeCommand('dayz-mod-tool.refreshMods');
            }
        });
    }
    async extractPboName(dirPath) {
        try {
            const cppPath = path.join(dirPath, 'config.cpp');
            if (fs.existsSync(cppPath)) {
                const content = await fs.promises.readFile(cppPath, 'utf8');
                // Regex: class CfgPatches { class NAME
                const match = content.match(/class\s+CfgPatches\s*\{[\s\S]*?class\s+([a-zA-Z0-9_]+)/);
                if (match && match[1]) {
                    return match[1];
                }
            }
        }
        catch (e) {
            this.outputChannel.appendLine(`Error parsing config.cpp in ${dirPath}: ${e}`);
        }
        return null;
    }
    async buildAll(mods) {
        if (mods.length === 0) {
            vscode.window.showInformationMessage("No mods to build.");
            return;
        }
        this.outputChannel.show(true);
        this.outputChannel.appendLine(`=== Starting Batch Build (${mods.length} mods) ===`);
        for (const modPath of mods) {
            await this.buildMod(modPath);
        }
        this.outputChannel.appendLine(`=== Batch Build Complete ===`);
    }
}
exports.PboBuilder = PboBuilder;
//# sourceMappingURL=pboBuilder.js.map