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
        this.input = null;
        this.list  = [];
        this.item = [];
        this.hasShow = false;
        this.currentInput = arg.currentInput||null;
        this.autocomplete = arg.autocomplete||true;
        this.defaults = arg.defaults||null;
        this.stopPropagation = false;
        this.max = arg.max||null;
        this.panel = lib.g(arg.render);
        this._oldEvents = {};
        this._canReceive = false;
        
	},{
		init: function(){

			this.addListener("reRenderData", function(data){
				this.current = undefiend;
				this.list = data;
				if(data.length <= 0){
					this.hide();
					return;
				}


				this._renderItem(data.slice(0, Math.min((this.max||Number.MAX_VALUE), data.length)));
				
				/*if(this.item.length){
					this._replaceItemData(data.slice(0,Math.min(this.item.length, data.length)));
					if(data.length > this.item.length){
						this._renderItem(data.slice(data.length, this.item.length));
					}
				}else{
					this._renderItem(data.slice(0, data.length));
				}*/
				
				

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
		_replaceItemData: function(data){
			var that = this;
			lib.array.each(this.item,function(item,index){
				if(data[index]){
					var result = that.formatData(data[index]);
					if(Object.prototype.toString.call(result) === "[object Array]"){
						item.innerHTML = result[0];
						item.setAttribute("key", result[1]);
					}else{
						item.innerHTML = result;
						item.setAttribute("key", result);
					}
				}				
			});
		},
		_renderItem: function(data){
			this.parent.innerHTML = "";
			var fragment = document.createDocumentFragment(); 
			if(this.formatData){
				for(var i=0,d;d = data[i];i++){
					var li = document.createElement("li");
					var result = this.formatData(d);
					if(Object.prototype.toString.call(result) === "[object Array]"){
						li.innerHTML = result[0];
						li.setAttribute("key", result[1]);
					}else{
						li.innerHTML = result;
						li.setAttribute("key", result);
					}						
        			li.className = "suggestion-item";
        			this.register(li);
					fragment.appendChild(li);
					this.item.push(li);
				}
			}else{
				fragment = this._defaultFormat(data);
			}

			this.parent.appendChild(fragment);
		},
		_defaultFormat: function(data){
			var that = this;
			var fragment = document.createDocumentFragment(); 
			lib.array.each(data,function(item){
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

				that.item.push(li);

			});

			return fragment;
		},
		setCurrent: function(currentItem){
			$(currentItem).addClass("current");
            this.current = currentItem;
            if(this.autocomplete) this.currentInput.value = this.current.getAttribute("key");
		},
		setSelected: function(c){
			this.current = c;
            this.hide();
            this.excuteEv("selected",[this.current.getAttribute("key")]);
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
				this.panel.style.left = this.currentInput.offsetLeft-1+"px";
	            this.panel.style.top = this.currentInput.offsetTop+this.currentInput.offsetHeight+"px";
				this.panel.style.width = (this.defaults&&this.defaults.width) ? this.defaults.width : this.currentInput.offsetWidth+"px";
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
            	this.setCurrent(currentItem);
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
            	this.setCurrent(currentItem);
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
		                        if(!that.list.length>0) return;
		                        that._setNext();
		                        e.preventDefault();
		                    break;
		                    case 38:
		                        if(!that.list.length>0) return;
		                        that._setPrev();
		                        e.preventDefault();
		                    break;

		                    case 27:
		                        that.hide();
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
                if(that.current) $(that.current).removeClass("current");
                $(this).addClass("current");
                that.current = this;
            });
            lib.on(li,"mousedown",function(e){
            	that.mouseItem = this;
            });
            lib.on(li,"mouseup",function(e){
            	if(e.which==1&&this===that.mouseItem){
            		that.setSelected(that.current);
            	}
                that.mouseItem = null;
            });
			 
		},
		setCurrentInput: function(input){
			if(input == this.currentInput) return;

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
			this._getData.call(this,value);
		}
	});
	lib.object.extend(s.prototype, Events);
	
	lib.extend.addComponent("Suggestion",s);


})(window);