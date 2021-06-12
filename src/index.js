const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1144,
        height: 600,
        minWidth: 648,
        minHeight: 400,
        webPreferences: {
            spellcheck: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload', 'index.js'),
        },
        frame: false,
        icon: path.join(__dirname, 'images', 'icon.png')
    });

    //mainWindow.setOverlayIcon(path.join(__dirname, 'images', 'icon.png'), '')

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    Menu.setApplicationMenu(Menu.buildFromTemplate([]));

    //mainWindow.maximize();

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open the DevTools.
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
