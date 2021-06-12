// Modals

function merge(dest, obj) {
    for (let key of Object.keys(obj)) {
        dest[key] = obj[key];
    }
    return dest;
}

function modal(config) {
    const vueConf = {
        data: function () {
            const modalData = {
                visible: false,
                title: "Modal",
                footer: !!config.footer,
            };

            if (config.data) {
                const specData = config.data();
                merge(modalData, specData);
            }

            return modalData;
        },
        methods: merge({
            onContainerClick: function (e) {
                if (!this.static) {
                    this.close();
                }
            },
            onModalClick: function (e) {
                if (e) {
                    e.stopPropagation();
                }
            },
            close: function () {
                this.visible = false;
            },
            open: function () {
                this.visible = true;
                Vue.nextTick(function () {
                    this.$el.querySelector(".modal-focus")?.focus();
                }.bind(this));
            },
        }, config.methods || {}),
        mounted: config.mounted || function () { },
        beforeDestroy: config.beforeDestroy || function () { },
        props: ['static'].concat(config.props || []),
        template: '' +
            '<transition name="fade">' +
            '<div v-if="visible" class="modal-container" @mousedown="onContainerClick">' +

            ' <div class="modal" @mousedown="onModalClick">' +
            '     <div class="modal-header">' +
            '         <span class="modal-title">{{title}}</span>' +
            '         <button class="btn btn-right close-btn" data-tooltip="Close" @click="close"></button>' +
            '     </div>' +

            '     <div class="modal-body">' +
            (config.body || "") +
            '     </div>' +

            '     <div v-if="footer" class="modal-footer">' +
            (config.footer || "") +
            '     </div>' +

            ' </div>' +

            '</div>' +
            '</transition>'
    };
    return vueConf;
}

Vue.component("modal-add-file", modal({
    data: function () {
        return {
            busy: false,
            notesTitle: "",
            invalidNoTitle: false,
        };
    },
    methods: {
        show: function () {
            this.title = "Add notes";
            this.notesTitle = "";
            this.invalidNoTitle = false;
            this.open();
        },
        onTextInput: function () {
            this.invalidNoTitle = false;
        },
        submit: function (e) {
            if (e) {
                e.preventDefault();
            }
            if (!this.notesTitle) {
                this.invalidNoTitle = true;
                return;
            }
            this.busy = true;
            Notes.create(this.notesTitle).then(function (newId) {
                this.$emit("notes-create", newId);
                this.busy = false;
                this.close();
            }.bind(this)).catch(function (err) {
                this.busy = false;
                alert(err.message);
            }.bind(this))
        },
    },
    mounted: function () {

    },
    body: '<form @submit="submit">' +

        '   <div class="form-group">' +
        '       <label>Title:</label>' +
        '       <input type="text" v-model="notesTitle" placeholder="Input notes title..." class="form-control form-fill modal-focus" maxlength="80" @input="onTextInput">' +
        '       <span v-if="invalidNoTitle" class="invalid-feedback">Please, provide a title for your notes.</span>' +
        '   </div>' +

        '<input type="submit" style="display:none;">' +
        '</form>',
    footer: '' +
        '<button :disabled="busy" class="modal-btn modal-icon-btn add-btn-black" @click="submit">Add Notes</button>'
}));

Vue.component("modal-rename-file", modal({
    data: function () {
        return {
            notes: "",
            busy: false,
            notesTitle: "",
            invalidNoTitle: false,
        };
    },
    methods: {
        show: function (id, prevTitle) {
            this.notes = id;
            this.title = "Rename notes: " + prevTitle;
            this.notesTitle = prevTitle;
            this.invalidNoTitle = false;
            this.open();
        },
        onTextInput: function () {
            this.invalidNoTitle = false;
        },
        submit: function (e) {
            if (e) {
                e.preventDefault();
            }
            if (!this.notesTitle) {
                this.invalidNoTitle = true;
                return;
            }
            this.busy = true;
            Notes.rename(this.notes, this.notesTitle).then(function () {
                this.$emit("notes-rename", this.notes);
                this.busy = false;
                this.close();
            }.bind(this)).catch(function (err) {
                this.busy = false;
                alert(err.message);
            }.bind(this))
        },
    },
    mounted: function () {

    },
    body: '<form @submit="submit">' +

        '   <div class="form-group">' +
        '       <label>Title:</label>' +
        '       <input type="text" v-model="notesTitle" placeholder="Input notes title..." class="form-control form-fill modal-focus" maxlength="80" @input="onTextInput">' +
        '       <span v-if="invalidNoTitle" class="invalid-feedback">Please, provide a title for your notes.</span>' +
        '   </div>' +

        '<input type="submit" style="display:none;">' +
        '</form>',
    footer: '' +
        '<button :disabled="busy" class="modal-btn modal-icon-btn rename-btn-black" @click="submit">Rename</button>'
}));

Vue.component("modal-delete-file", modal({
    data: function () {
        return {
            notes: "",
            busy: false,
        };
    },
    methods: {
        show: function (id, prevTitle) {
            this.notes = id;
            this.title = "Delete notes: " + prevTitle;
            this.open();
        },
        submit: function (e) {
            if (e) {
                e.preventDefault();
            }
            this.busy = true;
            Notes.delete(this.notes).then(function () {
                this.$emit("notes-delete", this.notes);
                this.busy = false;
                this.close();
            }.bind(this)).catch(function (err) {
                this.busy = false;
                alert(err.message);
            }.bind(this))
        },
    },
    mounted: function () {

    },
    body: '<span>Are you sure you want to delete these notes? This action cannot be undone.</span>',
    footer: '' +
        '<button :disabled="busy" class="modal-btn modal-icon-btn close-btn-black" @click="close">No, Keep</button>' +
        '<button :disabled="busy" class="modal-btn modal-icon-btn delete-btn-black" @click="submit">Yes, Delete</button>'
}));
