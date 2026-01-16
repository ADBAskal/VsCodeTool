// Standalone script to verify mod scanning logic
// Run with: node scripts/verify_scanner.js [path1] [path2] ...
// If no arguments provided, scans current working directory.

const fs = require('fs');
const path = require('path');

async function scanFolder(folderPath) {
    const absPath = path.resolve(folderPath);
    console.log(`\nScanning: ${absPath}`);

    // Safety checks
    if (!fs.existsSync(absPath)) {
        console.log(`[ERROR] Path does not exist: ${absPath}`);
        return;
    }

    // Skip ignored folders
    if (absPath.includes('node_modules') || absPath.includes('.git') || absPath.endsWith('.gemini')) {
        return;
    }

    let entries;
    try {
        entries = await fs.promises.readdir(absPath);
    } catch (err) {
        console.error(`[ERROR] Failed to read dir: ${absPath}`, err);
        return;
    }

    // Check for config.cpp
    const hasConfig = entries.some(e => e.toLowerCase() === 'config.cpp');

    if (hasConfig) {
        console.log(`[SUCCESS] Found Mod Candidate: ${absPath}`);
        // In the real app, we stop recursion here usually.
    }

    for (const entry of entries) {
        const fullPath = path.join(absPath, entry);
        let stat;
        try {
            stat = await fs.promises.stat(fullPath);
        } catch (e) { continue; }

        if (stat.isDirectory()) {
            await scanFolder(fullPath);
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const pathsToTest = args.length > 0 ? args : [process.cwd()];

    console.log(`Starting Scan Tool... Targets: ${pathsToTest.length}`);

    for (const p of pathsToTest) {
        console.log(`--- Testing Root: ${p} ---`);
        await scanFolder(p);
    }
}

main();
