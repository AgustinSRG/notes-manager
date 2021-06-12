// Main preload script

const { contextBridge } = require('electron');
const fontList = require('font-list');

// Require custom titlebar
require("./custom-titlebar");


// Notes Manager

const { NotesManager } = require('./notes');

const notesManager = NotesManager.getInstance();

let systemFonts = null;
let waitingForFonts = null;

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
};

contextBridge.exposeInMainWorld("Notes", Notes);


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
