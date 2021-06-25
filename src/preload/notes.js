// Notes manager

"use strict";

const Homedir = require('os').homedir();
const FS = require('fs');
const Path = require('path');
const Chokidar = require('chokidar');
const EventEmitter = require('events');

/**
 * Notes manager class
 */
class NotesManager extends EventEmitter {

    static getInstance() {
        return new NotesManager(Path.resolve(Homedir, ".notesmngr"));
    }

    constructor(dir) {
        super();
        this.files = new Map();
        this.initialized = false;
        this.waitingForInit = [];
        this.listeners = [];
        this.mainPath = dir;
        this.metaPath = Path.resolve(dir, "meta");
        this.dataPath = Path.resolve(dir, "notes");

        // Make sure path exists

        if (!FS.existsSync(this.mainPath)) {
            FS.mkdirSync(this.mainPath);
        }

        if (!FS.existsSync(this.metaPath)) {
            FS.mkdirSync(this.metaPath);
        }

        if (!FS.existsSync(this.dataPath)) {
            FS.mkdirSync(this.dataPath);
        }
    }

    async init() {
        // Load files
        const files = await this.initialDetectFiles();

        // Load metadata of each file
        for (let file of files) {
            await this.onFileAdded(file, true);
        }

        // Watch for changes
        this.watcher = Chokidar.watch(this.dataPath);
        this.watcher.on("add", function (path) {
            this.onFileAdded(Path.basename(path));
        }.bind(this));
        this.watcher.on("change", function (path) {
            this.onFileChanged(Path.basename(path));
        }.bind(this));
        this.watcher.on("unlink", function (path) {
            this.onFileRemoved(Path.basename(path));
        }.bind(this));

        this.initialized = true;
        this.waitingForInit.forEach(function (fn) {
            fn(JSON.stringify(this.getFiles()));
        }.bind(this));
        this.waitingForInit = [];
    }

    async initialDetectFiles() {
        return new Promise(function (resolve, reject) {
            FS.readdir(this.dataPath, function (err, files) {
                if (err) {
                    return reject(err);
                }
                resolve(files.filter(v => v.endsWith(".notes")));
            });
        }.bind(this));
    }

    getFiles() {
        const res = [];
        this.files.forEach((value, key) => {
            res.push({ id: key, meta: value });
        });
        return res;
    }

    onceLoaded(fn) {
        if (this.initialized) {
            fn(JSON.stringify(this.getFiles()));
        } else {
            this.waitingForInit.push(fn);
        }
    }

    async onFileAdded(file, noevent) {
        if (!file.endsWith(".notes")) return;
        if (this.files.has(file)) return;
        const meta = await this.loadFileMetadata(file);
        this.files.set(file, meta);
        if (!noevent) {
            this.emit("file-add", file, meta);
        }
    }

    async onFileChanged(file) {
        if (!file.endsWith(".notes")) return;
        if (!this.files.has(file)) return;
        const meta = await this.loadFileMetadata(file);
        this.files.set(file, meta);
        this.emit("file-change", file, meta);
    }

    async onFileRemoved(file) {
        if (!file.endsWith(".notes")) return;
        if (!this.files.has(file)) return;
        this.files.delete(file);
        this.emit("file-delete", file);
    }

    async loadFileMetadata(file) {
        return new Promise(async function (resolve) {
            FS.readFile(Path.resolve(this.metaPath, file), { encoding: "utf8" }, function (error, data) {
                if (error) {
                    return resolve({ lines: -1, words: -1, characters: -1, lastModified: -1 });
                }
                try {
                    const meta = JSON.parse(data.toString());
                    return resolve({
                        name: "" + meta.name,
                        lines: parseInt(meta.lines, 10),
                        words: parseInt(meta.words, 10),
                        characters: parseInt(meta.characters, 10),
                        lastModified: parseInt(meta.lastModified, 10),
                    });
                } catch (ex) {
                    return resolve({ lines: -1, words: -1, characters: -1, lastModified: -1 });
                }
            })
        }.bind(this));
    }

    async saveFileMetadata(file, metaData) {
        return new Promise(async function (resolve, reject) {
            FS.writeFile(Path.resolve(this.metaPath, file), JSON.stringify(metaData), function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        }.bind(this));
    }

    loadFile(file) {
        return new Promise(async function (resolve, reject) {
            if (!this.files.has(file)) {
                const error = new Error("File not found");
                error.code = "ERR_NOT_FOUND";
                return reject(error);
            }
            FS.readFile(Path.resolve(this.dataPath, file), { encoding: "utf8" }, function (error, data) {
                if (error) {
                    const error = new Error("File not found");
                    error.code = "ERR_NOT_FOUND";
                    return reject(error);
                }
                try {
                    const delta = JSON.parse(data.toString());
                    return resolve(delta);
                } catch (ex) {
                    return resolve({ ops: [] });
                }
            })
        }.bind(this));
    }

    async createFile(name) {
        let id = (name + "").replace(/\s/g, "_").toLowerCase().replace(/[^a-z0-9_]/gi, "");

        if (!id) {
            id = "file";
        }

        let originalId = id;
        let i = 1;

        while (this.files.has(id + ".notes")) {
            id = originalId + "_" + i;
            i++;
        }

        id = id + ".notes";

        const meta = {
            name: name,
            lines: 0,
            words: 0,
            characters: 0,
            lastModified: Date.now(),
        };

        this.files.set(id, meta);
        const realMeta = await this.saveFile(id, { ops: [] }, "");
        this.emit("file-add", id, realMeta);
        return id;
    }

    renameFile(file, name) {
        return new Promise(async function (resolve, reject) {
            if (!this.files.has(file)) {
                const error = new Error("File not found");
                error.code = "ERR_NOT_FOUND";
                return reject(error);
            }

            const oldMeta = this.files.get(file);

            // File metadata

            const meta = {
                name: name,
                lines: oldMeta.lines,
                words: oldMeta.words,
                characters: oldMeta.characters,
                lastModified: Date.now(),
            };

            try {
                await this.saveFileMetadata(file, meta);
            } catch (ex) {
                return reject(ex);
            }

            this.files.set(file, meta);

            this.emit("file-change", file, meta);

            resolve();
        }.bind(this));
    }

    saveFile(file, delta, text) {
        return new Promise(async function (resolve, reject) {
            if (!this.files.has(file)) {
                const error = new Error("File not found");
                error.code = "ERR_NOT_FOUND";
                return reject(error);
            }

            const name = this.files.get(file).name;

            // File metadata

            const meta = {
                name: name,
                lines: Math.max(0, text.split("\n").length - 1),
                words: text.split(/[\s\t\n]/gi).filter(a => !!a.trim()).length,
                characters: Math.max(0, text.length - 1),
                lastModified: Date.now(),
            };

            try {
                await this.saveFileMetadata(file, meta);
            } catch (ex) {
                return reject(ex);
            }

            // Write data

            FS.writeFile(Path.resolve(this.dataPath, file), JSON.stringify(delta), function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(meta);
            });
        }.bind(this));
    }

    removeFile(file) {
        return new Promise(async function (resolve, reject) {
            if (!this.files.has(file)) {
                return resolve(); // Already deleted
            }

            FS.unlink(Path.resolve(this.metaPath, file), function () {
                FS.unlink(Path.resolve(this.dataPath, file), function () {
                    resolve();
                });
            }.bind(this));
        }.bind(this));
    }
}

exports.NotesManager = NotesManager;
