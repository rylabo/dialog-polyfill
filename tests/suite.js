/* jshint undef: true, expr: true, browser: true, devel: true, mocha: true */
/* globals dialogPolyfill */

/*
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


void function() {

  /**
   * Asserts that the displayed dialog is in the center of the screen.
   *
   * @param {HTMLDialogElement?} opt_dialog to check, or test default
   */
  function checkDialogCenter(opt_dialog) {
    var d = opt_dialog || dialog;
    var expectedTop = (window.innerHeight - d.offsetHeight) / 2;
    var expectedLeft = (window.innerWidth - d.offsetWidth) / 2;
    var rect = d.getBoundingClientRect();
    rect.top.should.be.approximately(expectedTop, 1, 'top ('+ rect.top +') should be nearby ' + expectedTop + '\n');
    //TODO proper viewport detection
    rect.left.should.be.approximately(expectedLeft, 10, 'left ('+ rect.left +') should be nearby '+ expectedLeft + '\n');
  }

  /**
   * Creates a fake KeyboardEvent.
   *
   * @param {number} keyCode to press
   * @param {string?} opt_type to use, default keydown
   * @return {!Event} event
   */
  function createKeyboardEvent(keyCode, opt_type) {
    var ev = document.createEvent('Events');
    ev.initEvent(opt_type || 'keydown', true, true);
    ev.keyCode = keyCode;
    ev.which = keyCode;
    return ev;
  }

  /**
   * Cleans up any passed DOM elements.
   *
   * @param {!Element} el to clean up
   * @return {!Element} the same element, for chaining
   */
  var cleanup = (function() {
    var e = [];
    afterEach(function() {
      e.forEach(function(el) {
        try {
          el.close();  // try to close dialogs
        } catch (e) {}
        el.parentElement && el.parentElement.removeChild(el);
      });
      e = [];
    });

    return function(el) {
      e.push(el);
      return el;
    };
  })();

  /**
   * Creates a dialog for testing that will be cleaned up later.
   *
   * @param {string?} opt_content to be used as innerHTML
   */
  function createDialog(opt_content) {
    var dialog = document.createElement('dialog');
    dialog.innerHTML = opt_content || 'Dialog #' + (cleanup.length);
    document.body.appendChild(dialog);
    if (window.location.search == '?force') {
      dialogPolyfill.forceRegisterDialog(dialog);
    } else {
      dialogPolyfill.registerDialog(dialog);
    }
    return cleanup(dialog);
  }

  var dialog;  // global dialog for all tests
  var getOpenProperty;
  beforeEach(function() {
    dialog = createDialog('Default Dialog');
    getOpenProperty = (typeof dialog.open === 'function') ? dialog.open : function (){return dialog.open;};
  });

  describe('basic functions', function() {
    it('shows and closes', function() {
      dialog.hasAttribute('open').should.be["false"]();
      dialog.show();
      dialog.hasAttribute('open').should.be["true"]();
      getOpenProperty().should.be["true"]();

      var returnValue = 1234;
      dialog.close(returnValue);
      dialog.hasAttribute('open').should.be["false"]();
      dialog.returnValue.should.eql(returnValue);

      dialog.show();
      dialog.close();
      getOpenProperty().should.be["false"]();
      dialog.returnValue.should.eql(returnValue);
    });

    if (Object.defineProperty !== undefined){
      describe('"open" in an environment that supports "Object.defineProperty"', function() {
        it('open', function() {
          dialog.hasAttribute('open').should.be["false"]();
          dialog.show();
          dialog.hasAttribute('open').should.be["true"]();
          dialog.open.should.be["true"]();

          dialog.open = false;
          dialog.open.should.be["false"]();
          dialog.hasAttribute('open').should.be["false"]('open property should clear attribute');
          dialog.close.should["throw"]();

          var overlay = document.querySelector('._dialog_overlay');
          (overlay === null).should.be["true"]();
        });
      });
    } else {
      describe('"open" in an environment that does NOT support "Object.defineProperty"', function() {
        it('open', function() {
          dialog.hasAttribute('open').should.be["false"]();
          dialog.show();
          dialog.hasAttribute('open').should.be["true"]();
          dialog.open().should.be["true"]();

          dialog.open(false);
          dialog.open().should.be["false"]();
          dialog.hasAttribute('open').should.be["false"]('open property should clear attribute');
          dialog.close.should["throw"]();

          var overlay = document.querySelector('._dialog_overlay');
          (overlay === null).should.be["true"]();
        });
      });
    }
    it('show/showModal interaction', function() {
      dialog.hasAttribute('open').should.be["false"]();
      dialog.show();

      // If the native dialog is being tested, show/showModal are not already
      // bound, so wrap them in helper methods for throws/doesNotThrow.
      var show = function() { dialog.show(); };
      var showModal = function() { dialog.showModal(); };

      show.should.not["throw"]();
      showModal.should["throw"]();

      dialog.setOpen(false);
      showModal.should.not["throw"]();
      show.should.not["throw"]();  // show after showModal does nothing
      showModal.should["throw"]();
      // TODO: check dialog is still modal
      var check = dialog.getOpenProperty();
      dialog.getOpenProperty().should.be["true"]();
    });
    it('setAttribute reflects property', function() {
      dialog.setAttribute('open', '');
      dialog.getOpenProperty().should.be["true"]('attribute opens dialog');
    });
    it('changing open to dummy value is ignored', function() {
      dialog.showModal();

      dialog.setAttribute('open', 'dummy, ignored');
      dialog.getOpenProperty().should.be["true"]('dialog open with dummy open value');

      var overlay = document.querySelector('._dialog_overlay');
      overlay.should.be.ok('dialog is still modal');
    });
    it('show/showModal outside document', function() {
      dialog.setOpenProperty(false);
      dialog.parentNode.removeChild(dialog);

      (function() { dialog.showModal(); }).should["throw"]();

      (function() { dialog.show(); }).should.not["throw"]();
      dialog.getOpenProperty().should.be["true"]('can open non-modal outside document');
      document.body.contains(dialog).should.be["false"]();
    });
    it('has a11y property', function() {
      dialog.getAttribute('role').should.eql('dialog', 'role should be dialog');
    });
  });

  describe('DOM', function() {
    beforeEach(function(done) {
      // DOM tests wait for modal to settle, so MutationOberver doesn't coalesce attr changes
      dialog.showModal();
      window.setTimeout(done, 0);
    });
    it('DOM direct removal', function(done) {
      dialog.getOpenProperty().should.be["true"]();
      (document.querySelector('.backdrop') === null).should.be["false"]();

      var parentNode = dialog.parentNode;
      parentNode.removeChild(dialog);

      // DOMNodeRemoved defers its task a frame (since it occurs before removal, not after). This
      // doesn't effect MutationObserver, just delays the test a frame.
      window.setTimeout(function() {
        (document.querySelector('.backdrop') === null).should.be["true"]('dialog removal should clear modal');

        dialog.getOpenProperty().should.be["true"]('removed dialog should still be open');
        parentNode.appendChild(dialog);

        dialog.getOpenProperty().should.be["true"]('re-added dialog should still be open');
        (document.querySelector('.backdrop') === null).should.be["true"]('dialog removal should clear modal');
        (document.querySelector('.backdrop') === null).should.be["true"]('re-add dialog should not be modal');

        done();
      }, 0);
    });
    it('DOM removal inside other element', function(done) {
      var div = cleanup(document.createElement('div'));
      document.body.appendChild(div);
      div.appendChild(dialog);

      document.body.removeChild(div);

      window.setTimeout(function() {
        (document.querySelector('.backdrop') === null).should.be["true"]('dialog removal should clear modal');
        dialog.getOpenProperty().should.be["true"]('removed dialog should still be open');
        done();
      }, 0);
    });
    it('DOM instant remove/add', function(done) {
      var div = cleanup(document.createElement('div'));
      document.body.appendChild(div);
      dialog.parentNode.removeChild(dialog);
      div.appendChild(dialog);

      window.setTimeout(function() {
        (document.querySelector('.backdrop') === null).should.be["true"]('backdrop should disappear');
        dialog.getOpenProperty().should.be["true"]();
        done();
      }, 0);
    });
  });

  describe('position', function() {
    it('non-modal is not centered', function() {
      var el = cleanup(document.createElement('div'));
      dialog.parentNode.insertBefore(el, dialog);
      var testRect = el.getBoundingClientRect();

      dialog.show();
      var rect = dialog.getBoundingClientRect();

      rect.top.should.eql(testRect.top, 'dialog should not be centered');
    });
    it('default modal centering', function() {
      dialog.showModal();
      checkDialogCenter();
      dialog.style.top.should.be.ok('expected top to be set');
      dialog.close();
      dialog.style.top.should.not.be.ok('expected top to be cleared');
    });
    it('modal respects static position', function() {
      dialog.style.top = '10px';
      dialog.showModal();

      var rect = dialog.getBoundingClientRect();
      rect.top.should.eql(10);
    });
    it('modal recentering', function() {
      var pX = document.body.scrollLeft;
      var pY = document.body.scrollTop;
      var big = cleanup(document.createElement('div'));
      big.style.height = '200vh';  // 2x view height
      document.body.appendChild(big);

      try {
        var scrollValue = 200;  // don't use incredibly large values
        dialog.showModal();
        dialog.close();

        window.scrollTo(0, scrollValue);
        dialog.showModal();
        checkDialogCenter();  // must be centered, even after scroll
        var rectAtScroll = dialog.getBoundingClientRect();

        // after scroll, we aren't recentered, check offset
        window.scrollTo(0, 0);
        var rect = dialog.getBoundingClientRect();
        (rectAtScroll.top + scrollValue).should.be.approximately(rect.top, 1);
      } finally {
        window.scrollTo(pX, pY);
      }
    });
    it('clamped to top of page', function() {
      var big = cleanup(document.createElement('div'));
      big.style.height = '200vh';  // 2x view height
      document.body.appendChild(big);
      document.documentElement.scrollTop = document.documentElement.scrollHeight / 2;

      dialog.style.height = document.documentElement.scrollHeight + 200 + 'px';
      dialog.showModal();

      var visibleRect = dialog.getBoundingClientRect();
      visibleRect.top.should.eql(0, 'large dialog should be visible at top of page');

      var style = window.getComputedStyle(dialog);
      style.top.should.eql(document.documentElement.scrollTop + 'px', 'large dialog should be absolutely positioned at scroll top');
    });
  });

  describe('backdrop', function() {
    it('backdrop div on modal', function() {
      dialog.showModal();
      var foundBackdrop = document.querySelector('.backdrop');
      (foundBackdrop === null).should.be["false"]();

      var sibling = dialog.nextElementSibling;
      foundBackdrop.should.equal(sibling);
    });
    it('no backdrop on non-modal', function() {
      dialog.show();
      (document.querySelector('.backdrop') === null).should.be["true"]();
      dialog.close();
    });
    it('backdrop click appears as dialog', function() {
      dialog.showModal();
      var backdrop = dialog.nextElementSibling;

      var clickFired = 0;
      var helper = function(ev) {
        ev.target.should.eql(dialog);
        ++clickFired;
      };

      dialog.addEventListener('click', helper);
      backdrop.click();
      clickFired.should.eql(1);
    });
    it('backdrop click focuses dialog', function() {
      dialog.showModal();
      dialog.tabIndex = 0;

      var input = document.createElement('input');
      input.type = 'text';
      dialog.appendChild(input);

      // TODO: It would be nice to check `input` instead here, but there's no more reliable ways
      // to emulate a browser tab event (Firefox, Chrome etc have made it a security violation).

      var backdrop = dialog.nextElementSibling;
      backdrop.click();
      document.activeElement.should.eql(dialog);
    });
  });

  describe('form focus', function() {
    it('non-modal inside modal is focusable', function() {
      var sub = createDialog();
      dialog.appendChild(sub);

      var input = document.createElement('input');
      input.type = 'text';
      sub.appendChild(input);

      dialog.showModal();
      sub.show();

      input.focus();
      input.should.eql(document.activeElement);
    });
    it('clear focus when nothing focusable in modal', function() {
      var input = cleanup(document.createElement('input'));
      input.type = 'text';
      document.body.appendChild(input);
      input.focus();

      var previous = document.activeElement;
      dialog.showModal();
      previous.should.not.eql(document.activeElement);
    });
    it('default focus on modal', function() {
      var input = cleanup(document.createElement('input'));
      input.type = 'text';
      dialog.appendChild(input);

      var anotherInput = cleanup(document.createElement('input'));
      anotherInput.type = 'text';
      dialog.appendChild(anotherInput);

      dialog.showModal();
      document.activeElement.should.eql(input);
    });
    it('default focus on non-modal', function() {
      var div = cleanup(document.createElement('div'));
      div.tabIndex = 4;
      dialog.appendChild(div);

      dialog.show();
      document.activeElement.should.eql(div);
    });
    it('autofocus element chosen', function() {
      var input = cleanup(document.createElement('input'));
      input.type = 'text';
      dialog.appendChild(input);

      var inputAF = cleanup(document.createElement('input'));
      inputAF.type = 'text';
      inputAF.autofocus = true;
      dialog.appendChild(inputAF);

      dialog.showModal();
      document.activeElement.should.eql(inputAF);
    });
    it('child modal dialog', function() {
      dialog.showModal();

      var input = cleanup(document.createElement('input'));
      input.type = 'text';
      dialog.appendChild(input);
      input.focus();
      document.activeElement.should.eql(input);

      // NOTE: This is a single sub-test, but all the above tests could be run
      // again in a sub-context (i.e., dialog within dialog).
      var child = createDialog();
      child.showModal();
      document.activeElement.should.not.eql(input, 'additional modal dialog should clear parent focus');

      child.close();
      document.activeElement.should.not.eql(input, 'parent focus should not be restored');
    });
    it('don\'t scroll anything into focus', function() {
      // https://github.com/GoogleChrome/dialog-polyfill/issues/119

      var div = cleanup(document.createElement('div'));
      document.body.appendChild(div);

      var inner = document.createElement('div');
      inner.style.height = '10000px';
      div.appendChild(inner);

      div.appendChild(dialog);

      var input = cleanup(document.createElement('input'));
      input.type = 'text';
      dialog.appendChild(input);

      var prev = document.documentElement.scrollTop;
      dialog.showModal();
      document.documentElement.scrollTop.should.eql(prev);
    });
  });

  describe('top layer / inert', function() {
    it('background focus allowed on non-modal', function() {
      var input = cleanup(document.createElement('input'));
      input.type = 'text';
      document.body.appendChild(input);
      input.focus();

      dialog.show();
      document.activeElement.should.not.eql(input, 'non-modal dialog should clear focus, even with no dialog content');

      document.body.focus();
      input.focus();
      document.activeElement.should.eql(input, 'non-modal should allow background focus');
    });
    it('modal disallows background focus', function() {
      var input = cleanup(document.createElement('input'));
      input.type = 'text';
      document.body.appendChild(input);

      dialog.showModal();
      input.focus();

      if (!document.hasFocus()) {
        // Browsers won't trigger a focus event if they're not in the
        // foreground, so we can't intercept it. However, they'll fire one when
        // restored, before a user can get to any incorrectly focused element.
        console.warn('background focus test requires document focus');
        document.documentElement.focus();
      }
      document.activeElement.should.not.eql(input, 'modal should disallow background focus');
    });
    it('overlay is a sibling of topmost dialog', function() {
      var stacking = cleanup(document.createElement('div'));
      stacking.style.opacity = 0.8;  // creates stacking context
      document.body.appendChild(stacking);
      stacking.appendChild(dialog);
      dialog.showModal();

      var overlay = document.querySelector('._dialog_overlay');
      (overlay === null).should.be["false"]();
      overlay.parentNode.should.eql(dialog.parentNode);
    });
    it('overlay is between topmost and remaining dialogs', function() {
      dialog.showModal();

      var other = cleanup(createDialog());
      document.body.appendChild(other);
      other.showModal();

      var overlay = document.querySelector('._dialog_overlay');
      (overlay === null).should.be["false"]();
      overlay.parentNode.should.eql(other.parentNode);

      other.style.zIndex.should.be.above(overlay.style.zIndex, 'top-most dialog above overlay');
      overlay.style.zIndex.should.be.above(dialog.style.zIndex, 'overlay above other dialogs');
    });
  });

  describe('events', function() {
    it('close event', function() {
      var closeFired = 0;
      dialog.addEventListener('close', function() {
        ++closeFired;
      });

      dialog.show();
      closeFired.should.eql(0);

      dialog.close();
      closeFired.should.eql(1);

      dialog.close.should["throw"]();  // can't close already closed dialog
      closeFired.should.eql(1);

      dialog.showModal();
      dialog.close();
      closeFired.should.eql(2);
    });
    it('cancel event', function() {
      dialog.showModal();
      dialog.dispatchEvent(createKeyboardEvent(27));
      dialog.getOpenProperty().should.be["false"]('esc should close modal');

      var cancelFired = 0;
      dialog.addEventListener('cancel', function() {
        ++cancelFired;
      });
      dialog.showModal();
      dialog.dispatchEvent(createKeyboardEvent(27));
      cancelFired.should.eql(1, 'expected cancel to be fired');
      dialog.getOpenProperty().should.be["false"]('esc should close modal again');

      // Sanity-check that non-modals aren't effected.
      dialog.show();
      dialog.dispatchEvent(createKeyboardEvent(27));
      dialog.getOpenProperty().should.be["true"]('esc should only close modal dialog');
      cancelFired.should.eql(1);
    });
    it('overlay click is prevented', function() {
      dialog.showModal();

      var overlay = document.querySelector('._dialog_overlay');
      (overlay === null).should.be["false"]();

      var helper = function(ev) {
        throw Error('body should not be clicked');
      };
      try {
        document.body.addEventListener('click', helper);
        overlay.click();
      } finally {
        document.body.removeEventListener('click', helper);
      }
    });
  });

  describe('form', function() {
    it('dialog method input', function() {
      var value = 'ExpectedValue' + Math.random();

      var form = document.createElement('form');
      try {
        form.method = 'dialog';
      } catch (e) {
        // Setting the method directly throws an exception in <=IE9.
        form.setAttribute('method', 'dialog');
      }
      dialog.appendChild(form);

      var input = document.createElement('input');
      input.type = 'submit';
      input.value = value;
      form.appendChild(input);

      dialog.show();
      input.focus();  // emulate user focus action
      input.click();

      dialog.getOpenProperty().should.be["false"]();
      dialog.returnValue.should.eql(value);
    });
    it('dialog method button', function() {
      var value = 'ExpectedValue' + Math.random();

      var form = document.createElement('form');
      form.setAttribute('method', 'dialog');
      dialog.appendChild(form);

      var button = document.createElement('button');
      button.value = value;
      form.appendChild(button);

      dialog.showModal();
      button.focus();  // emulate user focus action
      button.click();

      dialog.getOpenProperty().should.be["false"]();
      dialog.returnValue.should.eql(value);

      // Clear button value, confirm textContent is not used as value.
      button.value = '';
      button.removeAttribute('value');
      button.textContent = value;
      dialog.show();
      button.focus();  // emulate user focus action
      button.click();

      dialog.returnValue.should.eql(button.value, 'don\'t take button textContent as value');
    });
    it('boring form inside dialog', function() {
      var form = document.createElement('form');
      dialog.appendChild(form);  // don't specify method
      form.addEventListener('submit', function(ev) {
        ev.preventDefault();
      });

      var button = document.createElement('button');
      button.value = 'Moot';
      form.appendChild(button);

      dialog.showModal();
      button.focus();  // emulate user focus action
      button.click();

      dialog.getOpenProperty().should.be["true"]('non-dialog form should not close dialog');
      (!dialog.returnValue).should.be.ok();
    });
  });

  describe('order', function() {
    it('non-modal unchanged', function() {
      var one = createDialog();
      var two = createDialog();

      one.style.zIndex = 100;
      two.style.zIndex = 200;
      one.show();
      two.show();

      window.getComputedStyle(one).zIndex.should.eql('100');
      window.getComputedStyle(two).zIndex.should.eql('200');

      two.close();
      window.getComputedStyle(two).zIndex.should.eql('200');
    });
    it('modal stacking order', function() {
      dialog.showModal();

      // Create incorrectly-named dialogs: front has a lower z-index, and back
      // has a higher z-index.
      var front = createDialog();
      var back = createDialog();
      front.style.zIndex = 100;
      back.style.zIndex = 200;

      // Show back first, then front. Thus we expect back to be behind front.
      back.showModal();
      front.showModal();

      var zf = window.getComputedStyle(front).zIndex;
      var zb = window.getComputedStyle(back).zIndex;
      zf.should.be.above(zb, 'showModal order dictates z-index');

      var backBackdrop = back.nextElementSibling;
      var zbb = window.getComputedStyle(backBackdrop).zIndex;
      backBackdrop.className.should.eql('backdrop');
      zbb.should.be.below(zb, 'backdrop below dialog');

      var frontBackdrop = front.nextElementSibling;
      var zfb = window.getComputedStyle(frontBackdrop).zIndex;
      frontBackdrop.className.should.eql('backdrop');
      zfb.should.be.below(zf, 'backdrop below dialog');

      zfb.should.be.above(zb, 'front backdrop is above back dialog');

      front.close();
      front.style.zIndex.should.not.be.ok('modal close should clear zindex');
    });
  });

  describe('press tab key', function() {
    it('tab key', function() {
      var dialog = createDialog();
      dialog.showModal();

      document.documentElement.dispatchEvent(createKeyboardEvent(9));

      var ev = document.createEvent('Events');
      ev.initEvent('focus', true, true);
      document.documentElement.dispatchEvent(ev);

      dialog.close();
    });
  });
}();
