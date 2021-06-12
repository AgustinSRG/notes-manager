// Editor 

let waitingForEditor = null;
let editorReady = false;

function editorIsReady() {
    editorReady = true;
    if (waitingForEditor) {
        waitingForEditor();
    }
}

window.waitForEditorReady = function (fn) {
    if (editorReady) {
        fn();
    } else {
        waitingForEditor = fn;
    }
};

Notes.waitForFonts(function (fonts) {

    let css = [];
    let favorites = [];
    const prefered = ["consolas", "roboto", "helvetica", "arial", "sans-serif"];

    const fontsData = fonts.map(function (a) {
        const name = ("" + a).replace(/\"/g, "");
        const id = name.toLowerCase().replace(/[\s]/, "-").replace(/[^a-z0-9\-]/gi, "");

        if (prefered.indexOf(id) >= 0) {
            favorites.push(id);
        }

        css.push("." + "ql-font-" + id + " { font-family: '" + escapeHTML(name) + "'; }");
        return {name: name, id: id}
    });

    favorites = favorites.sort((a, b) => {
        return prefered.indexOf(a) - prefered.indexOf(b);
    });

    let favFont = "";

    if (favorites.length > 0) {
        favFont = favorites[0];
    }

    const quillFontOptions = fontsData.map(a => {
        return '<option value="' + escapeHTML(a.id) + '"' + (favFont === a.id ? " selected=\"selected\"" : "") + '>' + escapeHTML(a.name) + '</option>';
    }).join("");

    document.getElementById("customFontsStyle").innerHTML = css.join("\n");

    const FontAttributor = Quill.import('formats/font');
    FontAttributor.whitelist = fontsData.map(a => a.id);
    Quill.register(FontAttributor, true);

    Vue.component("editor", {
        data: function () {
            return {
                loading: false,
                fileLoaded: "",
                dirty: false,
                saving: false,
                waitingForSave: [],
                notChosen: true,
                fonts: [],
            };
        },
        methods: {
            savePendingChanges: function (callback) {
                if (!this.dirty || !this.fileLoaded) {
                    callback();
                    if (this.waitingForSave.length > 0) {
                        const otherCallback = this.waitingForSave.shift();
                        this.savePendingChanges(otherCallback);
                    }
                    return;
                }
                if (this.saving) {
                    this.waitingForSave.push({ callback: callback });
                    return;
                }
                this.saving = true;
                this.dirty = false;
                Notes.save(this.fileLoaded, this.$options.quill.getContents(), this.$options.quill.getText()).then(function () {
                    this.saving = false;
                    callback();
                    if (this.waitingForSave.length > 0) {
                        const otherCallback = this.waitingForSave.shift();
                        this.savePendingChanges(otherCallback);
                    }
                }.bind(this)).catch(function (ex) {
                    this.saving = false;
                    console.error(ex);
                    callback();
                    if (this.waitingForSave.length > 0) {
                        const otherCallback = this.waitingForSave.shift();
                        this.savePendingChanges(otherCallback);
                    }
                }.bind(this));
            },
            clearEditor: function () {
                this.$options.quill.setContents({ ops: [] });
            },
            openNotes: function (id) {
                this.notChosen = false;
                this.loading = true;
                this.savePendingChanges(function () {
                    this.fileLoaded = id;
                    this.clearEditor();
                    Vue.nextTick(function () {
                        Notes.load(id).then(function (delta) {
                            if (this.fileLoaded !== id) {
                                return;
                            }
                            this.loading = false;
                            this.notChosen = false;
                            this.$options.quill.setContents(delta);
                            this.$options.quill.focus();
                        }.bind(this)).catch(function (err) {
                            if (this.fileLoaded !== id) {
                                return;
                            }
                            this.loading = false;
                            this.notChosen = true;
                        }.bind(this));
                    }.bind(this));
                }.bind(this))
            },
        },
        mounted: function () {
            this.$options.quill = new Quill(this.$el.querySelector('.editor-root'), {
                theme: 'snow',
                modules: {
                    toolbar: this.$el.querySelector('.editor-toolbar'),
                    history: {
                        delay: 2000,
                        maxStack: 500,
                        userOnly: true
                    },
                    imageDrop: true,
                },
            });
            this.$options.quill.on('text-change', function (delta, oldDelta, source) {
                if (source === 'user') {
                    this.dirty = true;
                }
            }.bind(this));
            setInterval(function () {
                this.savePendingChanges(function () {
                    // After save
                }.bind(this));
            }.bind(this), 2000);
            Notes.on("file-delete", function (id) {
                if (this.fileLoaded === id) {
                    this.loading = false;
                    this.notChosen = true;
                    this.fileLoaded = "";
                    this.clearEditor();
                }
            }.bind(this));
        },
        template: '' +
    
            '<div class="editor" v-bind:class="{\'disabled\': loading || notChosen}">' +
    
            // Toolbar
            '   <div class="editor-toolbar">' +
            '       <span class="ql-formats min-750">' +
            '           <select class="ql-font" data-tooltip="Font">' + quillFontOptions + '</select>' +
            '           <select class="ql-size" data-tooltip="Size"></select>' +
            '       </span>' +
            '       <span class="ql-formats">' +
            '           <button class="ql-bold" data-tooltip="Bold"></button>' +
            '           <button class="ql-italic" data-tooltip="Italic"></button>' +
            '           <button class="ql-underline" data-tooltip="Underline"></button>' +
            '           <button class="ql-strike" data-tooltip="Strikethrough"></button>' +
            '       </span>' +
            '       <span class="ql-formats min-850">' +
            '           <button class="ql-script" value="sub" data-tooltip="Subscript"></button>' +
            '           <button class="ql-script" value="super" data-tooltip="Superscript"></button>' +
            '       </span>' +
            '       <span class="ql-formats">' +
            '           <select class="ql-color" data-tooltip="Text color"></select>' +
            '           <select class="ql-background" data-tooltip="Blackground Color"></select>' +
            '       </span>' +
            '       <span class="ql-formats">' +
            '           <button class="ql-blockquote" data-tooltip="Quote"></button>' +
            '           <button class="ql-code-block" data-tooltip="Code Block"></button>' +
            '       </span>' +
            '       <span class="ql-formats">' +
            '           <button class="ql-indent" value="-1" data-tooltip="Reduce indent"></button>' +
            '           <button class="ql-indent" value="+1" data-tooltip="Increase indent"></button>' +
            '           <select class="ql-align" data-tooltip="Align"></select>' +
            '           <button class="ql-list" value="ordered" data-tooltip="Sorted list" data-tooltip-dir="left"></button>' +
            '           <button class="ql-list" value="bullet" data-tooltip="Unsorted list" data-tooltip-dir="left"></button>' +
            '       </span>' +
            '       <span class="ql-formats min-900">' +
            '           <button class="ql-image" data-tooltip="Image" data-tooltip-dir="left"></button>' +
            '           <button class="ql-video" data-tooltip="Video" data-tooltip-dir="left"></button>' +
            '       </span>' +
            '       <span class="ql-formats">' +
            '           <button class="ql-clean" data-tooltip="Remove all formats" data-tooltip-dir="left"></button>' +
            '       </span>' +
            '   </div>' +
    
            '<div class="editor-root"></div>' +
            '<div class="editor-loader" v-if="loading"><div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>' +
            '<div class="editor-not-chosen" v-if="notChosen">Select a note or create a new one to start.</div>' +
            '' +
    
            '</div>'
    });

    editorIsReady();
});
