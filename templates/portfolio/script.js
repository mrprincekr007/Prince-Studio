(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var toggle = document.querySelector('.pf-toggle');
  var links = document.querySelector('.pf-links');

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

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  var progress = document.querySelector('.pf-progress span');
  var art = document.querySelector('.pf-art');
  var artGlow = document.querySelector('.pf-art-glow');
  var navItems = [];

  Array.prototype.forEach.call(document.querySelectorAll('.pf-links a[href^="#"]'), function (link) {
    if (link.classList.contains('pf-available')) return;
    var section = document.querySelector(link.getAttribute('href'));
    if (section) navItems.push({ link: link, section: section });
  });

  function updateNav() {
    if (!navItems.length) return;
    var marker = window.scrollY + 150;
    var current = null;

    navItems.forEach(function (item) {
      if (item.section.offsetTop <= marker) current = item;
    });

    navItems.forEach(function (item) {
      item.link.classList.toggle('is-current', item === current);
    });
  }

  function updateParallax() {
    if (!art || !artGlow || reduceMotion) return;
    var rect = art.getBoundingClientRect();
    if (rect.bottom < -160 || rect.top > window.innerHeight + 160) return;
    var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.07;
    artGlow.style.setProperty('--parallax-y', offset.toFixed(1) + 'px');
  }

  var scrollQueued = false;

  function updateScroll() {
    scrollQueued = false;
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      ratio = Math.min(1, Math.max(0, ratio));
      progress.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    }
    updateNav();
    updateParallax();
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

  Array.prototype.forEach.call(document.querySelectorAll('[data-spotlight]'), function (el) {
    var spot = document.createElement('span');
    spot.className = 'pf-spot';
    spot.setAttribute('aria-hidden', 'true');
    el.insertBefore(spot, el.firstChild);

    el.addEventListener('pointermove', function (event) {
      var rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((event.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
    });
  });

  var revealGroups = [
    ['.pf-section-head', 0],
    ['.pf-project', 90],
    ['.pf-service', 90],
    ['.pf-step', 70],
    ['.pf-note', 0],
    ['.pf-contact', 0],
    ['.pf-about > *', 90],
    ['.pf-process-intro', 0]
  ];
  var revealItems = [];
  var seen = [];

  revealGroups.forEach(function (group) {
    Array.prototype.forEach.call(document.querySelectorAll(group[0]), function (el, index) {
      if (seen.indexOf(el) > -1) return;
      seen.push(el);
      el.classList.add('pf-reveal');
      if (group[1]) el.style.setProperty('--delay', index * group[1] + 'ms');
      revealItems.push(el);
    });
  });

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  }

  var counters = document.querySelectorAll('[data-count]');

  function settleCounters() {
    Array.prototype.forEach.call(counters, function (counter) {
      counter.textContent = counter.getAttribute('data-count') + (counter.getAttribute('data-suffix') || '');
    });
  }

  function runCounter(counter) {
    if (counter.dataset.counted) return;
    counter.dataset.counted = 'true';
    var target = parseInt(counter.getAttribute('data-count'), 10) || 0;
    var suffix = counter.getAttribute('data-suffix') || '';
    var start = 0;
    var duration = 1300;

    function frame(now) {
      if (!start) start = now;
      var progressValue = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - progressValue, 3);
      counter.textContent = Math.round(target * eased) + suffix;
      if (progressValue < 1) window.requestAnimationFrame(frame);
    }

    counter.textContent = '0' + suffix;
    window.requestAnimationFrame(frame);
  }

  if (reduceMotion) {
    settleCounters();
  } else if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.7 });

    Array.prototype.forEach.call(counters, function (counter) {
      counter.textContent = '0' + (counter.getAttribute('data-suffix') || '');
      counterObserver.observe(counter);
    });
  } else {
    settleCounters();
  }

  if (finePointer && !reduceMotion) {
    var ring = document.createElement('span');
    var dot = document.createElement('span');
    ring.className = 'pf-cursor';
    dot.className = 'pf-cursor-dot';
    ring.setAttribute('aria-hidden', 'true');
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.body.classList.add('pf-has-cursor');

    var pointerX = window.innerWidth / 2;
    var pointerY = window.innerHeight / 2;
    var ringX = pointerX;
    var ringY = pointerY;

    document.addEventListener('pointermove', function (event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      dot.style.transform = 'translate3d(' + pointerX + 'px,' + pointerY + 'px,0)';
    }, { passive: true });

    function followPointer() {
      ringX += (pointerX - ringX) * 0.16;
      ringY += (pointerY - ringY) * 0.16;
      ring.style.transform = 'translate3d(' + ringX.toFixed(1) + 'px,' + ringY.toFixed(1) + 'px,0)';
      window.requestAnimationFrame(followPointer);
    }
    window.requestAnimationFrame(followPointer);

    var interactive = 'a, button, .pf-project, input, textarea, select, [role="button"]';

    document.addEventListener('pointerover', function (event) {
      if (event.target.closest && event.target.closest(interactive)) ring.classList.add('is-hover');
    });

    document.addEventListener('pointerout', function (event) {
      if (event.target.closest && event.target.closest(interactive)) ring.classList.remove('is-hover');
    });

    Array.prototype.forEach.call(document.querySelectorAll('.magnetic, .pf-available'), function (el) {
      el.addEventListener('pointermove', function (event) {
        var rect = el.getBoundingClientRect();
        var dx = (event.clientX - (rect.left + rect.width / 2)) * 0.16;
        var dy = (event.clientY - (rect.top + rect.height / 2)) * 0.16;
        dx = Math.max(-7, Math.min(7, dx));
        dy = Math.max(-7, Math.min(7, dy));
        el.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
      });

      el.addEventListener('pointerleave', function () {
        el.style.transform = 'translate3d(0,0,0)';
      });
    });

    if (art) {
      art.addEventListener('pointermove', function (event) {
        var rect = art.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        art.style.setProperty('--tilt-y', (x * 7).toFixed(2) + 'deg');
        art.style.setProperty('--tilt-x', (-y * 7).toFixed(2) + 'deg');
      });

      art.addEventListener('pointerleave', function () {
        art.style.setProperty('--tilt-y', '0deg');
        art.style.setProperty('--tilt-x', '0deg');
      });
    }
  }

  var dialog = document.getElementById('pf-project-modal');

  if (dialog && typeof dialog.showModal === 'function') {
    var projects = {
      northwind: {
        mark: 'N',
        year: '2025',
        role: 'Product system / direction',
        title: 'Northwind',
        copy: 'A climate intelligence platform was growing faster than its interface. We rebuilt the product language around one system, then used it to simplify the highest-friction workflows.',
        scope: 'Brand, product, web',
        time: '12 weeks',
        result: 'One coherent product language'
      },
      lumen: {
        mark: 'L',
        year: '2024',
        role: 'Editorial product design',
        title: 'Lumen',
        copy: 'A reading app with a strong point of view and a noisy interface. The work was mostly subtraction: quieter hierarchy, better typography and a calmer first session.',
        scope: 'Product, editorial, web',
        time: '9 weeks',
        result: 'A calmer reading experience'
      },
      atlas: {
        mark: 'A',
        year: '2024',
        role: 'Interface / interaction',
        title: 'Atlas',
        copy: 'Spatial tools tend to hide their logic. Atlas needed to feel discoverable without a manual. We prototyped the core interactions in the browser and built the system around what felt inevitable.',
        scope: 'Product, interaction, system',
        time: '14 weeks',
        result: 'A spatial tool that feels natural'
      }
    };

    var closeButton = dialog.querySelector('.pf-modal-close');
    var lastTrigger = null;
    var cursorWasEnabled = false;

    function setText(id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    function openProject(key, trigger) {
      var project = projects[key];
      if (!project) return;

      dialog.dataset.project = key;
      setText('pf-modal-mark', project.mark);
      setText('pf-modal-year', project.year);
      setText('pf-modal-role', project.role);
      setText('pf-modal-title', project.title);
      setText('pf-modal-copy', project.copy);
      setText('pf-modal-scope', project.scope);
      setText('pf-modal-time', project.time);
      setText('pf-modal-result', project.result);

      lastTrigger = trigger;
      cursorWasEnabled = document.body.classList.contains('pf-has-cursor');
      document.body.classList.remove('pf-has-cursor');
      dialog.showModal();
      document.body.classList.add('pf-modal-open');
      if (closeButton) closeButton.focus();
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-project]'), function (button) {
      button.addEventListener('click', function () {
        openProject(button.getAttribute('data-project'), button);
      });
    });

    if (closeButton) closeButton.addEventListener('click', function () { dialog.close(); });

    dialog.addEventListener('close', function () {
      document.body.classList.remove('pf-modal-open');
      if (cursorWasEnabled) document.body.classList.add('pf-has-cursor');
      if (lastTrigger) lastTrigger.focus();
    });

    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var rect = dialog.getBoundingClientRect();
      var outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) dialog.close();
    });

    var modalLink = dialog.querySelector('[data-close-modal]');
    if (modalLink) modalLink.addEventListener('click', function () { dialog.close(); });
  }
})();
