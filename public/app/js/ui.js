/*TEMPLATE*/
COMPONENT('template', function(self) {

	var properties = null;
	var is = false;

	self.readonly();

	self.configure = function(key, value) {
		if (key === 'properties')
			properties = value.split(',').trim();
	};

	self.make = function(template) {

		if (template) {
			self.template = Tangular.compile(template);
			return;
		}

		var script = self.find('script');

		if (!script.length) {
			script = self.element;
			self.element = self.parent();
		}

		var html = script.html();
		is = html.COMPILABLE();

		self.template = Tangular.compile(html);
		script.remove();
	};

	self.setter = function(value, path) {

		if (properties && path !== self.path) {
			var key = path.substring(self.path.length + 1);
			if (!key || properties.indexOf(key))
				return;
		}

		if (NOTMODIFIED(self.id, value))
			return;
		if (value) {
			setTimeout2(self.ID, function() {
				self.html(self.template(value)).rclass('hidden');
				is && COMPILE(self.element);
			}, 100);
		} else
			self.aclass('hidden');
	};
});
/*REPEATER*/
COMPONENT('repeater', 'hidden:true;check:true', function(self, config) {

	var filter = null;
	var recompile = false;
	var reg = /\$(index|path)/g;

	self.readonly();

	self.configure = function(key, value) {
		if (key === 'filter')
			filter = value ? GET(value) : null;
	};

	self.make = function() {
		var element = self.find('script');

		if (!element.length) {
			element = self.element;
			self.element = self.element.parent();
		}

		var html = element.html();
		element.remove();
		self.template = Tangular.compile(html);
		recompile = html.COMPILABLE();
	};

	self.setter = function(value) {

		if (!value || !value.length) {
			config.hidden && self.aclass('hidden');
			self.empty();
			self.cache = '';
			return;
		}

		var builder = [];
		for (var i = 0, length = value.length; i < length; i++) {
			var item = value[i];
			item.index = i;
			if (!filter || filter(item)) {
				builder.push(self.template(item).replace(reg, function(text) {
					return text.substring(0, 2) === '$i' ? i.toString() : self.path + '[' + i + ']';
				}));
			}
		}

		var tmp = builder.join('');

		if (config.check) {
			if (tmp === self.cache)
				return;
			self.cache = tmp;
		}

		self.html(tmp);
		config.hidden && self.rclass('hidden');
		recompile && self.compile();
	};
});
/*DROPDOWN*/
COMPONENT('dropdown', function(self, config) {

	var select, condition, content = null;
	var render = '';
	self.nocompile && self.nocompile();

	self.validate = function(value) {

		if (!config.required || config.disabled)
			return true;

		var type = typeof(value);
		if (type === 'undefined' || type === 'object')
			value = '';
		else
			value = value.toString();

		EMIT('reflow', self.name);

		switch (self.type) {
			case 'currency':
			case 'number':
				return value > 0;
		}

		return value.length > 0;
	};

	self.configure = function(key, value, init) {

		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'type':
				self.type = value;
				break;
			case 'items':

				if (value instanceof Array) {
					self.bind('', value);
					return;
				}

				var items = [];

				value.split(',').forEach(function(item) {
					item = item.trim().split('|');
					var obj = { id: item[1] == null ? item[0] : item[1], name: item[0] };
					items.push(obj);
				});

				self.bind('', items);
				break;
			case 'if':
				condition = value ? FN(value) : null;
				break;
			case 'required':
				self.tclass('ui-dropdown-required', value === true);
				self.state(1, 1);
				break;
			case 'datasource':
				self.datasource(value, self.bind);
				break;
			case 'label':
				content = value;
				redraw = true;
				break;
			case 'icon':
				redraw = true;
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('select').prop('disabled', value);
				self.reset();
				break;
		}

		redraw && setTimeout2(self.id + '.redraw', 100);
	};

	self.bind = function(path, arr) {

		if (!arr)
			arr = EMPTYARRAY;

		var builder = [];
		var value = self.get();
		var propText = config.text || 'name';
		var propValue = config.value || 'id';

		config.empty !== undefined && builder.push('<option value="">{0}</option>'.format(config.empty));

		var type = typeof(arr[0]);
		var notObj = type === 'string' || type === 'number';

		for (var i = 0, length = arr.length; i < length; i++) {
			var item = arr[i];
			if (condition && !condition(item))
				continue;
			if (notObj)
				builder.push(self.template({ value: item, selected: value == item, text: item }));
			else
				builder.push(self.template({ value: item[propValue], selected: value == item[propValue], text: item[propText] }));
		}

		render = builder.join('');
		select.html(render);
	};

	self.redraw = function() {
		var html = '<div class="ui-dropdown"><select data-jc-bind="">{0}</select></div>'.format(render);
		var builder = [];
		var label = content || config.label;
		if (label) {
			builder.push('<div class="ui-dropdown-label">{0}{1}:</div>'.format(config.icon ? '<span class="fa fa-{0}"></span> '.format(config.icon) : '', label));
			builder.push('<div class="ui-dropdown-values">{0}</div>'.format(html));
			self.html(builder.join(''));
		} else
			self.html(html).aclass('ui-dropdown-values');
		select = self.find('select');
		render && self.refresh();
		config.disabled && self.reconfigure('disabled:true');
		self.tclass('ui-dropdown-required', config.required === true);
                if (config.class) { 
			self.find('.ui-dropdown').rclass('ui-dropdown'); 
                } 
	};

	self.make = function() {
		self.template = Tangular.compile('<option value="{{value}}"{{if selected}} selected="selected"{{ fi }}>{{text}}</option>');
		self.type = config.type;
		content = self.html();
		self.aclass('ui-dropdown-container');
		self.redraw();
		config.if && (condition = FN(config.if));
		config.items && self.reconfigure({ items: config.items });
		config.datasource && self.reconfigure('datasource:' + config.datasource);
	    if (config.class) self.find('select').attr('class', config.class);
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass('ui-dropdown-invalid', invalid);
	};
});
/* AIR DATEPICKER */
COMPONENT('airdp', 'language:en;position:bottom left;class:form-control;period:30;width:100%',  function(self, config) {
    var html, input, fg = null;  
    self.template = '<input type="text" class={0}>';         
    self.configure = function(key, value, init) {                        
        switch (key) {                        
        }    
    };    
    self.redraw = function() {                    
        self.refresh();                 
    };    
   	self.updateDate = function(date) {   		
        self.air.datepicker().data('datepicker').selectDate(date);                
   	};	   	    
   	self.setter = function(value, path, type) {                    
        if (type == 1) {            
            //if (isNaN(Date.parse(value))) return false;
            self.air.datepicker().data('datepicker').selectDate(value);            
        }
    };
    //Doc: http://t1m0n.name/air-datepicker/docs/index-ru.html#sub-section-38
    self.select = function(formattedDate, date, inst) {
        self.set(date, 2);         
    };
    self.validate = function(value,  isInitialValue) {        
     	if (isInitialValue) return true;			
        var errtpl = '<span class="help-block"><i class="fa fa-exclamation-triangle"></i> {0}</span>';
        fg.find('.help-block').remove();
        fg.rclass('has-error');
        if (config.required) {
       		if (!value) {
       			fg.append(errtpl.format('Select date'));       
            	fg.aclass('has-error');
            	return false;		
       		}
        } 
        if (config.range && value.length < 2) {
            fg.append(errtpl.format('Select period'));       
            fg.aclass('has-error');
            return false;
        }                      
        return true;
    };    

    self.make = function() {      
        html = Tangular.compile(self.template.format(config.class));   
        self.css('width', config.width);     
        self.html(html);        
        input = self.find('input');  
        fg = $(input).closest('.form-group');      
        var opt = {};
        console.log(config);
        if (config.autoClose) opt.autoClose= true;
        if (config.range) { opt.range = true; opt.multipleDatesSeparator=' - ';}
        if (config.timepicker) opt.timepicker = true;    
        if (config.clearButton) opt.clearButton = true;    
        //Документация http://t1m0n.name/air-datepicker/docs/index-ru.html#opts-timeFormat
        if (config.timeFormat) opt.timeFormat = config.timeFormat;
        //Документация http://t1m0n.name/air-datepicker/docs/index-ru.html#sub-section-9
        if (config.dateFormat) opt.dateFormat = config.dateFormat;
        if (config.language) opt.language = config.language;
        if (config.position) opt.position = config.position;
        if (config.view) opt.view = config.view;
        if (config.change) {
        	self.event('change', 'input', function(e) {
        		EXEC(config.change, $(e.target).val(), e);   				
			});
        }
        //choice date and time
        opt.onSelect = self.select;
        self.air = $(input).datepicker(opt);      
        if (!self.get()) {
            if (config.range) {
                var date = [NOW.add('-'+config.period+' day'), NOW];
            };
        } else var date = self.get()||NOW;
        self.air.datepicker().data('datepicker').selectDate(date);
    };    
});
/*TEXTBOX*/
COMPONENT('textbox', function(self, config) {

	var input, content = null, isfilled = false;
	var innerlabel = function() {
		var is = !!input[0].value;
		if (isfilled !== is) {
			isfilled = is;
			self.tclass('ui-textbox-filled', isfilled);
		}
	};

	self.nocompile && self.nocompile();

	self.validate = function(value) {

		if ((!config.required || config.disabled) && !self.forcedvalidation())
			return true;

		if (self.type === 'date')
			return value instanceof Date && !isNaN(value.getTime());

		if (value == null)
			value = '';
		else
			value = value.toString();

		EMIT('reflow', self.name);

		if (config.minlength && value.length < config.minlength)
			return false;

		switch (self.type) {
			case 'email':
				return value.isEmail();
			case 'phone':
				return value.isPhone();
			case 'url':
				return value.isURL();
			case 'currency':
			case 'number':
				return value > 0;
		}

		return config.validation ? !!self.evaluate(value, config.validation, true) : value.length > 0;
	};

	self.make = function() {

		content = self.html();

		self.type = config.type;
		self.format = config.format;

		self.event('click', '.fa-calendar', function(e) {
			if (!config.disabled && !config.readonly && config.type === 'date') {
				e.preventDefault();
				SETTER('calendar', 'toggle', self.element, self.get(), function(date) {
					self.change(true);
					self.set(date);
				});
			}
		});

		self.event('click', '.fa-caret-up,.fa-caret-down', function() {
			if (!config.disabled && !config.readonly && config.increment) {
				var el = $(this);
				var inc = el.hclass('fa-caret-up') ? 1 : -1;
				self.change(true);
				self.inc(inc);
			}
		});

		self.event('click', '.ui-textbox-label', function() {
			input.focus();
		});

		self.event('click', '.ui-textbox-control-icon', function() {
			if (config.disabled || config.readonly)
				return;
			if (self.type === 'search') {
				self.$stateremoved = false;
				$(this).rclass('fa-times').aclass('fa-search');
				self.set('');
			} else if (self.type === 'password') {
				var el = $(this);
				var type = input.attr('type');

				input.attr('type', type === 'text' ? 'password' : 'text');
				//el.rclass2('fa-').aclass(type === 'text' ? 'fa-eye' : 'fa-eye-slash');
			} else if (config.iconclick)
				EXEC(config.iconclick, self);
		});

		self.event('focus', 'input', function() {
			if (!config.disabled && !config.readonly && config.autocomplete)
				EXEC(config.autocomplete, self);
		});

		self.event('input', 'input', innerlabel);
		self.redraw();
		config.iconclick && self.configure('iconclick', config.iconclick);
	};

	self.setter2 = function(value) {
		if (self.type === 'search') {
			if (self.$stateremoved && !value)
				return;
			self.$stateremoved = !value;
			self.find('.ui-textbox-control-icon').tclass('fa-times', !!value).tclass('fa-search', !value);
		}
		innerlabel();
	};

	self.redraw = function() {

		var attrs = [];
		var builder = [];
		var tmp = 'text';

		switch (config.type) {
			case 'password':
				tmp = config.type;
				break;
			case 'number':
			case 'phone':
				isMOBILE && (tmp = 'tel');
				break;
		}

		self.tclass('ui-disabled', !!config.disabled);
		self.tclass('ui-textbox-required', !!config.required);
		self.type = config.type;
		attrs.attr('type', tmp);
		config.placeholder && !config.innerlabel && attrs.attr('placeholder', config.placeholder);
		config.maxlength && attrs.attr('maxlength', config.maxlength);
		config.keypress != null && attrs.attr('data-jc-keypress', config.keypress);
		config.delay && attrs.attr('data-jc-keypress-delay', config.delay);
		config.disabled && attrs.attr('disabled');
		config.readonly && attrs.attr('readonly');
		config.error && attrs.attr('error');
	        config.class && attrs.attr('class', config.class);
        	config.id && attrs.attr('id', config.id);

		attrs.attr('data-jc-bind', '');

		if (config.autofill) {
			attrs.attr('name', self.path.replace(/\./g, '_'));
			self.autofill && self.autofill();
		} else {
			attrs.attr('name', 'input' + Date.now());
			attrs.attr('autocomplete', 'new-password');
		}

		config.align && attrs.attr('class', 'ui-' + config.align);
		!isMOBILE && config.autofocus && attrs.attr('autofocus');

		builder.push('<div class="ui-textbox-input"><input {0} /></div>'.format(attrs.join(' ')));

		var icon = config.icon;
		var icon2 = config.icon2;

		if (!icon2 && self.type === 'date')
			icon2 = 'calendar';
	/*	else if (!icon2 && self.type === 'password')
			icon2 = 'eye';*/
		else if (self.type === 'search')
			icon2 = 'search';

		icon2 && builder.push('<div class="ui-textbox-control"><span class="fa fa-{0} ui-textbox-control-icon"></span></div>'.format(icon2));
		config.increment && !icon2 && builder.push('<div class="ui-textbox-control"><span class="fa fa-caret-up"></span><span class="fa fa-caret-down"></span></div>');

		if (config.label)
			content = config.label;

		self.tclass('ui-textbox-innerlabel', !!config.innerlabel);

		if (content.length) {
			var html = builder.join('');
			builder = [];
			builder.push('<div class="ui-textbox-label">');
			icon && builder.push('<i class="fa fa-{0}"></i> '.format(icon));
			builder.push('<span>' + content + (content.substring(content.length - 1) === '?' ? '' : ':') + '</span>');
			builder.push('</div><div class="ui-textbox">{0}</div>'.format(html));
			config.error && builder.push('<div class="ui-textbox-helper"><i class="fa fa-exclamation-triangle"></i> {0}</div>'.format(config.error));
			self.html(builder.join(''));
			self.aclass('ui-textbox-container');
			input = self.find('input');
		} else {
			config.error && builder.push('<div class="ui-textbox-helper"><i class="fa fa-exclamation-triangle"></i> {0}</div>'.format(config.error));
			self.aclass('ui-textbox ui-textbox-container');
			self.html(builder.join(''));
			input = self.find('input');
		}
                if (config.class) { 
			self.find('.ui-textbox-input').rclass('ui-textbox-input');
                        self.find('.ui-textbox').rclass('ui-textbox'); 
			self.rclass('ui-textbox'); 
                } 
	};

	self.configure = function(key, value, init) {

		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'readonly':
				self.find('input').prop('readonly', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('input').prop('disabled', value);
				self.reset();
				break;
			case 'format':
				self.format = value;
				self.refresh();
				break;
			case 'required':
				self.noValid(!value);
				!value && self.state(1, 1);
				self.tclass('ui-textbox-required', value === true);
				break;
			case 'placeholder':
				input.prop('placeholder', value || '');
				break;
			case 'maxlength':
				input.prop('maxlength', value || 1000);
				break;
			case 'autofill':
				input.prop('name', value ? self.path.replace(/\./g, '_') : '');
				break;
			case 'label':
				if (content && value)
					self.find('.ui-textbox-label span').html(value);
				else
					redraw = true;
				content = value;
				break;
			case 'type':
				self.type = value;
				if (value === 'password')
					value = 'password';
				else
					self.type = 'text';
				self.find('input').prop('type', self.type);
				break;
			case 'align':
				input.rclass(input.attr('class')).aclass('ui-' + value || 'left');
				break;
			case 'autofocus':
				input.focus();
				break;
			case 'icon2click': // backward compatibility
			case 'iconclick':
				config.iconclick = value;
				self.find('.ui-textbox-control').css('cursor', value ? 'pointer' : 'default');
				break;
			case 'icon':
				var tmp = self.find('.ui-textbox-label .fa');
				if (tmp.length)
					tmp.rclass2('fa-').aclass('fa-' + value);
				else
					redraw = true;
				break;
			case 'icon2':
			case 'increment':
				redraw = true;
				break;
			case 'labeltype':
				redraw = true;
				break;
		}

		redraw && setTimeout2('redraw.' + self.id, function() {
			self.redraw();
			self.refresh();
		}, 100);
	};

	self.formatter(function(path, value) {
		if (value) {
			switch (config.type) {
				case 'lower':
					value = value.toString().toLowerCase();
					break;
				case 'upper':
					value = value.toString().toUpperCase();
					break;
			}
		}
		return config.type === 'date' ? (value ? value.format(config.format || 'yyyy-MM-dd') : value) : value;
	});

	self.parser(function(path, value) {
		if (value) {
			switch (config.type) {
				case 'lower':
					value = value.toLowerCase();
					break;
				case 'upper':
					value = value.toUpperCase();
					break;
			}
		}
		return value ? config.spaces === false ? value.replace(/\s/g, '') : value : value;
	});

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : self.forcedvalidation() ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass('ui-textbox-invalid', invalid);
		config.error && self.find('.ui-textbox-helper').tclass('ui-textbox-helper-show', invalid);
	};

	self.forcedvalidation = function() {
		var val = self.get();
		return (self.type === 'phone' || self.type === 'email') && (val != null && (typeof val === 'string' && val.length !== 0));
	};
});
/*TEXTAREA*/
COMPONENT('textarea', 'scrollbar:true', function(self, config) {

	var cls = 'ui-textarea';
	var cls2 = '.' + cls;
	var input, placeholder, content = null;

	self.nocompile && self.nocompile();

	self.validate = function(value) {
		if (config.disabled || !config.required || config.readonly)
			return true;
		if (value == null)
			value = '';
		else
			value = value.toString();
		return value.length > 0;
	};

	self.configure = function(key, value, init) {
		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'readonly':
				self.find('textarea').prop('readonly', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('textarea').prop('disabled', value);
				self.reset();
				break;
			case 'required':
				self.noValid(!value);
				!value && self.state(1, 1);
				self.tclass(cls + '-required', value);
				break;
			case 'placeholder':
				placeholder.html(value || '');
				break;
			case 'maxlength':
				input.prop('maxlength', value || 1000);
				break;
			case 'label':
				redraw = true;
				break;
			case 'autofocus':
				input.focus();
				break;
			case 'monospace':
				self.tclass(cls + '-monospace', value);
				break;
			case 'icon':
				redraw = true;
				break;
			case 'format':
				self.format = value;
				self.refresh();
				break;
			case 'height':
				self.find('textarea').css('height', (value > 0 ? value + 'px' : value));
				break;
		}

		redraw && setTimeout2('redraw' + self.id, function() {
			self.redraw();
			self.refresh();
		}, 100);
	};

	self.redraw = function() {

		var attrs = [];
		var builder = [];
		var placeholderelement = '';

		self.tclass('ui-disabled', !!config.disabled);
		self.tclass(cls + '-monospace', !!config.monospace);
		self.tclass(cls + '-required', !!config.required);

		config.placeholder && (placeholderelement = '<div class="{0}-placeholder">{1}</div>'.format(cls, config.placeholder));
		config.maxlength && attrs.attr('maxlength', config.maxlength);
		config.error && attrs.attr('error');
		attrs.attr('data-jc-bind', '');
		config.height && attrs.attr('style', 'height:{0}px'.format(config.height));
		config.autofocus === 'true' && attrs.attr('autofocus');
		config.disabled && attrs.attr('disabled');
		config.readonly && attrs.attr('readonly');
		builder.push('{1}<textarea {0}></textarea>'.format(attrs.join(' '), placeholderelement));

		var label = config.label || content;

		if (!label.length) {
			config.error && builder.push('<div class="{0}-helper"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i> {1}</div>'.format(cls, config.error));
			self.aclass(cls + ' ' + cls + '-container');
			self.html(builder.join(''));
		} else {
			var html = builder.join('');
			builder = [];
			builder.push('<div class="' + cls + '-label">');
			config.icon && builder.push('<i class="fa fa-{0}"></i>'.format(config.icon));
			builder.push(label);
			builder.push(':</div><div class="{0}">{1}</div>'.format(cls, html));
			config.error && builder.push('<div class="{0}-helper"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i> {1}</div>'.format(cls, config.error));
			self.html(builder.join(''));
			self.rclass(cls);
			self.aclass(cls + '-container');
		}

		input = self.find('textarea');
		placeholder = self.find(cls2 + '-placeholder');

		if (!config.scrollbar) {
			input.noscrollbar();
			input.css('padding-right', (SCROLLBARWIDTH() + 5) + 'px');
		}
	};

	self.make = function() {
		content = self.html();
		self.type = config.type;
		self.format = config.format;
		self.redraw();

		self.event('click', cls2 + '-placeholder', function() {
			if (!config.disabled) {
				placeholder.aclass('hidden');
				input.focus();
			}
		});

		self.event('focus', 'textarea', function() {
			placeholder.aclass('hidden');
		});

		self.event('blur', 'textarea', function() {
			if (!self.get() && config.placeholder)
				placeholder.rclass('hidden');
		});
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass(cls + '-invalid', invalid);
		config.error && self.find( cls2 + '-helper').tclass(cls + '-helper-show', invalid);
	};

	self.setter2 = function(value) {

		if (!config.placeholder)
			return;

		if (value)
			placeholder.aclass('hidden');
		else
			placeholder.rclass('hidden');
	};
});
/*TEXBOXLIST*/
COMPONENT('textboxlist', 'maxlength:100;required:false;error:You reach the maximum limit;movable:false', function (self, config, cls) {

	var container, content;
	var empty = {};
	var skip = false;
	var cempty = cls + '-empty';
	var crequired = 'required';
	var helper = null;
	var cls2 = '.' + cls;

	self.setter = null;
	self.getter = null;
	self.nocompile && self.nocompile();

	self.template = Tangular.compile(('<div class="{0}-item"><div>'  + (config.movable ? '<i class="fa fa-angle-up {0}-up"></i><i class="fa fa-angle-down {0}-down"></i>' : '') + '<i class="fa fa-times {0}-remove"></i></div><div><input type="text" maxlength="{{ max }}" placeholder="{{ placeholder }}"{{ if disabled}} disabled="disabled"{{ fi }} value="{{ value }}" /></div></div>').format(cls));

	self.configure = function (key, value, init, prev) {

		if (init)
			return;

		var redraw = false;
		switch (key) {
			case 'disabled':
				self.tclass(crequired, value);
				self.find('input').prop('disabled', true);
				empty.disabled = value;
				self.reset();
				break;
			case 'maxlength':
				empty.max = value;
				self.find('input').prop(key, value);
				break;
			case 'placeholder':
				empty.placeholder = value;
				self.find('input').prop(key, value);
				break;
			case 'label':
				redraw = true;
				break;
			case 'icon':
				if (value && prev)
					self.find('i').rclass().aclass(value);
				else
					redraw = true;
				break;
		}

		if (redraw) {
			skip = false;
			self.redraw();
			self.refresh();
		}
	};

	self.redraw = function () {

		var icon = '';
		var html = config.label || content;

		if (config.icon)
			icon = '<i class="{0}"></i>'.format(config.icon.indexOf(' ') === -1 ? ('fa fa-' + config.icon) : config.icon);

		empty.value = '';
		self.tclass(cls + '-movable', !!config.movable);
		self.html((html ? ('<div class="' + cls + '-label{2}">{1}{0}:</div>').format(html, icon, config.required ? (' ' + cls + '-required') : '') : '') + ('<div class="' + cls + '-items"></div>' + self.template(empty).replace('-item"', '-item ' + cls + '-base"')));
		container = self.find(cls2 + '-items');
	};

	self.make = function () {

		empty.max = config.max;
		empty.placeholder = config.placeholder;
		empty.value = '';
		empty.disabled = config.disabled;

		if (config.disabled)
			self.aclass('ui-disabled');

		content = self.html();
		self.aclass(cls);
		self.redraw();

		self.move = function(offset, el) {

			var arr = self.get();
			var index = el.index();
			var tmp;

			if (offset === 1) {
				if (arr[index] == null || arr[index + 1] == null)
					return;
			} else {
				if (arr[index] == null || arr[index - 1] == null)
					return;
			}

			tmp = arr[index];
			arr[index] = arr[index + offset];
			arr[index + offset] = tmp;
			var items = self.find(cls2 + '-item');
			items.eq(index).find('input').val(arr[index]);
			items.eq(index + offset).find('input').val(arr[index + offset]);
		};

		self.event('click', cls2 + '-up', function () {
			self.move(-1, $(this).closest(cls2 + '-item'));
		});

		self.event('click', cls2 + '-down', function () {
			self.move(1, $(this).closest(cls2 + '-item'));
		});

		self.event('click', cls2 + '-remove', function () {

			if (config.disabled)
				return;

			var el = $(this);
			var parent = el.closest(cls2 + '-item');
			var value = parent.find('input').val();
			var arr = self.get();

			helper != null && helper.remove();
			helper = null;

			parent.remove();

			var index = arr.indexOf(value);
			if (index === -1)
				return;

			arr.splice(index, 1);

			self.tclass(cempty, !arr.length);
			self.tclass(crequired, config.required && !arr.length);

			skip = true;
			SET(self.path, arr, 2);
			self.change(true);
		});

		self.event('change keypress blur', 'input', function (e) {

			if ((e.type === 'keypress' && e.which !== 13) || config.disabled)
				return;

			var el = $(this);

			var value = this.value.trim();
			if (!value)
				return;

			var arr = [];
			var base = el.closest(cls2 + '-base');
			var len = base.length > 0;

			if (len && e.type === 'change')
				return;

			var raw = self.get();

			if (config.limit && len && raw.length >= config.limit) {
				if (!helper) {
					base.after(('<div class="' + cls + '-helper"><i class="fa fa-warning" aria-hidden="true"></i> {0}</div>').format(config.error));
					helper = container.closest(cls2).find(cls2 + '-helper');
				}
				return;
			}

			if (len) {

				if (!raw || raw.indexOf(value) === -1)
					self.push(value);

				this.value = '';
				self.change(true);
				return;
			}

			skip = true;

			container.find('input').each(function () {
				var temp = this.value.trim();
				switch (config.type) {
					case 'number':
						temp = temp.parseInt();
						break;
					case 'date':
						temp = temp.parseDate();
						break;
				}

				if (arr.indexOf(temp) === -1)
					arr.push(temp);
				else
					skip = false;
			});

			self.set(arr, 2);
			self.change(true);
		});
	};

	self.setter = function (value) {

		if (skip) {
			skip = false;
			return;
		}

		if (!value || !value.length) {
			self.aclass(cempty);
			config.required && self.aclass(crequired);
			container.empty();
			return;
		}

		self.rclass(cempty);
		self.rclass(crequired);
		var builder = [];

		for (var i = 0; i < value.length; i++) {
			empty.value = value[i];
			builder.push(self.template(empty));
		}

		container.empty().append(builder.join(''));
	};

	self.validate = function(value, init) {

		if (init)
			return true;

		var valid = !config.required;
		var items = container.children();

		if (!value || !value.length)
			return valid;

		for (var i = 0; i < value.length; i++) {
			var item = value[i];
			!item && (item = '');
			switch (config.type) {
				case 'email':
					valid = item.isEmail();
					break;
				case 'url':
					valid = item.isURL();
					break;
				case 'currency':
				case 'number':
					valid = item > 0;
					break;
				case 'date':
					valid = item instanceof Date && !isNaN(item.getTime());
					break;
				default:
					valid = item.length > 0;
					break;
			}
			items.eq(i).tclass(cls + '-item-invalid', !valid);
		}

		return valid;
	};

});
/*TEXBOXTAGS*/
COMPONENT('textboxtags', function(self, config) {

	var isString = false;
	var container, content = null;
	var refresh = false;
	var W = window;

	if (!W.$textboxtagstemplate)
		W.$textboxtagstemplate = Tangular.compile('<div class="ui-textboxtags-tag" data-name="{{ name }}">{{ name }}<i class="fa fa-times"></i></div>');

	var template = W.$textboxtagstemplate;

	self.nocompile && self.nocompile();

	self.validate = function(value) {
		return config.disabled || !config.required ? true : value && value.length > 0;
	};

	self.configure = function(key, value, init) {
		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('input').prop('disabled', value);
				self.reset();
				break;
			case 'required':
				self.tclass('ui-textboxtags-required', value);
				self.state(1, 1);
				break;
			case 'icon':
				var fa = self.find('.ui-textboxtags-label > i');
				if (fa.length && value)
					fa.rclass().aclass('fa fa-' + value);
				else
					redraw = true;
				break;

			case 'placeholder':
				self.find('input').prop('placeholder', value);
				break;
			case 'height':
				self.find('.ui-textboxtags-values').css('height', value);
				break;
			case 'label':
				redraw = true;
				break;
			case 'type':
				self.type = value;
				isString = self.type === 'string';
				break;
		}

		redraw && setTimeout2('redraw' + self.id, function() {
			refresh = true;
			container.off();
			self.redraw();
			self.refresh();
		}, 100);

	};

	self.redraw = function() {
		var label = config.label || content;
		var html = '<div class="ui-textboxtags-values"' + (config.height ? ' style="min-height:' + config.height + 'px"' : '') + '><input type="text" placeholder="' + (config.placeholder || '') + '" /></div>';

		isString = self.type === 'string';

		if (content.length) {
			self.html('<div class="ui-textboxtags-label">{0}{1}:</div><div class="ui-textboxtags">{2}</div>'.format((config.icon ? '<i class="fa fa-' + config.icon + '"></i> ' : ''), label, html));
		} else {
			self.aclass('ui-textboxtags');
			self.html(html);
		}

		container = self.find('.ui-textboxtags-values');
		config.disabled && self.reconfigure('disabled:true');
	};

	self.make = function() {

		self.aclass('ui-textboxtags-container');
		config.required && self.aclass('ui-textboxtags-required');
		content = self.html();
		self.type = config.type || '';
		self.redraw();

		self.event('click', '.fa-times', function(e) {

			if (config.disabled)
				return;

			e.preventDefault();
			e.stopPropagation();

			var el = $(this);
			var arr = self.get();

			if (isString)
				arr = self.split(arr);

			if (!arr || !(arr instanceof Array) || !arr.length)
				return;

			var index = arr.indexOf(el.parent().attr('data-name'));
			if (index === -1)
				return;

			arr.splice(index, 1);
			self.set(isString ? arr.join(', ') : arr);
			self.change(true);
		});

		self.event('click', function() {
			!config.disabled && self.find('input').focus();
		});

		self.event('focus', 'input', function() {
			config.focus && EXEC(config.focus, $(this), self);
		});

		self.event('keydown', 'input', function(e) {

			if (config.disabled)
				return;

			if (e.which === 8) {
				if (this.value)
					return;
				var arr = self.get();
				if (isString)
					arr = self.split(arr);
				if (!arr || !(arr instanceof Array) || !arr.length)
					return;
				arr.pop();
				self.set(isString ? arr.join(', ') : arr);
				self.change(true);
				return;
			}

			if (e.which !== 13)
				return;

			e.preventDefault();

			if (!this.value)
				return;

			var arr = self.get();
			var value = this.value;

			if (config.uppercase)
				value = value.toUpperCase();
			else if (config.lowercase)
				value = value.toLowerCase();

			if (isString)
				arr = self.split(arr);

			if (!(arr instanceof Array))
				arr = [];

			if (arr.indexOf(value) === -1)
				arr.push(value);
			else
				return;

			this.value = '';
			self.set(isString ? arr.join(', ') : arr);
			self.change(true);
		});
	};

	self.split = function(value) {
		if (!value)
			return [];
		var arr = value.split(',');
		for (var i = 0, length = arr.length; i < length; i++)
			arr[i] = arr[i].trim();
		return arr;
	};

	self.setter = function(value) {

		if (!refresh && NOTMODIFIED(self.id, value))
			return;

		refresh = false;
		container.find('.ui-textboxtags-tag').remove();

		if (!value || !value.length)
			return;

		var arr = isString ? self.split(value) : value;
		var builder = '';
		for (var i = 0, length = arr.length; i < length; i++)
			builder += template({ name: arr[i] });

		container.prepend(builder);
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass('ui-textboxtags-invalid', invalid);
	};
});
/*INPUTTAGS*/
COMPONENT('inputtags', 'dirkey:name;dirvalue:id;transform:0;enteronly:1;after:\\:', function(self, config) {

	var cls = 'ui-inputtags';
	var cls2 = '.' + cls;
	var input, placeholder, dirsource, binded, customvalidator, tags, skip = false;

	self.nocompile();
	self.bindvisible(50);

	self.init = function() {
		Thelpers.ui_inputtags_icon = function(val) {
			return val.charAt(0) === '!' ? ('<span class="ui-inputtags-icon-custom">' + val.substring(1) + '</span>') : ('<i class="fa fa-' + val + '"></i>');
		};
		W.ui_inputtags_template = Tangular.compile(('{{ if label }}<div class="{0}-label">{{ if icon }}<i class="fa fa-{{ icon }}"></i>{{ fi }}{{ label }}{{ after }}</div>{{ fi }}<div class="{0}-control{{ if dirsource }} {0}-dropdown{{ fi }}{{ if licon }} {0}-licon{{ fi }}{{ if ricon }} {0}-ricon{{ fi }}">{{ if ricon }}<div class="{0}-icon-right">{{ ricon | ui_inputtags_icon }}</div>{{ fi }}{{ if licon }}<div class="{0}-icon-left{{ if liconclick }} {0}-click{{ fi }}">{{ licon | ui_inputtags_icon }}</div>{{ fi }}<div class="{0}-input{{ if align === 1 || align === \'center\' }} center{{ else if align === 2 || align === \'right\' }} right{{ fi }}">{{ if placeholder && !innerlabel }}<div class="{0}-placeholder">{{ placeholder }}</div>{{ fi }}<div class="{0}-tags"><span class="{0}-editable" contenteditable="true"></span></div></div></div>{{ if error }}<div class="{0}-error hidden"><i class="fa fa-exclamation-triangle"></i> {{ error }}</div>{{ fi }}').format(cls));
	};

	self.make = function() {

		if (!config.label)
			config.label = self.html();

		if (isMOBILE && config.autofocus)
			config.autofocus = false;

		config.PATH = self.path.replace(/\./g, '_');

		self.aclass(cls + ' invisible');
		self.rclass('invisible', 100);
		self.redraw();

		self.event('input change focusout', function(e) {
			self.check();
			if (!config.enteronly && e.type === 'focusout') {
				setTimeout(function() {
					var val = input.text();
					val && self.appendval(val);
					input.html('');
				}, 100);
			}
		});

		self.event('focus', cls2 + '-editable', function() {
			self.aclass(cls + '-focused');
			config.autocomplete && EXEC(config.autocomplete, self, input.parent());
			if (config.autosource) {
				var opt = {};
				opt.element = self.element;
				opt.search = GET(self.makepath(config.autosource));
				opt.callback = function(value) {
					input.empty();
					self.appendval(typeof(value) === 'string' ? value : value[config.autovalue]);
					self.check();
				};
				SETTER('autocomplete', 'show', opt);
			}
		});

		self.event('blur', cls2 + '-editable', function() {
			self.rclass(cls + '-focused');
		});

		self.event('click', '.fa-times', function(e) {
			var index = $(this).parent().index();
			self.removetag(index);
			e.stopPropagation();
			e.preventDefault();
		});

		self.event('click', cls2 + '-tag', function(e) {
			e.stopPropagation();
			e.preventDefault();
		});

		self.findvalue = function(arr, val) {
			for (var i = 0; i < arr.length; i++) {
				if (arr[i] && (arr[i] === val || arr[i][config.value] === val))
					return arr[i];
			}
		};

		self.event('click', cls2 + '-control', function() {

			if (!config.dirsource || config.disabled)
				return;

			var opt = {};
			opt.element = self.find(cls2 + '-control');
			opt.items = dirsource;
			opt.offsetY = -1;
			opt.placeholder = config.dirplaceholder;
			opt.render = config.dirrender ? GET(self.makepath(config.dirrender)) : null;
			opt.custom = !!config.dircustom;
			opt.offsetWidth = 2;
			opt.minwidth = config.dirminwidth || 200;
			opt.maxwidth = config.dirmaxwidth;
			opt.key = config.dirkey || config.key;
			opt.empty = config.dirempty;

			if (config.dirvalue && typeof(dirsource) !== 'function') {
				var val = self.get() || EMPTYARRAY;
				opt.exclude = function(item) {
					return item ? typeof(item) === 'string' ? self.findvalue(val, item) : self.findvalue(val, item[config.dirvalue]) : false;
				};
			}

			opt.callback = function(item, el, custom) {

				// empty
				if (item == null || (custom && !opt.custom))
					return;

				var val = custom || (typeof(item) === 'string' ? item : item[config.dirvalue || config.value]);
				if (custom) {
					if (typeof(config.dircustom) === 'string') {
						var fn = GET(self.makepath(config.dircustom));
						fn(val, function(val) {
							self.appendval(val, true);
						});
					} else
						self.appendval(item, true);
				} else if (!custom)
					self.appendval(typeof(dirsource) === 'function' ? item : val);
			};

			SETTER('directory', 'show', opt);
		});

		self.event('click', cls2 + '-placeholder,' + cls2 + '-label,' + cls2 + '-input', function(e) {
			if (!config.disabled) {
				if (config.dirsource) {
					e.preventDefault();
					e.stopPropagation();
					self.element.find(cls2 + '-control').trigger('click');
				} else
					input.focus();
			}
		});

		self.event('click', cls2 + '-icon-left,' + cls2 + '-icon-right', function(e) {

			if (config.disabled)
				return;

			var el = $(this);
			var left = el.hclass(cls + '-icon-left');

			if (config.dirsource && left && config.liconclick) {
				e.preventDefault();
				e.stopPropagation();
			}

			if (left && config.liconclick)
				EXEC(self.makepath(config.liconclick), self, el);
			else if (config.riconclick)
				EXEC(self.makepath(config.riconclick), self, el);

		});
	};

	self.curpos = function(pos) {
		var el = input[0];
		if (el.createTextRange) {
			var range = el.createTextRange();
			range.move('character', pos);
			range.select();
		} else if (el.selectionStart) {
			el.focus();
			el.setSelectionRange(pos, pos);
		}
	};

	self.validate = function(value) {		

		if (!config.required || config.disabled)
			return true;

		/*if (config.dirsource)
			return !!value;*/

		if (customvalidator)
			return customvalidator(value);

		if (value == null)
			value = EMPTYARRAY;

		return value.length > 0;
	};

	self.offset = function() {
		var offset = self.element.offset();
		var control = self.find(cls2 + '-control');
		var width = control.width() + 2;
		return { left: offset.left, top: control.offset().top + control.height(), width: width };
	};

	self.setter = function() {
		if (skip)
			skip = false;
		else
			self.bindvalue();
	};

	self.appendval = function(value, custom) {

		var cur = self.get() || EMPTYARRAY;
		var is = false;
		var isfn = false;
		var rawvalue = value;

		if (dirsource && typeof(dirsource) === 'function') {
			isfn = true;
			rawvalue = value[config.dirvalue];
			if (cur.indexOf(rawvalue) !== -1 || !self.checkvalue(rawvalue))
				return;
		} else {
			rawvalue = self.transform(rawvalue);
			if (cur.indexOf(rawvalue) !== -1 || !self.checkvalue(rawvalue))
				return;
		}

		if (config.dirsource) {
			if (custom) {
				is = true;
				self.appendtag(rawvalue);
			} else {
				if (isfn) {
					is = true;
					self.appendtag(value[config.dirkey]);
				} else {
					var item = dirsource.findItem(config.dirvalue, rawvalue);
					if (item) {
						is = true;
						self.appendtag(item[config.dirkey]);
					}
				}
			}
		} else {
			is = true;
			self.appendtag(rawvalue);
		}

		if (is) {
			skip = true;
			self.push(rawvalue);
			self.change(true);
		}

		self.check();
		self.dirinitchecksum = 0;
	};

	self.appendtag = function(text) {
		input.before('<span class="{0}-tag"><i class="fa fa-times"></i>{1}</span>'.format(cls, Thelpers.encode(text)));
	};

	self.removetag = function(index) {
		skip = true;
		tags.find('span').eq(index).remove();
		self.get().splice(index, 1);
		self.update(true);
		self.change(true);
		self.check();
	};

	self.checkvalue = function(val) {
		return config.check ? GET(self.makepath(config.check))(val) : true;
	};

	self.check = function() {

		var is = !!input[0].innerHTML || (self.get() || EMPTYARRAY).length > 0;
		setTimeout(self.resize, 10);

		if (binded === is)
			return;

		binded = is;
		placeholder && placeholder.tclass('hidden', is);
		self.tclass(cls + '-binded', is);

		if (config.type === 'search')
			self.find(cls2 + '-icon-right').find('i').tclass(config.ricon, !is).tclass('fa-times', is);
	};

	self.dirinitchecksum = 0;

	self.bindvalue = function() {

		var value = self.get() || EMPTYARRAY;
		var tmp = HASH(value);

		if (tmp === self.dirinitchecksum)
			return;

		self.dirinitchecksum = tmp;
		tags.find(cls2 + '-tag').remove();

		if (dirsource) {

			if (typeof(dirsource) === 'function') {
				EXEC(self.makepath(config.dirinit), value, function(dirsource) {

					var item;

					for (var i = 0; i < dirsource.length; i++) {
						item = dirsource[i];
						item.name = self.transform(item.name);
						if (value.indexOf(item[config.dirvalue || config.value]) != -1)
							self.appendtag(item[config.dirkey || config.key]);
					}

					input.empty();
					self.check();
				});
				return;
			}

			var arr = [];
			var item;

			for (var i = 0; i < dirsource.length; i++) {
				item = dirsource[i];
				item.name = self.transform(item.name);
				if (typeof(item) === 'string') {
					if (value.indexOf(item) === -1)
						continue;
					arr.push(item);
				} else if (value.indexOf(item[config.dirvalue || config.value]) != -1)
					arr.push(item[config.dirkey || config.key]);
			}

			// if (value && item == null && config.dircustom)
			// arr.push(value);

			for (var i = 0; i < arr.length; i++) {
				item = arr[i];
				item && self.appendtag(item);
			}

		} else {
			for (var i = 0; i < value.length; i++) {
				value[i] = self.transform(value[i]);
				value[i] && self.appendtag(value[i]);
			}
		}

		input.empty();
		self.check();
	};

	self.resize = function() {
		var h = (self.find(cls2 + '-input').height() + 7) + 'px'; // 7 == padding
		//self.find('.{0}-icon-right,.{0}-icon-left'.format(cls)).css({ height: h, 'line-height': h });
		self.find('.{0}-icon-right,.{0}-icon-left'.format(cls)).css({ height: h });
	};

	self.redraw = function() {

		if (!config.ricon) {
			if (config.dirsource)
				config.ricon = 'angle-down';
		}

		self.html(W.ui_inputtags_template(config));
		input = self.find(cls2 + '-editable');
		tags = self.find(cls2 + '-tags');
		placeholder = self.find(cls2 + '-placeholder');

		input.on('paste', function(e) {
			e.preventDefault();
			e.stopPropagation();
			var text = e.originalEvent.clipboardData.getData(self.attrd('clipboard') || 'text/plain');
			text && document.execCommand('insertText', false, text);
		});

		input.on('keydown', function(e) {
			var el;
			if (e.which === 13) {
				e.preventDefault();
				e.stopPropagation();
				el = $(this);
				setTimeout(function() {
					var val = el.text();
					val && self.appendval(val);
					el.html('');
				}, 100);
			} else if (e.which === 8) {
				if (!this.innerHTML) {
					var prev = $(this).prev();
					prev.length && self.removetag(prev.index());
				}
			}
		});
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'dirsource':
				var tmp = GET(self.makepath(value));
				input.prop('contenteditable', !value);
				if (typeof(tmp) !== 'function') {
					self.datasource(value, function(path, value) {
						dirsource = value || EMPTYARRAY;
						self.bindvalue();
					});
				} else
					dirsource = tmp;
				break;
			case 'disabled':
				self.tclass('ui-disabled', value == true);
				input.attr('contenteditable', !value);
				self.reset();
				break;
			case 'required':
				self.tclass(cls + '-required', value == true);
				self.reset();
				break;
			case 'validate':
				customvalidator = value ? (/\(|=|>|<|\+|-|\)/).test(value) ? FN('value=>' + value) : (function(path) { return function(value) { return GET(path)(value); }; })(value) : null;
				break;
			case 'innerlabel':
				self.tclass(cls + '-inner', value);
				break;
		}
	};

	self.formatter(function(path, value) {
		if (value) {
			switch (config.type) {
				case 'lower':
					return value.toString().toLowerCase();
				case 'upper':
					return value.toString().toUpperCase();
			}
		}

		return value;
	});

	self.parser(function(path, value) {
		if (value) {
			switch (config.type) {
				case 'lower':
					value = value.toLowerCase();
					break;
				case 'upper':
					value = value.toUpperCase();
					break;
			}
		}
		return value ? config.spaces === false ? value.replace(/\s/g, '') : value : value;
	});

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass(cls + '-invalid', invalid);
		config.error && self.find(cls2 + '-error').tclass('hidden', !invalid);
	};

	self.transform = function(string) {

		if (typeof string !== 'string')
			return string;

		switch (config.transform) {
			case 1:
				return string.toLowerCase();
			case 2:
				return string.toUpperCase();
			case 3:
				return self.capitalize(string);
		}
		return string;
	};

	self.capitalize = function(string) {
		return string.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
	};
});
/* ERROR */
COMPONENT('error', function(self, config) {

    self.readonly();

    self.make = function() {
        self.aclass('ui-error hidden');
    };

    self.setter = function(value) {
        //if (!(value instanceof Array) || !value.length) {
		if (!value) {
            self.tclass('hidden', true);
            return;
        }

        var builder = [];
        if (typeof value === 'string') {
        	value = [{'error': value}];
        } else {
        	value = Array.isArray(value) ? value : [value];
        }
		console.log(value);
        for (var i = 0, length = value.length; i < length; i++)
            builder.push('<div><span class="fa {1}"></span>{0}</div>'.format(value[i].error||value[i], 'fa-' + (config.icon || 'times-circle')));

        self.html(builder.join(''));
        self.tclass('hidden', false);
    };
});
/* CHECKBOX */
COMPONENT('checkbox', function(self, config) {

	self.nocompile && self.nocompile();

	self.validate = function(value) {
		return (config.disabled || !config.required) ? true : (value === true || value === 'true' || value === 'on');
	};

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'label':
				self.find('span').html(value);
				break;
			case 'required':
				self.find('span').tclass('ui-checkbox-label-required', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'checkicon':
				self.find('i').rclass2('fa-').aclass('fa-' + value);
				break;
		}
	};

    self.change = function() {
        if (config.change)
            EXEC(config.change, self.get());
        else return;
    };

	self.make = function() {
		self.aclass('ui-checkbox');
		self.html('<div><i class="fa fa-{2}"></i></div><span{1}>{0}</span>'.format(config.label || self.html(), config.required ? ' class="ui-checkbox-label-required"' : '', config.checkicon || 'check'));
		config.disabled && self.aclass('ui-disabled');
		self.event('click', function() {
			if (config.disabled)
				return;
			self.dirty(false);
			self.getter(!self.get());
			self.change();
		});
	};

	self.setter = function(value) {
		self.tclass('ui-checkbox-checked', !!value);
	};
});
/*ENTER*/
COMPONENT('enter', 'validate:true', function(self, config) {
	self.readonly();
	self.make = function() {
		self.event('keydown', 'input', function(e) {
			if (e.which === 13 && (!config.validate || CAN(self.path))) {
				if (config.trigger)
					self.find(config.trigger).trigger('click');
				else
					EXEC(config.exec, self);
			}
		});
	};
});
/*CLICK*/
COMPONENT('click', function(self, config) {
	var attr;
	self.readonly();

	self.click = function() {
		if (!config.disabled) {
			if (config.value) self.set(self.parser(config.value));			
			self.EXEC(attr, self.element);			
		}
	};

	self.make = function() {			
		if (self.pathscope) { 									
			attr = self.path.replace('.', '/');
		} else attr = self.path;				
		self.event('click', self.click);
		config.enter && $(config.enter === '?' ? self.scope : config.enter).on('keydown', 'input', function(e) {
			e.which === 13 && setTimeout(function() {
				!self.element[0].disabled && self.click();
			}, 100);
		});
	};	
});
/*PAGE*/
COMPONENT('page', function(self, config) {

	var type = 0;

	self.readonly();

	self.hide = function() {
		self.set('');
	};

	self.setter = function(value) {

		if (type === 1)
			return;

		var is = config.if == value;

		if (type === 2 || !is) {
			self.tclass('hidden', !is);
			is && config.reload && EXEC(config.reload);
			self.release(!is);
			EMIT('resize');
			return;
		}

		SETTER('loading', 'show');
		type = 1;

		self.import(config.url, function() {
			type = 2;

			if (config.init) {
				var fn = GET(config.init || '');
				typeof(fn) === 'function' && fn(self);
			}

			config.reload && EXEC(config.reload);
			config.default && DEFAULT(config.default, true);

			setTimeout(function() {
				self.tclass('hidden', !is);
				EMIT('resize');
			}, 200);

			self.release(false);
			SETTER('loading', 'hide', 1000);
		}, false);
	};
});
/*AUDIO*/
COMPONENT('audio', function(self) {

	var can = false;
	var volume = 0.5;

	self.items = [];
	self.readonly();
	self.singleton();

	self.make = function() {
		var audio = document.createElement('audio');
		if (audio.canPlayType && audio.canPlayType('audio/mpeg').replace(/no/, ''))
			can = true;
	};

	self.play = function(url) {

		if (!can)
			return;

		var audio = new window.Audio();

		audio.src = url;
		audio.volume = volume;
		audio.play();

		audio.onended = function() {
			audio.$destroy = true;
			self.cleaner();
		};

		audio.onerror = function() {
			audio.$destroy = true;
			self.cleaner();
		};

		audio.onabort = function() {
			audio.$destroy = true;
			self.cleaner();
		};

		self.items.push(audio);
		return self;
	};

	self.cleaner = function() {
		var index = 0;
		while (true) {
			var item = self.items[index++];
			if (item === undefined)
				return self;
			if (!item.$destroy)
				continue;
			item.pause();
			item.onended = null;
			item.onerror = null;
			item.onsuspend = null;
			item.onabort = null;
			item = null;
			index--;
			self.items.splice(index, 1);
		}
	};

	self.stop = function(url) {

		if (!url) {
			self.items.forEach(function(item) {
				item.$destroy = true;
			});
			return self.cleaner();
		}

		var index = self.items.findIndex('src', url);
		if (index === -1)
			return self;
		self.items[index].$destroy = true;
		return self.cleaner();
	};

	self.setter = function(value) {

		if (value === undefined)
			value = 0.5;
		else
			value = (value / 100);

		if (value > 1)
			value = 1;
		else if (value < 0)
			value = 0;

		volume = value ? +value : 0;
		for (var i = 0, length = self.items.length; i < length; i++) {
			var a = self.items[i];
			if (!a.$destroy)
				a.volume = value;
		}
	};
});
/* LOADING */
COMPONENT('loading', function(self, config, cls) {
	var delay;
	var prev;

	self.readonly();
	self.singleton();
	self.nocompile();

	self.make = function() {
		self.aclass(cls + ' ' + cls + '-' + (config.style || 1));
		self.append('<div><div class="' + cls + '-text hellip"></div></div>');
	};

	self.show = function(text) {
		clearTimeout(delay);

		if (prev !== text) {
			prev = text;
			self.find('.' + cls + '-text').html(text || '');
		}

		self.rclass('hidden');
		return self;
	};

	self.hide = function(timeout) {
		clearTimeout(delay);
		delay = setTimeout(function() {
			self.aclass('hidden');
		}, timeout || 1);
		return self;
	};

});
/*NOTIFY*/
COMPONENT('notify', 'timeout:3000;position:bottom', function(self, config) {

	var autoclosing;

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();
	self.template = Tangular.compile('<div class="ui-notify ui-notify-{{ type }}" data-id="{{ id }}"><div class="ui-notify-icon"><i class="fa {{ icon }}"></i></div><div class="ui-notify-message">{{ message | raw }}</div>');
	self.items = {};

	self.make = function() {

		self.aclass('ui-notify-container');

		self.event('click', '.ui-notify', function() {
			var el = $(this);
			self.close(+el.attrd('id'));
			clearTimeout(autoclosing);
			autoclosing = null;
			self.autoclose();
		});
	};

	self.configure = function(key, value, init) {
		if (key === 'position') {
			var cls = 'ui-notify-container-';
			self.rclass2(cls).aclass(cls + value.replace(/_|\s/, '-'));
		}
	};

	self.close = function(id) {
		var obj = self.items[id];
		if (obj) {
			delete self.items[id];
			var item = self.find('div[data-id="{0}"]'.format(id));
			item.aclass('ui-notify-hide');
			setTimeout(function() {
				item.remove();
			}, 600);
		}
	};


	self.append = function(message, type) {
                if (Array.isArray(message)) {
  		    message = message[0].error;
	   	    type = 2;
                } 

		if (!type)
			type = 1;

		switch (type) {
			case 'success':
				type = 1;
				break;
			case 'warning':
				type = 2;
				break;
			case 'info':
				type = 3;
				break;
		}

		// type 1: success
		// type 2: warning

		var obj = { id: Math.floor(Math.random() * 100000), message: message, type: type, icon: type === 1 ? 'fa-check-circle' : type === 2 ? 'fa-times-circle' : 'fa-info-circle' };
		self.items[obj.id] = obj;
		self.element.append(self.template(obj));
		self.autoclose();
	};

	self.autoclose = function() {

		if (autoclosing)
			return;

		autoclosing = setTimeout(function() {
			clearTimeout(autoclosing);
			autoclosing = null;
			var el = self.find('.ui-notify');
			el.length > 1 && self.autoclose();
			el.length && self.close(+el.eq(0).attrd('id'));
		}, config.timeout);
	};
});
/*RADIOBUTTON*/
COMPONENT('radiobutton', 'inline:1', function(self, config, cls) {

	var cls2 = '.' + cls;
	var template = '<div data-value="{1}"><i></i><span>{0}</span></div>';

	self.nocompile();

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'required':
				self.find(cls2 + '-label').tclass(cls + '-label-required', value);
				break;
			case 'type':
				self.type = config.type;
				break;
			case 'label':
				self.find(cls2 + '-label').html(value);
				break;
			case 'items':
				self.find('div[data-value]').remove();
				var builder = [];
				value.split(/[^\\],/).forEach(function(item) {
					item = item.split('|');
					builder.push(template.format((item[0] || item[1]).replace(/\\,/g, ','), item[1] || item[0]));
				});
				self.append(builder.join(''));
				self.refresh();
				break;
			case 'datasource':
				self.datasource(value, self.bind);
				break;
		}
	};

	self.make = function() {
		var builder = [];
		var label = config.label || self.html();
		label && builder.push('<div class="' + cls + '-label{1}">{0}</div>'.format(label, config.required ? (' ' + cls + '-label-required') : ''));
		self.aclass(cls + (!config.inline ? (' ' + cls + '-block') : '') + (config.disabled ? ' ui-disabled' : ''));
		self.event('click', 'div[data-value]', function() {
			if (config.disabled)
				return;
			var value = self.parser($(this).attrd('value'));
			self.set(value);
			self.change(true);
		});
		self.html(builder.join(''));
		config.items && self.reconfigure('items:' + config.items);
		config.datasource && self.reconfigure('datasource:' + config.datasource);
		config.type && (self.type = config.type);
	};

	self.validate = function(value) {
		return config.disabled || !config.required ? true : !!value;
	};

	self.setter = function(value) {
		self.find('div[data-value]').each(function() {
			var el = $(this);
			var is = el.attrd('value') === (value == null ? null : value.toString());
			el.tclass(cls + '-selected', is);
			el.find('.fa').tclass('fa-circle-o', !is).tclass('fa-circle', is);
		});
	};

	self.bind = function(path, arr) {

		if (!arr)
			arr = EMPTYARRAY;

		var builder = [];
		var propText = config.text || 'name';
		var propValue = config.value || 'id';

		var type = typeof(arr[0]);
		var notObj = type === 'string' || type === 'number';

		for (var i = 0, length = arr.length; i < length; i++) {
			var item = arr[i];
			if (notObj)
				builder.push(template.format(item, item));
			else
				builder.push(template.format(item[propText], item[propValue]));
		}

		self.find('div[data-value]').remove();
		self.append(builder.join(''));
		self.refresh();
	};
});
/*CONFIRM*/
COMPONENT('confirm', function(self, config, cls) {

	var cls2 = '.' + cls;
	var is;
	var events = {};

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {

		self.aclass(cls + ' hidden');

		self.event('click', 'button', function() {
			self.hide(+$(this).attrd('index'));
		});

		self.event('click', cls2 + '-close', function() {
			self.callback = null;
			self.hide(-1);
		});

		self.event('click', function(e) {
			var t = e.target.tagName;
			if (t !== 'DIV')
				return;
			var el = self.find(cls2 + '-body');
			el.aclass(cls + '-click');
			setTimeout(function() {
				el.rclass(cls + '-click');
			}, 300);
		});
	};

	events.keydown = function(e) {
		var index = e.which === 13 ? 0 : e.which === 27 ? 1 : null;
		if (index != null) {
			self.find('button[data-index="{0}"]'.format(index)).trigger('click');
			e.preventDefault();
			e.stopPropagation();
			events.unbind();
		}
	};

	events.bind = function() {
		$(W).on('keydown', events.keydown);
	};

	events.unbind = function() {
		$(W).off('keydown', events.keydown);
	};

	self.show2 = function(message, buttons, fn) {
		self.show(message, buttons, function(index) {
			!index && fn();
		});
	};

	self.show = self.confirm = function(message, buttons, fn) {

		if (M.scope)
			self.currscope = M.scope();

		self.callback = fn;

		var builder = [];

		for (var i = 0; i < buttons.length; i++) {
			var item = buttons[i];
			var icon = item.match(/"[a-z0-9-\s]+"/);
			if (icon) {

				var tmp = icon + '';
				if (tmp.indexOf(' ') == -1)
					tmp = 'fa fa-' + tmp;

				item = item.replace(icon, '').trim();
				icon = '<i class="{0}"></i>'.format(tmp.replace(/"/g, ''));
			} else
				icon = '';

			var color = item.match(/#[0-9a-f]+/i);
			if (color)
				item = item.replace(color, '').trim();

			builder.push('<button data-index="{1}"{3}>{2}{0}</button>'.format(item, i, icon, color ? ' style="background:{0}"'.format(color) : ''));
		}

		self.content('<div class="{0}-message">{1}</div>{2}'.format(cls, message.replace(/\n/g, '<br />'), builder.join('')));
	};

	self.hide = function(index) {
		self.currscope && M.scope(self.currscope);
		self.callback && self.callback(index);
		self.rclass(cls + '-visible');
		events.unbind();
		setTimeout2(self.id, function() {
			$('html').rclass(cls + '-noscroll');
			self.aclass('hidden');
		}, 1000);
	};

	self.content = function(text) {
		$('html').aclass(cls + '-noscroll');
		!is && self.html('<div><div class="{0}-body"><span class="{0}-close"><i class="fa fa-times"></i></span></div></div>'.format(cls));
		self.find(cls2 + '-body').append(text);
		self.rclass('hidden');
		events.bind();
		setTimeout2(self.id, function() {
			self.aclass(cls + '-visible');
		}, 5);
	};
});
/*TABMENU*/
COMPONENT('tabmenu', 'class:selected;selector:li', function(self, config) {
	var old, oldtab;

	self.readonly();
	self.nocompile && self.nocompile();
	self.bindvisible();

	self.make = function() {
		self.event('click', config.selector, function() {
			if (!config.disabled) {
				var el = $(this);
				if (!el.hclass(config.class)) {
					var val = el.attrd('value');
					if (config.exec)
						EXEC(self.makepath(config.exec), val);
					else
						self.set(val);
				}
			}
		});
		var scr = self.find('script');
		if (scr.length) {
			self.template = Tangular.compile(scr.html());
			scr.remove();
		}
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', !!value);
				break;
			case 'datasource':
				self.datasource(value, function(path, value) {
					if (value instanceof Array) {
						var builder = [];
						for (var i = 0; i < value.length; i++)
							builder.push(self.template(value[i]));
						old = null;
						self.html(builder.join(''));
						self.refresh();
					}
				}, true);
				break;
		}
	};

	self.setter = function(value) {
		if (old === value)
			return;
		oldtab && oldtab.rclass(config.class);
		oldtab = self.find(config.selector + '[data-value="' + value + '"]').aclass(config.class);
		old = value;
	};
});
/*AUTOCOMLETE*/
COMPONENT('autocomplete', 'height:200', function(self, config) {

	var cls = 'ui-autocomplete';
	var clssel = 'selected';

	var container, old, searchtimeout, searchvalue, blurtimeout, datasource, offsetter, scroller;
	var margin = {};
	var skipmouse = false;
	var is = false;
	var prev;

	self.template = Tangular.compile('<li{{ if index === 0 }} class="' + clssel + '"{{ fi }} data-index="{{ index }}"><span>{{ name }}</span><span>{{ type }}</span></li>');
	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {

		self.aclass(cls + '-container hidden');
		self.html('<div class="' + cls + '"><div class="noscrollbar"><ul></ul></div></div>');

		scroller = self.find('.noscrollbar');
		container = self.find('ul');

		self.event('click', 'li', function(e) {
			e.preventDefault();
			e.stopPropagation();
			if (self.opt.callback) {
				var val = datasource[+$(this).attrd('index')];
				self.opt.scope && M.scope(self.opt.scope);
				if (self.opt.path)
					SET(self.opt.path, val.value === undefined ? val.name : val.value);
				else
					self.opt.callback(val, old);
			}
			self.visible(false);
		});

		self.event('mouseenter mouseleave', 'li', function(e) {
			if (!skipmouse) {
				prev && prev.rclass(clssel);
				prev = $(this).tclass(clssel, e.type === 'mouseenter');
			}
		});

		$(document).on('click', function() {
			is && self.visible(false);
		});

		$(window).on('resize', function() {
			self.resize();
		});

		self.on('scroll', function() {
			is && self.visible(false);
		});
	};

	self.prerender = function(value) {
		self.render(value);
	};

	self.configure = function(name, value) {
		switch (name) {
			case 'height':
				value && scroller.css('height', value);
				break;
		}
	};

	function keydown(e) {
		var c = e.which;
		var input = this;
		if (c !== 38 && c !== 40 && c !== 13) {
			if (c !== 8 && c < 32)
				return;
			clearTimeout(searchtimeout);
			searchtimeout = setTimeout(function() {
				var val = input.value || input.innerHTML;
				if (!val)
					return self.render(EMPTYARRAY);
				if (searchvalue === val)
					return;
				searchvalue = val;
				self.resize();
				self.opt.search(val, self.prerender);
			}, 200);
			return;
		}

		if (!datasource || !datasource.length || !is)
			return;

		var current = container.find('.' + clssel);
		if (c === 13) {
			if (prev) {
				prev = null;
				self.visible(false);
				if (current.length) {
					var val = datasource[+current.attrd('index')];
					self.opt.scope && M.scope(self.opt.scope);
					if (self.opt.callback)
						self.opt.callback(val, old);
					else if (self.opt.path)
						SET(self.opt.path, val.value === undefined ? val.name : val.value);
					e.preventDefault();
					e.stopPropagation();
				}
			}
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		if (current.length) {
			current.rclass(clssel);
			current = c === 40 ? current.next() : current.prev();
		}

		skipmouse = true;
		!current.length && (current = self.find('li:{0}-child'.format(c === 40 ? 'first' : 'last')));
		prev && prev.rclass(clssel);
		prev = current.aclass(clssel);
		var index = +current.attrd('index');
		var h = current.innerHeight();
		var offset = ((index + 1) * h) + (h * 2);
		scroller[0].scrollTop = offset > config.height ? offset - config.height : 0;
		setTimeout2(self.ID + 'skipmouse', function() {
			skipmouse = false;
		}, 100);
	}

	function blur() {
		clearTimeout(blurtimeout);
		blurtimeout = setTimeout(function() {
			self.visible(false);
		}, 300);
	}

	self.visible = function(visible) {
		clearTimeout(blurtimeout);
		self.tclass('hidden', !visible);
		is = visible;
	};

	self.resize = function() {

		if (!offsetter || !old)
			return;

		var offset = offsetter.offset();
		offset.top += offsetter.height();
		offset.width = offsetter.width();

		if (margin.left)
			offset.left += margin.left;
		if (margin.top)
			offset.top += margin.top;
		if (margin.width)
			offset.width += margin.width;

		self.css(offset);
	};

	self.show = function(opt) {

		clearTimeout(searchtimeout);
		var selector = 'input,[contenteditable]';

		if (opt.input == null)
			opt.input = opt.element;

		if (opt.input.setter)
			opt.input = opt.input.find(selector);
		else
			opt.input = $(opt.input);

		if (opt.input[0].tagName !== 'INPUT' && !opt.input.attr('contenteditable'))
			opt.input = opt.input.find(selector);

		if (opt.element.setter) {
			if (!opt.callback)
				opt.callback = opt.element.path;
			opt.element = opt.element.element;
		}

		if (old) {
			old.removeAttr('autocomplete');
			old.off('blur', blur);
			old.off('keydown', keydown);
		}

		opt.input.on('keydown', keydown);
		opt.input.on('blur', blur);
		opt.input.attr('autocomplete', 'off');

		old = opt.input;
		margin.left = opt.offsetX;
		margin.top = opt.offsetY;
		margin.width = opt.offsetWidth;
		opt.scope = M.scope ? M.scope() : '';

		offsetter = $(opt.element);
		self.opt = opt;
		self.resize();
		self.refresh();
		searchvalue = '';
		self.visible(false);
	};

	self.attach = function(input, search, callback, left, top, width) {
		self.attachelement(input, input, search, callback, left, top, width);
	};

	self.attachelement = function(element, input, search, callback, left, top, width) {		
		if (typeof(callback) === 'number') {
			width = left;
			left = top;
			top = callback;
			callback = null;
		}

		var opt = {};
		opt.offsetX = left;
		opt.offsetY = top;
		opt.offsetWidth = width;

		if (typeof(callback) === 'string')
			opt.path = callback;
		else
			opt.callback = callback;

		opt.search = search;
		opt.element = input;
		opt.input = input;
		self.show(opt);
	};

	self.render = function(arr) {

		datasource = arr;

		if (!arr || !arr.length) {
			self.visible(false);
			return;
		}

		var builder = [];
		for (var i = 0, length = arr.length; i < length; i++) {
			var obj = arr[i];
			obj.index = i;
			if (!obj.name)
				obj.name = obj.text;
			builder.push(self.template(obj));
		}

		container.empty().append(builder.join(''));
		skipmouse = true;

		setTimeout(function() {
			scroller[0].scrollTop = 0;
			skipmouse = false;
		}, 100);

		prev = container.find('.' + clssel);
		self.visible(true);
		setTimeout(function() {
			scroller.noscrollbar(true);
		}, 100);
	};
});
/*MENU*/
COMPONENT('menu', function(self, config, cls) {

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();

	var cls2 = '.' + cls;

	var is = false;
	var issubmenu = false;
	var isopen = false;
	var events = {};
	var ul, children, prevsub, parentclass;

	self.make = function() {
		self.aclass(cls + ' hidden ' + cls + '-style-' + (config.style || 1));
		self.append('<div class="{0}-items"><ul></ul></div><div class="{0}-submenu hidden"><ul></ul></div>'.format(cls));
		ul = self.find(cls2 + '-items').find('ul');
		children = self.find(cls2 + '-submenu');

		self.event('click', 'li', function(e) {

			clearTimeout2(self.ID);

			var el = $(this);
			if (!el.hclass(cls + '-divider') && !el.hclass(cls + '-disabled')) {
				self.opt.scope && M.scope(self.opt.scope);
				var index = el.attrd('index').split('-');
				if (index.length > 1) {
					// submenu
					self.opt.callback(self.opt.items[+index[0]].children[+index[1]]);
					self.hide();
				} else if (!issubmenu) {
					self.opt.callback(self.opt.items[+index[0]]);
					self.hide();
				}
			}

			e.preventDefault();
			e.stopPropagation();
		});

		events.hide = function() {
			is && self.hide();
		};

		self.event('scroll', events.hide);
		self.on('reflow + scroll + resize + resize2', events.hide);

		events.click = function(e) {
			if (is && !isopen && (!self.target || (self.target !== e.target && !self.target.contains(e.target))))
				setTimeout2(self.ID, self.hide, isMOBILE ? 700 : 300);
		};

		events.hidechildren = function() {
			if ($(this.parentNode.parentNode).hclass(cls + '-items')) {
				if (prevsub && prevsub[0] !== this) {
					prevsub.rclass(cls + '-selected');
					prevsub = null;
					children.aclass('hidden');
					issubmenu = false;
				}
			}
		};

		events.children = function() {

			if (prevsub && prevsub[0] !== this) {
				prevsub.rclass(cls + '-selected');
				prevsub = null;
			}

			issubmenu = true;
			isopen = true;

			setTimeout(function() {
				isopen = false;
			}, 500);

			var el = prevsub = $(this);
			var index = +el.attrd('index');
			var item = self.opt.items[index];

			el.aclass(cls + '-selected');

			var html = self.makehtml(item.children, index);
			children.find('ul').html(html);
			children.rclass('hidden');

			var css = {};
			var offset = el.position();

			css.left = ul.width() - 5;
			css.top = offset.top - 5;

			var offsetX = offset.left;

			offset = self.element.offset();

			var w = children.width();
			var left = offset.left + css.left + w;
			if (left > WW + 30)
				css.left = (offsetX - w) + 5;

			children.css(css);
		};
	};

	self.bindevents = function() {
		events.is = true;
		$(document).on('touchstart mouseenter mousedown', cls2 + '-children', events.children).on('touchstart mousedown', events.click);
		$(W).on('scroll', events.hide);
		self.element.on('mouseenter', 'li', events.hidechildren);
	};

	self.unbindevents = function() {
		events.is = false;
		$(document).off('touchstart mouseenter mousedown', cls2 + '-children', events.children).off('touchstart mousedown', events.click);
		$(W).off('scroll', events.hide);
		self.element.off('mouseenter', 'li', events.hidechildren);
	};

	self.showxy = function(x, y, items, callback) {
		var opt = {};
		opt.x = x;
		opt.y = y;
		opt.items = items;
		opt.callback = callback;
		self.show(opt);
	};

	self.makehtml = function(items, index) {
		var builder = [];
		var tmp;

		for (var i = 0; i < items.length; i++) {
			var item = items[i];

			if (typeof(item) === 'string') {
				// caption or divider
				if (item === '-')
					tmp = '<hr />';
				else
					tmp = '<span>{0}</span>'.format(item);
				builder.push('<li class="{0}-divider">{1}</li>'.format(cls, tmp));
				continue;
			}

			var cn = item.classname || '';
			var icon = '';

			if (item.icon)
				icon = '<i class="{0}"></i>'.format(item.icon.charAt(0) === '!' ? item.icon.substring(1) : item.icon.indexOf('fa-') === -1 ? ('fa fa-' + item.icon) : item.icon);
			else
				cn = (cn ? (cn + ' ') : '') + cls + '-nofa';

			tmp = '';

			if (index == null && item.children && item.children.length) {
				cn += (cn ? ' ' : '') + cls + '-children';
				tmp += '<i class="fa fa-play pull-right"></i>';
			}

			if (item.selected)
				cn += (cn ? ' ' : '') + cls + '-selected';

			if (item.disabled)
				cn += (cn ? ' ' : '') + cls + '-disabled';

			tmp += '<div class="{0}-name">{1}{2}{3}</div>'.format(cls, icon, item.name, item.shortcut ? '<b>{0}</b>'.format(item.shortcut) : '');

			if (item.note)
				tmp += '<div class="ui-menu-note">{0}</div>'.format(item.note);

			builder.push('<li class="{0}" data-index="{2}">{1}</li>'.format(cn, tmp, (index != null ? (index + '-') : '') + i));
		}

		return builder.join('');
	};

	self.show = function(opt) {

		if (typeof(opt) === 'string') {
			// old version
			opt = { align: opt };
			opt.element = arguments[1];
			opt.items = arguments[2];
			opt.callback = arguments[3];
			opt.offsetX = arguments[4];
			opt.offsetY = arguments[5];
		}

		var tmp = opt.element ? opt.element instanceof jQuery ? opt.element[0] : opt.element.element ? opt.element.dom : opt.element : null;

		if (is && tmp && self.target === tmp) {
			self.hide();
			return;
		}

		var tmp;

		self.target = tmp;
		self.opt = opt;
		opt.scope = M.scope();

		if (parentclass && opt.classname !== parentclass) {
			self.rclass(parentclass);
			parentclass = null;
		}

		if (opt.large)
			self.aclass('ui-large');
		else
			self.rclass('ui-large');

		isopen = false;
		issubmenu = false;
		prevsub = null;

		var css = {};
		children.aclass('hidden');
		children.find('ul').empty();
		clearTimeout2(self.ID);

		ul.html(self.makehtml(opt.items));

		if (!parentclass && opt.classname) {
			self.aclass(opt.classname);
			parentclass = opt.classname;
		}

		if (is) {
			css.left = 0;
			css.top = 0;
			self.element.css(css);
		} else {
			self.rclass('hidden');
			self.aclass(cls + '-visible', 100);
			is = true;
			if (!events.is)
				self.bindevents();
		}

		var target = $(opt.element);
		var w = self.width();
		var offset = target.offset();

		if (opt.element) {
			switch (opt.align) {
				case 'center':
					css.left = Math.ceil((offset.left - w / 2) + (target.innerWidth() / 2));
					break;
				case 'right':
					css.left = (offset.left - w) + target.innerWidth();
					break;
				default:
					css.left = offset.left;
					break;
			}

			css.top = opt.position === 'bottom' ? (offset.top - self.element.height() - 10) : (offset.top + target.innerHeight() + 10);

		} else {
			css.left = opt.x;
			css.top = opt.y;
		}

		css.top -= 10;

		if (opt.offsetX)
			css.left += opt.offsetX;

		if (opt.offsetY)
			css.top += opt.offsetY;

		var mw = w;
		var mh = self.height();

		if (css.left < 0)
			css.left = 10;
		else if ((mw + css.left) > WW)
			css.left = (WW - mw) - 10;

		if (css.top < 0)
			css.top = 10;
		else if ((mh + css.top) > WH)
			css.top = (WH - mh) - 10;

		self.element.css(css);
	};

	self.hide = function() {
		events.is && self.unbindevents();
		is = false;
		self.opt && self.opt.hide && self.opt.hide();
		self.target = null;
		self.opt = null;
		self.aclass('hidden');
		self.rclass(cls + '-visible');
	};

});
/*EXEC*/
COMPONENT('exec', function(self, config) {

	var regparent = /\?\d/;

	self.readonly();
	self.blind();
	self.make = function() {

		var scope = null;

		var scopepath = function(el, val) {
			if (!scope)
				scope = el.scope();
			return val == null ? scope : scope ? scope.makepath ? scope.makepath(val) : val.replace(/\?/g, el.scope().path) : val;
		};

		var fn = function(plus, forceprevent) {
			return function(e) {

				var el = $(this);
				var attr = el.attrd('exec' + plus);
				var path = el.attrd('path' + plus);
				var href = el.attrd('href' + plus);
				var def = el.attrd('def' + plus);
				var reset = el.attrd('reset' + plus);

				scope = null;

				var prevent = forceprevent ? '1' : el.attrd('prevent' + plus);
				if (prevent === 'true' || prevent === '1') {
					e.preventDefault();
					e.stopPropagation();
				}

				if (attr) {

					// Run for the current component
					if (attr.charCodeAt(0) === '@') {
						attr = attr.substring(1);
						var com = el.component();
						if (com && typeof(com[attr]) === 'function')
							com[attr](el, e);
						return;
					}

					if (attr.indexOf('?') !== -1) {
						var tmp = scopepath(el);
						if (tmp) {
							var isparent = regparent.test(attr);
							attr = tmp.makepath ? tmp.makepath(attr) : attr.replace(/\?/g, tmp.path);
							if (isparent && attr.indexOf('/') !== -1)
								M.scope(attr.split('/')[0]);
							else
								M.scope(tmp.path);
						}
					}

					EXEC(attr, el, e);
				}

				href && NAV.redirect(href);

				if (def) {
					if (def.indexOf('?') !== -1)
						def = scopepath(el, def);
					DEFAULT(def);
				}

				if (reset) {
					if (reset.indexOf('?') !== -1)
						reset = scopepath(el, reset);
					RESET(reset);
				}

				if (path) {
					var val = el.attrd('value');
					if (val) {
						if (path.indexOf('?') !== -1)
							path = scopepath(el, path);
						var v = GET(path);
						SET(path, new Function('value', 'return ' + val)(v), true);
					}
				}
			};
		};

		self.event('contextmenu', config.selector3 || '.exec3', fn('3', true));
		self.event('dblclick', config.selector2 || '.exec2', fn('2'));
		self.event('click', config.selector || '.exec', fn(''));
	};
});
/* MINHeight*/
COMPONENT('minheight', 'parent:auto;margin:0;attr:min-height', function(self, config, cls) {

	var timeout;

	self.readonly();

	self.make = function() {
		self.aclass(cls);
		self.on('resize2', self.resize);
		self.resizeforce();
	};

	self.resize = function() {
		timeout && clearTimeout(timeout);
		timeout = setTimeout(self.resizeforce, 200);
	};

	self.resizeforce = function() {

		if (config['disabled' + WIDTH()]) {
			self.css(config.attr, config.minheight || '');
			return;
		}

		var parent = self.parent(config.parent);
		var h = parent.height() - config.margin;

		if (config.topoffset)
			h -= self.element.offset().top;

		if (config.topposition)
			h -= self.element.position().top;

		if (config.minheight && h < config.minheight)
			h = config.minheight;

		self.css(config.attr, h);
	};

});
/*VIEWBOX*/
COMPONENT('viewbox', 'margin:0;scroll:true;delay:100;scrollbar:0;visibleY:1;height:100;invisible:1', function(self, config, cls) {

	var eld, elb;
	var scrollbar;
	var cls2 = '.' + cls;
	var init = false;
	var cache;
	var scrolltoforce;

	self.readonly();

	self.init = function() {

		var resize = function() {
			for (var i = 0; i < M.components.length; i++) {
				var com = M.components[i];
				if (com.name === 'viewbox' && com.dom.offsetParent && com.$ready && !com.$removed)
					com.resizeforce();
			}
		};

		ON('resize2', function() {
			setTimeout2('viewboxresize', resize, 200);
		});
	};

	self.destroy = function() {
		scrollbar && scrollbar.destroy();
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'disabled':
				eld.tclass('hidden', !value);
				break;
			case 'minheight':
			case 'margin':
			case 'marginxs':
			case 'marginsm':
			case 'marginmd':
			case 'marginlg':
				!init && self.resize();
				break;
			case 'selector': // backward compatibility
				config.parent = value;
				self.resize();
				break;
		}
	};

	self.scrollbottom = function(val) {
		if (val == null)
			return elb[0].scrollTop;
		elb[0].scrollTop = (elb[0].scrollHeight - self.dom.clientHeight) - (val || 0);
		return elb[0].scrollTop;
	};

	self.scrolltop = function(val) {
		if (val == null)
			return elb[0].scrollTop;
		elb[0].scrollTop = (val || 0);
		return elb[0].scrollTop;
	};

	self.make = function() {
		config.invisible && self.aclass('invisible');
		config.scroll && MAIN.version > 17 && self.element.wrapInner('<div class="' + cls + '-body"></div>');
		self.element.prepend('<div class="' + cls + '-disabled hidden"></div>');
		eld = self.find('> .{0}-disabled'.format(cls)).eq(0);
		elb = self.find('> .{0}-body'.format(cls)).eq(0);
		self.aclass('{0} {0}-hidden'.format(cls));
		if (config.scroll) {
			if (config.scrollbar) {
				if (MAIN.version > 17) {
					scrollbar = W.SCROLLBAR(self.find(cls2 + '-body'), { shadow: config.scrollbarshadow, visibleY: config.visibleY, visibleX: config.visibleX, orientation: config.visibleX ? null : 'y', parent: self.element });
					self.scrolltop = scrollbar.scrollTop;
					self.scrollbottom = scrollbar.scrollBottom;
				} else
					self.aclass(cls + '-scroll');
			} else {
				self.aclass(cls + '-scroll');
				self.find(cls2 + '-body').aclass('noscrollbar');
			}
		}
		self.resize();
	};

	self.released = function(is) {
		!is && self.resize();
	};

	var css = {};

	self.resize = function() {
		setTimeout2(self.ID, self.resizeforce, 200);
	};

	self.resizeforce = function() {

		var el = self.parent(config.parent);
		var h = el.height();
		var w = el.width();

		var width = WIDTH();
		var mywidth = self.element.width();

		var key = width + 'x' + mywidth + 'x' + w + 'x' + h;
		if (cache === key) {
			scrollbar && scrollbar.resize();
			if (scrolltoforce) {
				if (scrolltoforce ==='bottom')
					self.scrollbottom(0);
				else
					self.scrolltop(0);
				scrolltoforce = null;
			}
			return;
		}

		cache = key;

		var margin = config.margin;
		var responsivemargin = config['margin' + width];

		if (responsivemargin != null)
			margin = responsivemargin;

		if (margin === 'auto')
			margin = self.element.offset().top;

		if (h === 0 || w === 0) {
			self.$waiting && clearTimeout(self.$waiting);
			self.$waiting = setTimeout(self.resize, 234);
			return;
		}

		h = ((h / 100) * config.height) - margin;

		if (config.minheight && h < config.minheight)
			h = config.minheight;

		css.height = h;
		css.width = mywidth;
		eld.css(css);

		css.width = '';
		self.css(css);
		elb.length && elb.css(css);
		self.element.SETTER('*', 'resize');
		var c = cls + '-hidden';
		self.hclass(c) && self.rclass(c, 100);
		scrollbar && scrollbar.resize();

		if (scrolltoforce) {
			if (scrolltoforce ==='bottom')
				self.scrollbottom(0);
			else
				self.scrolltop(0);
			scrolltoforce = null;
		}

		if (!init) {
			self.rclass('invisible', 250);
			init = true;
		}
	};

	self.resizescrollbar = function() {
		scrollbar && scrollbar.resize();
	};

	self.setter = function() {
		scrolltoforce = config.scrollto || config.scrolltop;
		if (scrolltoforce) {
			if (scrolltoforce ==='bottom')
				self.scrollbottom(0);
			else
				self.scrolltop(0);
			scrolltoforce = null;
		}
		setTimeout(self.resize, config.delay, scrolltoforce);
	};
});
/*PAGINATION*/
COMPONENT('pagination', 'pages:# pages,# page,# pages,# pages;items:# items,# item,# items,# items', function(self, config, cls) {

	var cachePages = 0;
	var cacheCount = 0;
	var nav;
	var info;

	self.template = Tangular.compile('<span class="page{{ if selected }} selected{{ fi }}" data-page="{{ page }}">{{ page }}</span>');
	self.nocompile && self.nocompile();
	self.readonly();

	self.make = function() {
		self.aclass(cls + ' hidden');
		self.append('<div></div><nav></nav>');
		nav = self.find('nav');
		info = self.find('div');

		self.event('click', '.page', function(e) {
			e.preventDefault();
			e.stopPropagation();
			var el = $(this);
			self.find('.selected').rclass('selected');
			self.page && self.page(+el.attrd('page'), el);
		});
	};

	self.configure = function(key, value, init) {
		!init && self.refresh();
	};

	self.page = function(page, el) {
		config.exec && self.SEEX(config.exec, page, el);
	};

	self.getPagination = function(page, pages, max, fn) {

		var half = Math.ceil(max / 2);
		var pageFrom = page - half;
		var pageTo = page + half;
		var plus = 0;

		if (pageFrom <= 0) {
			plus = Math.abs(pageFrom);
			pageFrom = 1;
			pageTo += plus;
		}

		if (pageTo >= pages) {
			pageTo = pages;
			pageFrom = pages - max;
		}

		if (pageFrom <= 0)
			pageFrom = 1;

		if (page < half + 1) {
			pageTo++;
			if (pageTo > pages)
				pageTo--;
		}

		for (var i = pageFrom; i < pageTo + 1; i++)
			fn(i);
	};

	self.getPages = function(length, max) {
		var pages = (length - 1) / max;
		if (pages % max !== 0)
			pages = Math.floor(pages) + 1;
		if (pages === 0)
			pages = 1;
		return pages;
	};

	self.setter = function(value) {

		// value.page   --> current page index
		// value.pages  --> count of pages
		// value.count  --> count of items in DB

		self.tclass('hidden', value == null);

		if (!value)
			return;

		var is;

		if (config.nopages) {
			is = value.pages < 2;
			self.tclass('hidden', is);
			if (is)
				return;
		}

		is = false;

		if (value.pages !== undefined) {
			if (value.pages !== cachePages || value.count !== cacheCount) {
				cachePages = value.pages;
				cacheCount = value.count;
				is = true;
			}
		}

		var builder = [];

		if (cachePages > 2) {
			var prev = value.page - 1;
			if (prev <= 0)
				prev = cachePages;
			builder.push('<span class="page" data-page="{0}"><i class="fa fa-chevron-left"></i></span>'.format(prev));
		}

		var max = config.max || 8;

		self.getPagination(value.page, cachePages, max, function(index) {
			builder.push(self.template({ page: index, selected: value.page === index }));
		});

		if (cachePages > 2) {
			var next = value.page + 1;
			if (next > cachePages)
				next = 1;
			builder.push('<span class="page" data-page="{0}"><i class="fa fa-chevron-right"></i></span>'.format(next));
		}

		nav.html(builder.join('')).tclass('hidden', builder.length <= 0);

		if (is) {
			var pluralize_pages = [cachePages];
			var pluralize_items = [cacheCount];
			pluralize_pages.push.apply(pluralize_pages, (config.pages || '').split(',').trim());
			pluralize_items.push.apply(pluralize_items, (config.items || '').split(',').trim());
			info.empty().append(Tangular.helpers.pluralize.apply(value, pluralize_pages) + ' / ' + Tangular.helpers.pluralize.apply(value, pluralize_items));
			self.tclass('hidden', cachePages < 1);
		}
	};
});
/*IMPORTER*/
COMPONENT('importer', function(self, config) {

	var init = false;
	var clid = null;
	var pending = false;
	var content = '';

	var replace = function(value) {
		return self.scope ? self.makepath(value) : value.replace(/\?/g, config.path || config.if);
	};

	var replace2 = function(value) {
		return value ? value.replace(/~PATH~/g, config.path || config.if) : value;
	};

	self.readonly();

	self.make = function() {
		var scr = self.find('script');
		content = scr.length ? scr.html() : '';
	};

	self.reload = function(recompile) {
		config.reload && EXEC(replace(config.reload));
		recompile && COMPILE();
		setTimeout(function() {
			pending = false;
			init = true;
		}, 1000);
	};

	self.setter = function(value) {

		if (pending)
			return;

		if (config.if !== value) {
			if (config.cleaner && init && !clid)
				clid = setTimeout(self.clean, config.cleaner * 60000);
			return;
		}

		pending = true;

		if (clid) {
			clearTimeout(clid);
			clid = null;
		}

		if (init) {
			self.reload();
			return;
		}

		if (content) {
			self.html(replace2(content));
			setTimeout(self.reload, 50, true);
		} else
			self.import(config.url, self.reload, true, replace2);
	};

	self.clean = function() {
		config.clean && EXEC(replace(config.clean));
		setTimeout(function() {
			self.empty();
			init = false;
			clid = null;
		}, 1000);
	};
});
/*LARGEFORM*/
COMPONENT('largeform', 'zindex:12;padding:30;scrollbar:1;scrolltop:1;style:1', function(self, config, cls) {

	var cls2 = '.' + cls;
	var csspos = {};
	var nav = false;
	var init = false;

	if (!W.$$largeform) {

		W.$$largeform_level = W.$$largeform_level || 1;
		W.$$largeform = true;

		$(document).on('click', cls2 + '-button-close', function() {
			SET($(this).attrd('path'), '');
		});

		var resize = function() {
			setTimeout2(self.name, function() {
				for (var i = 0; i < M.components.length; i++) {
					var com = M.components[i];
					if (com.name === 'largeform' && !HIDDEN(com.dom) && com.$ready && !com.$removed)
						com.resize();
				}
			}, 200);
		};

		ON('resize2', resize);

		$(document).on('click', cls2 + '-container', function(e) {

			if (e.target === this) {
				var com = $(this).component();
				if (com && com.config.closeoutside) {
					com.set('');
					return;
				}
			}

			var el = $(e.target);
			if (el.hclass(cls + '-container') && !el.hclass(cls + '-style-2')) {
				var form = el.find(cls2);
				var c = cls + '-animate-click';
				form.aclass(c);
				setTimeout(function() {
					form.rclass(c);
				}, 300);
			}
		});
	}

	self.readonly();
	self.submit = function() {
		if (config.submit)
			self.EXEC(config.submit, self.hide, self.element);
		else
			self.hide();
	};

	self.cancel = function() {
		config.cancel && self.EXEC(config.cancel, self.hide);
		self.hide();
	};

	self.hide = function() {
		if (config.independent)
			self.hideforce();
		self.set('');
	};

	self.icon = function(value) {
		var el = this.rclass2('fa');
		value.icon && el.aclass(value.icon.indexOf(' ') === -1 ? ('fa fa-' + value.icon) : value.icon);
	};

	self.resize = function() {

		if (self.hclass('hidden'))
			return;

		var padding = isMOBILE ? 0 : config.padding;
		var ui = self.find(cls2);

		csspos.height = WH - (config.style == 1 ? (padding * 2) : padding);
		csspos.top = padding;
		ui.css(csspos);

		var el = self.find(cls2 + '-title');
		var th = el.height();
		var w = ui.width();

		if (w > WW)
			w = WW;
		if (w == 0) w = 'auto';
		csspos = { height: csspos.height - th, width: w };

		if (nav)
			csspos.height -= nav.height();

		self.find(cls2 + '-body').css(csspos);
		self.scrollbar && self.scrollbar.resize();
		self.element.SETTER('*', 'resize');
	};

	self.make = function() {

		$(document.body).append('<div id="{0}" class="hidden {4}-container invisible"><div class="{4}" style="max-width:{1}px"><div data-bind="@config__text span:value.title__change .{4}-icon:@icon" class="{4}-title"><button name="cancel" class="{4}-button-close{3}" data-path="{2}"><i class="fa fa-times"></i></button><i class="{4}-icon"></i><span></span></div><div class="{4}-body"></div></div>'.format(self.ID, config.width || 800, self.path, config.closebutton == false ? ' hidden' : '', cls));

		var scr = self.find('> script');
		self.template = scr.length ? scr.html().trim() : '';
		scr.length && scr.remove();

		var el = $('#' + self.ID);
		var body = el.find(cls2 + '-body')[0];

		while (self.dom.children.length) {
			var child = self.dom.children[0];
			if (child.tagName === 'NAV') {
				nav = $(child);
				body.parentNode.appendChild(child);
			} else
				body.appendChild(child);
		}

		self.rclass('hidden invisible');
		self.replace(el, true);

		if (config.scrollbar)
			self.scrollbar = SCROLLBAR(self.find(cls2 + '-body'), { shadow: config.scrollbarshadow, visibleY: config.visibleY, orientation: 'y' });

		if (config.style === 2)
			self.aclass(cls + '-style-2');

		self.event('scroll', function() {
			EMIT('scroll', self.name);
			EMIT('reflow', self.name);
		});

		self.event('click', 'button[name]', function() {
			var t = this;
			switch (t.name) {
				case 'submit':
					self.submit(self.hide);
					break;
				case 'cancel':
					!t.disabled && self[t.name](self.hide);
					break;
			}
		});

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]')[0].disabled && setTimeout2(self.ID + 'enter', self.submit, 500);
		});
	};

	self.configure = function(key, value, init, prev) {
		if (!init) {
			switch (key) {
				case 'width':
					value !== prev && self.find(cls2).css('max-width', value + 'px');
					break;
				case 'closebutton':
					self.find(cls2 + '-button-close').tclass('hidden', value !== true);
					break;
			}
		}
	};

	self.esc = function(bind) {
		if (bind) {
			if (!self.$esc) {
				self.$esc = true;
				$(W).on('keydown', self.esc_keydown);
			}
		} else {
			if (self.$esc) {
				self.$esc = false;
				$(W).off('keydown', self.esc_keydown);
			}
		}
	};

	self.esc_keydown = function(e) {
		if (e.which === 27 && !e.isPropagationStopped()) {
			var val = self.get();
			if (!val || config.if === val) {
				e.preventDefault();
				e.stopPropagation();
				self.hide();
			}
		}
	};

	self.hideforce = function() {
		if (!self.hclass('hidden')) {
			self.aclass('hidden');
			self.release(true);
			self.esc(false);
			self.find(cls2).rclass(cls + '-animate');
			W.$$largeform_level--;
		}
	};

	var allowscrollbars = function() {
		$('html').tclass(cls + '-noscroll', !!$(cls2 + '-container').not('.hidden').length);
	};

	self.setter = function(value) {

		setTimeout2(self.name + '-noscroll', allowscrollbars, 50);

		var isHidden = value !== config.if;

		if (self.hclass('hidden') === isHidden) {
			if (!isHidden) {
				config.reload && self.EXEC(config.reload, self);
				config.default && DEFAULT(self.makepath(config.default), true);
				config.scrolltop && self.scrollbar && self.scrollbar.scrollTop(0);
			}
			return;
		}

		setTimeout2(cls, function() {
			EMIT('reflow', self.name);
		}, 10);

		if (isHidden) {
			if (!config.independent)
				self.hideforce();
			return;
		}

		if (self.template) {
			var is = self.template.COMPILABLE();
			self.find(cls2).append(self.template);
			self.template = null;
			is && COMPILE();
		}

		if (W.$$largeform_level < 1)
			W.$$largeform_level = 1;

		W.$$largeform_level++;

		self.css('z-index', W.$$largeform_level * config.zindex);
		self.aclass('invisible');
		self.rclass('hidden');
		self.release(false);

		config.scrolltop && self.scrollbar && self.scrollbar.scrollTop(0);
		config.reload && self.EXEC(config.reload, self);
		config.default && DEFAULT(self.makepath(config.default), true);

		self.resize();

		setTimeout(function() {
			self.rclass('invisible');
			self.find(cls2).aclass(cls + '-animate');
			if (!init && isMOBILE) {
				$('body').aclass('hidden');
				setTimeout(function() {
					$('body').rclass('hidden');
				}, 50);
			}

			config.autofocus && self.autofocus(config.autofocus);
			init = true;
		}, 200);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.ID, function() {
			self.css('z-index', (W.$$largeform_level * config.zindex) + 1);
		}, 500);

		config.closeesc && self.esc(true);
	};
});
/*BOOTSTRAP TABLE*/
COMPONENT('btt', 'locale:ru-RU;export:true;pagination:true', function(self, config) {
    self.prepare = function(meta) {              
    	function prepareRender(item) {
    		if (item.tpl) {             	
                item.tpl = Ta.compile($(item.tpl).html());                                   
                item.formatter = function(value, row, index) { return item.tpl(row) }; 
                //для печати
                if (item.ptpl) {
                    item.ptpl = Ta.compile($(item.ptpl).html());                                
                    item.printFormatter = function(value, row, index) { return item.ptpl(row) };                     
                }                   
            } else if (item.render) {                         
                item.formatter = Function('val, row, index', item.render);                       
              }              
            //сортировка по дате  
            if (item.sorterDate) {
                item.sorter = function(a, b) {
                    if (new Date(a) < new Date(b)) return 1;
                    if (new Date(a) > new Date(b)) return -1;
                    return 0
                } 
            }            
    	}
        var icons = {               
            refresh: 'fa-sync-alt',
            autoRefresh: 'fa-history',
            fullscreen: 'fa-arrows-alt',            
            columns: 'fa-columns',                
            export: 'fa-save',
            print: 'fa-print'                
        }; 
        meta.locale = config.locale;
        meta.pagination = config.pagination;
        meta.searchAlign = 'left';
       	meta.buttonsAlign = meta.buttonsAlign||'left';        				
        meta.sidePagination = (meta.url || meta.ajax) ? 'server' : 'client';
        meta.iconsPrefix = 'fa';
        meta.icons = icons;   
        //console.log(meta.columns);             
        meta.columns.forEach((item)=> {   
            if (Array.isArray(item)) {
            	item.forEach((item) => prepareRender(item));
            } else prepareRender(item); 
        });   

        //meta.buttonsClass = 'primary';                
        if (config.export) {         	
        	meta.showExport = config.export;
        	meta.exportTypes = meta.exportTypes||['csv', 'txt', 'excel'];
        }	

        if (meta.exportOptions) {            
            meta.exportOptions.onCellHtmlData = eval(meta.exportOptions.onCellHtmlData);            
        };  

        if (meta.onPostBody) {                                    
            meta.onPostBody = eval(meta.onPostBody);            
        };

        if (meta.onCheck) {                                    
            meta.onCheck = eval(meta.onCheck);            
        };

        if (meta.onUncheck) {                                    
            meta.onUncheck = eval(meta.onUncheck);            
        };

        if (meta.onPostBody) {                                    
            meta.onPostBody = eval(meta.onPostBody);            
        };

        if (meta.queryParams) {            
            meta.queryParams = eval(meta.queryParams);            
        };
        
        if (meta.cookieCustomStorageGet) {            
            meta.cookieCustomStorageGet = eval(meta.cookieCustomStorageGet);            
        };
        if (meta.cookieCustomStorageSet) {            
            meta.cookieCustomStorageSet = eval(meta.cookieCustomStorageSet);            
        };        
        if (meta.ajax) {            
            meta.ajax = eval(meta.ajax);            
        };
        if (meta.cookie) {
        	meta.cookieIdTable = config.name;
        }  
        self.meta = meta;
    };    

    self.setter = function(value, path, type) {
        self.grid.bootstrapTable('load', value||[]);                
    };

    self.updateRow = function(data, index) {
    	var obj = {index: index, row: data};
    	self.grid.bootstrapTable('updateRow', obj);                	
    };

    self.refresh = function() {    	
    	self.grid.bootstrapTable('refresh');                	
    };

    self.getRowById = function(id) {    	
    	return self.grid.bootstrapTable('getRowByUniqueId', id);                	
    };

    self.getSelections = function() {
    	return self.grid.bootstrapTable('getSelections');
    };

    self.hideColumn = function(name) {    	
    	self.grid.bootstrapTable('hideColumn', name);                	
    };

    self.make = function() {        
        var meta = self.find('script').html();           
        self.html('<table></table>');        
        if (typeof(meta) == 'string') {
            meta = new Function('return ' + meta.trim())();            
        }                 
        if (!meta) return;        
        self.grid = self.find('table');  
        self.prepare(meta);  

        setTimeout(()=>{
        	$(self.grid).bootstrapTable(self.meta); 
        	if (config.init) EXEC(config.init);        	
        }, 200)        
    }
});    
/*LISTMENU*/
COMPONENT('listmenu', 'class:selected;selector:a;property:id;click:true', function(self, config) {

	var old, oldvalue;

	self.readonly();
	self.nocompile && self.nocompile();

	self.make = function() {
		var scr = self.find('script');
		self.template = Tangular.compile(scr.html());
		scr.remove();
	};

	self.configure = function(name, value) {
		switch (name) {
			case 'datasource':
				self.datasource(self.makepath(value), self.rebind);
				break;
		}
	};

	self.rebind = function(path, value) {

		if (!value || !value.length) {
			self.empty();
			return;
		}

		var builder = [];
		var opt = { length: value.length };
		for (var i = 0; i < opt.length; i++) {
			var item = value[i];
			opt.index = i;
			builder.push(self.template(item, opt));
		}

		oldvalue = null;
		self.html(builder.join(''));

		config.click && self.find(config.selector).on('click', function() {
			var arr = self.find(config.selector).toArray();
			var index = arr.indexOf(this);
			if (index !== -1) {
				var item = self.finditem(self.get(self.makepath(config.datasource)), index);
				item && self.set(item[config.property]);
			}
		});

		self.refresh();
	};

	self.finditem = function(arr, index) {
		var j = 0;
		for (var i = 0; i < arr.length; i++) {
			var item = arr[i];
			var id = item[config.property];
			if (id && id != '-') {
				if (index === j)
					return item;
				j++;
			}
		}
	};

	self.findindex = function(arr, value) {
		var j = 0;
		for (var i = 0; i < arr.length; i++) {
			var item = arr[i];
			var id = item[config.property];
			if (id && id != '-') {
				if (id === value)
					return j;
				j++;
			}
		}
	};

	self.setter = function(value) {
		var arr = GET(self.makepath(config.datasource));
		if (arr && arr.length) {
			if (value === oldvalue)
				return;

			oldvalue = value;
			old && old.rclass(config.class);
			var index = self.findindex(arr, value);
			if (value)
				old = self.find(config.selector).eq(index).aclass(config.class);
		}
	};
});
/*FORM*/
COMPONENT('form', 'zindex:12;scrollbar:1', function(self, config, cls) {

	var cls2 = '.' + cls;
	var container;
	var csspos = {};

	if (!W.$$form) {

		W.$$form_level = W.$$form_level || 1;
		W.$$form = true;

		$(document).on('click', cls2 + '-button-close', function() {
			SET($(this).attrd('path'), '');
		});

		var resize = function() {
			setTimeout2('form', function() {
				for (var i = 0; i < M.components.length; i++) {
					var com = M.components[i];
					if (com.name === 'form' && !HIDDEN(com.dom) && com.$ready && !com.$removed)
						com.resize();
				}
			}, 200);
		};

		ON('resize2', resize);

		$(document).on('click', cls2 + '-container', function(e) {

			var el = $(e.target);
			if (e.target === this || el.hclass(cls + '-container-padding')) {
				var com = $(this).component();
				if (com && com.config.closeoutside) {
					com.set('');
					return;
				}
			}

			if (!(el.hclass(cls + '-container-padding') || el.hclass(cls + '-container')))
				return;

			var form = $(this).find(cls2);
			var c = cls + '-animate-click';
			form.aclass(c);

			setTimeout(function() {
				form.rclass(c);
			}, 300);
		});
	}

	self.readonly();
	self.submit = function() {
		if (config.submit)
			self.EXEC(config.submit, self.hide, self.element);
		else
			self.hide();
	};

	self.cancel = function() {
		config.cancel && self.EXEC(config.cancel, self.hide);
		self.hide();
	};

	self.hide = function() {
		if (config.independent)
			self.hideforce();
		self.set('');
	};

	self.icon = function(value) {
		var el = this.rclass2('fa');
		value.icon && el.aclass(value.icon.indexOf(' ') === -1 ? ('fa fa-' + value.icon) : value.icon);
		el.tclass('hidden', !value.icon);
	};

	self.resize = function() {
		if (self.scrollbar) {
			container.css('height', WH);
			self.scrollbar.resize();
		}

		if (!config.center || self.hclass('hidden'))
			return;

		var ui = self.find(cls2);
		var fh = ui.innerHeight();
		var wh = WH;
		var r = (wh / 2) - (fh / 2);
		csspos.marginTop = (r > 30 ? (r - 15) : 20) + 'px';
		ui.css(csspos);
	};

	self.make = function() {

		$(document.body).append('<div id="{0}" class="hidden {4}-container invisible"><div class="{4}-scrollbar"><div class="{4}-container-padding"><div class="{4}" style="max-width:{1}px"><div data-bind="@config__text span:value.title__change .{4}-icon:@icon" class="{4}-title"><button name="cancel" class="{4}-button-close{3}" data-path="{2}"><i class="fa fa-times"></i></button><i class="{4}-icon"></i><span></span></div></div></div></div>'.format(self.ID, config.width || 800, self.path, config.closebutton == false ? ' hidden' : '', cls));

		var scr = self.find('> script');
		self.template = scr.length ? scr.html().trim() : '';
		if (scr.length)
			scr.remove();

		var el = $('#' + self.ID);
		var body = el.find(cls2)[0];
		container = el.find(cls2 + '-scrollbar');

		if (config.scrollbar) {
			el.css('overflow', 'hidden');
			self.scrollbar = SCROLLBAR(el.find(cls2 + '-scrollbar'), { visibleY: 1, orientation: 'y' });
		}

		while (self.dom.children.length)
			body.appendChild(self.dom.children[0]);

		self.rclass('hidden invisible');
		self.replace(el, true);

		self.event('scroll', function() {
			EMIT('scroll', self.name);
			EMIT('reflow', self.name);
		});

		self.event('click', 'button[name]', function() {
			var t = this;
			switch (t.name) {
				case 'submit':
					self.submit(self.hide);
					break;
				case 'cancel':
					!t.disabled && self[t.name](self.hide);
					break;
			}
		});

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]')[0].disabled && setTimeout2(self.ID + 'enter', self.submit, 500);
		});
	};

	self.configure = function(key, value, init, prev) {
		if (init)
			return;
		switch (key) {
			case 'width':
				value !== prev && self.find(cls2).css('max-width', value + 'px');
				break;
			case 'closebutton':
				self.find(cls2 + '-button-close').tclass('hidden', value !== true);
				break;
		}
	};

	self.esc = function(bind) {
		if (bind) {
			if (!self.$esc) {
				self.$esc = true;
				$(W).on('keydown', self.esc_keydown);
			}
		} else {
			if (self.$esc) {
				self.$esc = false;
				$(W).off('keydown', self.esc_keydown);
			}
		}
	};

	self.esc_keydown = function(e) {
		if (e.which === 27 && !e.isPropagationStopped()) {
			var val = self.get();
			if (!val || config.if === val) {
				e.preventDefault();
				e.stopPropagation();
				self.hide();
			}
		}
	};

	self.hideforce = function() {
		if (!self.hclass('hidden')) {
			self.aclass('hidden');
			self.release(true);
			self.esc(false);
			self.find(cls2).rclass(cls + '-animate');
			W.$$form_level--;
		}
	};

	var allowscrollbars = function() {
		$('html').tclass(cls + '-noscroll', !!$(cls2 + '-container').not('.hidden').length);
	};

	self.setter = function(value) {

		setTimeout2(self.name + '-noscroll', allowscrollbars, 50);

		var isHidden = value !== config.if;

		if (self.hclass('hidden') === isHidden) {
			if (!isHidden) {
				config.reload && self.EXEC(config.reload, self);
				config.default && DEFAULT(self.makepath(config.default), true);
			}
			return;
		}

		setTimeout2(cls, function() {
			EMIT('reflow', self.name);
		}, 10);

		if (isHidden) {
			if (!config.independent)
				self.hideforce();
			return;
		}

		if (self.template) {
			var is = self.template.COMPILABLE();
			self.find(cls2).append(self.template);
			self.template = null;
			is && COMPILE();
		}

		if (W.$$form_level < 1)
			W.$$form_level = 1;

		W.$$form_level++;

		self.css('z-index', W.$$form_level * config.zindex);
		self.aclass('invisible');
		self.rclass('hidden');
		self.resize();
		self.release(false);

		if (self.scrollbar)
			self.scrollbar.scrollTop(0);
		else
			self.element.scrollTop(0);

		config.reload && self.EXEC(config.reload, self);
		config.default && DEFAULT(self.makepath(config.default), true);

		setTimeout(function() {

			self.rclass('invisible');

			if (self.scrollbar)
				self.scrollbar.scrollTop(0);
			else
				self.element.scrollTop(0);

			self.find(cls2).aclass(cls + '-animate');
			config.autofocus && self.autofocus(config.autofocus);

		}, 200);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.ID, function() {
			self.css('z-index', (W.$$form_level * config.zindex) + 1);
		}, 500);

		config.closeesc && self.esc(true);
	};
});
/*PART*/
COMPONENT('part', 'hide:1;loading:1;delay:500;delayloading:800', function(self, config, cls) {

	var init = false;
	var clid = null;
	var downloading = false;
	var isresizing = false;
	var cache = {};

	self.releasemode && self.releasemode('true');
	self.readonly();

	self.make = function() {
		self.aclass(cls);
	};

	self.resize = function() {
		if (config.absolute) {
			var pos = self.element.position();
			var obj = {};
			obj.width = WW - pos.left;
			obj.height = WH - pos.top;
			self.css(obj);
		}
	};

	var replace = function(value) {
		return value.replace(/\?/g, config.path || config.if);
	};

	self.setter = function(value) {

		if (cache[value]) {

			if (downloading)
				return;

			if (config.absolute && !isresizing) {
				self.on('resize2', self.resize);
				isresizing = true;
			}

			if (self.dom.hasChildNodes()) {

				if (clid) {
					clearTimeout(clid);
					clid = null;
				}

				self.release(false);

				var done = function() {
					config.hide && self.rclass('hidden');
					config.reload && EXEC(replace(config.reload));
					config.default && DEFAULT(replace(config.default), true);
					var invisible = self.hclass('invisible');
					invisible && self.rclass('invisible', config.delay);
					isresizing && setTimeout(self.resize, 50);
					setTimeout(self.emitresize, 200);
					config.autofocus && self.autofocus(config.autofocus);
				};

				if (config.check)
					EXEC(replace(config.check), done);
				else
					done();

			} else {

				config.loading && SETTER('loading/show');
				downloading = true;
				setTimeout(function() {

					var preparator;

					if (config.replace)
						preparator = GET(replace(config.replace));
					else {
						preparator = function(content) {
							return content.replace(/~PATH~/g, replace(config.path || config.if));
						};
					}

					self.import(replace(config.url), function() {

						if (!init) {
							config.init && EXEC(replace(config.init));
							init = true;
						}

						var done = function() {
							config.hide && self.rclass('hidden');
							self.release(false);
							config.reload && EXEC(replace(config.reload), true);
							config.default && DEFAULT(replace(config.default), true);
							config.loading && SETTER('loading/hide', config.delayloading);
							var invisible = self.hclass('invisible');
							invisible && self.rclass('invisible', config.delay);
							isresizing && setTimeout(self.resize, 50);
							setTimeout(self.emitresize, 200);
							downloading = false;
							config.autofocus && self.autofocus(config.autofocus);
						};

						EMIT('parts.' + config.if, self.element, self);

						if (config.check)
							EXEC(replace(config.check), done);
						else
							done();

					}, true, preparator);

				}, 200);
			}
		} else {

			if (!self.hclass('hidden')) {
				config.hidden && EXEC(replace(config.hidden));
				config.hide && self.aclass('hidden' + (config.invisible ? ' invisible' : ''));
				self.release(true);
			}

			if (config.cleaner && init && !clid)
				clid = setTimeout(self.clean, config.cleaner * 60000);
		}

	};

	self.emitresize = function() {
		self.element.SETTER('*', 'resize');
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'if':

				var tmp = (value + '').split(',').trim();
				cache = {};
				for (var i = 0; i < tmp.length; i++)
					cache[tmp[i]] = 1;

				break;
			case 'absolute':
				var is = !!value;
				self.tclass(cls + '-absolute', is);
				break;
		}
	};

	self.clean = function() {
		if (self.hclass('hidden')) {
			config.clean && EXEC(replace(config.clean));
			setTimeout(function() {
				self.empty();
				init = false;
				clid = null;
				setTimeout(FREE, 1000);
			}, 1000);
		}
	};
});
/*RESOURCE*/
COMPONENT('resource', function(self) {
	self.readonly();
	self.blind();
	self.nocompile && self.nocompile();

	self.init = function() {
		window.RESOURCEDB = {};
		window.RESOURCE = function(name, def) {
			return RESOURCEDB[name] || def || name;
		};
	};

	self.download = function(url, callback) {
		AJAX('GET ' + url, function(response) {
			if (!response) {
				callback && callback();
				return;
			}

			if (typeof(response) !== 'string')
				response = response.toString();
			self.prepare(response);
			callback && callback();
		});
	};

	self.prepare = function(value) {
		var w = window;
		value.split('\n').forEach(function(line) {

			var clean = line.trim();
			if (clean.substring(0, 2) === '//')
				return;

			var index = clean.indexOf(':');
			if (index === -1)
				return;

			var key = clean.substring(0, index).trim();
			var value = clean.substring(index + 1).trim();

			w.RESOURCEDB[key] = value;
		});
		return self;
	};

	self.make = function() {
		var el = self.find('script');
		self.prepare(el.html());
		el.remove();
	};
});
/*SELECTED*/
COMPONENT('selected', 'class:selected;selector:a;attr:if;attror:or;delay:50', function(self, config) {

	self.readonly();

	var highlight = function() {
		var cls = config.class;
		var val = self.get() || '';
		self.find(config.selector).each(function() {
			var el = $(this);
			var or = el.attrd(config.attror) || '';
			if (el.attrd(config.attr) === val || (or && val.indexOf(or) !== -1))
				el.aclass(cls);
			else if (el.hclass(cls))
				el.rclass(cls);
		});
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'datasource':
				self.datasource(value, function() {
					setTimeout2(self.ID, highlight, config.delay);
				});
				break;
		}
	};

	self.setter = function() {
		setTimeout2(self.ID, highlight, config.delay);
	};
});
/*LISTBOX*/
COMPONENT('listbox', function(self, config, cls) {

	var cls2 = '.' + cls;
	var Eitems = null;
	var skip = false;

	self.items = EMPTYARRAY;
	self.template = Tangular.compile('<li data-search="{{ search }}" data-index="{{ index }}" style="padding-right:{0}px">{{ if icon }}<i class="fa fa-{{ icon }}"></i>{{ fi }}{{ text }}</li>'.format(SCROLLBARWIDTH()));
	self.nocompile && self.nocompile();

	self.init = function() {

		var resize = function() {
			// Notifies all listboxes
			setTimeout2('listboxes_resize', function() {
				for (var i = 0; i < M.components.length; i++) {
					var com = M.components[i];
					if (com.name === 'listbox' && !(com.config.height > 0))
						com.resize2();
				}
			}, 100);
		};

		ON('resize2', resize);
	};

	self.validate = function(value) {
		return config.disabled || !config.required ? true : value ? (config.multiple ? value.length > 0 : true) : false;
	};

	self.make = function() {

		self.aclass(cls);
		self.redraw();

		config.datasource && self.reconfigure('datasource:' + config.datasource);
		config.items && self.reconfigure('items:' + config.items);

		self.event('click', 'li', function() {

			if (config.disabled)
				return;

			var index = +this.getAttribute('data-index');
			var value = self.items[index];

			skip = true;

			if (config.multiple) {
				var selected = self.get() || [];
				if (selected.indexOf(value.value) === -1)
					selected.push(value.value);
				else
					selected = selected.remove(value.value);
				self.set(selected);
				config.exec && self.EXEC(config.exec, selected);
			} else {
				self.set(value.value);
				config.exec && self.EXEC(config.exec, value.value);
			}

			self.change(true);
		});

		self.event('click', '.fa-times', function() {
			if (!config.disabled) {
				self.find('input').val('');
				self.search();
			}
		});

		typeof(config.search) === 'string' && self.event('keydown', 'input', function() {
			!config.disabled && setTimeout2(self.id, self.search, 500);
		});

		self.on('resize + reflow', self.resize2);
	};

	self.configure = function(key, value) {

		var redraw = false;
		switch (key) {
			case 'type':
				self.type = value;
				break;
			case 'disabled':
				self.tclass(cls + '-disabled', value);
				self.find('input').prop('disabled', value);
				if (value)
					self.rclass(cls + '-invalid');
				else if (config.required)
					self.state(1, 1);
				break;
			case 'required':
				!value && self.state(1, 1);
				break;
			case 'search':
				redraw = true;
				break;
			case 'height':
				if (value > 0)
					Eitems.css('height', value + 'px');
				else
					self.resize();
				break;
			case 'items':
				var arr = [];
				value.split(',').forEach(function(item) {
					item = item.trim().split('|');
					var obj = {};
					obj.name = item[0].trim();
					obj.id = (item[1] == null ? item[0] : item[1]).trim();
					if (config.type === 'number')
						obj.id = +obj.id;
					arr.push(obj);
				});
				self.bind('', arr);
				break;
			case 'datasource':
				self.datasource(value, self.bind, true);
				break;
		}

		redraw && self.redraw();
	};

	self.search = function() {
		var search = config.search ? self.find('input').val().toSearch() : '';
		var first;
		Eitems.find('li').each(function() {
			var el = $(this);
			el.tclass('hidden', el.attrd('search').indexOf(search) === -1);
			if (!first && el.hclass(cls + '-selected'))
				first = el;
		});
		self.find(cls2 + '-search-icon').tclass('fa-search', search.length === 0).tclass('fa-times', search.length > 0);
		!skip && first && first[0].scrollIntoView(true);
		skip = false;
	};

	self.redraw = function() {
		self.html((typeof(config.search) === 'string' ? '<div class="{0}-search"><span><i class="fa fa-search {0}-search-icon"></i></span><div><input type="text" placeholder="{1}" /></div></div><div><div class="{0}-search-empty"></div>'.format(cls, config.search) : '') + '<div class="{0}-container"><ul style="height:{1}px" class="{0}-noscrollbar"></ul></div>'.format(cls, config.height || '200'));
		Eitems = self.find('ul');
		self.resize();
	};

	self.resize2 = function() {
		if (!(config.height > 0))
			setTimeout2(self.ID + 'resize', self.resize, 300);
	};

	self.resize = function() {
		self.width(function() {
			var h = 0;
			var css = {};
			if (typeof(config.height) === 'string') {
				// selector
				switch (config.height) {
					case 'parent':
						h = self.element.parent().height();
						break;
					case 'window':
						h = WH;
						break;
					default:
						h = self.element.closest(config.height).height();
						break;
				}
				css.height = (h - (config.margin || 0) - (self.find(cls2 + '-search').height() + 4)) >> 0; // 4 means border
			}
			Eitems.css(css);
		});
	};

	self.bind = function(path, value) {

		var kt = config.text || 'name';
		var kv = config.value || 'id';
		var ki = config.icon || 'icon';
		var builder = [];

		self.items = [];
		value && value.forEach(function(item, index) {

			var text;
			var value;
			var icon = null;

			if (typeof(item) === 'string') {
				text = item || '';
				value = self.parser(item);
			} else {
				text = item[kt] || '';
				value = item[kv];
				icon = item[ki];
			}

			var item = { text: text, value: value, index: index, search: text.toSearch(), icon: icon };
			self.items.push(item);
			builder.push(self.template(item));
		});

		Eitems.empty().append(builder.join(''));
		self.search();
	};

	self.setter = function(value) {

		var selected = {};
		var ds = self.items;
		var dsl = ds.length;

		if (value != null) {
			if (config.multiple) {
				for (var i = 0, length = value.length; i < length; i++) {
					for (var j = 0; j < dsl; j++) {
						if (ds[j].value === value[i])
							selected[j] = true;
					}
				}
			} else {
				for (var j = 0; j < dsl; j++) {
					if (ds[j].value === value)
						selected[j] = true;
				}
			}
		}

		Eitems.find('li').each(function() {
			var el = $(this);
			var index = +el.attrd('index');
			var is = selected[index] !== undefined;
			el.tclass(cls + '-selected', is);
		});

		self.search();
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass(cls + '-invalid', invalid);
	};
});
/* INPUT */
COMPONENT('input', 'maxlength:200;dirkey:name;dirvalue:id;increment:1;autovalue:name;direxclude:false;checkicon:fa fa-check;forcevalidation:1;searchalign:1;height:80;after:\\:', function(self, config, cls) {

	var cls2 = '.' + cls;
	var input, placeholder, dirsource, binded, customvalidator, mask, rawvalue, isdirvisible = false, nobindcamouflage = false, focused = false;

	self.nocompile();

	self.init = function() {
		Thelpers.ui_input_icon = function(val) {
			return val.charAt(0) === '!' || val.indexOf(' ') !== -1 ? ('<span class="ui-input-icon-custom">' + (val.charAt(0) === '!' ? val.substring(1) : ('<i class="' + val) + '"></i>') + '</span>') : ('<i class="fa fa-' + val + '"></i>');
		};
		W.ui_input_template = Tangular.compile(('{{ if label }}<div class="{0}-label">{{ if icon }}<i class="{{ icon }}"></i>{{ fi }}{{ label | raw }}{{ after | raw }}</div>{{ fi }}<div class="{0}-control{{ if licon }} {0}-licon{{ fi }}{{ if ricon || (type === \'number\' && increment) }} {0}-ricon{{ fi }}">{{ if ricon || (type === \'number\' && increment) }}<div class="{0}-icon-right{{ if type === \'number\' && increment && !ricon }} {0}-increment{{ else if riconclick || type === \'date\' || type === \'time\' || (type === \'search\' && searchalign === 1) || type === \'password\' }} {0}-click{{ fi }}">{{ if type === \'number\' && !ricon }}<i class="fa fa-caret-up"></i><i class="fa fa-caret-down"></i>{{ else }}{{ ricon | ui_input_icon }}{{ fi }}</div>{{ fi }}{{ if licon }}<div class="{0}-icon-left{{ if liconclick || (type === \'search\' && searchalign !== 1) }} {0}-click{{ fi }}">{{ licon | ui_input_icon }}</div>{{ fi }}<div class="{0}-input{{ if align === 1 || align === \'center\' }} center{{ else if align === 2 || align === \'right\' }} right{{ fi }}">{{ if placeholder && !innerlabel }}<div class="{0}-placeholder">{{ placeholder }}</div>{{ fi }}{{ if dirsource || type === \'icon\' || type === \'emoji\' || type === \'color\' }}<div class="{0}-value" tabindex="0"></div>{{ else }}{{ if type === \'multiline\' }}<textarea data-jc-bind="" style="height:{{ height }}px"></textarea>{{ else }}<input type="{{ if type === \'password\' }}password{{ else }}text{{ fi }}"{{ if autofill }} autocomplete="on" name="{{ PATH }}"{{ else }} name="input' + Date.now() + '" autocomplete="new-password"{{ fi }} data-jc-bind=""{{ if maxlength > 0}} maxlength="{{ maxlength }}"{{ fi }}{{ if autofocus }} autofocus{{ fi }} />{{ fi }}{{ fi }}</div></div>{{ if error }}<div class="{0}-error hidden"><i class="fa fa-warning"></i> {{ error }}</div>{{ fi }}').format(cls));
	};

	self.make = function() {

		if (!config.label)
			config.label = self.html();

		if (isMOBILE && config.autofocus)
			config.autofocus = false;

		config.PATH = self.path.replace(/\./g, '_');

		self.aclass(cls + ' invisible');
		self.rclass('invisible', 100);
		self.redraw();

		self.event('input change', function() {
			if (nobindcamouflage)
				nobindcamouflage = false;
			else
				self.check();
		});

		self.event('click', cls2 + '-checkbox', function() {

			if (config.disabled) {
				$(this).blur();
				return;
			}

			self.change(true);
			var val = self.get();

			if (val === 1)
				val = 0;
			else if (val === 0)
				val = 1;
			else if (val === true)
				val = false;
			else
				val = true;
			self.set(val, 2);
		});

		self.event('focus', 'input,' + cls2 + '-value', function() {

			if (config.disabled) {
				$(this).blur();
				return;
			}

			focused = true;
			self.camouflage(false);
			self.aclass(cls + '-focused');
			config.autocomplete && EXEC(self.makepath(config.autocomplete), self, input.parent());
			if (config.autosource) {
				var opt = {};
				opt.element = self.element;
				opt.search = GET(self.makepath(config.autosource));
				opt.callback = function(value) {
					var val = typeof(value) === 'string' ? value : value[config.autovalue];
					if (config.autoexec) {
						EXEC(self.makepath(config.autoexec), value, function(val) {
							self.set(val, 2);
							self.change();
							self.bindvalue();
						});
					} else {
						self.set(val, 2);
						self.change();
						self.bindvalue();
					}
				};
				SETTER('autocomplete', 'show', opt);
			} else if (config.mask) {
				setTimeout(function(input) {
					input.selectionStart = input.selectionEnd = 0;
				}, 50, this);
			} else if (config.dirsource && (config.autofocus != false && config.autofocus != 0)) {
				if (!isdirvisible)
					self.find(cls2 + '-control').trigger('click');
			} else if (config.type === 'date' || config.type === 'time') {
				setTimeout(function() {
					self.element.find(cls2 + '-icon-right').trigger('click');
				}, 300);
			}
		});

		self.event('paste', 'input', function(e) {

			if (config.mask) {
				var val = (e.originalEvent.clipboardData || window.clipboardData).getData('text');
				self.set(val.replace(/\s|\t/g, ''));
				e.preventDefault();
			}

			self.check();
		});

		self.event('keydown', 'input', function(e) {

			var t = this;
			var code = e.which;

			if (t.readOnly || config.disabled) {
				// TAB
				if (e.keyCode !== 9) {
					if (config.dirsource) {
						self.find(cls2 + '-control').trigger('click');
						return;
					}
					e.preventDefault();
					e.stopPropagation();
				}
				return;
			}

			if (!config.disabled && config.dirsource && (code === 13 || code > 30)) {
				self.find(cls2 + '-control').trigger('click');
				return;
			}

			if (config.mask) {

				if (e.metaKey) {
					if (code === 8 || code === 127) {
						e.preventDefault();
						e.stopPropagation();
					}
					return;
				}

				if (code === 32) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				var beg = e.target.selectionStart;
				var end = e.target.selectionEnd;
				var val = t.value;
				var c;

				if (code === 8 || code === 127) {

					if (beg === end) {
						c = config.mask.substring(beg - 1, beg);
						t.value = val.substring(0, beg - 1) + c + val.substring(beg);
						self.curpos(beg - 1);
					} else {
						for (var i = beg; i <= end; i++) {
							c = config.mask.substring(i - 1, i);
							val = val.substring(0, i - 1) + c + val.substring(i);
						}
						t.value = val;
						self.curpos(beg);
					}

					e.preventDefault();
					return;
				}

				if (code > 40) {

					var cur = String.fromCharCode(code);

					if (mask && mask[beg]) {
						if (!mask[beg].test(cur)) {
							e.preventDefault();
							return;
						}
					}

					c = config.mask.charCodeAt(beg);
					if (c !== 95) {
						beg++;
						while (true) {
							c = config.mask.charCodeAt(beg);
							if (c === 95 || isNaN(c))
								break;
							else
								beg++;
						}
					}

					if (c === 95) {

						val = val.substring(0, beg) + cur + val.substring(beg + 1);
						t.value = val;
						beg++;

						while (beg < config.mask.length) {
							c = config.mask.charCodeAt(beg);
							if (c === 95)
								break;
							else
								beg++;
						}

						self.curpos(beg);
					} else
						self.curpos(beg + 1);

					e.preventDefault();
					e.stopPropagation();
				}
			}

		});

		self.event('blur', 'input,' + cls2 + '-value', function() {
			focused = false;
			self.camouflage(true);
			self.rclass(cls + '-focused');
		});

		self.event('click', cls2 + '-control', function() {

			if (config.disabled || isdirvisible)
				return;

			if (config.type === 'icon') {
				opt = {};
				opt.element = self.element;
				opt.value = self.get();
				opt.empty = true;
				opt.callback = function(val) {
					self.change(true);
					self.set(val, 2);
					self.check();
					rawvalue[0].focus();
				};
				SETTER('faicons', 'show', opt);
				return;
			} else if (config.type === 'color') {
				opt = {};
				opt.element = self.element;
				opt.value = self.get();
				opt.empty = true;
				opt.callback = function(al) {
					self.change(true);
					self.set(al, 2);
					self.check();
					rawvalue[0].focus();
				};
				SETTER('colorpicker', 'show', opt);
				return;
			} else if (config.type === 'emoji') {
				opt = {};
				opt.element = self.element;
				opt.value = self.get();
				opt.empty = true;
				opt.callback = function(al) {
					self.change(true);
					self.set(al, 2);
					self.check();
					rawvalue[0].focus();
				};
				SETTER('emoji', 'show', opt);
				return;
			}

			if (!config.dirsource)
				return;

			isdirvisible = true;
			setTimeout(function() {
				isdirvisible = false;
			}, 500);

			var opt = {};
			opt.element = self.find(cls2 + '-control');
			opt.items = dirsource || GET(self.makepath(config.dirsource));
			opt.offsetY = -1 + (config.diroffsety || 0);
			opt.offsetX = 0 + (config.diroffsetx || 0);
			opt.placeholder = config.dirplaceholder;
			opt.render = config.dirrender ? GET(self.makepath(config.dirrender)) : null;
			opt.custom = !!config.dircustom;
			opt.offsetWidth = 2;
			opt.minwidth = config.dirminwidth || 200;
			opt.maxwidth = config.dirmaxwidth;
			opt.key = config.dirkey || config.key;
			opt.empty = config.dirempty;
			opt.checkbox = !!config.multiple;

			var val = self.get();

			if (config.multiple) {
				for (var i = 0; i < opt.items.length; i++) {
					var item = opt.items[i];
					if (val instanceof Array) {
						item.selectedts = val.indexOf(item[config.dirvalue || config.value]);
						item.selected = item.selectedts !== -1;
					} else
						item.selected = false;
				}
			} else
				opt.selected = val;

			if (config.dirraw)
				opt.raw = true;

			if (config.dirsearch != null)
				opt.search = config.dirsearch;

			if (dirsource && config.direxclude == false && !config.multiple) {
				for (var i = 0; i < dirsource.length; i++) {
					var item = dirsource[i];
					if (item)
						item.selected = typeof(item) === 'object' && item[config.dirvalue] === val;
				}
			} else if (config.direxclude) {
				opt.exclude = function(item) {
					return item ? item[config.dirvalue] === val : false;
				};
			}

			opt.callback = function(item, el, custom) {

				// empty
				if (item == null || (config.multiple && !item.length)) {
					rawvalue.html('');
					self.set(config.multiple ? [] : null, 2);
					self.change();
					self.check();
					return;
				}

				if (config.multiple) {

					var arr = [];

					for (var i = 0; i < item.length; i++) {
						var m = item[i];
						arr.push(m[config.dirvalue || config.value]);
					}

					self.set(arr, 2);
					self.change(true);
					// self.bindvalue();
					return;
				}

				var val = custom || typeof(item) === 'string' ? item : item[config.dirvalue || config.value];
				if (custom && typeof(config.dircustom) === 'string') {
					var fn = GET(config.dircustom);
					fn(val, function(val) {
						self.set(val, 2);
						self.change(true);
						self.bindvalue();
					});
				} else if (custom) {
					if (val) {
						self.set(val, 2);
						self.change(true);
						if (dirsource)
							self.bindvalue();
						else
							input.val(val);
					}
				} else {
					self.set(val, 2);
					self.change(true);
					if (dirsource)
						self.bindvalue();
					else
						input.val(val);
				}

				rawvalue[0].focus();
			};

			SETTER('directory', 'show', opt);
		});

		self.event('click', cls2 + '-placeholder,' + cls2 + '-label', function(e) {
			if (!config.disabled) {
				if (config.dirsource) {
					e.preventDefault();
					e.stopPropagation();
					self.find(cls2 + '-control').trigger('click');
				} else if (!config.camouflage || $(e.target).hclass(cls + '-placeholder')) {
					if (input.length) {
						input[0].focus();
					} else
						rawvalue[0].focus();
				}
			}
		});

		self.event('click', cls2 + '-icon-left,' + cls2 + '-icon-right', function(e) {

			if (config.disabled)
				return;

			var el = $(this);
			var left = el.hclass(cls + '-icon-left');
			var opt;

			if (config.dirsource && left && config.liconclick) {
				e.preventDefault();
				e.stopPropagation();
			}

			if (!left && !config.riconclick) {
				if (config.type === 'date') {
					opt = {};
					opt.element = self.element;
					opt.value = self.get();
					opt.callback = function(val) {
						self.change(true);
						self.set(val);
					};
					SETTER('datepicker', 'show', opt);
				} else if (config.type === 'time') {
					opt = {};
					opt.element = self.element;
					opt.value = self.get();
					opt.callback = function(val) {
						self.change(true);
						self.set(val);
					};
					SETTER('timepicker', 'show', opt);
				} else if (config.type === 'search')
					self.set('');
				else if (config.type === 'password')
					self.password();
				else if (config.type === 'number' || config.type === 'number2') {
					var tmp = $(e.target);
					if (tmp.attr('class').indexOf('fa-') !== -1) {
						var n = tmp.hclass('fa-caret-up') ? 1 : -1;
						self.change(true);
						var val = self.preparevalue((self.get() || 0) + (config.increment * n));
						self.set(val, 2);
					}
				}
				return;
			}

			if (left && config.liconclick)
				EXEC(self.makepath(config.liconclick), self, el);
			else if (config.riconclick)
				EXEC(self.makepath(config.riconclick), self, el);
			else if (left && config.type === 'search')
				self.set('');

		});
	};

	self.camouflage = function(is) {
		if (config.camouflage) {
			if (is) {
				var t = input[0];
				var arr = t.value.split('');
				for (var i = 0; i < arr.length; i++)
					arr[i] = typeof(config.camouflage) === 'string' ? config.camouflage : '•';
				nobindcamouflage = true;
				t.value = arr.join('');
			} else {
				nobindcamouflage = true;
				var val = self.get();
				input[0].value = val == null ? '' : val;
			}
			self.tclass(cls + '-camouflaged', is);
		}
	};

	self.curpos = function(pos) {
		var el = input[0];
		if (el.createTextRange) {
			var range = el.createTextRange();
			range.move('character', pos);
			range.select();
		} else if (el.selectionStart) {
			el.focus();
			el.setSelectionRange(pos, pos);
		}
	};

	self.validate = function(value) {

		if ((!config.required || config.disabled) && !self.forcedvalidation())
			return true;

		if (config.disabled)
			return true;

		if (config.dirsource)
			return !!value;

		if (customvalidator)
			return customvalidator(value);

		if (config.type === 'date')
			return value instanceof Date && !isNaN(value.getTime());

		if (config.type === 'checkbox')
			return value === true || value === 1;

		if (value == null)
			value = '';
		else
			value = value.toString();

		if (config.mask && typeof(value) === 'string' && value.indexOf('_') !== -1)
			return false;

		if (config.minlength && value.length < config.minlength)
			return false;

		switch (config.type) {
			case 'email':
				return value.isEmail();
			case 'phone':
				return value.isPhone();
			case 'url':
				return value.isURL();
			case 'zip':
				return (/^\d{5}(?:[-\s]\d{4})?$/).test(value);
			case 'currency':
			case 'number':
			case 'number2':
				if (config.type === 'number2' && (value == null || value == ''))
					return false;
				value = value.parseFloat();
				if ((config.minvalue != null && value < config.minvalue) || (config.maxvalue != null && value > config.maxvalue))
					return false;
				return config.minvalue == null ? value > 0 : true;
		}

		return value.length > 0;
	};

	self.offset = function() {
		var offset = self.element.offset();
		var control = self.find(cls2 + '-control');
		var width = control.width() + 2;
		return { left: offset.left, top: control.offset().top + control.height(), width: width };
	};

	self.password = function(show) {
		var visible = show == null ? input.attr('type') === 'text' : show;
		input.attr('type', visible ? 'password' : 'text');
		self.find(cls2 + '-icon-right').find('i').tclass(config.ricon, visible).tclass('fa-eye-slash', !visible);
	};

	self.preparevalue = function(value) {
		if (config.type === 'number' && (config.type !== 'number2' || value) && (config.minvalue != null || config.maxvalue != null)) {
			var tmp = typeof(value) === 'string' ? +value.replace(',', '.') : value;
			if (config.minvalue > tmp)
				value = config.minvalue;
			if (config.maxvalue < tmp)
				value = config.maxvalue;
		}
		return value;
	};

	self.getterin = self.getter;
	self.getter = function(value, realtime, nobind) {

		if (nobindcamouflage)
			return;

		if (config.mask && config.masktidy) {
			var val = [];
			for (var i = 0; i < value.length; i++) {
				if (config.mask.charAt(i) === '_')
					val.push(value.charAt(i));
			}
			value = val.join('');
		}

		self.getterin(self.preparevalue(value), realtime, nobind);
	};

	self.setterin = self.setter;

	self.setter = function(value, path, type) {

		if (config.mask) {
			if (value) {

				if (config.masktidy) {
					var index = 0;
					var val = [];
					for (var i = 0; i < config.mask.length; i++) {
						var c = config.mask.charAt(i);
						val.push(c === '_' ? (value.charAt(index++) || '_') : c);
					}
					value = val.join('');
				}

				// check values
				if (mask) {
					var arr = [];
					for (var i = 0; i < mask.length; i++) {
						var c = value.charAt(i);
						if (mask[i] && mask[i].test(c))
							arr.push(c);
						else
							arr.push(config.mask.charAt(i));
					}
					value = arr.join('');
				}

			} else
				value = config.mask;
		}

		self.setterin(value, path, type);
		self.bindvalue();
		config.camouflage && !focused && setTimeout(self.camouflage, type === 'show' ? 2000 : 1, true);

		if (config.type === 'password')
			self.password(true);
	};

	self.check = function() {

		var is = false;

		if (config.dirsource)
			is = !!rawvalue.text();
		else
			is = input && input.length ? !!input[0].value : !!self.get();

		if (binded === is)
			return;

		binded = is;
		placeholder && placeholder.tclass('hidden', is);
		self.tclass(cls + '-binded', is);

		if (config.type === 'search')
			self.find(cls2 + '-icon-' + (config.searchalign === 1 ? 'right' : 'left')).find('i').tclass(config.searchalign === 1 ? config.ricon : config.licon, !is).tclass('fa-times', is);
	};

	self.bindvalue = function() {

		var value = self.get();

		if (dirsource) {

			var item;
			var text = [];

			for (var i = 0; i < dirsource.length; i++) {
				item = dirsource[i];
				if (typeof(item) === 'string') {
					if (item === value)
						break;
					item = null;
				} else if (config.multiple) {
					var v = item[config.dirvalue || config.value];
					var index = value instanceof Array ? value.indexOf(v) : -1;
					if (index !== -1)
						text.push({ index: index, value: item[config.dirkey || config.key] });
				} else if (item[config.dirvalue || config.value] === value) {
					item = item[config.dirkey || config.key];
					break;
				} else
					item = null;
			}

			if (config.multiple) {

				text.quicksort('index');
				for (var i = 0; i < text.length; i++)
					text[i] = text[i].value;

				item = text.join(', ');
			} else if (value && item == null && config.dircustom)
				item = value;

			if (config.dirraw)
				rawvalue.html(item || '');
			else
				rawvalue.text(item || '');

		} else if (config.dirsource) {
			if (config.dirdetail) {
				self.EXEC(config.dirdetail, value, function(val) {
					if (config.dirraw)
						rawvalue.html(val || '');
					else
						rawvalue.text(val || '');
					self.check();
				});
				return;
			} else if (config.dirraw)
				rawvalue.html(value || '');
			else
				rawvalue.text(value || '');
		} else {
			switch (config.type) {
				case 'color':
					rawvalue.css('background-color', value || '');
					break;
				case 'icon':
					rawvalue.html('<i class="{0}"></i>'.format(value || ''));
					break;
				case 'emoji':
					rawvalue.html(value);
					break;
				case 'checkbox':
					self.tclass(cls + '-checked', value === true || value === 1);
					break;
			}
		}

		self.check();
	};

	self.redraw = function() {

		if (!config.ricon) {
			if (config.dirsource)
				config.ricon = 'angle-down';
			else if (config.type === 'date') {
				config.ricon = 'calendar';
				if (!config.align && !config.innerlabel)
					config.align = 1;
			} else if (config.type === 'icon' || config.type === 'color' || config.type === 'emoji') {
				config.ricon = 'angle-down';
				if (!config.align && !config.innerlabel)
					config.align = 1;
			} else if (config.type === 'time') {
				config.ricon = 'clock-o';
				if (!config.align && !config.innerlabel)
					config.align = 1;
			} else if (config.type === 'search')
				if (config.searchalign === 1)
					config.ricon = 'search';
				else
					config.licon = 'search';
			else if (config.type === 'password')
				config.ricon = 'eye';
			else if (config.type === 'number' || config.type === 'number2') {
				if (!config.align && !config.innerlabel)
					config.align = 1;
			}
		}

		self.tclass(cls + '-masked', !!config.mask);
		self.rclass2(cls + '-type-');

		if (config.type)
			self.aclass(cls + '-type-' + config.type);


		var html;
		var is = false;

		if (config.type === 'checkbox') {
			html = '<div class="{0}-checkbox"><span><i class="{checkicon}"></i></span><label>{label}</label></div>'.format(cls).arg(config);
		} else {
			is = true;
			var opt = CLONE(config);
			if (opt.type === 'number2')
				opt.type = 'number';
			html = W.ui_input_template(opt);
		}

		self.html(html);

		if (is) {
			input = self.find('input,textarea');
			rawvalue = self.find(cls2 + '-value');
			placeholder = self.find(cls2 + '-placeholder');
		} else
			input = rawvalue = placeholder = null;
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'icon':
				if (value && value.indexOf(' ') === -1)
					config.icon = 'fa fa-' + value;
				break;
			case 'dirsource':
				if (config.dirajax || value.indexOf('/') !== -1) {
					dirsource = null;
					self.bindvalue();
				} else {
					if (value.indexOf(',') !== -1) {
						dirsource = self.parsesource(value);
						self.bindvalue();
					} else {
						self.datasource(value, function(path, value) {
							dirsource = value;
							self.bindvalue();
						});
					}
				}
				self.tclass(cls + '-dropdown', !!value);
				input.prop('readonly', !!config.disabled || !!config.dirsource);
				break;
			case 'disabled':
				self.tclass('ui-disabled', !!value);
				input && input.prop('readonly', !!value || !!config.dirsource);
				self.reset();
				break;
			case 'required':
				self.tclass(cls + '-required', !!value);
				self.reset();
				break;
			case 'type':
				self.type = value;
				break;
			case 'validate':
				customvalidator = value ? (/\(|=|>|<|\+|-|\)/).test(value) ? FN('value=>' + value) : (function(path) { path = self.makepath(path); return function(value) { return GET(path)(value); }; })(value) : null;
				break;
			case 'innerlabel':
				self.tclass(cls + '-inner', !!value);
				break;
			case 'monospace':
				self.tclass(cls + '-monospace', !!value);
				break;
			case 'maskregexp':
				if (value) {
					mask = value.toLowerCase().split(',');
					for (var i = 0; i < mask.length; i++) {
						var m = mask[i];
						if (!m || m === 'null')
							mask[i] = '';
						else
							mask[i] = new RegExp(m);
					}
				} else
					mask = null;
				break;
			case 'mask':
				config.mask = value.replace(/#/g, '_');
				break;
		}
	};

	self.formatter(function(path, value) {
		if (value) {
			switch (config.type) {
				case 'lower':
					return (value + '').toLowerCase();
				case 'upper':
					return (value + '').toUpperCase();
				case 'phone':
					return (value + '').replace(/\s/g, '');
				case 'email':
					return (value + '').toLowerCase();
				case 'date':
					return value.format(config.format || DEF.dateformat || 'yyyy-MM-dd');
				case 'time':
					return value.format(config.format || 'HH:mm');
				case 'number':
					return config.format ? value.format(config.format) : value;
				case 'number2':
					return value == null ? '' : config.format ? value.format(config.format) : value;
			}
		}

		return value;
	});

	self.parser(function(path, value) {
		if (value) {
			var tmp;
			switch (config.type) {
				case 'date':
					tmp = self.get();
					if (tmp)
						tmp = tmp.format('HH:mm');
					else
						tmp = '';
					return value + (tmp ? (' ' + tmp) : '');
				case 'lower':
				case 'email':
					value = value.toLowerCase();
					break;
				case 'upper':
					value = value.toUpperCase();
					break;
				case 'phone':
					value = value.replace(/\s/g, '');
					break;
				case 'number2':
					if (value) {
						var type = typeof(value);
						if (type === 'string' && (/^[\-0-9\.\,]+$/).test(value))
							value = value.parseFloat();
						else if (type !== 'number')
							value = null;
					} else
						value = null;
					break;
				case 'time':
					tmp = value.split(':');
					var dt = self.get();
					value = dt ? new Date(dt.getTime()) : new Date();
					value.setHours((tmp[0] || '0').parseInt());
					value.setMinutes((tmp[1] || '0').parseInt());
					value.setSeconds((tmp[2] || '0').parseInt());
					break;
			}
		} else {
			switch (config.type) {
				case 'number':
					value = 0;
					break;
				case 'number2':
				case 'date':
					value = null;
					break;
			}
		}

		return value ? config.spaces === false ? value.replace(/\s/g, '') : value : value;
	});

	self.state = function(type, what) {
		if (type) {

			if (type === 1 && what === 4) {
				self.rclass(cls + '-ok ' + cls + '-invalid');
				self.$oldstate = null;
				return;
			}

			var invalid = config.required ? self.isInvalid() : self.forcedvalidation() ? self.isInvalid() : false;
			if (invalid !== self.$oldstate) {
				self.$oldstate = invalid;
				self.tclass(cls + '-invalid', invalid);
				self.tclass(cls + '-ok', !invalid);
				config.error && self.find(cls2 + '-error').tclass('hidden', !invalid);
			}
		}
	};

	self.forcedvalidation = function() {

		if (!config.forcevalidation)
			return false;

		if (config.type === 'number' || config.type === 'number2')
			return false;

		var val = self.get();

		if (config.type === 'checkbox')
			return val === true || val === 1;

		return (config.type === 'phone' || config.type === 'email') && (val != null && (typeof(val) === 'string' && val.length !== 0));
	};

});
/*IMAGE UPLOAD*/
COMPONENT('imageuploader', function(self) {

	var name, input, queue;
	var tmpresponse = [];
	var tmperror = [];

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();

	self.upload = self.browse = function(opt) {

		tmpresponse = [];
		tmperror = [];

		// opt.width
		// opt.height
		// opt.url
		// opt.keeporiginal
		// opt.callback
		// opt.background
		// opt.quality
		// opt.multiple

		self.find('input').prop('multiple', !!opt.multiple);
		self.opt = opt;
		input.click();
	};

	var resizewidth = function(w, h, size) {
		return Math.ceil(w * (size / h));
	};

	var resizeheight = function(w, h, size) {
		return Math.ceil(h * (size / w));
	};

	self.resizeforce = function(image) {
		var opt = self.opt;
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		canvas.width = opt.width;
		canvas.height = opt.height;
		ctx.fillStyle = opt.background || '#FFFFFF';
		ctx.fillRect(0, 0, opt.width, opt.height);

		var w = 0;
		var h = 0;
		var x = 0;
		var y = 0;
		var is = false;
		var diff = 0;

		if (image.width > opt.width || image.height > opt.height) {
			if (image.width > image.height) {

				w = resizewidth(image.width, image.height, opt.height);
				h = opt.height;

				if (w < opt.width) {
					w = opt.width;
					h = resizeheight(image.width, image.height, opt.width);
				}

				if (w > opt.width) {
					diff = w - opt.width;
					x -= (diff / 2) >> 0;
				}

				is = true;
			} else if (image.height > image.width) {

				w = opt.width;
				h = resizeheight(image.width, image.height, opt.width);

				if (h < opt.height) {
					h = opt.height;
					w = resizewidth(image.width, image.height, opt.height);
				}

				if (h > opt.height) {
					diff = h - opt.height;
					y -= (diff / 2) >> 0;
				}

				is = true;
			}
		}

		if (!is) {
			if (image.width < opt.width && image.height < opt.height) {
				w = image.width;
				h = image.height;
				x = (opt.width / 2) - (image.width / 2);
				y = (opt.height / 2) - (image.height / 2);
			} else if (image.width >= image.height) {
				w = opt.width;
				h = image.height * (opt.width / image.width);
				y = (opt.height / 2) - (h / 2);
			} else {
				h = opt.height;
				w = (image.width * (opt.height / image.height)) >> 0;
				x = (opt.width / 2) - (w / 2);
			}

		}
		ctx.drawImage(image, x, y, w, h);
		console.log(canvas);
		var base64 = canvas.toDataURL('image/jpeg', (opt.quality || 90) * 0.01);
		self.uploadforce(base64);
	};

	self.make = function() {
		self.aclass('hidden');
		self.append('<input type="file" accept="image/*" multiple />');
		input = self.find('input');
		self.event('change', 'input', function() {
			SETTER('loading/show');
			queue = [];
			for (var i = 0; i < this.files.length; i++)
				queue.push(this.files[i]);
			self.wait();
			this.value = '';
		});
	};

	self.wait = function() {
		if (!queue || !queue.length) {
			self.opt.callback(tmpresponse, tmperror);
			self.opt = null;
			queue = null;
			SETTER('loading/hide', 300);
		} else
			self.load(queue.shift());
	};

	self.load = function(file) {
		name = file.name;
		self.getorientation(file, function(orient) {
			var reader = new FileReader();
			reader.onload = function () {
				var img = new Image();
				img.onload = function() {

					if (self.opt.keeporiginal && img.width == self.opt.width && img.height == self.opt.height) {
						self.upload(reader.result);
						self.change(true);
					} else {
						self.resizeforce(img);
						self.change(true);
					}

				};
				img.crossOrigin = 'anonymous';
				if (orient < 2) {
					img.src = reader.result;
				} else {
					self.resetorientation(reader.result, orient, function(url) {
						img.src = url;
					});
				}
			};
			reader.readAsDataURL(file);
		});
	};

	self.uploadforce = function(base64) {
		if (base64) {
			var data = (new Function('base64', 'filename', 'return ' + (self.opt.schema || '{file:base64,name:filename}')))(base64, name);
			AJAX('POST ' + self.opt.url.env(true), data, function(response, err) {
				if (err) {
					tmperror.push(err + '');
					self.wait();
				} else {
					var tmp = response instanceof Array ? response[0] : response;
					if (tmp) {
						if (tmp.error)
							tmperror.push(err + '');
						else
							tmpresponse.push(tmp);
					}
					self.wait();
				}
			});
		}
	};

	// http://stackoverflow.com/a/32490603
	self.getorientation = function(file, callback) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var view = new DataView(e.target.result);
			if (view.getUint16(0, false) != 0xFFD8)
				return callback(-2);
			var length = view.byteLength;
			var offset = 2;
			while (offset < length) {
				var marker = view.getUint16(offset, false);
				offset += 2;
				if (marker == 0xFFE1) {
					if (view.getUint32(offset += 2, false) != 0x45786966)
						return callback(-1);
					var little = view.getUint16(offset += 6, false) == 0x4949;
					offset += view.getUint32(offset + 4, little);
					var tags = view.getUint16(offset, little);
					offset += 2;
					for (var i = 0; i < tags; i++)
						if (view.getUint16(offset + (i * 12), little) == 0x0112)
							return callback(view.getUint16(offset + (i * 12) + 8, little));
				} else if ((marker & 0xFF00) != 0xFF00)
					break;
				else
					offset += view.getUint16(offset, false);
			}
			return callback(-1);
		};
		reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
	};

	self.resetorientation = function(src, srcOrientation, callback) {
		var img = new Image();
		img.onload = function() {
			var width = img.width;
			var height = img.height;
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');

			canvas.width = width;
			canvas.height = height;

			switch (srcOrientation) {
				case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
				case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
				case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
				case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
				case 6: ctx.transform(-1, 0, 0, 1, width, 0); break;
				case 7: ctx.transform(0, -1, -1, 0, height, width); break;
				case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
			}

			ctx.drawImage(img, 0, 0);

			if (srcOrientation === 6) {
				var canvas2 = document.createElement('canvas');
				canvas2.width = width;
				canvas2.height = height;
				var ctx2 = canvas2.getContext('2d');
				ctx2.scale(-1, 1);
				ctx2.drawImage(canvas, -width, 0);
				callback(canvas2.toDataURL());
			} else
				callback(canvas.toDataURL());
		};
		img.src = src;
	};
});
/*FILEUPLOAD*/
COMPONENT('fileupload', function(self, config) {

	var id = 'fileupload' + self._id;
	var input = null;

	self.readonly();
	self.nocompile && self.nocompile();

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'accept':
				var el = $('#' + id);
				if (value)
					el.prop('accept', value);
				else
					el.removeProp('accept');
				break;
			case 'multiple':
				var el = $('#' + id);
				if (value)
					el.prop('multiple', true);
				else
					el.removeProp('multiple');
				break;
			case 'label':
				self.html(value);
				break;
		}
	};

	self.make = function() {

		config.disabled && self.aclass('ui-disabled');
		$(document.body).append('<input type="file" id="{0}" class="hidden"{1}{2} />'.format(id, config.accept ? ' accept="{0}"'.format(config.accept) : '', config.multiple ? ' multiple="multiple"' : ''));
		input = $('#' + id);

		self.event('click', function() {
			!config.disabled && input.click();
		});

		input.on('change', function(evt) {
			!config.disabled && self.upload(evt.target.files);
			this.value = '';
		});
	};

	self.upload = function(files) {

		var data = new FormData();
		var el = this;

		for (var i = 0, length = files.length; i < length; i++) {

			var filename = files[i].name;
			var index = filename.lastIndexOf('/');

			if (index === -1)
				index = filename.lastIndexOf('\\');

			if (index !== -1)
				filename = filename.substring(index + 1);

			data.append('file' + i, files[i], filename);
		}

		SETTER('loading', 'show');
		UPLOAD(config.url, data, function(response, err) {

			el.value = '';
			SETTER('loading', 'hide', 500);

			if (err) {
				SETTER('snackbar', 'warning', err.toString());
				return;
			}

			self.change();

			if (config.array)
				self.push(response);
			else
				self.set(response);
		});
	};

	self.destroy = function() {
		input.off().remove();
	};
});
/*Miniform*/
COMPONENT('miniform', 'zindex:12', function(self, config, cls) {

	var cls2 = '.' + cls;
	var csspos = {};

	if (!W.$$miniform) {

		W.$$miniform_level = W.$$miniform_level || 1;
		W.$$miniform = true;

		$(document).on('click', cls2 + '-button-close', function() {
			SET($(this).attrd('path'), '');
		});

		var resize = function() {
			setTimeout2(self.name, function() {
				for (var i = 0; i < M.components.length; i++) {
					var com = M.components[i];
					if (com.name === 'miniform' && !HIDDEN(com.dom) && com.$ready && !com.$removed)
						com.resize();
				}
			}, 200);
		};

		ON('resize2', resize);

		$(document).on('click', cls2 + '-container', function(e) {

			if (e.target === this) {
				var com = $(this).component();
				if (com && com.config.closeoutside) {
					com.set('');
					return;
				}
			}

			var el = $(e.target);

			if (el.hclass(cls + '-container-cell')) {
				var form = $(this).find(cls2);
				var c = cls + '-animate-click';
				form.aclass(c).rclass(c, 300);
				var com = el.parent().component();
				if (com && com.config.closeoutside)
					com.set('');
			}
		});
	}

	self.readonly();
	self.submit = function() {
		if (config.submit)
			self.EXEC(config.submit, self.hide, self.element);
		else
			self.hide();
	};

	self.cancel = function() {
		config.cancel && self.EXEC(config.cancel, self.hide);
		self.hide();
	};

	self.hide = function() {
		if (config.independent)
			self.hideforce();
		self.esc(false);
		self.set('');
	};

	self.esc = function(bind) {
		if (bind) {
			if (!self.$esc) {
				self.$esc = true;
				$(W).on('keydown', self.esc_keydown);
			}
		} else {
			if (self.$esc) {
				self.$esc = false;
				$(W).off('keydown', self.esc_keydown);
			}
		}
	};

	self.esc_keydown = function(e) {
		if (e.which === 27 && !e.isPropagationStopped()) {
			var val = self.get();
			if (!val || config.if === val) {
				e.preventDefault();
				e.stopPropagation();
				self.hide();
			}
		}
	};

	self.hideforce = function() {
		if (!self.hclass('hidden')) {
			self.aclass('hidden');
			self.release(true);
			self.find(cls2).rclass(cls + '-animate');
			W.$$miniform_level--;
		}
	};

	self.icon = function(value) {
		var el = this.rclass2('fa');
		value.icon && el.aclass(value.icon.indexOf(' ') === -1 ? ('fa fa-' + value.icon) : value.icon);
		this.tclass('hidden', !value.icon);
	};

	self.resize = function() {

		if (!config.center || self.hclass('hidden'))
			return;

		var ui = self.find(cls2);
		var fh = ui.innerHeight();
		var wh = WH;
		var r = (wh / 2) - (fh / 2);
		csspos.marginTop = (r > 30 ? (r - 15) : 20) + 'px';
		ui.css(csspos);
	};

	self.make = function() {

		$(document.body).append('<div id="{0}" class="hidden {4}-container invisible"><div class="{4}-container-table"><div class="{4}-container-cell"><div class="{4}" style="max-width:{1}px"><div data-bind="@config__text span:value.title__change .{4}-icon:@icon" class="{4}-title"><button name="cancel" class="{4}-button-close{3}" data-path="{2}"><i class="fa fa-times"></i></button><i class="{4}-icon"></i><span></span></div></div></div></div>'.format(self.ID, config.width || 800, self.path, config.closebutton == false ? ' hidden' : '', cls));

		var scr = self.find('> script');
		self.template = scr.length ? scr.html().trim() : '';
		if (scr.length)
			scr.remove();

		var el = $('#' + self.ID);
		var body = el.find(cls2)[0];

		while (self.dom.children.length)
			body.appendChild(self.dom.children[0]);

		self.rclass('hidden invisible');
		self.replace(el, true);

		self.event('scroll', function() {
			EMIT('scroll', self.name);
			EMIT('reflow', self.name);
		});

		self.event('click', 'button[name]', function() {
			var t = this;
			switch (t.name) {
				case 'submit':
					self.submit(self.hide);
					break;
				case 'cancel':
					!t.disabled && self[t.name](self.hide);
					break;
			}
		});

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]')[0].disabled && setTimeout2(self.ID + 'enter', self.submit, 500);
		});
	};

	self.configure = function(key, value, init, prev) {
		if (!init) {
			switch (key) {
				case 'width':
					value !== prev && self.find(cls2).css('max-width', value + 'px');
					break;
				case 'closebutton':
					self.find(cls2 + '-button-close').tclass('hidden', value !== true);
					break;
			}
		}
	};

	self.setter = function(value) {

		setTimeout2(cls + '-noscroll', function() {
			$('html').tclass(cls + '-noscroll', !!$(cls2 + '-container').not('.hidden').length);
		}, 50);

		var isHidden = value !== config.if;

		if (self.hclass('hidden') === isHidden) {
			if (!isHidden) {
				config.reload && self.EXEC(config.reload, self);
				config.default && DEFAULT(self.makepath(config.default), true);
			}
			return;
		}

		setTimeout2(cls, function() {
			EMIT('reflow', self.name);
		}, 10);

		if (isHidden) {
			if (!config.independent)
				self.hideforce();
			return;
		}

		if (self.template) {
			var is = self.template.COMPILABLE();
			self.find(cls2).append(self.template);
			self.template = null;
			is && COMPILE();
		}

		if (W.$$miniform_level < 1)
			W.$$miniform_level = 1;

		W.$$miniform_level++;

		self.css('z-index', W.$$miniform_level * config.zindex);
		self.rclass('hidden');

		self.resize();
		self.release(false);

		config.reload && self.EXEC(config.reload, self);
		config.default && DEFAULT(self.makepath(config.default), true);

		setTimeout(function() {
			self.rclass('invisible');
			self.find(cls2).aclass(cls + '-animate');
			config.autofocus && self.autofocus(config.autofocus);
		}, 200);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.ID, function() {
			self.css('z-index', (W.$$miniform_level * config.zindex) + 1);
		}, 400);

		config.closeesc && self.esc(true);
	};
});
/*UPLOAD*/
COMPONENT('upload', function(self) {

	var id = 'upload' + self._id;
	var input = null;

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.show = function(opt) {

		self.opt = opt;

		if (opt.accept)
			input.attr('accept', opt.accept);
		else
			input.removeAttr('accept');

		if (opt.multiple)
			input.attr('multiple', 'multiple');
		else
			input.removeAttr('multiple');

		input[0].value = '';
		input.trigger('click');
	};

	self.make = function() {

		$(document.body).append('<input type="file" id="{0}" class="hidden" />'.format(id));
		input = $('#' + id);

		input.on('change', function(evt) {
			self.upload(evt.target.files);
			this.value = '';
		});
	};

	self.upload = function(files) {

		var data = new FormData();
		var el = this;

		for (var i = 0, length = files.length; i < length; i++) {

			var filename = files[i].name;
			var index = filename.lastIndexOf('/');

			if (index === -1)
				index = filename.lastIndexOf('\\');

			if (index !== -1)
				filename = filename.substring(index + 1);

			data.append((self.opt.name || 'file') + i, files[i], filename);
		}

		if (self.opt.data) {
			var keys = Object.keys(self.opt.data);
			for (var i = 0; i < keys.length; i++)
				data.append(keys[i], self.opt.data[keys[i]]);
		}

		SETTER('loading', 'show');
		UPLOAD(self.opt.url, data, function(response, err) {

			el.value = '';
			SETTER('loading', 'hide', 1000);

			if (err) {

				if (self.opt.error)
					self.opt.error(err);
				else
					SETTER('snackbar', 'warning', err.toString());

			} else {

				if (typeof(self.opt.callback) === 'string')
					SET(self.opt.callback, response);
				else
					self.opt.callback(response);

				self.change(true);
			}
		});
	};
});

/*INITIALS*/
var TTIC = ['#1abc9c','#2ecc71','#3498db','#9b59b6','#34495e','#16a085','#2980b9','#8e44ad','#2c3e50','#f1c40f','#e67e22','#e74c3c','#d35400','#c0392b'];

Thelpers.initials = function(value) {
	var index = value.indexOf('.');
	var arr = value.substring(index + 1).replace(/\s{2,}/g, ' ').trim().split(' ');
	var initials = ((arr[0].substring(0, 1) + (arr[1] || '').substring(0, 1))).toUpperCase();
	var sum = 0;
	for (var i = 0; i < value.length; i++)
		sum += value.charCodeAt(i);
	return '<span class="initials" style="background-color:{1}" title="{2}">{0}</span>'.format(initials, TTIC[sum % TTIC.length], value);
};

Thelpers.initialsbase64 = function(value, width, height) {

	var index = value.indexOf('.');
	var arr = value.substring(index + 1).replace(/\s{2,}/g, ' ').trim().split(' ');
	var initials = ((arr[0].substring(0, 1) + (arr[1] || '').substring(0, 1))).toUpperCase();
	var sum = 0;

	for (var i = 0; i < value.length; i++)
		sum += value.charCodeAt(i);

	var canvas = W.$initialscanvas;
	if (!canvas)
		canvas = W.$initialscanvas = document.createElement('CANVAS');

	if (canvas.width != width)
		canvas.width = width;

	if (canvas.height != height)
		canvas.height = height;

	var color = TTIC[sum % TTIC.length];
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, width, height);
	ctx.font = 'bold ' + ((width / 2) >> 0) + 'px Arial';
	ctx.fillStyle = '#FFFFFF';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(initials, (width / 2), (height / 2 >> 0) + 5);
	return canvas.toDataURL('image/png');
};

/* - TEMPLATE    - comp
   - REPEATER    - comp
   - DROPDOWN    - comp + saper
   - AIRDP	     - saper
   - TEXTBOX     - comp
   - TEXTAREA    - comp
   - TEXTBOXLIST - comp
   - TEXBOXTAGS  - comp
   - INPUTTAGS   - comp
   - ERROR       - comp + saper
   - CHECKBOX    - comp
   - SELECTED    - comp
   - LISTBOX     - comp
   - ENTER       - comp
   - CLICK       - comp 
   - PAGE        - comp
   - AUDIO       - comp
   - LOADING     - comp
   - NOTIFY      - comp 
   - RADIOBUTTON - comp
   - CONFIRM     - comp
   - TABMENU     - comp + saper
   - AUTOCOMLETE - comp + saper
   - MENU        - comp 
   - EXEC        - comp 
   - MINHeight   - comp 
   - VIEWBOX     - comp
   - PAGINATION  - comp
   - IMPORTER    - comp
   - FORM        - comp
   - LARGEFORM   - comp + saper
   - BOOTSTRAP TABLE - saper
   - LIST MENU   - comp
   - PART        - comp
   - RESOURCE - ???
   - INPUT       - comp
   - IMAGEUPLOAD - comp
   - FILEUPLOAD  - comp
   - UPLOAD		 - comp
   - INITIALS
   - MINIFORM    - comp