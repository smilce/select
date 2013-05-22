;;;(function (window,document){

    var


    document = window.document,
    location = window.location,

    push = Array.prototype.push,
    splice = Array.prototype.splice,
    slice = Array.prototype.slice,
    indexOf = Array.prototype.indexOf,

    toString = {}.toString,
    hasOwn = {}.hasOwnProperty;


	var lib = {};
    lib.event = {};
    lib.event.on = lib.on = function(el,ev,fn){
        el = lib.dom.g(el);
        el.addEventListener(ev, fn, false);
        return el;
    }

    lib.event.un = lib.un = function(el,ev,fn){
        el = lib.dom.g(el);
        el.removeEventListener(ev, fn, false);
        return el;
    }

    lib.dom = {};
    lib.dom.g = lib.g = function(el){               
        if(typeof el == "string") return document.getElementById(el);           
        return el;
    }
    lib.dom.getCurrentStyle = function(el,key){
      key = key.replace (/([A-Z])/g, "-$1");
      key = key.toLowerCase();
      return document.defaultView.getComputedStyle(el,null)[key];
    }
    lib.dom.show = lib.show = function(el){
        el = this.g(el);
        el.style.display="";
    }
    lib.dom.hide = lib.hide = function(el){
        el = this.g(el);
        el.style.display="none";
    }
    lib.dom.hasClass = function(dom,classname){
        dom = lib.g(dom);
        return dom.className.indexOf(classname) > -1 ? true : false;
    }
    lib.dom.toggleClass = function(dom,classname){
        dom = lib.g(dom);
        var names = dom.className;
        (!names) && (names = "");
        if(lib.dom.hasClass(dom,classname)){
            var n = names.split(" ");
            n.pop();
            dom.className = n.join(" ");
        }else{
            dom.setAttribute("className", (dom.getAttribute("className")||"") + " " + classname)
        }
    }
    lib.date = {};
    lib.date.getDate = function(count, date){
        /*var newDate = new Date(); 
        if(date){
            newDate.setDate(date.getDate()+count);
        }else{
            newDate.setDate(newDate.getDate()+count);
        }*/
        if(!date) date = new Date();
        var y,m,d;
            y = date.getFullYear();
            m = date.getMonth();
            d = date.getDate()+count;
            if(d == 0){
                d = 31;
                m = m - 1;
            }
        var newDate = new Date(y, m, d);

        return newDate;
    }
    lib.dom.scanParent = function(element, scaner){
        if (!element || !scaner) return;
        while (element) {
            if (scaner(element)) return true;
            element = element.parentNode;
        }
    }
    lib.dom.setStyle = function(dom,atrs){
        var text = "";
        lib.object.each(atrs,function(key,value){
            text = lib.array.toString(text,key,":",value,";");
        });
        dom.style.cssText = text;
    }
    lib.localData = {};
    lib.localData.getData = function(key){
        var data = window.localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
    lib.localData.setData = function(key, value){
        var data = window.localStorage.setItem(key, JSON.stringify(value));
    }
    lib.send = {};
    lib.send.ajax = function(url){
        var xhr = new XMLHttpRequest(); // note: IE never uses XHR (it supports true preloading), so no more need for ActiveXObject fallback for IE <= 7
        var promiseFn = [];
        var promise = {
            then: function(fn,context){
                promiseFn.push({
                    fn: fn,
                    context: context
                });
            }
        };
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                xhr.onreadystatechange = function(){}; // fix a memory leak in IE
                var data = JSON.parse(xhr.responseText);
                promiseFn.forEach(function(item){
                    item.fn.call(item.context, data);
                });
                promise = null;
                context = null;
                xhr = null;
                promiseFn = null;
            }
        };
        xhr.open("GET",url);
        xhr.send();
        return promise;
    }
    lib.send.jsonp = function(url,arg){
        var script = document.createElement("script");
        if(!arg.onlySend){
            var receiver = arg.receiver ? arg.receiver : "callback" + new Date().getTime().toString();
            var receiverFlag = arg.receiverFlag || "callback";
            var callback = arg.callback||null;
            window[receiver] = function(data){
                window[receiver] = null;
                callback&&callback(data);
            } 
            script.src = url+"&"+receiverFlag+"="+receiver;
        }else{
            script.src = url;
        }           
        
        script.onload = script.onreadystatechange = function() {
            if ((script.readyState && script.readyState != "complete" && script.readyState != "loaded")) return;
            script.onload = script.onreadystatechange = null;
            document.body.removeChild(script);
        };
        //homepage "http://suggestion.baidu.com/su?p=3&cb=getDate&wd=刘";
        //tieba http://tieba.baidu.com/sug?query=%E4%B9%B3&_=1368115379385&callback=getDate
        // zhidao http://nssug.baidu.com/su?wd=刘&prod=zhidao&t=1368115749867
        //image http://nssug.baidu.com/su?wd=1&ie=utf-8&prod=image&t=0.5681813715491444&callback=getDate
        // video http://nssug.baidu.com/su?wd=刘&prod=video_ala&oe=utf-8&t=0.49744463502429426
        // news http://nssug.baidu.com/su?wd=zhang'yi'mou&prod=news&t=1368280119775
        // map http://map.baidu.com/su?wd=%E9%BE%99&cid=131&type=0&newmap=1

        document.body.appendChild(script)
    }
    var GB2312UnicodeConverter = {
        ToUnicode: function (str) {
            return escape(str).toLocaleLowerCase().replace(/%u/gi, '\\u');
        }
        , ToGB2312: function (str) {
            return unescape(str.replace(/\\u/gi, '%u'));
        }
    };
    lib.type = {};
    lib.type.getType = function(c){
        var t = Object.prototype.toString.call(c);
        return t.substring(8,t.length -1).toLowerCase(); 
    }

    function each(obj, iterator, context){
        obj.forEach(iterator, context);
    }

    lib.array={};
    lib.array.each=function(obj, iterator, context){
        each(obj, iterator, context);
    }
    lib.array.toString=function(){
        return Array.prototype.slice.call(arguments).join("");
    }

    function Founder(arg){
        this.author = "小明有2个苹果";
        this.version = "0.0.0.0";
        this.web = (arg&&arg.web)||"http://www.smilce.com";

        this.init&&this.init();

    }
    Founder.prototype = {
        constructor: Founder
    }

    lib.object = {};
    lib.object.each = function(obj, iterator, context){
        for(var o in obj){
            iterator.call(context, o, obj[o]);
        }
    };
    lib.object.extend = function(obj){
        each(slice.call(arguments, 1),function(source){
            for(var prop in source){
                obj[prop] = source[prop];
            }
        }); 
        return obj;
    };
    lib.object.inherit = function (parent, context, protoProps){
        parent = parent || Founder;
        var child = function(){
            context.apply(this, arguments);
            parent.apply(this, arguments);
        }
        var empty = function(){this.constructor = child};
        empty.prototype = parent.prototype;
        child.prototype = new empty;

        if(protoProps) lib.object.extend(child.prototype, protoProps);

        child.__super__ = parent.prototype;

        return child;
    }

    lib.extend = {};
    lib.extend.components = {};
    lib.extend.addComponent = function(name, fn){
        lib.extend.components[name] = fn;
    }
    lib.extend.useComponent = function(name, args){
        return new lib.extend.components[name](args);
    }
    var path = 0;
    lib.uniquePath = function(prefix) {
        var id = path++;
        return prefix ? prefix + id : id;
    };

    window.lib = lib;

})(window);