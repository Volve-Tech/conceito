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

  var form = document.querySelector('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
    });
  }
})();
