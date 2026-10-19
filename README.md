# Digit Grouping (jQuery plugin)

A tiny jQuery plugin that groups digits **while the user types** in an `<input type="text">`, so `1234567` becomes `1,234,567` without the caret jumping around.

- Accepts only the digits `0-9` (typed, pasted or dropped) and ignores everything else
- Caret stays where the user expects, even when typing or deleting in the middle of the number
- Backspace and Delete step over separators instead of getting "stuck"
- Works on desktop and mobile keyboards (uses `beforeinput` / `input`, not `keydown`)
- Configurable separator, group size and maximum number of digits
- Works with jQuery **1.7 through 4.x**, with or without [jQuery Migrate](https://github.com/jquery/jquery-migrate)
- No dependencies besides jQuery, no CSS, about 160 lines of readable code

## Demo

Open [`jquery-digitgrouping-demo.html`](jquery-digitgrouping-demo.html) in a browser.
It is fully self-contained (jQuery, Migrate and the plugin are in-lined), so it works offline.

## Installation

Download [`jquery.digitgrouping.js`](jquery.digitgrouping.js) and load it after jQuery:

```html
<script src="https://code.jquery.com/jquery-4.0.0.min.js"></script>
<script src="jquery.digitgrouping.js"></script>
```

Or load it from a CDN such as `<cdnjs>`, pinned to a release tag:

```html
<script src="https://cdn.jsdelivr.net/gh/PerseusTheGreat/jquery-digit-grouping@1.0.0/jquery.digitgrouping.js"></script>
```

With a bundler or AMD loader, the plugin registers itself on the `jquery` module:

```js
import $ from "jquery";
import "./jquery.digitgrouping.js"; // or require( "./jquery.digitgrouping.js" )
```

## Usage

```html
<input id="amount" type="text" placeholder="1,234,567,890">
```

```js
$("#amount").digitGrouping();
```

That's it.
The plugin also sets `inputmode="numeric"` (numeric keypad on phones) and `autocomplete="off"` on the input if they are not already present.

### With options

```js
$("#amount")
    .digitGrouping({
        separator: " ",   // blank: "1 234 567 890"
        groupSize: 3,
        maxDigits: 10
    });
```

### Markup only

Elements with `data-digit-grouping` are initialized automatically on DOM ready:

```html
<input type="text" 
       data-digit-grouping="" 
       data-separator=" " 
       data-group-size="4" 
       data-max-digits="16">
```

Inputs added to the page later are not picked up automatically.
Call `.digitGrouping()` on them yourself.

## Options

| Option | Data attribute | Default | Description |
|---|---|---|---|
| `separator` | `data-separator` | `","` | String inserted between groups. Any string works, including `" "`, `"."`, `"'"` or an empty string. |
| `groupSize` | `data-group-size` | `3` | Digits per group, counted from the right. |
| `maxDigits` | `data-max-digits` | `18` | Maximum number of **digits** (separators don't count). Don't also set `maxlength` on the input, because that counts formatted characters. |

Explicit JavaScript options win over data attributes, which win over the defaults.
Change the defaults globally with:

```js
$.fn.digitGrouping.defaults.separator = ".";
```

## Methods

| Call | Returns | Description |
|---|---|---|
| `.digitGrouping(options)` | the jQuery collection | Initialize. Calling it again on an initialized input does nothing. |
| `.digitGrouping("val")` | `string` or `undefined` | The **digits only** (e.g. `"1234567"`) of the first matched input. `undefined` if it isn't initialized. |
| `.digitGrouping("val", value)` | the jQuery collection | Set a value (non-digits are stripped) and format it. Fires no events. |
| `.digitGrouping("destroy")` | the jQuery collection | Remove the handlers and the attributes the plugin added. The input keeps its current text. |

### Reading the value

`.val()` returns what the user sees (`"1,234,567"`). Use the `val` method to get the digits:

```js
$("#amount")
    .on("input", function () {
        let currentValue = $(this).digitGrouping("val");
        console.log(currentValue); // "1234567"
    });
```

The result is a string, so very long numbers don't lose precision the way a JavaScript `Number` would beyond 15-16 digits.
Convert it yourself (`Number(...)`, `BigInt(...)`) when you need to.

When submitting a form, either copy the digits into a hidden field or strip the separators on the server:

```js
$("form")
    .on("submit", function () {
        let currentValue = $("#amount").digitGrouping("val");
        $("#amount-raw").val(currentValue);
    });
```

### Changing the value from your own code

After you set `input.value` or `.val( "..." )` yourself, either use `.digitGrouping( "val", x )` instead or trigger a reformat:

```js
$("#amount")
    .val("9876543210")
    .trigger("input"); // -> "9,876,543,210"
```

## Compatibility

### jQuery versions

| jQuery | Status |
|---|---|
| 4.x | Supported |
| 3.x | Supported |
| 2.x | Supported |
| 1.7 ~ 1.12 | Supported (needs `.on()` / `.off()`, so 1.7 is the minimum) |

Automated smoke tests in jsDOM cover jQuery 1.12.4, 2.2.4, 3.7.1 and 4.0.0, each alone and together with its matching Migrate build (1.4.1, 3.5.2 and 4.0.2).
They check typing, blocked non-digits, `maxDigits`, Backspace/Delete across separators, `val`, data-attribute initialization and `destroy`.
They are not a substitute for real-browser testing, so please report anything odd on your device.

### jQuery Migrate

[jQuery Migrate](https://github.com/jquery/jquery-migrate) restores APIs that newer jQuery releases removed, so older page code keeps working on a newer jQuery.
This plugin doesn't need it, because it only uses `.on`, `.off`, `.data`, `.attr`, `.each` and `$.extend`.
It avoids everything removed in jQuery 4.0 (`$.trim`, `$.isArray`, `$.isFunction`, `$.type`, `.size()` and friends) as well as deprecated methods such as `.bind()`.
With Migrate loaded, the plugin produces **no** Migrate warnings.

Use Migrate for the rest of your page if other scripts still depend on removed APIs.
Load it right after jQuery and before your other scripts:

```html
<script src="https://code.jquery.com/jquery-4.0.0.min.js"></script>
<script src="https://code.jquery.com/jquery-migrate-4.0.2.min.js"></script>
<script src="jquery.digitgrouping.js"></script>
```

Open the console and look for `JQMIGRATE` messages to find the code that needs updating.

### Browsers

The plugin targets current evergreen browsers on desktop and mobile (Chrome, Edge, Firefox, Safari).
It relies on [`beforeinput`](https://caniuse.com/mdn-api_element_beforeinput_event) and [`InputEvent.inputType`](https://caniuse.com/mdn-api_inputevent_inputtype).
In a browser without them, digit filtering still happens in the [`input`](https://caniuse.com/input-event) handler, but the separator-aware Backspace/Delete handling won't work.

## How it works

Key events are unreliable on mobile (Android keyboards often report `key` as `"Unidentified"`), so the plugin listens to `beforeinput` and `input` instead:

1. **`beforeinput`** remembers the digits before the edit and whether the selection was a plain caret, and cancels typed non-digit characters where the browser allows it.
2. **`input`** is the safety net for pasting, drag and drop, and mobile keyboards. It strips everything that isn't a digit, counts how many digits sit left of the caret, reformats the value, and puts the caret back after the same number of digits.
3. If Backspace or Delete removed only a **separator** (the digits are unchanged), the plugin removes the neighboring digit instead. Otherwise the separator would be re-inserted and the key would appear to do nothing.

One jQuery detail: jQuery doesn't copy `inputType` onto its event object, and its own `event.data` means something different, so the plugin reads both from `event.originalEvent`.

## Limitations

- **Integers only.** There is no decimal point or minus sign. Typing them is blocked.
- **ASCII digits only.** Digits from other scripts (for example Arabic-Indic) are stripped.
- **Plain text inputs only.** `type="number"`, `type="email"` and others don't support caret control. Use `type="text"` (or `tel` / `search`) and `inputmode="numeric"`.
- **Grouping is from the right,** which suits amounts and quantities. Formats that group from the left (such as card numbers) are not covered.
- **Undo.** Rewriting `input.value` clears the browser's native undo history, so Ctrl+Z won't step back through edits.
- **Leading zeros are kept.** `0012345` becomes `0,012,345`. Strip them from the `val` result if you don't want them.
- **iOS numeric keypad.** It has no Done/Return key, so users may need to tap elsewhere to dismiss it.

## Contributing

Bug reports and pull requests are welcome.
When reporting a problem, please include your jQuery version, whether Migrate is loaded, the browser and device, and the exact keys or gestures that triggered it.
Behavior on real mobile keyboards is the most valuable feedback.

## License

[MIT](LICENSE)

## Disclaimers
This plugin was generated entirely by `Claude AI` agent.
The publisher accepts no responsibility for any software defects it may contain.