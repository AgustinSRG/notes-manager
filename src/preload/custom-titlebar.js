const customTitlebar = require('custom-electron-titlebar');

window.addEventListener('DOMContentLoaded', () => {
    new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#37474f'),
        titleHorizontalAlignment: "left",
        icon: 'images/icon.png',
    });
});