(function () {
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var toggle = $('.sa-toggle');
  var links = $('.sa-links');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !links.classList.contains('is-open')) return;
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    });
  }

  var billingButtons = $$('[data-billing]');
  var prices = $$('[data-monthly]');
  var billingNotes = $$('[data-monthly-note]');

  function replaySwap(element) {
    if (!element || reduceMotion) return;
    element.classList.remove('is-swapping');
    void element.offsetWidth;
    element.classList.add('is-swapping');
  }

  billingButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var period = button.getAttribute('data-billing');

      billingButtons.forEach(function (item) {
        var active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      prices.forEach(function (price) {
        price.textContent = price.getAttribute('data-' + period);
        replaySwap(price.closest('.sa-price'));
      });

      billingNotes.forEach(function (note) {
        note.textContent = note.getAttribute('data-' + period + '-note');
        replaySwap(note);
      });
    });
  });

  var signupForm = $('#sa-signup');
  var email = $('#sa-email');
  var signupNote = $('#sa-signup-note');

  if (signupForm && email && signupNote) {
    signupForm.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!email.value.trim() || !email.checkValidity()) {
        signupNote.textContent = 'Enter a valid work email to continue.';
        signupNote.classList.remove('is-success');
        signupNote.classList.add('is-error');
        email.focus();
        return;
      }

      signupNote.textContent = 'You are in. Check ' + email.value.trim() + ' for your invite.';
      signupNote.classList.remove('is-error');
      signupNote.classList.add('is-success');
      signupForm.reset();
    });

    email.addEventListener('input', function () {
      if (!signupNote.classList.contains('is-success') && !signupNote.classList.contains('is-error')) return;
      signupNote.textContent = 'Free for 14 days. No credit card.';
      signupNote.classList.remove('is-success', 'is-error');
    });
  }

  var toast = $('#sa-toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 3400);
  }

  var modal = $('#sa-release-modal');
  var releaseForm = $('#sa-release-form');
  var openButtons = $$('[data-open-release]');
  var closeButton = $('.sa-modal-close', modal || document);
  var lastTrigger = null;

  function openRelease(trigger) {
    if (!modal) return;
    lastTrigger = trigger || null;
    if (typeof modal.showModal === 'function') {
      if (!modal.open) modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
    document.body.classList.add('sa-modal-open');
    var versionInput = $('#sa-new-version');
    if (versionInput) {
      window.setTimeout(function () {
        versionInput.focus();
        versionInput.select();
      }, 30);
    }
  }

  function closeRelease() {
    if (!modal) return;
    if (typeof modal.close === 'function' && modal.open) {
      modal.close();
    } else {
      modal.removeAttribute('open');
      document.body.classList.remove('sa-modal-open');
    }
    document.body.classList.remove('sa-modal-open');
  }

  if (modal) {
    openButtons.forEach(function (button) {
      button.addEventListener('click', function () { openRelease(button); });
    });

    if (closeButton) closeButton.addEventListener('click', closeRelease);

    modal.addEventListener('click', function (event) {
      if (event.target !== modal) return;
      var rect = modal.getBoundingClientRect();
      var inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) closeRelease();
    });

    modal.addEventListener('close', function () {
      document.body.classList.remove('sa-modal-open');
      if (lastTrigger) lastTrigger.focus();
      lastTrigger = null;
    });
  }

  function addActivity(version) {
    var activity = $('#sa-activity');
    if (!activity) return;
    var row = document.createElement('div');
    var avatar = document.createElement('span');
    var copy = document.createElement('div');
    var title = document.createElement('strong');
    var meta = document.createElement('small');
    var check = document.createElement('span');

    row.className = 'sa-activity-row';
    avatar.className = 'sa-avatar sa-avatar--blue';
    avatar.textContent = 'AK';
    title.textContent = 'You shipped ' + version;
    meta.textContent = 'Production - just now';
    check.className = 'sa-check';
    check.textContent = '\u2713';

    copy.appendChild(title);
    copy.appendChild(meta);
    row.appendChild(avatar);
    row.appendChild(copy);
    row.appendChild(check);

    var head = $('.sa-card-head', activity);
    activity.insertBefore(row, head ? head.nextSibling : activity.firstChild);
  }

  if (releaseForm && modal) {
    releaseForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (typeof releaseForm.reportValidity === 'function' && !releaseForm.reportValidity()) return;

      var versionInput = $('#sa-new-version');
      var notesInput = $('#sa-new-notes');
      var version = versionInput ? versionInput.value.trim() : 'v2.4.1';
      var notes = notesInput ? notesInput.value.trim().replace(/\s+/g, ' ') : 'A calmer release.';

      var currentVersion = $('#sa-current-version');
      var releaseCopy = $('#sa-release-copy');
      var progress = $('#sa-release-progress');
      var meta = $('#sa-release-meta');
      var percent = $('#sa-release-percent');
      var card = $('.sa-release-card');

      if (currentVersion) currentVersion.textContent = version;
      if (releaseCopy) releaseCopy.textContent = notes;
      if (progress) progress.style.width = '100%';
      if (meta) meta.textContent = '14 of 14 tasks';
      if (percent) percent.textContent = '100%';
      if (card) {
        card.classList.add('is-updated');
        window.setTimeout(function () { card.classList.remove('is-updated'); }, 850);
      }

      addActivity(version);
      closeRelease();
      releaseForm.reset();
      showToast(version + ' is live. Nice ship.');
    });
  }

  var faqItems = $$('.sa-faq-item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  var spotTargets = $$('[data-spotlight]');
  spotTargets.forEach(function (target) {
    var spot = document.createElement('span');
    spot.className = 'sa-spot';
    spot.setAttribute('aria-hidden', 'true');
    target.appendChild(spot);

    target.addEventListener('pointermove', function (event) {
      var rect = target.getBoundingClientRect();
      target.style.setProperty('--sa-x', ((event.clientX - rect.left) / rect.width * 100) + '%');
      target.style.setProperty('--sa-y', ((event.clientY - rect.top) / rect.height * 100) + '%');
    });
  });

  var revealItems = $$('.sa-section-head, .sa-bento-card, .sa-integrations-head, .sa-integration, .sa-customers-head, .sa-quote, .sa-pricing-head, .sa-plan, .sa-faq-intro, .sa-faq-item, .sa-signup-card');
  revealItems.forEach(function (item, index) {
    item.classList.add('sa-reveal');
    item.style.setProperty('--sa-delay', (Math.min(index % 4, 3) * 0.06) + 's');
  });

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealItems.forEach(function (item) { item.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  var scrollProgress = $('.sa-scroll-progress span');
  var header = $('.sa-header');
  var navLinks = $$('.sa-links > a');
  var sections = ['features', 'customers', 'pricing'].map(function (id) {
    return document.getElementById(id);
  }).filter(Boolean);
  var ticking = false;

  function updateScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? window.scrollY / max : 0;

    if (scrollProgress) scrollProgress.style.width = (Math.min(Math.max(ratio, 0), 1) * 100) + '%';
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);

    var current = 'product';
    sections.forEach(function (section) {
      if (window.scrollY >= section.offsetTop - 190) current = section.id;
    });

    navLinks.forEach(function (link) {
      link.classList.toggle('is-current', link.getAttribute('href') === '#' + current);
    });

    ticking = false;
  }

  function requestScrollUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScroll);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateScroll();

  var year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
