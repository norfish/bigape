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

    setPagelet: function(domID, chunk) {
        if(!this.pageletLength) {
            return;
        }

        this.pageletLength = this.pageletLength - 1;

        // 如果没有dom 数据或者没有 domID, 说明没有节点，那就没必要去做渲染
        // TODO: 对pagelet其他模式的兼容
        if(!this.dom || !domID) {
            return;
        }

        var $ = this.dom;
        var html = chunk.html || '';
        var script = '<script>BigPipe.onArrive('+ JSON.stringify(chunk) +')</script>';

        $('#' + domID).html(html || '');
        $('html').append(script);
    },

    getHtml: function() {
        if(this.pageletLength) {
            throw '部分模块尚未处理完成，请检查';
        }

        return this.dom.html();
    }

}

module.exports = HtmlParser;
