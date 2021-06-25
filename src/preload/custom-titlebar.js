// Custom titlebar 

"use strict";

const { contextBridge, ipcRenderer } = require('electron');
const customTitlebar = require('custom-electron-titlebar');

let titlebar = null;
let theme = "dark";

const DARK_COLOR = "#37474f";
const LIGHT_COLOR = "#fefefe";

window.addEventListener('DOMContentLoaded', () => {
    titlebar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex(theme === "light" ? LIGHT_COLOR : DARK_COLOR),
        icon: 'images/icon.png',
    });
});

ipcRenderer.on("theme", (e, arg) => {
    theme = arg;
    if (!titlebar) {
        return;
    }
    if (arg === "light") {
        titlebar.updateBackground(customTitlebar.Color.fromHex(LIGHT_COLOR));
    } else {
        titlebar.updateBackground(customTitlebar.Color.fromHex(DARK_COLOR));
    }
});

