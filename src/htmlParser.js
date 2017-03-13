/**
 * render static html at server side
 */


var cheerio = require('cheerio')

var HtmlParser = function(pageletLength) {
    if(!(this instanceof HtmlParser)) {
        return new HtmlParser(pageletLength);
    }

    this.dom = null;
    this.pageletLength = pageletLength;
    return this;
};

HtmlParser.prototype = {
    setLayout: function(html) {
        this.dom = cheerio.load(html, {
            decodeEntities: false
        });
    },

    setPagelet: function(domID, html) {
        if(!this.dom || !domID) {
            return;
        }

        if(!this.pageletLength) {
            return;
        }

        this.pageletLength = this.pageletLength - 1;

        var $ = this.dom;
        $('#' + domID).html(html || '');
    },

    getHtml: function() {
        if(this.pageletLength) {
            throw '部分模块尚未处理完成，请检查';
        }

        return this.dom.html();
    }

}

module.exports = HtmlParser;
