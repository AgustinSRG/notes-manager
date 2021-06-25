// Main preload script

"ue strict";

const { contextBridge, ipcRenderer } = require('electron');
const fontList = require('font-list');

// Notes Manager

const { NotesManager } = require('./notes');

const notesManager = NotesManager.getInstance();

let systemFonts = null;
let waitingForFonts = null;
let savingCallback = null;

const Notes = {
    getNotes: function () {
        return notesManager.getFiles();
    },
    init: function () {
        return notesManager.init();
    },
    onceInitialized: function (fn) {
        notesManager.onceLoaded(fn);
    },
    on: function (eventName, listener) {
        notesManager.on("" + eventName, listener);
    },
    create: function (name) {
        return notesManager.createFile("" + name);
    },
    rename: function (file, name) {
        return notesManager.renameFile("" + file, "" + name);
    },
    load: function (file) {
        return notesManager.loadFile("" + file);
    },
    save: function (file, delta, text) {
        return notesManager.saveFile("" + file, delta, "" + text);
    },
    delete: function (file) {
        return notesManager.removeFile("" + file);
    },
    getFonts: function () {
        return fonts.slice();
    },
    waitForFonts: function (fn) {
        if (systemFonts !== null) {
            fn(fonts.slice());
        } else {
            waitingForFonts = fn;
        }
    },
    setSavingCallback: function(fn) {
        savingCallback = fn;
    },
};

let alreadyClosing = false;

ipcRenderer.on("closing", (e, arg) => {
    if (alreadyClosing) {
        return;
    }
    alreadyClosing = true;
    if (savingCallback) {
        var timeout = setTimeout(function () {
            ipcRenderer.send('closing-completed', 'timeout');
        }, 3000);
        try {
            savingCallback(function () {
                clearTimeout(timeout);
                ipcRenderer.send('closing-completed', 'saved');
            });
        } catch (ex) {
            ipcRenderer.send('closing-completed', 'error');
        }
    } else {
        ipcRenderer.send('closing-completed', 'no-callback');
    }
});

contextBridge.exposeInMainWorld("Notes", Notes);

// Fonts

fontList.getFonts()
    .then(fonts => {
        systemFonts = fonts;
        if (waitingForFonts) {
            waitingForFonts(fonts.slice());
        }
    })
    .catch(err => {
        systemFonts = [];
        if (waitingForFonts) {
            waitingForFonts(fonts.slice());
        }
    });

// Themes

let themeChangeCallback = null;

const Theme = {
    theme: "dark",
    onChange: function (fn) {
        themeChangeCallback = fn;
        fn(Theme.theme);
    },
};

ipcRenderer.on("theme", (e, arg) => {
    Theme.theme = arg;
    if (themeChangeCallback) {
        themeChangeCallback(arg);
    }
});

contextBridge.exposeInMainWorld("Theme", Theme);

// Search Trigger

let searchCallback = null;

const SearchTrigger = {
    handle: function (fn) {
        searchCallback = fn;
    },
};

ipcRenderer.on("search", (e, arg) => {
    if (searchCallback) {
        searchCallback(arg);
    }
});

contextBridge.exposeInMainWorld("SearchTrigger", SearchTrigger);

// Custom titlebar
require("./custom-titlebar");
