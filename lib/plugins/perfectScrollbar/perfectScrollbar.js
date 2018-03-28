var PScrollbar = (function(){
	//-----------------settings-----------------------------
	var defaultSettings = {
	  handlers: ['click-rail', 'drag-scrollbar', 'keyboard', 'wheel', 'touch'],
	  constructorType: ['Object', 'Array', 'Function', 'Number'],
	  maxScrollbarLength: null,
	  minScrollbarLength: null,
	  scrollXMarginOffset: 0,
	  scrollYMarginOffset: 0,
	  suppressScrollX: false,
	  suppressScrollY: false,
	  swipePropagation: true,
	  swipeEasing: true,
	  useBothWheelAxes: false,
	  wheelPropagation: false,
	  wheelSpeed: 1,
	  theme: 'default'
	};

	//-----------------util---------------------------------
	var util = {
		guid: (function(){
			function str0x(){
				return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
			}
			return function(){
				return str0x() + str0x() + 
					   '-' + str0x() + '-' + str0x() + '-' + str0x() + '-' +
					   str0x() + str0x() + str0x();
			}
		})(),
		helper: (function(){
			function toggleScrolling(type){
				return function(element, axis){
					var handler = function(){};
					switch(type){
						case 'add': handler = util.class.add;break;
						case 'remove': handler = util.class.remove;break;
					}
					handler(element, 'ps--in-scrolling');
					if(typeof axis !== 'undefined'){
						handler(element, 'ps--' + axis);
					}else{
						handler(element, 'ps--x');
						handler(element, 'ps--y');
					}
				}
			};
			return {
				toInt: function(x){
					return parseInt(x, 10) || 0;
				},
				clone: function(obj){
					if(!obj) return null;
					var result = {}, that = this;
					if(Array.isArray(obj)){
						result = obj.map(function(_obj){
							return that.clone.apply(that, [_obj]);
						});
					}else if(typeof obj == 'object'){
						for(var key in obj){
							result[key] = that.clone(obj[key]);
						}
					}else {
						result = obj;
					}
					return result;
				},
				extend: function(original, source){
					var result = this.clone(original);
					for(var key in source) {
						result[key] = this.clone(source[key]);
					}
					return result;
				},
				startScrolling: toggleScrolling('add'),
				stopScrolling: toggleScrolling('remove'),
			}
		})(),
		class: (function(){
			function oldAdd(element, className){
				var classList = element.className.split(' ');
				if(classList.indexOf(className) < 0){
					classList.push(className);
				}
				element.className = classList.join(' ');
			}
			function oldRemove(element, className){
				var classList = element.className.split(' ');
				var idex = classList.indexOf(className);
				if(idex > -1){
					classList.splice(idex, 1);
				}
				element.className = classList.join(' ');
			}
			var add = function(element, className){
				if(element.classList){
					element.classList.add(className)
				}else{
					oldAdd(element, className);
				}
			}
			var remove = function(element, className){
				if(element.classList){
					element.classList.remove(className);
				}else{
					oldRemove.apply(null, arguments);
				}
			}
			var list = function(element){
				if(element.classList){
					return Array.prototype.slice.apply(element.classList);
				}else{
					return element.className.split(' ');
				}
			}
			return {
				add: add,
				remove: remove,
				list: list
			}	
		})(),
		dom: (function(){
			function cssGet(element, styleName){
				return window.getComputedStyle(element)[styleName];
			}
			function cssSet(element, styleName, styleValue){
				if(util.isNumber(styleValue)){
					styleValue = styleValue.toString() + 'px';
				}
				element.style[styleName] = styleValue;
				return element;
			}
			function cssMultiSet(element, obj){
				for(var key in obj){
					cssSet(element, key, obj[key]);
				}
			}
			return {
				e: function(tagName, className){
					var elem = document.createElement(tagName);
					elem.className = className;
					return elem;
				},
				appendTo: function(child, parent){
					parent.appendChild(child);
					return child;
				},
				css: function(element, styleNameOrObject, styleValue){
					if(util.isObject(styleNameOrObject)){
						cssMultiSet(element, styleNameOrObject);
					}else{
						if(typeof styleValue === 'undefined')
							cssGet(element, styleNameOrObject);
						else
							cssSet(element, styleNameOrObject, styleValue);
					}
				},
				remove: function(element){
					if(element.remove && util.isFunction(element.remove)){
						element.remove();
					}else{
						if(element.parentNode)
							element.parentNode.removeChild(element);
					}
				},
				queryChildren: function(element, selector){
					var that = this;
					return Array.prototype.filter.call(element.childNodes, function(child){
						return that.matches(child, selector);
					});
				},
				matches: function(elem, query){
					if(typeof elem.matches !== 'undefined'){
						return elem.matches(query);
					}else{
						if(typeof elem.matchesSelector !== 'undefined')
							return elem.matchesSelector(query);
						else if(typeof elem.webkitMatchesSelector !== 'undefined')
							return elem.webkitMatchesSelector(query);
						else if(typeof elem.mozMatchesSelector !== 'undefined')
							return elem.mozMatchesSelector(query);
						else if(typeof elem.msMatchesSelector !== 'undefined')
							return elem.msMatchesSelector(query);
					}
				}
			}
		})()
	};
	defaultSettings.constructorType.forEach(function(type){
		util['is'+type] = function(obj){
			return Object.prototype.toString.apply(obj) == '[object ' + type + ']';
		}
	});

	//-----------------handler-------------------------------
	var handler = {
		clickRail: function(elem){},
		dragScrollbar: function(elem){
			var i = instances.get(elem);
			bindMouseScrollXHandler();
			bindMouseScrollYHandler();
			function bindMouseScrollXHandler(){
				var currentLeft = null;
				var currentPageX = null;
				function updateScrollLeft(deltaX){
					var newLeft = currentLeft + (deltaX * i.railXRatio);
					var maxLeft = Math.max(0, i.scrollbarXRail.getBoundingClientRect().left) +
						(i.railXRatio * (i.railXWidth - i.scrollbarXWidth));

					if (newLeft < 0) {
				      i.scrollbarXLeft = 0;
				    } else if (newLeft > maxLeft) {
				      i.scrollbarXLeft = maxLeft;
				    } else {
				      i.scrollbarXLeft = newLeft;
				    }

				    var scrollLeft = util.helper.toInt(i.scrollbarXLeft * 
				    	(i.contentWidth - i.containerWidth) / 
				    	(i.containerWidth - (i.railXRatio * i.scrollbarXWidth))) - 
				    	i.negativeScrollAdjustment;
				    updateScroll(elem, 'left', scrollLeft);
				}
				var mouseMoveHandler = function(evt){
					updateScrollLeft(evt.pageX - currentPageX);
					updateGeometry(elem);
					evt.stopPropagation();
					evt.preventDefault();
				}
				var mouseUpHandler = function(evt){
					util.helper.stopScrolling(elem, 'x');
					i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
				}
				i.event.bind(i.scrollbarX, 'mousedown', function(e){
					currentPageX = e.pageX;
					currentLeft = util.helper.toInt(util.dom.css(i.scrollbarX, 'left')) * i.railXRatio;
					util.helper.startScrolling(elem, 'x');
					i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
					i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler)
					e.stopPropagation();
					e.preventDefault();
				})
			}
			function bindMouseScrollYHandler(){
				
			}
		},
		keyboard: function(elem){},
		mouseWheel: function(elem){},
		touch: function(elem){},
		selection: function(elem){},
		nativeScroll: function(elem){
			var i = instances.get(elem);
			i.event.bind(elem, 'scroll', function(){
				updateGeometry(elem);
			});
		}
	};

	//-----------------EventManager---------------------------------
	var EventElement = function (element) {
	  this.element = element;
	  this.events = {};
	};
	EventElement.prototype = {
		bind: function (eventName, handler) {
		  if (typeof this.events[eventName] === 'undefined') {
		    this.events[eventName] = [];
		  }
		  this.events[eventName].push(handler);
		  this.element.addEventListener(eventName, handler, false);
		},
		unbind: function (eventName, handler) {
		  var isHandlerProvided = (typeof handler !== 'undefined');
		  this.events[eventName] = this.events[eventName].filter(function (hdlr) {
		    if (isHandlerProvided && hdlr !== handler) {
		      return true;
		    }
		    this.element.removeEventListener(eventName, hdlr, false);
		    return false;
		  }, this);
		},
		unbindAll: function () {
		  for (var name in this.events) {
		    this.unbind(name);
		  }
		}
	}

	var EventManager = function(){
		this.eventElements = [];
	}
	EventManager.prototype = {
		eventElement: function (element) {
		  var ee = this.eventElements.filter(function (eventElement) {
		    return eventElement.element === element;
		  })[0];
		  if (typeof ee === 'undefined') {
		    ee = new EventElement(element);
		    this.eventElements.push(ee);
		  }
		  return ee;
		},
		bind: function (element, eventName, handler) {
		  this.eventElement(element).bind(eventName, handler);
		},
		unbind: function (element, eventName, handler) {
		  this.eventElement(element).unbind(eventName, handler);
		},
		unbindAll: function () {
		  for (var i = 0; i < this.eventElements.length; i++) {
		    this.eventElements[i].unbindAll();
		  }
		},
		once: function (element, eventName, handler) {
		  var ee = this.eventElement(element);
		  var onceHandler = function (e) {
		    ee.unbind(eventName, onceHandler);
		    handler(e);
		  };
		  ee.bind(eventName, onceHandler);
		}
	}

	//-----------------instances-----------------------------
	var instances = (function(){
		var _instances = {};
		var Instance = function(element){
			var t = this;

			t.settings = util.helper.clone(defaultSettings);
			t.containerWidth = null; t.containerHeight = null;
			t.contentWidth = null; t.contentHeight = null;

			t.isRtl = util.dom.css(element, 'direction') === 'rtl';
			t.isNegativeScroll = (function(){
				var originalScrollLeft = element.scrollLeft;
				element.scrollLeft = -1;
				var result = element.scrollLeft < 0;
				element.scrollLeft = originalScrollLeft;
				return result;
			})()
			t.negativeScrollAdjustment = t.isNegativeScroll ? element.scrollWidth - element.clientWidth : 0;
			t.event = new EventManager();
			t.ownerDocument = element.ownerDocument || document;

			function focus(){
				util.class.add(element, 'ps--focus');
			}
			function blur(){
				util.class.remove(element, 'ps--focus');
			}

			t.scrollbarXRail = util.dom.appendTo(util.dom.e('div', 'ps__scrollbar-x-rail'), element);
			t.scrollbarX = util.dom.appendTo(util.dom.e('div', 'ps__scrollbar-x'), t.scrollbarXRail);
			t.scrollbarX.setAttribute('tabindex', 0);
			t.scrollbarXActive = null;
			t.scrollbarXWidth = null;
			t.scrollbarXLeft = null;
			t.scrollbarXBottom = util.helper.toInt(util.dom.css(t.scrollbarXRail, 'bottom'));
			t.isScrollbarXUsingBottom = t.scrollbarXBottom === t.scrollbarXBottom; // !isNaN
		    t.scrollbarXTop = t.isScrollbarXUsingBottom ? null : util.helper.toInt(util.dom.css(t.scrollbarXRail, 'top'));
		    t.railBorderXWidth = util.helper.toInt(util.dom.css(t.scrollbarXRail, 'borderLeftWidth')) + util.helper.toInt(util.dom.css(t.scrollbarXRail, 'borderRightWidth'));
		  	// Set rail to display:block to calculate margins
		    util.dom.css(t.scrollbarXRail, 'display', 'block');
		    t.railXMarginWidth = util.helper.toInt(util.dom.css(t.scrollbarXRail, 'marginLeft')) + util.helper.toInt(util.dom.css(t.scrollbarXRail, 'marginRight'));
		    util.dom.css(t.scrollbarXRail, 'display', '');
		    t.railXWidth = null;
		    t.railXRatio = null;

		    t.scrollbarYRail = util.dom.appendTo(util.dom.e('div', 'ps__scrollbar-y-rail'), element);
			t.scrollbarY = util.dom.appendTo(util.dom.e('div', 'ps__scrollbar-y'), t.scrollbarYRail);
			t.scrollbarY.setAttribute('tabindex', 0);
			t.event.bind(t.scrollbarY, 'focus', focus);
			t.event.bind(t.scrollbarY, 'blur', blur);
			t.scrollbarYActive = null;
			t.scrollbarYHeight = null;
			t.scrollbarYTop = null;
			t.scrollbarYRight = util.helper.toInt(util.dom.css(t.scrollbarYRail, 'right'));
			t.isScrollbarYUsingRight = t.scrollbarYRight === t.scrollbarYRight; // !isNaN
			t.scrollbarYLeft = t.isScrollbarYUsingRight ? null : util.helper.toInt(util.dom.css(t.scrollbarYRail, 'left'));
			// t.scrollbarYOuterWidth = t.isRtl ? util.helper.outerWidth(t.scrollbarY) : null;
			t.railBorderYWidth = util.helper.toInt(util.dom.css(t.scrollbarYRail, 'borderTopWidth')) + util.helper.toInt(util.dom.css(t.scrollbarYRail, 'borderBottomWidth'));
			util.dom.css(t.scrollbarYRail, 'display', 'block');
			t.railYMarginHeight = util.helper.toInt(util.dom.css(t.scrollbarYRail, 'marginTop')) + util.helper.toInt(util.dom.css(t.scrollbarYRail, 'marginBottom'));
			util.dom.css(t.scrollbarYRail, 'display', '');
			t.railYHeight = null;
			t.railYRatio = null;
		}
		function setId(element, id){
			element.setAttribute('data-ps-id', id);
		}
		function getId(element){
			return element.getAttribute('data-ps-id');
		}
		function removeId(element){
			element.removeAttribute('data-ps-id');
		}
		return {
			add: function(element){
				var newId = util.guid();
				setId(element, newId);
				return _instances[newId] = new Instance(element);
			},
			remove: function(element){
				delete _instances[getId(element)];
				removeId(element);
			},
			get: function(element){
				return _instances[getId(element)]
			}
		}
	})()

	//-----------------updateGeometry,updateScroll----------------------------
	var updateGeometry = function(element){

		function getThumbSize(ins, thumbSize) {
		  if (ins.settings.minScrollbarLength) {
		    thumbSize = Math.max(thumbSize, ins.settings.minScrollbarLength);
		  }
		  if (ins.settings.maxScrollbarLength) {
		    thumbSize = Math.min(thumbSize, ins.settings.maxScrollbarLength);
		  }
		  return thumbSize;
		}

		function updateCss(elem, ins) {
		  var xRailOffset = {width: ins.railXWidth};
		  if (ins.isRtl) {
		    xRailOffset.left = ins.negativeScrollAdjustment + elem.scrollLeft + ins.containerWidth - ins.contentWidth;
		  } else {
		    xRailOffset.left = elem.scrollLeft;
		  }
		  if (ins.isScrollbarXUsingBottom) {
		    xRailOffset.bottom = ins.scrollbarXBottom - elem.scrollTop;
		  } else {
		    xRailOffset.top = ins.scrollbarXTop + elem.scrollTop;
		  }
		  util.dom.css(ins.scrollbarXRail, xRailOffset);

		  var yRailOffset = {top: elem.scrollTop, height: ins.railYHeight};
		  if (ins.isScrollbarYUsingRight) {
		    if (ins.isRtl) {
		      yRailOffset.right = ins.contentWidth - (ins.negativeScrollAdjustment + elem.scrollLeft) - ins.scrollbarYRight - ins.scrollbarYOuterWidth;
		    } else {
		      yRailOffset.right = ins.scrollbarYRight - elem.scrollLeft;
		    }
		  } else {
		    if (ins.isRtl) {
		      yRailOffset.left = ins.negativeScrollAdjustment + elem.scrollLeft + ins.containerWidth * 2 - ins.contentWidth - ins.scrollbarYLeft - ins.scrollbarYOuterWidth;
		    } else {
		      yRailOffset.left = ins.scrollbarYLeft + elem.scrollLeft;
		    }
		  }
		  util.dom.css(ins.scrollbarYRail, yRailOffset);

		  util.dom.css(ins.scrollbarX, {left: ins.scrollbarXLeft, width: ins.scrollbarXWidth - ins.railBorderXWidth});
		  util.dom.css(ins.scrollbarY, {top: ins.scrollbarYTop, height: ins.scrollbarYHeight - ins.railBorderYWidth});
		}

		  var i = instances.get(element);

		  i.containerWidth = element.clientWidth;
		  i.containerHeight = element.clientHeight;
		  i.contentWidth = element.scrollWidth;
		  i.contentHeight = element.scrollHeight;

		  var existingRails;
		  if (!element.contains(i.scrollbarXRail)) {
		    existingRails = util.dom.queryChildren(element, '.ps__scrollbar-x-rail');
		    if (existingRails.length > 0) {
		      existingRails.forEach(function (rail) {
		        util.dom.remove(rail);
		      });
		    }
		    util.dom.appendTo(i.scrollbarXRail, element);
		  }
		  if (!element.contains(i.scrollbarYRail)) {
		    existingRails = util.dom.queryChildren(element, '.ps__scrollbar-y-rail');
		    if (existingRails.length > 0) {
		      existingRails.forEach(function (rail) {
		        util.dom.remove(rail);
		      });
		    }
		    util.dom.appendTo(i.scrollbarYRail, element);
		  }

		  if (!i.settings.suppressScrollX && i.containerWidth + i.settings.scrollXMarginOffset < i.contentWidth) {
		    i.scrollbarXActive = true;
		    i.railXWidth = i.containerWidth - i.railXMarginWidth;
		    i.railXRatio = i.containerWidth / i.railXWidth;
		    i.scrollbarXWidth = getThumbSize(i, util.helper.toInt(i.railXWidth * i.containerWidth / i.contentWidth));
		    i.scrollbarXLeft = util.helper.toInt((i.negativeScrollAdjustment + element.scrollLeft) * (i.railXWidth - i.scrollbarXWidth) / (i.contentWidth - i.containerWidth));
		  } else {
		    i.scrollbarXActive = false;
		  }

		  if (!i.settings.suppressScrollY && i.containerHeight + i.settings.scrollYMarginOffset < i.contentHeight) {
		    i.scrollbarYActive = true;
		    i.railYHeight = i.containerHeight - i.railYMarginHeight;
		    i.railYRatio = i.containerHeight / i.railYHeight;
		    i.scrollbarYHeight = getThumbSize(i, util.helper.toInt(i.railYHeight * i.containerHeight / i.contentHeight));
		    i.scrollbarYTop = util.helper.toInt(element.scrollTop * (i.railYHeight - i.scrollbarYHeight) / (i.contentHeight - i.containerHeight));
		  } else {
		    i.scrollbarYActive = false;
		  }

		  if (i.scrollbarXLeft >= i.railXWidth - i.scrollbarXWidth) {
		    i.scrollbarXLeft = i.railXWidth - i.scrollbarXWidth;
		  }
		  if (i.scrollbarYTop >= i.railYHeight - i.scrollbarYHeight) {
		    i.scrollbarYTop = i.railYHeight - i.scrollbarYHeight;
		  }

		  updateCss(element, i);

		  if (i.scrollbarXActive) {
		    util.class.add(element, 'ps--active-x');
		  } else {
		    util.class.remove(element, 'ps--active-x');
		    i.scrollbarXWidth = 0;
		    i.scrollbarXLeft = 0;
		    updateScroll(element, 'left', 0);
		  }
		  if (i.scrollbarYActive) {
		    util.class.add(element, 'ps--active-y');
		  } else {
		    util.class.remove(element, 'ps--active-y');
		    i.scrollbarYHeight = 0;
		    i.scrollbarYTop = 0;
		    updateScroll(element, 'top', 0);
		  }
	}
	var updateScroll = function(element, axis, value){
		
		if (typeof element === 'undefined') {
		  	throw 'You must provide an element to the update-scroll function';
		}

		if (typeof axis === 'undefined') {
		  	throw 'You must provide an axis to the update-scroll function';
		}

		if (typeof value === 'undefined') {
		  	throw 'You must provide a value to the update-scroll function';
		}

		var createDOMEvent = function (name) {
		  	var event = document.createEvent("Event");
		  	event.initEvent(name, true, true);
		  	return event;
		};

		if (axis === 'top' && value <= 0) {
		  	element.scrollTop = value = 0; // don't allow negative scroll
		  	element.dispatchEvent(createDOMEvent('ps-y-reach-start'));
		}

		if (axis === 'left' && value <= 0) {
		  	element.scrollLeft = value = 0; // don't allow negative scroll
		  	element.dispatchEvent(createDOMEvent('ps-x-reach-start'));
		}

		var i = instances.get(element);

		if (axis === 'top' && value >= i.contentHeight - i.containerHeight) {
		    // don't allow scroll past container
		    value = i.contentHeight - i.containerHeight;
		    if (value - element.scrollTop <= 1) {
		      // mitigates rounding errors on non-subpixel scroll values
		      value = element.scrollTop;
		    } else {
		      element.scrollTop = value;
		    }
		    element.dispatchEvent(createDOMEvent('ps-y-reach-end'));
		}

		if (axis === 'left' && value >= i.contentWidth - i.containerWidth) {
		    // don't allow scroll past container
		    value = i.contentWidth - i.containerWidth;
		    if (value - element.scrollLeft <= 1) {
		      	// mitigates rounding errors on non-subpixel scroll values
		      	value = element.scrollLeft;
		    } else {
		      	element.scrollLeft = value;
		    }
		    element.dispatchEvent(createDOMEvent('ps-x-reach-end'));
		}

		if (i.lastTop === undefined) {
		    i.lastTop = element.scrollTop;
		}

		if (i.lastLeft === undefined) {
		    i.lastLeft = element.scrollLeft;
		}

		if (axis === 'top' && value < i.lastTop) {
		    element.dispatchEvent(createDOMEvent('ps-scroll-up'));
		}

		if (axis === 'top' && value > i.lastTop) {
		    element.dispatchEvent(createDOMEvent('ps-scroll-down'));
		}

		if (axis === 'left' && value < i.lastLeft) {
		    element.dispatchEvent(createDOMEvent('ps-scroll-left'));
		}

		if (axis === 'left' && value > i.lastLeft) {
		    element.dispatchEvent(createDOMEvent('ps-scroll-right'));
		}

		if (axis === 'top' && value !== i.lastTop) {
		    element.scrollTop = i.lastTop = value;
		    element.dispatchEvent(createDOMEvent('ps-scroll-y'));
		}

		if (axis === 'left' && value !== i.lastLeft) {
		    element.scrollLeft = i.lastLeft = value;
		    element.dispatchEvent(createDOMEvent('ps-scroll-x'));
		}
	}

	//-----------------initialize----------------------------
	function initialize(element, settings){
		settings = util.isObject(settings) ? settings : {};
		var handlers = {
			'click-rail': handler.clickRail,
			'drag-scrollbar': handler.dragScrollbar,
			'keyboard': handler.keyboard,
			'wheel': handler.mouseWheel,
			'touch': handler.touch,
			'selection': handler.selection
		}

		util.class.add(element, 'ps');
		//create a plugin instance
		var i = instances.add(element);
		i.settings = util.helper.extend(i.settings, settings);
		util.class.add(element, 'ps--theme_' + i.settings.theme);
		i.settings.handlers.forEach(function(handlerName){
			if(typeof handlers[handlerName] !== 'undefined'){
				handlers[handlerName](element);
			}
		});
		handler.nativeScroll(element);
		updateGeometry(element);
		console.log(settings);
	}

	function update(){

	}

	function destroy(){

	}

	return {
		initialize: initialize,
		update:　update,
		destroy: destroy
	}
})();