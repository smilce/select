;;;(function (window,undefiend){

	//the ancester of all Class,providing the all base's methods and events
	var Events = {
		//register a fn or some fns to an event, an event can bind some fns
		addListener: function(ev,fn,context){
			//alert(typeof fn);
			//alert(Object.prototype.toString.call(fn));
			//alert(fn instanceof Function);
			this.events = this.events || {};
			this.events[ev] = this.events[ev] || [];
            this.events[ev].push({
            	fn: fn,
            	context: context||this
            });
        },
        excuteEv: function(ev,args){
            var that = this;
            if(that.events[ev]){
                for(var i=0,f;f=that.events[ev][i];i++){
                    f.fn.apply(f.context,args);
                }
            }
        }
	}	

	var s = lib.object.inherit(null,function(arg){
		arg = arg||{};
		this.parent = arg.parent||document.body;
		this._getData = arg.getData;
		this.formatData = arg.formatData||null;
        this.current = null;
        this._list  = [];
        this.item = [];
        this.hasShow = false;
        this.currentInput = arg.currentInput||null;
        this._autocomplete = arg.autocomplete === false ? false : true;
        this.defaults = arg.defaults||null;
        this.stopPropagation = false;
        this.max = arg.max||null;
        this.panel = lib.g(arg.render);
        this._oldEvents = {};
        this._canReceive = false;
        this._needCache = arg.needCache === false ? false : true;
        this._cache = {};
        
	},{
		init: function(){

			this.addListener("reRenderData", function(data){
				this.current = undefiend;
				this._list = data;
				if(data.length <= 0){
					this.hide();
					return;
				}


				this._renderItem(data.slice(0, Math.min((this.max||Number.MAX_VALUE), data.length)));

				if(!this.isShow) 
					this.show();
			});

			this.parent = document.createElement("ul");
			this.panel.appendChild(this.parent);
			
			this._initEvents();
			this.setGetData(this._getData, this.formatData);
		

		},
		_initEvents: function(){
			var that = this;

			lib.on(document,"click",function(e){
				if(that.stopPropagation){
					that.stopPropagation = false;
					return;
				}
				if(e.target!==that.currentInput){
					that.hide();
				}
			});

			lib.on(window,"resize",function(){
				that._resizePanel();
			});

			that._initInputEvent(that.currentInput);
			
		},
		_renderItem: function(data){
			this.parent.innerHTML = "";
			var fragment = document.createDocumentFragment(); 
			if(this.formatData){
				for(var i=0,d;d = data[i];i++){
					var li = document.createElement("li");
					var result = this.formatData(d);
					if(lib.type.getType(result) === "array"){
						li.innerHTML = result[0];
						li.setAttribute("key", result[1]);
					}else{
						li.innerHTML = result;
						li.setAttribute("key", result);
					}						
        			li.className = "suggestion-item";
        			this.register(li);
					fragment.appendChild(li);
					
					var path = lib.uniquePath("suggestion");
					li.setAttribute("path", path);
					this._list[i].path = path;
				}
			}else{
				fragment = this._defaultFormat(data);
			}

			this.parent.appendChild(fragment);
		},
		_defaultFormat: function(data){
			var that = this;
			var fragment = document.createDocumentFragment(); 
			lib.array.each(data,function(item,index){
				var li = document.createElement("li");
				var keys = "";

				var isArray =  lib.type.getType(item)==="array";
				var eachFn = isArray ? lib.array.each : lib.object.each;
				eachFn(item,function(key,value){
					var s = document.createElement("span");
					keys+=(s.innerHTML = isArray ? key : value);
					li.appendChild(s);
				},this);
				li.setAttribute("key", keys)
				that.register(li);

				fragment.appendChild(li);

				var path = lib.uniquePath("suggestion");
				li.setAttribute("path", path);
				that._list[index].path = path;
				

			});

			return fragment;
		},
		_setCurrent: function(currentItem){
			if(this.current) $(this.current).removeClass("current");
            $(currentItem).addClass("current");
            this.current = currentItem;
            this.excuteEv("selected",[this.currentInput.value]);
		},
		_setSelected: function(c){
			this._setCurrent(c);
			if(this._autocomplete) this.currentInput.value = this.current.getAttribute("key");
		},
		_submit: function(c){
			var obj = {};
			if(this.current){
				var list = this._list;
				var path = this.current.getAttribute("path");
				lib.array.each(list,function(item,index){
					if(item.path === path){
						obj = item;
						return;
					}
				});
			}
			this.hide();
            this.excuteEv("submit",[this.currentInput.value,obj||{}]);
		},
		returnData: function(data){
			if(!this._canReceive) return;
			this.excuteEv("reRenderData",[data]);
		},
		show: function(){
			this.isShow = true;
			this.panel.style.display = "";
			this._resizePanel();
		},
		_resizePanel: function(){
			if(this.isShow){
				lib.dom.setStyle(this.panel,{
					left: this.currentInput.offsetLeft-1+"px",
					top: this.currentInput.offsetTop+this.currentInput.offsetHeight+"px",
					width: (this.defaults&&this.defaults.width) ? this.defaults.width : this.currentInput.offsetWidth+"px"
				});
			}
		},
		_setPrev: function(){
			var currentItem = null;
			if (!this.current) {
                currentItem = this.parent.lastElementChild;
            } else {
            	currentItem = this.current.previousElementSibling;
                if (!currentItem) {
                    this.currentInput.value ? this.currentInput.value = this.query : currentItem=this.parent.lastElementChild;
                }
            }
            this._removeSeleted();
            if(currentItem)
            	this._setSelected(currentItem);
		},
		_setNext: function(){
			var currentItem = null;
			if (!this.current) {
                currentItem = this.parent.firstElementChild;
            } else {
            	currentItem = this.current.nextElementSibling;
                if (!currentItem) {
                    this.currentInput.value ? this.currentInput.value = this.query : currentItem=this.parent.firstElementChild;
                }
            }
            this._removeSeleted();
            if(currentItem)
            	this._setSelected(currentItem);
		},
		_removeSeleted: function(){
			if(this.current){
				$(this.current).removeClass("current");
				this.current = undefiend;
			}
				
		},
		//初始化当前input的事件
		_initInputEvent: function(input){
			//移除上一个绑定的input事件
			if(this._oldEvents.currentInput){
				lib.un(this.currentInput,"input", this._oldEvents.currentInput.input);
				lib.un(this.currentInput,"keydown", this._oldEvents.currentInput.keydown);
				this._oldEvents.currentInput = null;
			}
			if(input.tagName == "INPUT"&&input.type == "text"){
				var that = this;

				this._oldEvents.currentInput = {};
				this._oldEvents.currentInput.input = function(e){
					that.currentInput.value != "" ? that.getData(that.currentInput.value) : that.hide();
				}
				this._oldEvents.currentInput.keydown = function(e){
					if(!that.isShow){
	                	if(e.which===40&&that.currentInput.value!==""){
	                		that.getData(that.currentInput.value);
	                		e.preventDefault();
	                	} 
	                }else{
	                	switch(e.which){
		                    case 40:
		                        if(!that._list.length>0) return;
		                        that._setNext();
		                        e.preventDefault();
		                    break;
		                    case 38:
		                        if(!that._list.length>0) return;
		                        that._setPrev();
		                        e.preventDefault();
		                    break;
		                    case 27:
		                        that.hide();
		                    break;
		                    case 13:
		                    	that._submit();
		                    break;
		                }
	                }
	                
				}
				lib.on(input,"keydown",this._oldEvents.currentInput.keydown);
				lib.on(input,"input",this._oldEvents.currentInput.input);
			}
		}, 
		hide: function(){
			this._canReceive = false;
			if(this.isShow){
				this.panel.style.display = "none";
				this.isShow = false;
			}
		},
		register: function(li){
			var that = this;
            lib.on(li,"mouseover",function(){
                that._setCurrent(this);
            });
            lib.on(li,"mousedown",function(e){
            	that.mouseItem = this;
            });
            lib.on(li,"mouseup",function(e){
            	if(e.which==1&&this===that.mouseItem){
            		that._setSelected(this);
            		that._submit();
            	}
                that.mouseItem = null;
            });
			 
		},
		setCurrentInput: function(input){

			if(input == this.currentInput) return;
			this.hide();
			this._initInputEvent(input);

			this.currentInput = input;
			
		},
		setGetData: function(fn,f){
			this._getData = fn;
			this.formatData = f;
		},
		getData: function(value){
			this.query = value;
			this._canReceive = true;
			var t = this._getData;

			if(lib.type.getType(t)==="function"){
				t.call(this,value);
			}else{
				var u=t.url,
					k=t.key,
					f=t.filter;
				if(this._needCache&&this._cache[u]&&this._cache[u][value]){
					this.returnData(this._cache[u][value]);
				}else{
					var url = lib.array.toString(u,"&",k,"=",value);
					var that = this;
					lib.send.jsonp(url,{
			            callback: function(data){
			            	var temp = f(data);
			            	if(that._needCache){
			            		console.error(u);
			            		(!that._cache[u])&&(that._cache[u]={});
			            		that._cache[u][value] = temp;
			            	}
			                console.log(data);
			                suggestion.returnData(temp);
			            } 
			        });
				}
				
			}
		},
		set: function(){

		}
	});
	lib.object.extend(s.prototype, Events);
	
	lib.extend.addComponent("Suggestion",s);


})(window);