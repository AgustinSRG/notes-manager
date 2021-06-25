// Index file - Entry point

"use strict";

const { app, BrowserWindow, Menu, ipcMain, MenuItem } = require('electron');
const path = require('path');
const { WindowManager } = require('./window');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit();
}

const appStatus = {
    closed: false,
};

const createWindow = () => {
    // Request window state
    const winManager = new WindowManager();
    winManager.load();

    // Window options
    const options = {
        width: winManager.w,
        height: winManager.h,
        minWidth: 648,
        minHeight: 400,
        webPreferences: {
            spellcheck: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload', 'index.js'),
        },
        frame: false,
        icon: path.join(__dirname, 'images', 'icon.png')
    };

    if (winManager.x !== null) {
        options.x = winManager.x;
    }

    if (winManager.y !== null) {
        options.y = winManager.y;
    }

    // Create the browser window.
    const mainWindow = new BrowserWindow(options);

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    // Menu
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        new MenuItem({
            type: "submenu",
            label: "Edit",
            submenu: Menu.buildFromTemplate([
                new MenuItem({
                    role: 'undo',
                }),
                new MenuItem({
                    role: 'redo',
                }),
                new MenuItem({
                    type: "separator"
                }),
                new MenuItem({
                    role: 'cut',
                }),
                new MenuItem({
                    role: 'copy',
                }),
                new MenuItem({
                    role: 'paste',
                }),
                new MenuItem({
                    role: 'delete',
                }),
                new MenuItem({
                    type: "separator"
                }),
                new MenuItem({
                    type: "normal",
                    label: "Search",
                    accelerator: "CmdOrCtrl+F",
                    registerAccelerator: true,
                    click: function () {
                        mainWindow.webContents.send('search', 'search');
                    },
                }),
                new MenuItem({
                    type: "normal",
                    label: "Replace",
                    accelerator: "CmdOrCtrl+R",
                    registerAccelerator: true,
                    click: function () {
                        mainWindow.webContents.send('search', 'replace');
                    },
                }),
                new MenuItem({
                    type: "separator"
                }),
                new MenuItem({
                    role: 'selectAll',
                }),
            ]),
        }),
        new MenuItem({
            type: "submenu",
            label: "Theme",
            submenu: Menu.buildFromTemplate([
                new MenuItem({
                    type: "radio",
                    id: "theme_dark",
                    label: "Dark Theme",
                    click: function () {
                        winManager.theme = "dark";
                        mainWindow.webContents.send('theme', 'dark');
                        winManager.save();
                    },
                    checked: winManager.theme === "dark",
                }),
                new MenuItem({
                    type: "radio",
                    id: "theme_light",
                    label: "Light Theme",
                    click: function () {
                        winManager.theme = "light";
                        mainWindow.webContents.send('theme', 'light');
                        winManager.save();
                    },
                    checked: winManager.theme === "light",
                }),
            ]),
        }),
    ]));

    // Initial maximized
    if (winManager.maximized) {
        mainWindow.maximize();
    }

    // Track window state
    winManager.setWindow(mainWindow);

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open the DevTools.
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // Prevent closing from losing data
    mainWindow.on('close', (e) => {
        if (appStatus.closed) {
            return;
        }
        mainWindow.webContents.send('closing', 'closing-first-stage');
        e.preventDefault();
    });

    // After data is saved
    ipcMain.on('closing-completed', (event, arg) => {
        // Quit the app
        appStatus.closed = true;
        app.quit();
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
