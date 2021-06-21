// Window size and position Manager

"use strict";

const FS = require("fs");
const Homedir = require('os').homedir();
const Path = require('path');

/**
 * Window manager
 */
class WindowManager {
    constructor() {
        this.x = null;
        this.y = null;
        this.w = 1144;
        this.h = 600;
        this.maximized = false;

        this.saving = false;
        this.waitingForSave = false;


        this.mainPath = Path.resolve(Homedir, ".notesmngr");

        if (!FS.existsSync(this.mainPath)) {
            FS.mkdirSync(this.mainPath);
        }

        this.stateFile = Path.resolve(this.mainPath, "window.state");
    }

    load() {
        try {
            const savedOptions = JSON.parse(FS.readFileSync(this.stateFile).toString());

            this.x = savedOptions.x;
            this.y = savedOptions.y;
            this.w = savedOptions.w;
            this.h = savedOptions.h;

            this.maximized = !!savedOptions.maximized;
        } catch (ex) { }
    }

    getData() {
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            maximized: this.maximized,
        };
    }

    save() {
        if (this.saving) {
            this.waitingForSave = true;
            return;
        }
        this.saving = true;
        FS.writeFile(this.stateFile, JSON.stringify(this.getData()), function (err) {
            this.saving = false;
            if (this.waitingForSave) {
                this.waitingForSave = false;
                this.save();
            }
        }.bind(this));
    }

    setWindow(win) {
        win.on("maximize", function () {
            this.maximized = true;
            this.save();
        }.bind(this));

        win.on("unmaximize", function () {
            this.maximized = false;
            this.save();
        }.bind(this));

        win.on("move", function () {
            if (win.isMaximized()) return;
            const bounds = win.getBounds();
            this.x = bounds.x;
            this.y = bounds.y;
            this.save();
        }.bind(this));

        win.on("resize", function () {
            if (win.isMaximized()) return;
            const bounds = win.getBounds();
            this.w = bounds.width;
            this.h = bounds.height;
            this.save();
        }.bind(this));
    }
}

exports.WindowManager = WindowManager;
