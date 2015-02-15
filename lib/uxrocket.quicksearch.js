/**
 * UX Rocket
 * QuickSearch
 * @author Bilal Cinarli
 * @dependency Handlebars
 */

(function($) {
    var ux,

        defaults = {
            menu    : null,
            holder  : ".uxrocket-quicksearch-results",
            cssClass: "",
            list    : '<div id="uxrocket-quicksearch-results" class="{{cssClass}} uxrocket-quicksearch-results">' +
                      '    <ul>' +
                      '    {{#each list}}' +
                      '        <li>{{{url}}}</li>' +
                      '    {{/each}}' +
                      '    </ul>' +
                      '</div>',
            exclude   : '',
            closeDelay: false,

            // callbacks
            onReady   : false,
            onEnter   : false, // callback event on press enter in input field
            onSearch  : false, // callback event on search results
            onSelect  : false, // callback event when selecting a result with arrow keys,
            onRemove  : false  // callback when plugin removed
        },
        events = {
            keyup            : 'keyup.uxQuickSearch',
            click            : 'click.uxQuickSearch',
            touchstart       : 'touchstart.uxQuickSearch',
            pointerdown      : 'MSPointerDown.uxQuickSearch',
            resize           : 'resize.uxQuickSearch',
            orientationchange: 'orientationchange.uxQuickSearch'
        },
        ns = {
            rocket    : 'uxRocket',
            data      : 'uxQuickSearch',
            searchData: 'uxQuickSearchData',
            ready     : 'uxrocket-quicksearch-ready',
            list      : 'uxrocket-quicksearch-results',
            selected  : 'uxrocket-quicksearch-selected',
            highlight : 'uxrocket-quicksearch-highlight'
        };

    // Constructor Method
    var QuickSearch = function(el, options, selector) {
        var $el = $(el),
            opts = $.extend({}, defaults, options, $el.data(), {'selector': selector}),
            menudata = setSearchData(opts.menu, opts.exclude);

        opts.offset = $el.offset();
        opts.width = $el.outerWidth();
        opts.height = $el.outerHeight();
        $el.data(ns.data, opts);
        $el.data(ns.searchData, menudata);

        // call onReady function if any
        callback(opts.onReady);

        // bind the ui interactions
        bindUIActions($el);
    };

    var bindUIActions = function($el) {
        var menu = $el.data(ns.searchData),
            _opts = $el.data(ns.data);

        $el.on(events.keyup, function(e) {
            var query = $(this).val().toLowerCase();

            if(e.keyCode == 38 || e.keyCode == 40) {
                highLightMenu($el, e);
            }
            else if(e.keyCode == 13 && $(this).hasClass(ns.selected)) {
                callback(_opts.onEnter);
            }
            else {
                $(this).removeClass(ns.selected);
                searchQuery($el, query, menu);
            }
        });

        $(document).on(events.click + ' ' + events.touchstart + ' ' + events.pointerdown, function() {
            $(_opts.holder).remove();

        }).on(events.click + ' ' + events.touchstart + ' ' + events.pointerdown, _opts.holder, function(e) {
            // events in holder
            e.stopPropagation();

            var holder = $(this);

            if(_opts.closeDelay) {
                var interval = setTimeout(function() {
                    holder.remove();
                }, _opts.closeDelay);
            }

            else {
                holder.remove();
            }

            callback(_opts.onSelect);

        }).on(events.click + ' ' + events.touchstart + ' ' + events.pointerdown, _opts.holder + ' a', function() {
            // events in holder links
            $(this).addClass(ns.selected);
        });

        $(window).on(events.resize + ' ' + events.orientationchange, function(e) {
            setPosition($el, true);
        });
    };

    var setSearchData = function(menu, exclude) {
        var list = $(menu).find('a'),
            len,
            listModel = {};

        if(exclude != '') {
            list = list.not(exclude);
        }

        len = list.length;

        for(var i = 0; i < len; i++) {
            listModel[i] = {'text': list[i].outerText, 'url': list[i].outerHTML};
        }

        return listModel;
    };

    var searchQuery = function($el, needle, stack) {
        var _opts = $el.data(ns.data),
            $holder = $(_opts.holder),
            len = Object.keys(stack).length,
            matched = [];

        if(needle.length < 2) {
            $holder.remove();
            return;
        }

        for(var i = 0; i < len; i++) {
            var text = stack[i]['text'].toLowerCase();

            if(text.indexOf(needle) > -1) {
                matched.push(stack[i]);
            }
        }

        if(!setResults($el, matched)) {
            $holder.remove();
        }
    };

    var highLightMenu = function($el, e) {
        var direction = 'next',
            _opts = $el.data(ns.data),
            list = $('.' + ns.list),
            highlight = list.find('.' + ns.highlight),
            selected;

        if(e.keyCode == 38) {
            direction = 'prev';
        }

        if(highlight.length == 0) {
            selected = list.find('li:first-child').addClass(ns.highlight);
        } else {
            selected = highlight.removeClass(ns.highlight)[direction]().addClass(ns.highlight);
        }

        $el.val(selected.text()).addClass(ns.selected);
    };

    var setResults = function($el, matched) {
        var _opts = $el.data(ns.data),
            results = {list: matched, cssClass: _opts['cssClass']},
            list = Handlebars.compile(_opts.list)(results),
            $holder = $(_opts.holder);

        if(Object.keys(matched).length < 1) {
            return false;
        }

        if($holder.length == 1) {
            $holder.replaceWith(list);
        }
        else {
            $("body").append(list);
        }

        setPosition($el);

        callback(_opts.onSearch);
    };

    var setPosition = function($el, orientation) {
        var _opts = $el.data(ns.data),
            results = $(_opts.holder),
            resultsW = results.outerWidth();

        if(orientation) {
            _opts.offset = $el.offset();
            _opts.width = $el.outerWidth();
            _opts.height = $el.outerHeight();
        }

        results.css({top: _opts.offset.top + _opts.height, left: _opts.offset.left - (resultsW - _opts.width)});
    };

    // global callback
    var callback = function(fn) {
        // if callback string is function call it directly
        if(typeof fn === 'function') {
            fn.apply(this);
        }

        // if callback defined via data-attribute, call it via new Function
        else {
            if(fn !== false) {
                var func = new Function('return' + fn);
                func();
            }
        }
    };

    // jQuery Binding
    ux = $.fn.quicksearch = $.uxquicksearch = function(options) {
        var selector = this.selector;

        return this.each(function() {
            var $el = $(this),
                uxrocket = $el.data(ns.rocket) || {},
                quicksearch;

            if($el.hasClass(ns.ready)) {
                return;
            }

            $el.addClass(ns.ready);

            uxrocket[ns.data] = {'hasWrapper': false, 'ready': ns.ready, 'selector': selector, 'options': options};

            $el.data(ns.rocket, uxrocket);

            quicksearch = new QuickSearch(this, options, selector);
        });
    };

    ux.remove = function(el) {
        var $el = el !== undefined ? $(el) : $("." + ns.ready);

        $el.each(function() {
            var _this = $(this),
                _instance = _this.data(ns.data),
                _uxrocket = _this.data(ns.rocket);

            // remove ready class
            _this.removeClass(ns.ready);

            // remove plugin events
            _this.off(events.keyup);
            $(document).off(events.click + ' ' + events.touchstart + ' ' + events.pointerdown);
            $(window).off(events.resize + ' ' + events.orientationchange);

            // remove plugin data
            _this.removeData(ns.data);
            _this.removeData(ns.searchData);

            // remove uxRocket registry
            delete _uxrocket[ns.data];
            _this.data(ns.rocket, _uxrocket);

            callback(_instance.onRemove);
        });
    };

    // Plugin Version
    ux.version = '0.3.0';

    // Plugin Settings
    ux.settings = defaults;
})(jQuery);

// Old IE polyfill
Object.keys = Object.keys || function(o, k, r) {
    r = [];
    for(k in o)r.hasOwnProperty.call(o, k) && r.push(k);
    return r;
};