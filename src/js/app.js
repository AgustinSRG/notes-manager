// Interface main script

window.addEventListener('DOMContentLoaded', () => {
    // Declare main component
    waitForEditorReady(function () {
        Vue.component("main-container", {
            data: function () {
                return {

                };
            },
            methods: {
                onFileOpen: function (id) {
                    this.$refs.editor.openNotes(id);
                },
                onFileCreated: function (id) {
                    this.$refs.sidebar.selectNotes(id);
                },
                openAddModal: function () {
                    this.$refs.modalAddFile.show();
                },
                openRenameModal: function (id, title) {
                    this.$refs.modalRenameFile.show(id, title);
                },
                openDeleteModal: function (id, title) {
                    this.$refs.modalDeleteFile.show(id, title);
                },
            },
            mounted: function () {

            },
            template: ''

                + '<div class="main-container">'

                + '<editor ref="editor"></editor>'
                + '<sidebar ref="sidebar" @notes-selected="onFileOpen" @notes-rename="openRenameModal" @notes-delete="openDeleteModal" @click-add="openAddModal"></sidebar>'

                + '<modal-add-file ref="modalAddFile" @notes-create="onFileCreated"></modal-add-file>'

                + '<modal-rename-file ref="modalRenameFile"></modal-rename-file>'

                + '<modal-delete-file ref="modalDeleteFile"></modal-delete-file>'

                + '</div>'
        });

        //  Instanciate application
        const app = new Vue({
            el: "#app",
            data: function () {
                return {

                };
            },
            methods: {

            },
            mounted: function () {
                Notes.init();
            },
        });

        window.App = app;

        Theme.onChange(function (theme) {
            if (theme === "light") {
                document.querySelector("body").classList.add("light-theme");
            } else {
                document.querySelector("body").classList.remove("light-theme");
            }
        });
    });
});
