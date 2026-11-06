(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var toggle = document.querySelector('.rs-toggle');
  var links = document.querySelector('.rs-links');

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

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.rs-tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.rs-panel'));

  function setTab(tab) {
    tabs.forEach(function (item) {
      var active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });

    panels.forEach(function (panel) {
      var active = panel.getAttribute('data-panel') === tab.getAttribute('data-tab');
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      setTab(tab);
    });

    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      var next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      setTab(next);
      next.focus();
    });
  });

  var date = document.querySelector('#rs-date');
  if (date) {
    var now = new Date();
    var min = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    date.min = min.toISOString().slice(0, 10);
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function icsDate(value) {
    return value.getUTCFullYear() + pad(value.getUTCMonth() + 1) + pad(value.getUTCDate()) + 'T' +
      pad(value.getUTCHours()) + pad(value.getUTCMinutes()) + '00Z';
  }

  function parseTime(value) {
    var match = String(value).match(/(\d+):(\d+)\s*(am|pm)/i);
    if (!match) return { hours: 19, minutes: 0 };
    var hours = parseInt(match[1], 10);
    var minutes = parseInt(match[2], 10);
    if (match[3].toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (match[3].toLowerCase() === 'am' && hours === 12) hours = 0;
    return { hours: hours, minutes: minutes };
  }

  var form = document.querySelector('#rs-form');
  var confirm = document.querySelector('#rs-confirm');
  var confirmText = document.querySelector('#rs-confirm-text');
  var again = document.querySelector('#rs-again');
  var calendarLink = document.querySelector('#rs-calendar');

  function clearCalendar() {
    if (!calendarLink) return;
    if (calendarLink.dataset.url) URL.revokeObjectURL(calendarLink.dataset.url);
    calendarLink.removeAttribute('data-url');
    calendarLink.href = '#';
    calendarLink.hidden = true;
  }

  function setCalendar(data, dateValue, timeValue, guests) {
    if (!calendarLink || !dateValue || !timeValue) return;
    var time = parseTime(timeValue);
    var start = new Date(dateValue + 'T12:00:00');
    if (Number.isNaN(start.getTime())) return;
    start.setHours(time.hours, time.minutes, 0, 0);
    var end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    var stamp = icsDate(new Date());
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tandoor//Reservation//EN',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@tandoor.in',
      'DTSTAMP:' + stamp,
      'DTSTART:' + icsDate(start),
      'DTEND:' + icsDate(end),
      'SUMMARY:Tandoor reservation for ' + guests,
      'LOCATION:14 Chapel Lane Bandra West Mumbai',
      'DESCRIPTION:Table request for ' + guests + ' at Tandoor. Confirmation will arrive by email.',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    var blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
    clearCalendar();
    var url = URL.createObjectURL(blob);
    calendarLink.href = url;
    calendarLink.download = 'tandoor-reservation.ics';
    calendarLink.dataset.url = url;
    calendarLink.hidden = false;
  }

  if (form && confirm && confirmText) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var dateValue = data.get('date');
      var timeValue = data.get('time');
      var guests = data.get('guests');
      var email = data.get('email');
      var prettyDate = dateValue
        ? new Date(dateValue + 'T12:00:00').toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : '';

      confirmText.textContent =
        'Your request for ' +
        guests +
        ' on ' +
        prettyDate +
        ' at ' +
        timeValue +
        ' is in. We will email ' +
        email +
        ' to confirm.';

      setCalendar(data, dateValue, timeValue, guests);

      form.hidden = true;
      confirm.hidden = false;
      confirm.querySelector('h3').focus();
    });
  }

  if (again && form && confirm) {
    again.addEventListener('click', function () {
      clearCalendar();
      confirm.hidden = true;
      form.hidden = false;
      form.reset();
      form.querySelector('input').focus();
    });
  }

  var statusNodes = Array.prototype.slice.call(document.querySelectorAll('.rs-status'));

  function updateStatus() {
    if (!statusNodes.length) return;
    var current = new Date();
    var day = current.getDay();
    var minutes = current.getHours() * 60 + current.getMinutes();
    var close = (day === 0 || day === 5 || day === 6) ? 23 * 60 + 30 : 23 * 60;
    var isOpen = day !== 1 && minutes >= 18 * 60 && minutes < close;
    var label;

    if (day === 1) label = 'Closed today';
    else if (isOpen) label = 'Open now';
    else if (minutes < 18 * 60) label = 'Opens at 6:00 pm';
    else label = 'Closed for tonight';

    statusNodes.forEach(function (node) {
      node.classList.toggle('is-open', isOpen);
      var text = node.querySelector('span');
      if (text) text.textContent = label;
    });
  }

  updateStatus();
  window.setInterval(updateStatus, 60000);

  var progress = document.querySelector('.rs-progress span');
  var header = document.querySelector('.rs-header');
  var hero = document.querySelector('.rs-hero');
  var reserveSection = document.querySelector('#reserve');
  var footer = document.querySelector('.rs-footer');
  var mobileCta = document.querySelector('#rs-mobile-cta');
  var scrollQueued = false;

  function updateMobileCta() {
    if (!mobileCta) return;
    if (window.innerWidth > 720) {
      mobileCta.classList.remove('is-visible');
      return;
    }
    var afterHero = hero ? window.scrollY > hero.offsetTop + hero.offsetHeight - 140 : window.scrollY > 460;
    var beforeReserve = reserveSection ? window.scrollY < reserveSection.offsetTop - window.innerHeight * 0.52 : true;
    var beforeFooter = footer ? window.scrollY < footer.offsetTop - window.innerHeight * 0.75 : true;
    mobileCta.classList.toggle('is-visible', afterHero && beforeReserve && beforeFooter);
  }

  function updateScroll() {
    scrollQueued = false;
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      ratio = Math.min(1, Math.max(0, ratio));
      progress.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    }
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 20);
    updateMobileCta();
  }

  function queueScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateScroll);
  }

  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll);
  window.addEventListener('load', queueScroll);
  updateScroll();

  var groups = [
    ['.rs-section-head', 0],
    ['.rs-signature', 90],
    ['.rs-room-card', 80],
    ['.rs-events-card', 0],
    ['.rs-newsletter-inner > *', 90],
    ['.rs-story > *', 90],
    ['.rs-visit > *', 90],
    ['.rs-reserve-copy', 0],
    ['.rs-form-card', 0],
    ['.rs-menu-shell', 0],
    ['.rs-quote .rs-eyebrow, .rs-quote blockquote, .rs-quote-by', 80]
  ];
  var revealItems = [];
  var seen = [];

  groups.forEach(function (group) {
    Array.prototype.forEach.call(document.querySelectorAll(group[0]), function (el, index) {
      if (seen.indexOf(el) > -1) return;
      seen.push(el);
      el.classList.add('rs-reveal');
      if (group[1]) el.style.setProperty('--delay', index * group[1] + 'ms');
      revealItems.push(el);
    });
  });

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

    revealItems.forEach(function (el) { observer.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  }

  var newsForm = document.querySelector('#rs-news-form');
  var newsEmail = document.querySelector('#rs-news-email');
  var newsNote = document.querySelector('#rs-news-note');

  if (newsForm && newsEmail && newsNote) {
    newsForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!newsForm.reportValidity()) return;
      newsNote.textContent = 'You are on the list. The first letter is on its way.';
      newsNote.classList.add('is-success');
      newsEmail.value = '';
      var button = newsForm.querySelector('button');
      if (button) {
        button.textContent = 'Added';
        button.disabled = true;
      }
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
