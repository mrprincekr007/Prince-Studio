(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');

  if (toggle && links) {
    var setMenu = function (open) {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    setMenu(false);

    toggle.addEventListener('click', function (event) {
      event.stopPropagation();
      setMenu(!links.classList.contains('open'));
    });

    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenu(false);
      });
    });

    document.addEventListener('click', function (event) {
      if (!links.classList.contains('open')) return;
      if (links.contains(event.target) || toggle.contains(event.target)) return;
      setMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !links.classList.contains('open')) return;
      setMenu(false);
      toggle.focus();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 820 && links.classList.contains('open')) setMenu(false);
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  var proofRail = document.querySelector('.app-proof-rail');
  if (proofRail) {
    var proofWrap = proofRail.closest('.app-proof-rail-wrap');
    var syncProofRail = function () {
      if (!proofWrap) return;
      var max = proofRail.scrollWidth - proofRail.clientWidth;
      proofWrap.classList.toggle('is-scrollable', max > 2);
      proofWrap.classList.toggle('is-at-start', proofRail.scrollLeft <= 2);
      proofWrap.classList.toggle('is-at-end', proofRail.scrollLeft >= max - 2);
    };

    proofRail.addEventListener('scroll', syncProofRail, { passive: true });
    window.addEventListener('resize', syncProofRail);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncProofRail);
    if ('ResizeObserver' in window) new ResizeObserver(syncProofRail).observe(proofRail);
    syncProofRail();
  }

  var textHeads = document.querySelectorAll('main h1, main h2');
  if (!reduceMotion && textHeads.length && 'IntersectionObserver' in window) {
    var wrapWords = function (root, state) {
      Array.prototype.slice.call(root.childNodes).forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          var parts = node.nodeValue.split(/(\s+)/);
          if (!parts.some(function (part) { return part.trim(); })) return;
          var fragment = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (!part.trim()) {
              fragment.appendChild(document.createTextNode(part));
              return;
            }
            var word = document.createElement('span');
            word.className = 'text-word';
            var inner = document.createElement('span');
            inner.className = 'text-word-inner';
            inner.textContent = part;
            inner.style.setProperty('--word-index', state.index++);
            word.appendChild(inner);
            fragment.appendChild(word);
          });
          root.replaceChild(fragment, node);
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
          wrapWords(node, state);
        }
      });
    };

    var textObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-text-visible');
        textObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -8% 0px' });

    textHeads.forEach(function (heading) {
      wrapWords(heading, { index: 0 });
      heading.classList.add('text-reveal');
      textObserver.observe(heading);
    });
  }

  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  var header = document.querySelector('.site-header');
  var hero = document.querySelector('.hero');
  var win = document.querySelector('.hero .window');
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  var band = document.querySelector('.kinetic-band');
  var track = band ? band.querySelector('.kinetic-track') : null;

  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  var progressFill = document.createElement('i');
  progress.appendChild(progressFill);
  document.body.appendChild(progress);

  var lastY = window.pageYOffset || 0;
  var queued = false;

  function renderScroll() {
    queued = false;
    var y = window.pageYOffset;
    var root = document.documentElement;
    var max = root.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    progressFill.style.transform = 'scaleX(' + ratio + ')';

    if (header) {
      header.classList.toggle('is-scrolled', y > 12);
      if (!reduceMotion && !(links && links.classList.contains('open'))) {
        if (y > 280 && y > lastY + 6) header.classList.add('is-hidden');
        else if (y < lastY - 6 || y < 180) header.classList.remove('is-hidden');
      }
    }

    if (!reduceMotion && win && hero && window.innerWidth > 760) {
      var rect = hero.getBoundingClientRect();
      var flat = Math.min(1, Math.max(0, -rect.top / (rect.height * 0.8)));
      win.style.setProperty('--win-tilt', ((1 - flat) * 5).toFixed(2) + 'deg');
      win.style.setProperty('--win-y', ((1 - flat) * 12).toFixed(2) + 'px');
    }

    if (!reduceMotion && shots.length && window.innerWidth > 960) {
      var mid = window.innerHeight / 2;
      shots.forEach(function (shot) {
        var r = shot.getBoundingClientRect();
        if (r.bottom < -120 || r.top > window.innerHeight + 120) return;
        var offset = (r.top + r.height / 2 - mid) * -0.045;
        offset = Math.max(-24, Math.min(24, offset));
        shot.style.setProperty('--py', offset.toFixed(1) + 'px');
      });
    }

    if (!reduceMotion && track && band) {
      var bandRect = band.getBoundingClientRect();
      var travel = Math.min(1, Math.max(0, (window.innerHeight - bandRect.top) / (window.innerHeight + bandRect.height)));
      track.style.setProperty('--kx', (travel * 360).toFixed(1) + 'px');
    }

    lastY = y;
  }

  window.addEventListener('scroll', function () {
    if (!queued) {
      queued = true;
      requestAnimationFrame(renderScroll);
    }
  }, { passive: true });

  window.addEventListener('resize', renderScroll);
  renderScroll();

  if (finePointer && !reduceMotion && hero) {
    var pointerFrame = null;
    var px = 0;
    var py = 0;

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
      if (!pointerFrame) {
        pointerFrame = requestAnimationFrame(function () {
          pointerFrame = null;
          hero.style.setProperty('--mx', px.toFixed(3));
          hero.style.setProperty('--my', py.toFixed(3));
        });
      }
    });

    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--mx', '0');
      hero.style.setProperty('--my', '0');
    });
  }

  var stats = document.querySelectorAll('.stat strong');
  if (stats.length && !reduceMotion && 'IntersectionObserver' in window) {
    var strip = document.querySelector('.stat-strip');

    var countUp = function (el) {
      var original = el.textContent.trim();
      var parts = original.match(/^([\d.]+)(.*)$/);
      if (!parts) return;
      var target = parseFloat(parts[1]);
      var suffix = parts[2] || '';
      var decimals = (parts[1].split('.')[1] || '').length;
      var started = null;

      var step = function (now) {
        if (!started) started = now;
        var p = Math.min(1, (now - started) / 1100);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = original;
      };

      requestAnimationFrame(step);
      setTimeout(function () { el.textContent = original; }, 1700);
    };

    if (strip) {
      var statObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            stats.forEach(countUp);
            statObserver.disconnect();
          }
        });
      }, { threshold: 0.4 });
      statObserver.observe(strip);
    }
  }

  var build = document.querySelector('.build-mock');
  if (build && !reduceMotion && 'IntersectionObserver' in window) {
    build.classList.add('is-pending');
    var buildObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          build.classList.add('is-built');
          buildObserver.disconnect();
        }
      });
    }, { threshold: 0.35 });
    buildObserver.observe(build);
  }

  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.tpl').forEach(function (tpl) {
      var preview = tpl.querySelector('.tpl-shot');
      if (!preview) return;

      tpl.addEventListener('pointermove', function (e) {
        var r = tpl.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        preview.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
        preview.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg');
      });

      tpl.addEventListener('pointerleave', function () {
        preview.style.setProperty('--rx', '0deg');
        preview.style.setProperty('--ry', '0deg');
      });
    });

    shots.forEach(function (shot) {
      shot.addEventListener('pointermove', function (e) {
        var r = shot.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        shot.style.setProperty('--rx', (-y * 4).toFixed(2) + 'deg');
        shot.style.setProperty('--ry', (x * 4).toFixed(2) + 'deg');
      });

      shot.addEventListener('pointerleave', function () {
        shot.style.setProperty('--rx', '0deg');
        shot.style.setProperty('--ry', '0deg');
      });
    });

    document.querySelectorAll('.hero-actions .btn').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.14;
        var y = (e.clientY - r.top - r.height / 2) * 0.22;
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });

      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
      });
    });
  }

  var ide = document.querySelector('[data-ide]');

  if (ide) {
    var ideTabs = Array.prototype.slice.call(ide.querySelectorAll('.ide-tab'));
    var ideFiles = Array.prototype.slice.call(ide.querySelectorAll('.ide-file'));
    var idePanels = Array.prototype.slice.call(ide.querySelectorAll('.ide-filepanel'));
    var ideCrumb = ide.querySelector('[data-crumb]');
    var ideSymbol = ide.querySelector('[data-symbol]');
    var ideLang = ide.querySelector('[data-lang]');
    var idePosition = ide.querySelector('[data-position]');
    var runButtons = Array.prototype.slice.call(ide.querySelectorAll('[data-run]'));
    var runLabels = Array.prototype.slice.call(ide.querySelectorAll('[data-run-label]'));
    var refreshButton = ide.querySelector('[data-refresh]');
    var mobileButtons = Array.prototype.slice.call(ide.querySelectorAll('[data-mobile-view]'));
    var railButtons = Array.prototype.slice.call(ide.querySelectorAll('[data-rail]'));
    var previewPanel = ide.querySelector('.ide-preview');
    var previewTabs = Array.prototype.slice.call(ide.querySelectorAll('[data-preview-tab]'));
    var previewStage = ide.querySelector('.preview-stage');
    var previewTerminal = ide.querySelector('[data-terminal]');
    var previewStatus = ide.querySelector('[data-preview-status]');
    var previewDim = ide.querySelector('[data-preview-dim]');
    var toast = ide.querySelector('[data-toast]');
    var palette = ide.querySelector('[data-palette]');
    var paletteOpen = ide.querySelector('[data-palette-open]');
    var paletteInput = ide.querySelector('[data-palette-input]');
    var paletteItems = Array.prototype.slice.call(ide.querySelectorAll('[data-palette-file]'));
    var paletteEmpty = ide.querySelector('[data-palette-empty]');
    var runTimer = null;
    var refreshTimer = null;
    var toastTimer = null;

    var fileMeta = {
      'index.html': { lang: 'HTML', symbol: 'section.hero', position: 'Ln 9, Col 22' },
      'styles.css': { lang: 'CSS', symbol: '.hero', position: 'Ln 7, Col 1' },
      'script.js': { lang: 'JavaScript', symbol: 'menu?.addEventListener', position: 'Ln 4, Col 32' }
    };

    var openFile = function (name) {
      var meta = fileMeta[name];
      if (!meta) return;

      idePanels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-panel') !== name;
      });

      ideTabs.forEach(function (tab) {
        var active = tab.getAttribute('data-file') === name;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      ideFiles.forEach(function (file) {
        file.classList.toggle('active', file.getAttribute('data-file') === name);
      });

      if (ideCrumb) ideCrumb.textContent = name;
      if (ideSymbol) ideSymbol.textContent = meta.symbol;
      if (ideLang) ideLang.textContent = meta.lang;
      if (idePosition) idePosition.textContent = meta.position;
    };

    ideTabs.concat(ideFiles).forEach(function (button) {
      button.addEventListener('click', function () {
        openFile(button.getAttribute('data-file'));
      });
    });

    ideTabs.forEach(function (tab, index) {
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var next = ideTabs[(index + (e.key === 'ArrowRight' ? 1 : ideTabs.length - 1)) % ideTabs.length];
        openFile(next.getAttribute('data-file'));
        next.focus();
      });
    });

    var showToast = function (message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove('show');
      }, 2600);
    };

    var setPreviewTab = function (name) {
      var terminalMode = name === 'terminal';

      previewTabs.forEach(function (tab) {
        var active = tab.getAttribute('data-preview-tab') === name;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      if (previewPanel) previewPanel.classList.toggle('show-terminal', terminalMode);
      if (previewTerminal) previewTerminal.hidden = !terminalMode;
      if (previewStage) previewStage.hidden = terminalMode;
      if (previewStatus) previewStatus.innerHTML = terminalMode ? '<i></i> Shell ready' : '<i></i> Hot reload';
      if (previewDim) previewDim.textContent = terminalMode ? 'zsh · UTF-8' : '390 × 844';
    };

    previewTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        setPreviewTab(tab.getAttribute('data-preview-tab'));
      });
    });

    var setBuilding = function (building) {
      ide.classList.toggle('is-building', building);
      runButtons.forEach(function (button) {
        button.classList.toggle('is-building', building);
        button.disabled = building;
      });
      runLabels.forEach(function (label) {
        label.textContent = building ? 'Building' : 'Run';
      });
    };

    var startBuild = function () {
      if (ide.classList.contains('is-building')) return;
      setBuilding(true);
      clearTimeout(runTimer);
      runTimer = setTimeout(function () {
        setBuilding(false);
        showToast('Build complete — app-release.apk signed');
      }, 1050);
    };

    runButtons.forEach(function (button) {
      button.addEventListener('click', startBuild);
    });

    railButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var rail = button.getAttribute('data-rail');

        if (rail === 'search') {
          showPalette();
          return;
        }

        if (rail === 'run') {
          startBuild();
          return;
        }

        var messages = {
          explorer: 'Explorer — 5 files · 2 checkpoints',
          source: 'Source control — working tree clean',
          extensions: '4 built-in tools — no extensions needed',
          account: 'Local-first — no account required',
          settings: 'Settings saved on this device'
        };

        if (messages[rail]) showToast(messages[rail]);
      });
    });

    if (refreshButton) {
      refreshButton.addEventListener('click', function () {
        ide.classList.add('is-building');
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () {
          ide.classList.remove('is-building');
        }, 520);
        showToast('Preview refreshed · localhost:8080');
      });
    }

    mobileButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var preview = button.getAttribute('data-mobile-view') === 'preview';
        ide.classList.toggle('show-preview', preview);
        if (preview) setPreviewTab('preview');
        mobileButtons.forEach(function (item) {
          var active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      });
    });

    var closePalette = function () {
      if (!palette) return;
      palette.hidden = true;
      if (paletteOpen) {
        paletteOpen.setAttribute('aria-expanded', 'false');
        paletteOpen.focus();
      }
    };

    var filterPalette = function () {
      if (!paletteInput) return;
      var query = paletteInput.value.trim().toLowerCase();
      var visible = 0;

      paletteItems.forEach(function (item) {
        var match = item.getAttribute('data-palette-file').toLowerCase().indexOf(query) !== -1;
        item.hidden = !match;
        if (match) visible += 1;
      });

      if (paletteEmpty) paletteEmpty.hidden = visible > 0;
    };

    var showPalette = function () {
      if (!palette) return;
      palette.hidden = false;
      if (paletteOpen) paletteOpen.setAttribute('aria-expanded', 'true');
      if (paletteInput) {
        paletteInput.value = '';
        filterPalette();
        paletteInput.focus();
      }
    };

    if (palette && paletteOpen && paletteInput) {
      paletteOpen.addEventListener('click', showPalette);
      paletteInput.addEventListener('input', filterPalette);

      paletteInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var first = paletteItems.filter(function (item) { return !item.hidden; })[0];
        if (!first) return;
        openFile(first.getAttribute('data-palette-file'));
        closePalette();
      });

      paletteItems.forEach(function (item) {
        item.addEventListener('click', function () {
          openFile(item.getAttribute('data-palette-file'));
          closePalette();
        });
      });

      palette.addEventListener('click', function (e) {
        if (e.target === palette) closePalette();
      });

      document.addEventListener('keydown', function (e) {
        if (palette.hidden) return;
        if (e.key === 'Escape') closePalette();
      });
    }

    if (palette) {
      document.addEventListener('keydown', function (e) {
        if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
        if (e.key.toLowerCase() !== 'p') return;
        e.preventDefault();
        showPalette();
      });
    }
  }
})();

(function () {
  var section = document.querySelector('[data-fscroll]');
  if (!section) return;

  var cards = Array.prototype.slice.call(section.querySelectorAll('[data-fcard]'));
  var tabs = Array.prototype.slice.call(section.querySelectorAll('[data-fstep]'));
  var pin = section.querySelector('.fscroll-pin');
  var progress = section.querySelector('[data-fprogress]');
  var indexLabel = section.querySelector('[data-findex]');
  var liquid = section.querySelector('.fscroll-liquid');
  var liquidTimer = 0;
  var desktop = window.matchMedia('(min-width: 900px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var active = 0;
  var enhanced = false;
  var scheduled = false;
  var scrollLock = false;
  var lockTimer = 0;

  if (!cards.length || !pin) return;

  var syncLiquid = function (animate) {
    if (!liquid || !enhanced || !tabs[active]) return;

    var tab = tabs[active];
    liquid.style.setProperty('--liquid-x', tab.offsetLeft + 'px');
    liquid.style.setProperty('--liquid-y', tab.offsetTop + 'px');
    liquid.style.setProperty('--liquid-w', tab.offsetWidth + 'px');
    liquid.style.setProperty('--liquid-h', tab.offsetHeight + 'px');

    if (!animate) return;

    liquid.classList.remove('is-moving');
    void liquid.offsetWidth;
    liquid.classList.add('is-moving');
    window.clearTimeout(liquidTimer);
    liquidTimer = window.setTimeout(function () {
      liquid.classList.remove('is-moving');
    }, 640);
  };

  var assignSlots = function () {
    cards.forEach(function (card, i) {
      var slot = (i - active + cards.length) % cards.length;
      card.classList.remove('is-slot-0', 'is-slot-1', 'is-slot-2');
      card.classList.add('is-slot-' + slot);
    });
  };

  var clearStack = function () {
    cards.forEach(function (card) {
      card.classList.remove('is-slot-0', 'is-slot-1', 'is-slot-2', 'is-flying');
      card.style.transition = '';
      card.style.opacity = '';
    });
  };

  cards.forEach(function (card) {
    card.addEventListener('animationend', function (e) {
      if (e.animationName !== 'fcardThrow') return;
      card.classList.remove('is-flying');
      card.style.transition = 'none';
      card.style.opacity = '0';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (card.classList.contains('is-flying')) return;
          card.style.transition = '';
          card.style.opacity = '';
        });
      });
    });
  });

  var setActive = function (next) {
    var prev = active;
    active = Math.max(0, Math.min(cards.length - 1, next));
    var changed = prev !== active;

    cards.forEach(function (card) {
      card.classList.remove('is-flying');
    });

    tabs.forEach(function (tab, i) {
      var on = i === active;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });

    cards.forEach(function (card, i) {
      var on = i === active;
      card.classList.toggle('is-active', on);
      if (enhanced) card.setAttribute('aria-hidden', on ? 'false' : 'true');
    });

    if (enhanced) {
      assignSlots();
      if (changed && cards[prev]) cards[prev].classList.add('is-flying');
      syncLiquid(true);
    }

    if (indexLabel) indexLabel.textContent = String(active + 1).padStart(2, '0');
  };

  var getTravel = function () {
    var pinStyle = getComputedStyle(pin);
    var top = parseFloat(pinStyle.top) || 94;
    var travel = Math.max(1, section.offsetHeight - pin.offsetHeight);
    return { top: top, travel: travel };
  };

  var update = function () {
    if (!enhanced) return;

    var rect = section.getBoundingClientRect();
    var geom = getTravel();
    var p = Math.min(1, Math.max(0, (geom.top - rect.top) / geom.travel));
    var next = Math.min(cards.length - 1, Math.floor(p * cards.length));
    var changed = next !== active;

    if (changed && !scrollLock) setActive(next);
    if (progress) progress.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  };

  var schedule = function () {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      update();
    });
  };

  var releaseLock = function () {
    if (!scrollLock) return;
    scrollLock = false;
    update();
  };

  var goTo = function (index, focusTab) {
    if (!enhanced) return;

    var rect = section.getBoundingClientRect();
    var geom = getTravel();
    var p = (index + 0.05) / cards.length;
    var target = window.pageYOffset + rect.top - geom.top + p * geom.travel;

    scrollLock = true;
    window.clearTimeout(lockTimer);
    lockTimer = window.setTimeout(releaseLock, 1000);

    setActive(index);
    if (progress) progress.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    window.scrollTo({
      top: Math.max(0, target),
      behavior: reduced.matches ? 'auto' : 'smooth'
    });

    if (focusTab !== false && tabs[index]) tabs[index].focus({ preventScroll: true });
  };

  var applyMode = function () {
    var shouldEnhance = desktop.matches && !reduced.matches;

    if (shouldEnhance === enhanced) {
      if (enhanced) schedule();
      return;
    }

    enhanced = shouldEnhance;
    section.classList.toggle('is-enhanced', enhanced);

    if (enhanced) {
      setActive(0);
      update();
    } else {
      clearStack();
      cards.forEach(function (card) {
        card.removeAttribute('aria-hidden');
        card.classList.remove('is-active');
      });
      if (progress) progress.style.transform = '';
    }
  };

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      goTo(Number(tab.getAttribute('data-fstep')));
    });

    tab.addEventListener('keydown', function (e) {
      var index = Number(tab.getAttribute('data-fstep'));
      var next = index;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % cards.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + cards.length) % cards.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = cards.length - 1;
      else return;

      e.preventDefault();
      goTo(next);
    });
  });

  cards.forEach(function (card, i) {
    card.addEventListener('click', function (e) {
      if (!enhanced || i === active) return;
      if (e.target.closest('a, button, input, textarea, select')) return;
      goTo(i, false);
    });
  });

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('scrollend', releaseLock);
  window.addEventListener('resize', schedule);
  window.addEventListener('resize', function () {
    window.requestAnimationFrame(function () { syncLiquid(false); });
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { syncLiquid(false); });
  }

  if (desktop.addEventListener) {
    desktop.addEventListener('change', applyMode);
    reduced.addEventListener('change', applyMode);
  } else {
    desktop.addListener(applyMode);
    reduced.addListener(applyMode);
  }

  applyMode();
})();

(function () {
  'use strict';

  var form = document.querySelector('[data-support-form]');
  if (!form) return;

  var topic = form.querySelector('[name="topic"]');
  var version = form.querySelector('[name="version"]');
  var message = form.querySelector('[name="message"]');
  var copyButton = form.querySelector('[data-sp-copy]');
  var counter = form.querySelector('[data-sp-count]');
  var statusEl = document.querySelector('[data-sp-status]');
  var whatsappNumber = '917488739325';
  var whatsappHref = 'https://wa.me/' + whatsappNumber;
  var maxLength = message ? parseInt(message.getAttribute('maxlength'), 10) || 1200 : 1200;

  function fieldFor(el) {
    return el ? el.closest('.sp-field') : null;
  }

  function clearInvalid(el) {
    var field = fieldFor(el);
    if (!field) return;
    field.classList.remove('is-invalid');
    el.removeAttribute('aria-invalid');
  }

  function markInvalid(el) {
    var field = fieldFor(el);
    if (!field) return;
    field.classList.add('is-invalid');
    el.setAttribute('aria-invalid', 'true');
  }

  function setStatus(text, state) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    if (state) statusEl.setAttribute('data-state', state);
    else statusEl.removeAttribute('data-state');
  }

  function updateCounter() {
    if (!counter || !message) return;
    counter.textContent = message.value.length + ' / ' + maxLength;
  }

  function topicSubject() {
    if (!topic || !topic.value) return 'Support request';
    return topic.options[topic.selectedIndex].getAttribute('data-subject') || topic.value;
  }

  function buildMessage() {
    var parts = [];
    var chosen = topicSubject();
    var versionText = version ? version.value.trim() : '';
    var messageText = message ? message.value.trim() : '';

    parts.push('Hi Prince Studio team,');
    parts.push('');
    parts.push(chosen);
    parts.push('');
    parts.push(messageText || '[Add the details here]');
    if (versionText) {
      parts.push('');
      parts.push('App version: ' + versionText);
    }
    parts.push('');
    parts.push('Sent from the Prince Studio support page.');

    return parts.join('\n');
  }

  function renderDraftLinks() {
    whatsappHref = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(buildMessage());
  }

  function validate() {
    if (!topic || !message) return true;

    var firstInvalid = null;
    var missingTopic = !topic.value;
    var missingMessage = !message.value.trim();

    clearInvalid(topic);
    clearInvalid(message);

    if (missingTopic) {
      markInvalid(topic);
      firstInvalid = topic;
    }

    if (missingMessage) {
      markInvalid(message);
      if (!firstInvalid) firstInvalid = message;
    }

    if (missingTopic && missingMessage) {
      setStatus('Choose a topic and add a short message so we can help.', 'error');
    } else if (missingTopic) {
      setStatus('Choose the closest topic so your message reaches the right place.', 'error');
    } else if (missingMessage) {
      setStatus('Add a short message before opening WhatsApp.', 'error');
    } else {
      return true;
    }

    if (firstInvalid) firstInvalid.focus();
    return false;
  }

  function legacyCopy(text) {
    var helper = document.createElement('textarea');
    var copied = false;
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.top = '-9999px';
    helper.style.left = '-9999px';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    try {
      copied = document.execCommand('copy');
    } catch (err) {
      copied = false;
    }
    document.body.removeChild(helper);
    if (copyButton) copyButton.focus();
    return copied;
  }

  function copyDraft(event) {
    if (event) event.preventDefault();
    var text = buildMessage();

    function copied() {
      setStatus('Draft copied. Paste it into WhatsApp or anywhere.', 'ok');
    }

    function fallback() {
      if (legacyCopy(text)) {
        copied();
        return;
      }
      if (message && message.value) {
        message.focus();
        message.select();
        setStatus('Copy was blocked. The message is selected; press Ctrl+C.', 'error');
      } else {
        setStatus('Copy was blocked. Type a message, then copy it manually.', 'error');
      }
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(copied).catch(fallback);
    } else {
      fallback();
    }
  }

  if (copyButton) copyButton.addEventListener('click', copyDraft);

  Array.prototype.forEach.call(document.querySelectorAll('[data-support-topic]'), function (trigger) {
    trigger.addEventListener('click', function () {
      if (!topic) return;

      var value = trigger.getAttribute('data-support-topic');
      var matched = false;

      for (var i = 0; i < topic.options.length; i += 1) {
        if (topic.options[i].value === value) {
          matched = true;
          break;
        }
      }

      if (!matched) return;

      topic.value = value;
      topic.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!validate()) return;

    setStatus('Opening WhatsApp with the message filled in.', 'ok');

    var opened = window.open(whatsappHref, '_blank');
    if (opened) opened.opener = null;
    else window.location.href = whatsappHref;
  });

  if (topic) {
    topic.addEventListener('change', function () {
      clearInvalid(topic);
      renderDraftLinks();
      setStatus('');
    });
  }

  if (message) {
    message.addEventListener('input', function () {
      clearInvalid(message);
      updateCounter();
      renderDraftLinks();
      setStatus('');
    });
  }

  if (version) {
    version.addEventListener('input', function () {
      renderDraftLinks();
      setStatus('');
    });
  }

  updateCounter();
  renderDraftLinks();
})();
(function () {
  if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) return;

  var pages = {
    'index.html': 'index',
    'features.html': 'features',
    'privacy.html': 'privacy',
    'support.html': 'support'
  };
  var warmed = {};

  function prefetch(url, as) {
    var key = as + ':' + url;
    if (warmed[key]) return;
    warmed[key] = true;
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    if (as) link.as = as;
    document.head.appendChild(link);
  }

  function warm(anchor) {
    if (!anchor || anchor.hasAttribute('download') || anchor.target === '_blank') return;
    var href = anchor.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    var url;
    try { url = new URL(href, document.baseURI); } catch (error) { return; }
    if (url.origin !== window.location.origin) return;
    var file = url.pathname.split('/').pop() || 'index.html';
    var name = pages[file];
    if (!name) return;
    var pageUrl = url.href.split('#')[0];
    if (pageUrl === window.location.href.split('#')[0]) return;
    prefetch(pageUrl);
    prefetch(new URL('css/' + name + '.css', pageUrl).href, 'style');
    prefetch(new URL('js/' + name + '.js', pageUrl).href, 'script');
  }

  function handle(event) {
    var target = event.target;
    while (target && target !== document) {
      if (target.tagName === 'A') {
        warm(target);
        return;
      }
      target = target.parentNode;
    }
  }

  document.addEventListener('pointerover', handle, { passive: true });
  document.addEventListener('focusin', handle);
  document.addEventListener('touchstart', handle, { passive: true });
})();