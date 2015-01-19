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
            onSelect  : false  // callback event when selecting a result with arrow keys
        },
        events = {
            keyup      : 'keyup.uxQuickSearch',
            click      : 'click.uxQuickSearch',
            touchstart : 'touchstart.uxQuickSearch',
            pointerdown: 'MSPointerDown.uxQuickSearch',
            resize     : 'resize.uxQuickSearch',
            orientationchange : 'orientationchange.uxQuickSearch'
        };

    // Constructor Method
    var QuickSearch = function(el, options, selector) {
        var $el = $(el),
            opts = $.extend({}, defaults, options, $el.data(), {'selector': selector}),
            menudata = setSearchData(opts.menu, opts.exclude);

        opts.offset = $el.offset();
        opts.width = $el.outerWidth();
        opts.height = $el.outerHeight();
        $el.data('uxQuickSearch', opts);
        $el.data('uxQuickSearchData', menudata);

        // call onReady function if any
        callback(opts.onReady);

        // bind the ui interactions
        bindUIActions($el);
    };

    var bindUIActions = function($el) {
        var menu = $el.data('uxQuickSearchData'),
            _opts = $el.data('uxQuickSearch');

        $el.on(events.keyup, function(e) {
            var query = $(this).val().toLowerCase();

            if(e.keyCode == 38 || e.keyCode == 40) {
                highLightMenu($el, e);
            }
            else if(e.keyCode == 13 && $(this).hasClass('uxrocket-quicksearch-selected')) {
                callback(_opts.onEnter);
            }
            else {
                $(this).removeClass('uxrocket-quicksearch-selected');
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

            $(this).addClass('uxrocket-quicksearch-selected');
        });

        $(window).on(events.resize + ' ' + events.orientationchange, function(e){
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
        var _opts = $el.data('uxQuickSearch'),
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
            _opts = $el.data('uxQuickSearch'),
            list = $('.uxrocket-quicksearch-results'),
            highlight = list.find('.uxrocket-quicksearch-highlight'),
            selected;

        if(e.keyCode == 38) {
            direction = 'prev';
        }

        if(highlight.length == 0) {
            selected = list.find('li:first-child').addClass('uxrocket-quicksearch-highlight');
        } else {
            selected = highlight.removeClass('uxrocket-quicksearch-highlight')[direction]().addClass('uxrocket-quicksearch-highlight');
        }

        $el.val(selected.text()).addClass('uxrocket-quicksearch-selected');
    };

    var setResults = function($el, matched) {
        var _opts = $el.data('uxQuickSearch'),
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
        var _opts = $el.data('uxQuickSearch'),
            results = $(_opts.holder),
            resultsW = results.outerWidth();

        if(orientation){
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
                uxrocket = $el.data('uxRocket') || {},
                quicksearch;

            if($el.hasClass('uxrocket-quicksearch-ready')) {
                return;
            }

            $el.addClass('uxrocket-quicksearch-ready');

            uxrocket['uxQuickSearch'] = {'hasWrapper': false, 'ready': 'uxitd-quicksearch-ready', 'selector': selector, 'options': options};

            $el.data('uxRocket', uxrocket);

            quicksearch = new QuickSearch(this, options, selector);
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