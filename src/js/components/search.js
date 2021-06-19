// Quill searcher

const Inline = Quill.import('blots/inline');

class SearchedStringCurrentBlot extends Inline {
}

SearchedStringCurrentBlot.blotName = 'SearchedStringCurrent';
SearchedStringCurrentBlot.className = 'ql-searched-string-current';
SearchedStringCurrentBlot.tagName = 'div';

Quill.register(SearchedStringCurrentBlot);

class SearchedStringBlot extends Inline {
}

SearchedStringBlot.blotName = 'SearchedString';
SearchedStringBlot.className = 'ql-searched-string';
SearchedStringBlot.tagName = 'div';

Quill.register(SearchedStringBlot);

function getIndicesOf(str, searchStr) {
    let searchStrLen = searchStr.length;
    let startIndex = 0,
        index,
        indices = [];
    while ((index = str.toLowerCase().indexOf(searchStr.toLowerCase(), startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
};

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function findAll(str, re, mod) {
    try {
        var regexp = new RegExp(re, mod);
        var res = [];

        while ((match = regexp.exec(str)) != null) {
            if (!match[0]) {
                break;
            }
            res.push({ val: match[0], i: match.index });
        }

        return res;
    } catch (ex) {
        return [];
    }
}

Vue.component("searcher", {
    data: function () {
        return {
            searchingFor: "",
            replaceFor: "",
            resultsText: "No results",
            expanded: false,
            display: false,
            matchCase: false,
            strictWord: false,
            regExp: false,

            rIndex: 0,
            resultsLength: 0,
            replacing: false,
        };
    },
    methods: {
        setQuill: function (quill) {
            this.$options.quill = quill;
        },
        expand: function (e) {
            e.stopPropagation();
            this.expanded = !this.expanded;
        },
        updateSearch: function () {
            if (this.replacing) {
                return;
            }
            if (this.display) {
                this.search();
            } else {
                this.removeStyle();
            }
        },
        searchKeyUp: function (e) {
            switch (e.key) {
                case "ArrowDown":
                case "Enter":
                    e.preventDefault();
                    this.goNext();
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    this.goPrev();
                    break;

            }
        },
        replaceKeyUp: function (e) {

        },
        search: function () {
            this.removeStyle();
            var quill = this.$options.quill;
            if (this.searchingFor) {
                var totalText = quill.getText();
                var re = escapeRegExp(this.searchingFor);
                var mod = "g";

                if (!this.matchCase) {
                    mod += "i";
                }

                if (this.strictWord) {
                    re = "(^|\\s)(" + re + ")(\\s|$)";
                }

                if (this.regExp) {
                    re = this.searchingFor;
                }

                var results = findAll(totalText, re, mod);

                if (this.rIndex >= results.length) {
                    this.rIndex = 0;
                }

                results.forEach(function (r, i) {
                    if (i === this.rIndex) {
                        quill.formatText(r.i, r.val.length, "SearchedStringCurrent", true);
                    } else {
                        quill.formatText(r.i, r.val.length, "SearchedString", true);
                    }
                }.bind(this));

                this.$options.results = results;
                this.resultsLength = results.length;
            } else {
                this.rIndex = 0;
                this.$options.results = [];
                this.resultsLength = 0;
            }
            this.updateResultsText();
            this.updateScroll();
        },
        changeSearchCurrent: function (rPrev, rNow) {
            var quill = this.$options.quill;
            quill.formatText(rPrev.i, rPrev.val.length, "SearchedStringCurrent", false);
            quill.formatText(rPrev.i, rPrev.val.length, "SearchedString", true);

            quill.formatText(rNow.i, rNow.val.length, "SearchedString", false);
            quill.formatText(rNow.i, rNow.val.length, "SearchedStringCurrent", true);
        },
        goNext: function () {
            if (this.resultsLength === 0) {
                return;
            }
            if (this.rIndex >= this.resultsLength - 1) {
                this.changeSearchCurrent(this.$options.results[this.rIndex], this.$options.results[0])
                this.rIndex = 0;
            } else {
                this.changeSearchCurrent(this.$options.results[this.rIndex], this.$options.results[this.rIndex + 1])
                this.rIndex++;
            }
            this.updateResultsText();
            this.updateScroll();
        },
        goPrev: function () {
            if (this.resultsLength === 0) {
                return;
            }
            if (this.rIndex <= 0) {
                this.changeSearchCurrent(this.$options.results[this.rIndex], this.$options.results[this.resultsLength - 1])
                this.rIndex = this.resultsLength - 1;
            } else {
                this.changeSearchCurrent(this.$options.results[this.rIndex], this.$options.results[this.rIndex - 1])
                this.rIndex--;
            }
            this.updateResultsText();
            this.updateScroll();
        },
        updateResultsText: function () {
            if (this.resultsLength === 0) {
                this.resultsText = "No results";
            } else {
                this.resultsText = (this.rIndex + 1) + " of " + this.resultsLength;
            }
        },
        updateScroll: function () {
            Vue.nextTick(function () {
                var el = document.querySelector(".ql-searched-string-current");

                if (el) {
                    el.scrollIntoView();
                }
            });
        },
        replace: function () {
            if (this.resultsLength === 0) {
                return;
            }

            var quill = this.$options.quill;
            var result = this.$options.results[this.rIndex];

            this.replacing = true;

            quill.deleteText(result.i, result.val.length, "user");
            quill.insertText(result.i, this.replaceFor, "user");

            this.replacing = false;

            this.updateSearch();
        },
        replaceAll: function () {
            var quill = this.$options.quill;
            var replaceFor = this.replaceFor;

            this.replacing = true;

            this.$options.results.forEach(function (result) {
                quill.deleteText(result.i, result.val.length, "user");
                quill.insertText(result.i, replaceFor, "user");
            });

            this.replacing = false;

            this.updateSearch();
        },
        close: function () {
            this.display = false;
            this.removeStyle();
        },
        open: function () {
            this.display = true;
            Vue.nextTick(function () {this.$el.querySelector(".searcher-input-search").focus();}.bind(this));
            this.search();
        },
        toggle: function () {
            this.display = !this.display;
            if (this.display) {
                this.search();
                Vue.nextTick(function () {this.$el.querySelector(".searcher-input-search").focus();}.bind(this));
            }
        },
        removeStyle: function () {
            this.$options.quill.formatText(0, this.$options.quill.getText().length, 'SearchedString', false);
            this.$options.quill.formatText(0, this.$options.quill.getText().length, 'SearchedStringCurrent', false);
        },
        init: function () {
            this.search();
        },
        tMatchCase: function () {
            this.matchCase = !this.matchCase;
            this.search();
        },
        tStrictWord: function () {
            this.strictWord = !this.strictWord;
            this.search();
        },
        tRegExp: function () {
            this.regExp = !this.regExp;
            this.search();
        },
    },
    mounted: function () {

    },
    template: '' +
        '<div class="searcher" v-show="display">' +

        '   <div class="searcher-expander" @click="expand">' +
        '       <button v-if="!expanded" class="btn btn-right expand-btn" data-tooltip="Search and Replace" @click="expand"></button>' +
        '       <button v-if="expanded" class="btn btn-right expand-less-btn" data-tooltip="Search Only" @click="expand"></button>' +
        '   </div>' +


        '   <div class="searcher-inputs">' +
        '       <input type="text" class="searcher-input-search" placeholder="Search..." v-model="searchingFor" v-on:input="updateSearch" v-on:keyup="searchKeyUp" />' +
        '       <input v-if="expanded" type="text" class="searcher-input-replace" placeholder="Replace..." v-model="replaceFor" v-on:keyup="replaceKeyUp" />' +
        '   </div>' +

        '   <div class="searcher-buttons">' +
        '       <div class="searcher-buttons-search">' +

        '       <span class="searcher-results-count" :class="{\'error-search-count\': !!searchingFor && resultsLength === 0}">{{resultsText}}</span>' +

        '       <button :disabled="resultsLength === 0" class="btn btn-right up-btn" data-tooltip="Previous" @click="goPrev"></button>' +

        '       <button :disabled="resultsLength === 0" class="btn btn-right down-btn" data-tooltip="Next" @click="goNext"></button>' +

        '       <button class="btn btn-right match-case-btn" :class="{\'search-option-selected\': matchCase}" data-tooltip="Match case" @click="tMatchCase"></button>' +
        '       <button class="btn btn-right strict-word-btn" :class="{\'search-option-selected\': strictWord}" data-tooltip="Strict word" @click="tStrictWord"></button>' +
        '       <button class="btn btn-right regexp-btn" :class="{\'search-option-selected\': regExp}" data-tooltip="Regular expression" @click="tRegExp"></button>' +

        '       <button class="btn btn-right close-btn" data-tooltip="Close" @click="close"></button>' +


        '       </div>' +
        '       <div v-if="expanded" class="searcher-buttons-replace">' +

        '       <button class="btn btn-right replace-btn" data-tooltip="Replace" @click="replace"></button>' +
        '       <button class="btn btn-right replace-all-btn" data-tooltip="Replace all" @click="replaceAll"></button>' +


        '       </div>' +
        '   </div>' +

        '</div>'
});

