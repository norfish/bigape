;(function(window){
    var _data = {};

    console = console || {
        log: function(){},
        warn: function(){}
    };

    var createEvent = document.createEvent
        ? function(name, data){
        event = document.createEvent("HTMLEvents");
        event.initEvent(name, true, true);
        event.detail = data;
        return event;
    }
        : function(name, data){
        event = document.createEventObject();
        event.eventType = name;
        event.detail = data;
        return event;
    };

    var triggerEvent = document.createEvent
        ? function(element, event){
        element.dispatchEvent(event);
    }
        : function(element, event){
        element.fireEvent('on' + event.eventType, event);
    };

    function trigger(name, data){
        var eve = createEvent(name, data);
        triggerEvent(document, eve);
    }

    function removeClass(dom, cls) {
        if(!dom) return;
        dom.classList.remove(cls);
        // var domCls = dom.className;
        // cls = cls.split(/\s+/);
        // cls.map(function(clsItem){
        //     clsItem && (domCls = domCls.replace(clsItem, ''));
        // });
        // dom.className = domCls;
    }

    function addClass(dom, cls) {
        if(!dom) return;
        dom.classList.add(cls);
    }

    function replaceDom(dom, html) {
        if(!dom) return;
        var parentNode = dom.parentNode;
        if(!parentNode) {
            return;
        };

        var fragement = document.createDocumentFragment();
        var tmp = document.createElement('div');

        tmp.innerHTML = html;
        fragement.appendChild(tmp);

        parentNode.replaceChild(fragement, dom);
    }

    window.BigPipe = {
        setData : function(key, value, eventName){
            eventName = (eventName || key) + '-data-ready';
            _data[key] = value;
            trigger(eventName, value);
        },

        getData : function(key){
            return key ? _data[key] : _data
        },

        onArrive : function(options){
            var domID = options.domID,
                dom = null,
                html = options.html,
                scripts = options.scripts,
                styles = options.styles,
                data = options.data,
                i = 0,
                len = 0,
                tmpEle,
                mode = options.mode,
                doc = document.body,
                dataEventName = options.dataEventName,
                pageletEventName = options.pageletEventName || domID;

            trigger('arrive', options);

            dom = document.getElementById(domID);

            if(html){
                if(dom){
                    switch (mode) {
                        case 'append':
                            dom.innerHTML += html;
                            break;
                        case 'remove':
                            dom.innerHTML = '';
                            break;
                        case 'removeDom':
                            addClass(dom, 'hide');
                            break;
                        case 'replace':
                            replaceDom(dom, html);
                            break;
                        case 'html':
                        default:
                            dom.innerHTML = html;
                            break;
                    }
                } else if(mode === 'layout') {
                    doc.innerHTML += html;
                } else {
                    console.warn('element #' + domID + ' does not exists.');
                }
            }

            if(data){
                // console.log(options, options.dataKey, options.modID);
                this.setData(options.dataKey || options.modID, data, dataEventName);
            }

            for(i = 0, len = styles.length; i < len; i++){
                tmpEle = document.createElement('link');
                tmpEle.type = 'text/css';
                tmpEle.rel = 'stylesheet';
                tmpEle.href = styles[i];
                document.head.appendChild(tmpEle)//.parentNode.removeChild(tmpEle)
            }

            for(i = 0, len = scripts.length; i < len; i++){
                tmpEle = document.createElement('script');
                tmpEle.type = 'text/javascript';
                tmpEle.src = scripts[i];
                document.head.appendChild(tmpEle)//.parentNode.removeChild(tmpEle)
            }

            trigger(pageletEventName + '-ready');
        }
    };
})(window);
