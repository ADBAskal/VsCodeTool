# DayZ Mod Tool - VS Code Extension

This extension integrates Mikero's PboProject into VS Code, allowing you to build DayZ mods directly from your workspace.

## Setup Instructions

1.  **Prerequisites**:
    *   Node.js and npm installed.
    *   Mikero Tools installed (specifically `pboProject`).
    *   VS Code.

2.  **Installation**:
    Open this folder in VS Code.
    Open a terminal and run:
    ```bash
    npm install
    ```

3.  **Running the Extension**:
    *   Press `F5` to open a new "Extension Development Host" window.
    *   In the new window, open your DayZ Mod workspace (e.g., `P:\MyMod`).

## Features

*   **Auto-Detection**: Scans your workspace for folders containing `config.cpp`.
*   **Mod Explorer**: Displays detected mods in the "DayZ Mods" activity bar icon.
*   **One-Click Build**: Click the "Build" icon (or right-click) on a mod to run PboProject.
*   **Configuration**: 
    *   Go to `File > Preferences > Settings`.
    *   Search for `DayZ Tool`.
    *   Configure `Source Path`, `Output Path`, `Key Path`, etc.

## Configuration Details

The extension tries to detect `pboProject.exe` from the Windows Registry automatically.
You can configure:
*   `dayzTool.sourcePath`: Defaults to `P:/`.
*   `dayzTool.keyPath`: Path to your private key for signing.
*   `dayzTool.outputPath`: (Optional) Custom output directory.

## Troubleshooting

*   If `npm install` fails, verify Node.js is in your PATH.
*   If "Build" fails, check the "DayZ PboProject" output channel for logs.
