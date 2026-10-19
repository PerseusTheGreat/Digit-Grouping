/*!
 * jquery.digitgrouping.js
 * group digits while typing in <input type="text">
 *
 * MIT License
 * Copyright (c) 2026 Arash Laylazi
 * 
 * Disclaimers:
 * This plugin was generated entirely by 'Claude AI' agent.
 * The publisher accepts no responsibility for any software defects it may contain.
 */
(function (factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("jquery"));
    } else {
        factory(window.jQuery);
    }
}(function ($) {
    "use strict";

    var NS = ".digitGrouping";
    // Not "digitGrouping": .data() would fall back to the data-digit-grouping attribute.
    var KEY = "digitGroupingInstance";

    function onlyDigits(value) {
        return String(value).replace(/\D/g, "");
    }

    function readAttributes($el) {
        var out = {},
            separator = $el.attr("data-separator"),
            groupSize = parseInt($el.attr("data-group-size"), 10),
            maxDigits = parseInt($el.attr("data-max-digits"), 10);

        if (separator != null) { out.separator = separator; }
        if (groupSize > 0) { out.groupSize = groupSize; }
        if (maxDigits > 0) { out.maxDigits = maxDigits; }
        return out;
    }

    function DigitGrouping(input, options) {
        var self = this,
            $input = $(input);

        this.input = input;
        this.opts = $.extend({}, $.fn.digitGrouping.defaults, readAttributes($input), options);
        this.groupRe = new RegExp("\\B(?=(?:\\d{" + this.opts.groupSize + "})+$)", "g");
        this.prevDigits = "";   // digits before the current edit
        this.collapsed = true;  // was the selection a plain caret (not a range)?
        this.added = [];        // attributes we added, removed again on destroy

        $.each({ inputmode: "numeric", autocomplete: "off" }, function (name, value) {
            if (!$input.is("[" + name + "]")) {
                $input.attr(name, value);
                self.added.push(name);
            }
        });

        $input
            .on("beforeinput" + NS, function (e) { self.beforeInput(e); })
            .on("input" + NS, function (e) { self.afterInput(e); });

        if (input.value) { this.setRaw(input.value); }
    }

    DigitGrouping.prototype = {

        format: function (digits) {
            var separator = this.opts.separator;
            return digits.replace(this.groupRe, function () { return separator; });
        },

        getRaw: function () {
            return onlyDigits(this.input.value);
        },

        setRaw: function (value) {
            var digits = onlyDigits(value == null ? "" : value).slice(0, this.opts.maxDigits);
            this.input.value = this.format(digits);
            this.prevDigits = digits;
        },

        // Runs before the browser edits the value. Blocks typed non-digits where possible.
        // jQuery does not copy inputType/data onto its event object (and its own
        // event.data means something else), so both come from the native event.
        beforeInput: function (e) {
            var nativeEvent = e.originalEvent || e,
                input = this.input;

            this.prevDigits = onlyDigits(input.value);
            this.collapsed = input.selectionStart === input.selectionEnd;

            if (nativeEvent.inputType === "insertText" && nativeEvent.data && /\D/.test(nativeEvent.data) && nativeEvent.cancelable) {
                e.preventDefault();
            }
        },

        // Runs after every edit (typing, delete, paste, drop, mobile IME).
        // Safety net: whatever got through is sanitized and reformatted here.
        afterInput: function (e) {
            var nativeEvent = e.originalEvent || e,
                inputType = nativeEvent.inputType,
                input = this.input,
                max = this.opts.maxDigits,
                digits = onlyDigits(input.value),
                pos = onlyDigits(input.value.slice(0, input.selectionStart)).length, // digits left of caret
                formatted, caret, seen;

            // Backspace/Delete removed only a separator: remove the neighbouring digit instead,
            // otherwise reformatting would put the separator back and the key would seem dead.
            if (digits === this.prevDigits && this.collapsed) {
                if (inputType === "deleteContentBackward" && pos > 0) {
                    digits = digits.slice(0, pos - 1) + digits.slice(pos);
                    pos--;
                } else if (inputType === "deleteContentForward") {
                    digits = digits.slice(0, pos) + digits.slice(pos + 1);
                }
            }

            if (digits.length > max) {
                digits = digits.slice(0, max);
                pos = Math.min(pos, max);
            }

            formatted = this.format(digits);

            // Put the caret right after the same number of digits as before
            caret = 0;
            seen = 0;
            while (seen < pos && caret < formatted.length) {
                if (/\d/.test(formatted.charAt(caret))) { seen++; }
                caret++;
            }

            if (input.value !== formatted) { input.value = formatted; }
            // Don't move the selection of a field that isn't focused (e.g. .trigger("input"))
            if (input.ownerDocument.activeElement === input) {
                input.setSelectionRange(caret, caret);
            }
            this.prevDigits = digits;
        },

        destroy: function () {
            var $input = $(this.input);

            $input.off(NS).removeData(KEY);
            $.each(this.added, function (i, name) { $input.removeAttr(name); });
        }
    };

    $.fn.digitGrouping = function (method, arg) {
        var isMethod = typeof method === "string",
            $inputs = this.filter("input"),
            first;

        // Getter: .digitGrouping( "val" ) → digits of the first matched input
        if (isMethod && method === "val" && arg === undefined) {
            first = $inputs.length ? $inputs.data(KEY) : null;
            return first ? first.getRaw() : undefined;
        }

        $inputs.each(function () {
            var $el = $(this),
                instance = $el.data(KEY);

            if (!isMethod) {
                if (!instance) { $el.data(KEY, new DigitGrouping(this, method)); }
            } else if (instance) {
                if (method === "val") { instance.setRaw(arg); }
                else if (method === "destroy") { instance.destroy(); }
                else { $.error("Method " + method + " does not exist on jQuery.fn.digitGrouping"); }
            }
        });

        return this;
    };

    $.fn.digitGrouping.defaults = { separator: ",", groupSize: 3, maxDigits: 18 };

    $(function () { $("[data-digit-grouping]").digitGrouping(); });
}));
