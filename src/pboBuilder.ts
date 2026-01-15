import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { ConfigManager } from './configManager';

export class PboBuilder {
    private configManager: ConfigManager;
    private outputChannel: vscode.OutputChannel;

    constructor(configManager: ConfigManager, outputChannel: vscode.OutputChannel) {
        this.configManager = configManager;
        this.outputChannel = outputChannel;
    }

    public async buildMod(modPath: string) {
        const pboProjectExe = await this.configManager.getPboProjectPath();
        if (!pboProjectExe) {
            vscode.window.showErrorMessage('PboProject.exe path not found. Please install Mikero Tools or configure the path in Registry.');
            return;
        }

        const config = this.configManager.getConfig();
        const modName = path.basename(modPath);

        // Validation: Verify if mod is physically inside the declared Source Path (usually P:/)
        // This is a soft check, we warn if it looks wrong but proceed if the user really wants to.
        const sourceRoot = this.configManager.ensureSourcePath(path.dirname(modPath));
        if (!modPath.toLowerCase().startsWith(sourceRoot.toLowerCase())) {
            // Just a debug warning, pboProject might handle it if drive mapping is correct
            console.warn(`Mod path ${modPath} does not seem to be inside configured source root ${sourceRoot}`);
        }

        let args: string[] = [];

        // Command Structure for PboProject:
        // pboProject.exe -P -K "KeyPath" "SourcePath" "DestinationPath"

        // -P: Pause on error? Or just "Project" mode? 
        // "Pipeline Via CLI" usually implies we want automation.
        // Common mikero flags:
        // -g: No Pause / No GUI (Batch mode)
        // -P: Pause (we probably don't want this for automation, but let's stick to simple defaults first)
        // Actually, Mikero's tools are quirky. 
        // usually: pboProject.exe -K <key> <source> <output>

        // Key Path
        if (config.keyPath && config.keyPath.trim() !== "") {
            args.push(`-K "${config.keyPath}"`);
        } else {
            vscode.window.showWarningMessage('No private key configured. Mod will not be signed.');
        }

        // Source and Destination
        const sourceArg = `"${path.normalize(modPath)}"`;

        let destArg = "";
        if (config.outputPath && config.outputPath.trim() !== "") {
            destArg = `"${path.normalize(config.outputPath)}"`;
        } else {
            // If no output specified, PboProject usually defaults to P:/ or parent dir.
            // We leave it empty to let PboProject decide.
        }

        const command = `"${pboProjectExe}" ${args.join(' ')} ${sourceArg} ${destArg}`;

        this.outputChannel.show(true);
        this.outputChannel.appendLine(`Starting Build for: ${modName}`);
        this.outputChannel.appendLine(`Source: ${modPath}`);
        this.outputChannel.appendLine(`Output: ${config.outputPath || "(Default)"}`);
        this.outputChannel.appendLine(`Executing: ${command}`);

        cp.exec(command, (error, stdout, stderr) => {
            if (stdout) {
                this.outputChannel.append(stdout);
            }
            if (stderr) {
                this.outputChannel.append(stderr);
            }

            if (error) {
                this.outputChannel.appendLine(`\n[ERROR] Build Process Exited with Error code: ${error.code}`);
                this.outputChannel.appendLine(`Message: ${error.message}`);
                vscode.window.showErrorMessage(`Build for ${modName} failed. Check output for details.`);
            } else {
                this.outputChannel.appendLine(`\n[SUCCESS] Build completed.`);
                vscode.window.showInformationMessage(`Build for ${modName} complete!`);
            }
        });
    }
}
