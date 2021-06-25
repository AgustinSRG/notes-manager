// Vue sidebar compoent

function renderDateTime (date) {
    if (!date) return "-";
    if (typeof date === "string" || typeof date === "number") {
        date = new Date(date);
    }
    if (date.iso) {
        date = new Date(date.iso);
    }
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var templ = "{m} {d}, {y} {hh}:{mm}:{ss}";
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    m = m - 1;
    if (m < 0) {
        m = 0;
    } else if (m > months.length) {
        m = months.length - 1;
    }
    var hh = "" + date.getHours()
    var mm = "" + date.getMinutes();
    var ss = "" + date.getSeconds();

    if (hh.length < 2) {
        hh = "0" + hh;
    }

    if (mm.length < 2) {
        mm = "0" + mm;
    }

    if (ss.length < 2) {
        ss = "0" + ss;
    }

    return ("" + templ).replace("{m}", months[m]).replace("{d}", d).replace("{y}", y).replace("{hh}", hh).replace("{mm}", mm).replace("{ss}", ss);
}

Vue.component("sidebar", {
    data: function () {
        return {
            searchingFor: "",
            notes: [],
            allNotes: [],
            loading: true,
            selectedNotes: "",
            now: Date.now(),
        };
    },
    methods: {
        onAdd: function () {
            this.$emit("click-add", "sidebar");
        },
        updateSearch: function () {
            this.notes = this.allNotes.filter(function (note) {
                if (!this.searchingFor) {
                    return true;
                }
                return note.meta.name.toLowerCase().indexOf(this.searchingFor.toLowerCase()) >= 0;
            }.bind(this)).sort((a, b) => {
                if (a.meta.lastModified > b.meta.lastModified) {
                    return -1;
                } else if (a.meta.lastModified < b.meta.lastModified) {
                    return 1;
                } else {
                    return 0;
                }
            });
        },
        clearSearch: function () {
            this.searchingFor = "";
            this.updateSearch();
        },
        findNotesName: function (id) {
            var found = this.allNotes.filter(function (note) {
                return note.id === id;
            })[0];
            if (found) {
                return found.meta.name;
            } else {
                return "";
            }
        },
        selectNotes: function (id) {
            this.selectedNotes = id;
            this.$emit("notes-selected", id);
            this.updateTitleBar();
        },
        updateTitleBar: function () {
            var name = this.findNotesName(this.selectedNotes);
            if (name) {
                TitleBar.changeTitle(name + ": " + "Notes Manager");
            } else {
                TitleBar.changeTitle("Notes Manager");
            }
        },
        onNotesClick: function (id) {
            this.selectNotes(id);
        },
        onRename: function (event, id, title) {
            event.stopPropagation();
            this.$emit("notes-rename", id, title);
        },
        onDelete: function (event, id, title) {
            event.stopPropagation();
            this.$emit("notes-delete", id, title);
        },
        renderStat: function (n) {
            if (n >= 0) {
                return "" + n;
            } else {
                return "?";
            }
        },
        renderLast: function (timestamp, now) {
            const diff = Date.now() - timestamp;
            if (diff < 2000) {
                return "Just now.";
            }
            if (diff < 60000) {
                // Seconds
                const sec = Math.floor(diff / 1000);
                return "" + sec + " " + (sec === 1 ? "second" : "seconds") + " ago.";
            } else if (diff < 3600000) {
                // Minutes
                const min = Math.floor(diff / 60000);
                return "" + min + " " + (min === 1 ? "minute" : "minutes") + " ago.";
            } else if (diff < 86400000) {
                // Hours
                const hours = Math.floor(diff / 3600000);
                return "" + hours + " " + (hours === 1 ? "hour" : "hours") + " ago.";
            } else {
                // Just the date
                return renderDateTime(timestamp);
            }
        },
        renderName: function (name) {
            return generateSearchHighlights("" + name, "" + this.searchingFor);
        },
    },
    mounted: function () {
        Notes.onceInitialized(function (allNotes) {
            this.allNotes = JSON.parse(allNotes);
            Notes.on("file-add", function (id, meta) {
                this.allNotes.push({
                    id: id,
                    meta: meta,
                });
                this.updateSearch();
            }.bind(this));
    
            Notes.on("file-change", function (id, meta) {
                this.allNotes.forEach(element => {
                    if (element.id === id) {
                        element.meta = meta;
                    }
                });
                this.updateSearch();
                this.updateTitleBar();
            }.bind(this));
    
            Notes.on("file-delete", function (id) {
                this.allNotes = this.allNotes.filter((n) => (n.id !== id));
                
                this.updateSearch();

                if (this.selectedNotes === id) {
                    this.selectedNotes = "";
                    this.updateTitleBar();
                    Vue.nextTick(function () {
                        if (!this.selectedNotes && this.notes.length > 0) {
                            this.selectNotes(this.notes[0].id);
                        }
                    }.bind(this));
                }
            }.bind(this));
    
            this.updateSearch();
            this.loading = false;

            if (this.notes.length > 0) {
                this.selectNotes(this.notes[0].id);
            }

            if (this.allNotes.length === 0) {
                Notes.create("Notes").then(function (newId) {
                    this.selectNotes(newId);
                }.bind(this)).catch(function (err) {
                    console.error(err);
                }.bind(this));
            }
        }.bind(this));
        setInterval(function () {
            this.now = Date.now();
        }.bind(this), 5000);
    },
    template: '' +
        '<div class="sidebar">' +

        '   <div class="sidebar-head" v-bind:class="{\'disabled\': loading}">' +
        '       <input type="text" class="search-input" placeholder="Search..." v-model="searchingFor" v-on:input="updateSearch" />' +
        '       <button class="btn btn-right close-btn" v-bind:class="{\'hidden\': !searchingFor}" data-tooltip="Clear search" @click="clearSearch"></button>' +
        '       <button class="btn btn-right add-btn" data-tooltip="Add notes" @click="onAdd"></button>' +
        '   </div>' +


        '   <div class="sidebar-list" v-if="!loading">' +
        '       <div class="sidebar-item" v-bind:class="{\'selected\': selectedNotes === note.id}" v-for="note in notes" @click="onNotesClick(note.id)">' +
        '           <span class="sidebar-item-name" v-html="renderName(note.meta.name)"></span>' +
        '           <button class="btn btn-right rename-btn" data-tooltip="Rename" @click="onRename($event, note.id, note.meta.name)"></button>' +
        '           <button class="btn btn-right delete-btn" data-tooltip="Delete" @click="onDelete($event, note.id, note.meta.name)"></button>' +
        '           <span class="sidebar-item-lines">{{renderStat(note.meta.lines)}} lines, {{renderStat(note.meta.words)}} words, {{renderStat(note.meta.characters)}} characters</span>' +
        '           <span class="sidebar-item-last-edit">Last Edit: {{renderLast(note.meta.lastModified, now)}}</span>' +
        '       </div>' +
        '       <div class="sidebar-noitems" v-if="notes.length === 0">No notes found.</div>' +
        '   </div>' +
        '   <div class="sidebar-loader" v-if="loading"><div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>' +

        '   <div class="sidebar-min"><button class="btn btn-right menu-btn"></button></div>' +

        '</div>'
});
