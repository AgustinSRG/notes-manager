// Utils

window.escapeHTML = function escapeHTML(html) {
    return ("" + html).replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

window.generateSearchHighlights = function (text, query, cls) {
    if (!query) {
        return escapeHTML(text);
    }
    var result = "";
    var tmp = text;
    var queryLowerCase = query.toLowerCase();
    while (tmp.length > 0) {
        var i = tmp.toLowerCase().indexOf(queryLowerCase);
        if (i === -1) {
            result += escapeHTML(tmp);
            tmp = "";
        } else {
            var preQuery = tmp.substr(0, i);
            var q = tmp.substr(i, query.length);
            tmp = tmp.substr(i + query.length);
            result += escapeHTML(preQuery) + '<b class="' + (cls || "shl") + '">' + escapeHTML(q) + '</b>';
        }
    }
    return result;
};
