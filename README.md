As the name suggests, this fork exists to allow support for `<dialog>` in IE8+. Bear in mind, IE8 is a very old browser, so some sacrifices needed to be made to get it to function properly.

dialog-polyfill-ie8.js aims to function as a drop-in replacement for[dialog-polyfill.js](https://github.com/GoogleChrome/dialog-polyfill). As with [dialog-polyfill.js](https://github.com/GoogleChrome/dialog-polyfill), it allows the usage of the `<dialog>` element in browsers not yet supporting it.

`<dialog>` is an element for a popup box in a web page, including a modal option which will make the rest of the page inert during use.
This could be useful to block a user's interaction until they give you a response, or to confirm an action.
See the [HTML spec](https://html.spec.whatwg.org/multipage/forms.html#the-dialog-element).

## Usage

### Installation

This package needs to have several libraries loaded before it will work in IE:

- [html5-shiv](https://github.com/aFarkas/html5shiv) - Allows HTML5 elements in IE8
- [ie8](https://github.com/WebReflection/ie8) - Some browser specific DOM fixes for IE8
- [dom4](https://github.com/WebReflection/dom4) - A cross-browser polyfill that aims for full DOM level 4 support in most major browsers

It is recommended that users install via NPM with the ```--only=production``` flag, as this library has a LOT of dev dependencies:

    $ npm install dialog-polyfill-ie8 --only=production


### Supports

This polyfill aims to work in modern versions of all major browsers, supporting IE8 and above.

### Steps

1. Include the CSS in the `<head>` of your document, and the Javascript anywhere before referencing `dialogPolyfill`.
2. Create your dialog elements within the document. See [limitations](#limitations) for more details.
3. Register the elements using `dialogPolyfill.registerDialog()`, passing it one node at a time. This polyfill won't replace native support.
4. Use your `<dialog>` elements!

## Example

```html
<head>
  <link rel="stylesheet" type="text/css" href="/path/to/dialog-polyfill-ie8.css" />
</head>
<body>
  <dialog>
    I'm a dialog!
    <form method="dialog">
      <input type="submit" value="Close" />
    </form>
  </dialog>
  <script src="/path/to/dialog-polyfill-ie8.js"></script>
  <script>
    var dialog = document.querySelector('dialog');
    dialogPolyfill.registerDialog(dialog);
    // Now dialog acts like a native <dialog>.
    dialog.showModal();
  </script>
</body>
```

### ::backdrop

In native `<dialog>`, the backdrop is a pseudo-element.
When using the polyfill, the backdrop will be an adjacent element:

```css
dialog::backdrop { /* native */
  background-color: green;
}
dialog + .backdrop { /* polyfill */
  background-color: green;
}
```

## Testing

You will need to edit the karma.conf.js 

Once that is done, you can test by running:

    grunt karma:dev

## Limitations

In the polyfill, modal dialogs have limitations-

- They should not be contained by parents that create a stacking context, see below
- The browser's chrome may not always be accessible via the tab key
- Changes to the CSS top/bottom values while open aren't retained

### Stacking Context

The major limitation of the polyfill is that dialogs should not have parents that create [a stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context).
The easiest way to solve this is to move your `<dialog>` element to be a child of `<body>`.

If this isn't possible you may still be able to use the dialog.
However, you may want to resolve it for two major reasons-

1. The polyfill can't guarantee that the dialog will be the top-most element of your page
2. The dialog may be positioned incorrectly as they are positioned as part of the page layout _where they are opened_ (defined by spec), and not at a fixed position in the user's browser.

To position a dialog in the center (regardless of user scroll position or stacking context), you can specify the following CSS-

```css
dialog {
  position: fixed;
  top: 50%;
  transform: translate(0, -50%);
}
```

### The `open` property

`dialog.open` may be a property, or a function, depending on the browser. Users intending to . 

It is therefore recommended to use the `dialog.openDialog` method this library adds, which will consistently be implemented as a function across all browsers.
