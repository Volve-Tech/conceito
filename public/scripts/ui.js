(function () {
  var header = document.querySelector('[data-header]');
  var openBtn = document.querySelector('[data-menu-open]');
  var closeBtn = document.querySelector('[data-menu-close]');
  var menu = document.querySelector('[data-mobile-menu]');
  var backdrop = document.querySelector('[data-menu-backdrop]');

  function setMenu(open) {
    if (!menu) return;
    menu.hidden = !open;
    if (backdrop) backdrop.hidden = !open;
    document.body.classList.toggle('is-scroll-locked', open);
    if (openBtn) openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (header) {
    var update = function () {
      header.classList.toggle('is-dark', window.scrollY > 10);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  openBtn && openBtn.addEventListener('click', function () { setMenu(true); });
  closeBtn && closeBtn.addEventListener('click', function () { setMenu(false); });
  backdrop && backdrop.addEventListener('click', function () { setMenu(false); });

  var EMAIL_PATTERN = /\S+@\S+\.\S+/;
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submitContactForm(form);
    });
  }

  /**
   * Validate, mint a fresh reCAPTCHA v3 token, and POST to the Worker.
   *
   * @param {HTMLFormElement} formEl
   */
  function submitContactForm(formEl) {
    var apiUrl = formEl.getAttribute('data-contact-api');
    var siteKey = formEl.getAttribute('data-recaptcha-site-key');
    var submit = formEl.querySelector('.submit');
    var success = formEl.querySelector('[data-contact-success]');
    var error = formEl.querySelector('[data-contact-error]');

    hideEl(success);
    hideEl(error);

    var fields = {
      name: readField(formEl, 'name'),
      email: readField(formEl, 'email'),
      phone: readField(formEl, 'phone'),
      message: readField(formEl, 'message'),
    };

    var invalid = {
      name: fields.name === '',
      email: !EMAIL_PATTERN.test(fields.email),
      phone: fields.phone === '',
      message: fields.message === '',
    };

    setFieldError(formEl, 'name', invalid.name);
    setFieldError(formEl, 'email', invalid.email);
    setFieldError(formEl, 'phone', invalid.phone);
    setFieldError(formEl, 'message', invalid.message);

    if (invalid.name || invalid.email || invalid.phone || invalid.message) {
      return;
    }

    if (!apiUrl || !siteKey || !/^https?:\/\//i.test(apiUrl)) {
      showEl(error);
      return;
    }

    if (submit) submit.disabled = true;

    executeRecaptcha(siteKey)
      .then(function (token) {
        return fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token,
            name: fields.name,
            email: fields.email,
            phone: fields.phone,
            message: fields.message,
          }),
        });
      })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('send-failed');
        }
        formEl.reset();
        showEl(success);
      })
      .catch(function () {
        showEl(error);
      })
      .then(function () {
        if (submit) submit.disabled = false;
      });
  }

  /**
   * @param {HTMLFormElement} formEl
   * @param {string} name
   * @returns {string}
   */
  function readField(formEl, name) {
    var field = formEl.elements.namedItem(name);
    return field && 'value' in field ? String(field.value).trim() : '';
  }

  /**
   * @param {HTMLFormElement} formEl
   * @param {string} name
   * @param {boolean} show
   */
  function setFieldError(formEl, name, show) {
    var message = formEl.querySelector('[data-error-for="' + name + '"]');
    if (!message) return;
    message.hidden = !show;
  }

  /**
   * Await a fresh classic reCAPTCHA v3 token.
   *
   * @param {string} siteKey
   * @returns {Promise<string>}
   */
  function executeRecaptcha(siteKey) {
    return new Promise(function (resolve, reject) {
      var grecaptcha = window.grecaptcha;
      if (!grecaptcha || typeof grecaptcha.execute !== 'function') {
        reject(new Error('recaptcha-unavailable'));
        return;
      }
      var run = function () {
        grecaptcha.execute(siteKey, { action: 'contact' }).then(resolve, reject);
      };
      if (typeof grecaptcha.ready === 'function') {
        grecaptcha.ready(run);
      } else {
        run();
      }
    });
  }

  function showEl(el) {
    if (el) el.hidden = false;
  }

  function hideEl(el) {
    if (el) el.hidden = true;
  }
})();
