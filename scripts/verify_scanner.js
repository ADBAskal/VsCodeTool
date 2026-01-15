// Standalone script to verify mod scanning logic
// Run with: node scripts/verify_scanner.js

const fs = require('fs');
const path = require('path');

async function scanFolder(folderPath) {
    console.log(`Scanning: ${folderPath}`);

    // Safety checks
    if (!fs.existsSync(folderPath)) {
        console.log(`Path does not exist: ${folderPath}`);
        return;
    }

    if (folderPath.includes('node_modules') || folderPath.includes('.git') || folderPath.endsWith('.gemini')) {
        return;
    }

    let entries;
    try {
        entries = await fs.promises.readdir(folderPath);
    } catch (err) {
        console.error(`Failed to read dir: ${folderPath}`, err);
        return;
    }

    // Check for config.cpp
    const hasConfig = entries.some(e => e.toLowerCase() === 'config.cpp');

    if (hasConfig) {
        console.log(`[SUCCESS] Found Mod Candidate: ${folderPath}`);
        // In the real app, we stop recursion here usually, or continue if we expect nested mods.
        // mimicking current implementation:
    }

    for (const entry of entries) {
        const fullPath = path.join(folderPath, entry);
        let stat;
        try {
            stat = await fs.promises.stat(fullPath);
        } catch { continue; }

        if (stat.isDirectory()) {
            await scanFolder(fullPath);
        }
    }
}

async function main() {
    // Hardcoded paths based on user's workspace
    const pathsToTest = [
        'd:\\Tools\\VsCodeTool',
        'P:\\askal', // Added based on earlier context/screenshot
        'D:\\Tools'
    ];

    for (const p of pathsToTest) {
        console.log(`--- Testing Root: ${p} ---`);
        await scanFolder(p);
    }
}

main();
