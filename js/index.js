(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.addEventListener('dragstart', function (event) {
    if (event.target instanceof HTMLImageElement) event.preventDefault();
  });

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
    var buildCard = build.closest('.fcard');
    var buildPct = build.querySelector('.pct');
    var buildPctValue = buildPct ? parseInt(buildPct.textContent, 10) || 100 : 100;
    var buildInView = false;
    var buildStarted = false;
    var buildObserver = null;

    var startBuildMock = function () {
      if (buildStarted) return;
      buildStarted = true;
      build.classList.add('is-built');

      if (buildPct) {
        var countStart = 0;
        var countUp = function (now) {
          if (!countStart) countStart = now;
          var t = Math.min(1, (now - countStart) / 1050);
          var eased = 1 - Math.pow(1 - t, 3);
          buildPct.textContent = Math.round(buildPctValue * eased) + '%';
          if (t < 1) {
            requestAnimationFrame(countUp);
          } else {
            buildPct.textContent = buildPctValue + '%';
          }
        };
        buildPct.textContent = '0%';
        requestAnimationFrame(countUp);
      }
    };

    var syncBuild = function () {
      if (!buildInView || buildStarted) return;

      var deck = build.closest('.fscroll');
      if (deck && deck.classList.contains('is-enhanced') && buildCard && !buildCard.classList.contains('is-active')) return;

      startBuildMock();
      if (buildObserver) buildObserver.disconnect();
    };

    build.classList.add('is-pending');
    buildObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        buildInView = entry.isIntersecting;
        if (entry.isIntersecting) syncBuild();
      });
    }, { threshold: 0.35 });
    buildObserver.observe(build);

    if (buildCard) {
      buildCard.addEventListener('fcardactivate', syncBuild);
    }
  }

  var motionCards = Array.prototype.slice.call(document.querySelectorAll('#fcard-editor, #fcard-copilot'));
  if (motionCards.length && !reduceMotion) {
    var motionDeck = document.querySelector('[data-fscroll]');
    var motionObserver = null;
    var motionVisuals = [];

    var revealMotionVisual = function (visual) {
      if (!visual || visual.classList.contains('is-live')) return;
      if (visual.getAttribute('data-in-view') !== '1') return;

      var card = visual.closest('.fcard');
      if (motionDeck && motionDeck.classList.contains('is-enhanced') && card && !card.classList.contains('is-active')) return;

      visual.classList.remove('is-pending');
      visual.classList.add('is-live');
      if (motionObserver) motionObserver.unobserve(visual);
    };

    if ('IntersectionObserver' in window) {
      motionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.setAttribute('data-in-view', entry.isIntersecting ? '1' : '0');
          if (entry.isIntersecting) revealMotionVisual(entry.target);
        });
      }, { threshold: 0.2 });
    }

    motionCards.forEach(function (card) {
      var visual = card.querySelector('.fcard-visual');
      if (!visual) return;
      motionVisuals.push(visual);
      visual.classList.add('is-pending');
      visual.setAttribute('data-in-view', '0');
      if (motionObserver) motionObserver.observe(visual);
      card.addEventListener('fcardactivate', function () {
        revealMotionVisual(visual);
      });
    });

    if (!motionObserver) {
      motionVisuals.forEach(function (visual) {
        visual.classList.remove('is-pending');
        visual.classList.add('is-live');
      });
    }

    var editRows = document.querySelectorAll('#fcard-editor .edit-code > div');
    Array.prototype.forEach.call(editRows, function (row, index) {
      row.style.setProperty('--line-index', String(index));
    });
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
    ide.querySelectorAll('.ide-filepanel').forEach(function (panel) {
      Array.prototype.forEach.call(panel.querySelectorAll('.code-line'), function (line, index) {
        line.style.setProperty('--line-index', String(index));
      });
    });

    var ideSeen = false;
    var markIdeLive = function () {
      if (ideSeen) return;
      ideSeen = true;
      ide.classList.add('is-live');
    };

    if (!reduceMotion && 'IntersectionObserver' in window) {
      var ideObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          ideObserver.disconnect();
          markIdeLive();
        });
      }, { threshold: 0.12 });
      ideObserver.observe(ide.closest('.showcase') || ide);
    } else {
      markIdeLive();
    }

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
        var active = panel.getAttribute('data-panel') === name;
        var wasHidden = panel.hidden;
        panel.hidden = !active;

        if (!active) {
          panel.classList.remove('is-entering');
          return;
        }

        if (wasHidden) {
          panel.classList.remove('is-entering');
          void panel.offsetWidth;
          panel.classList.add('is-entering');
        }
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

      var previewBody = terminalMode ? previewTerminal : previewStage;
      if (previewBody) {
        previewBody.classList.remove('is-entering');
        void previewBody.offsetWidth;
        previewBody.classList.add('is-entering');
      }
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
  var desktop = window.matchMedia('(min-width: 900px) and (min-height: 620px) and (orientation: landscape)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var active = 0;
  var enhanced = false;
  var scheduled = false;
  var scrollLock = false;
  var lockTimer = 0;
  var revealObserver = null;

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
      if (on) card.dispatchEvent(new Event('fcardactivate'));
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

  var clearReveal = function () {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    section.classList.remove('is-reveal-ready');
    cards.forEach(function (card) {
      card.classList.remove('is-revealed');
      card.style.transitionDelay = '';
    });
  };

  var setupReveal = function () {
    if (revealObserver || reduced.matches || !('IntersectionObserver' in window)) return;

    section.classList.add('is-reveal-ready');
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var index = cards.indexOf(entry.target);
        entry.target.style.transitionDelay = (Math.max(0, index) * 80) + 'ms';
        entry.target.classList.add('is-revealed');
        window.setTimeout(function () {
          entry.target.style.transitionDelay = '';
        }, 900 + Math.max(0, index) * 80);
        if (revealObserver) revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    cards.forEach(function (card) {
      revealObserver.observe(card);
    });
  };

  var syncReveal = function () {
    if (enhanced || reduced.matches) {
      clearReveal();
      return;
    }
    setupReveal();
  };

  var applyMode = function () {
    var shouldEnhance = desktop.matches && !reduced.matches;

    if (shouldEnhance === enhanced) {
      if (enhanced) schedule();
      syncReveal();
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

    syncReveal();
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
(function () {
  var trigger = document.querySelector('[data-qr-open]');
  var modal = document.getElementById('qrModal');
  if (!trigger || !modal) return;

  var closers = modal.querySelectorAll('[data-qr-close]');

  var open = function () {
    if (typeof modal.showModal !== 'function') return;
    if (!modal.open) modal.showModal();
    document.body.classList.add('qr-modal-open');
  };

  var close = function () {
    if (modal.open) modal.close();
  };

  trigger.addEventListener('click', open);

  Array.prototype.forEach.call(closers, function (button) {
    button.addEventListener('click', close);
  });

  modal.addEventListener('click', function (event) {
    if (event.target === modal) close();
  });

  modal.addEventListener('close', function () {
    document.body.classList.remove('qr-modal-open');
  });

  modal.addEventListener('cancel', function () {
    document.body.classList.remove('qr-modal-open');
  });
})();
(function () {
  var section = document.querySelector('[data-fscroll]');
  if (!section) return;

  var deck = section.querySelector('.fscroll-deck');
  var nav = section.querySelector('.fscroll-mobile-nav');
  if (!deck || !nav) return;

  var cards = Array.prototype.slice.call(deck.querySelectorAll('[data-fcard]'));
  var dots = Array.prototype.slice.call(nav.querySelectorAll('[data-fdot]'));
  var prev = nav.querySelector('[data-fdir="-1"]');
  var next = nav.querySelector('[data-fdir="1"]');
  if (!cards.length || !dots.length) return;

  var mobile = window.matchMedia('(max-width: 560px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = 0;
  var frame = 0;

  var inset = function () {
    return parseFloat(window.getComputedStyle(deck).scrollPaddingLeft) || 0;
  };

  var setActive = function (index) {
    current = index;
    dots.forEach(function (dot, i) {
      var active = i === current;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  var goTo = function (index, smooth) {
    if (!mobile.matches) return;

    setActive((index + cards.length) % cards.length);

    var card = cards[current];
    var left = card.getBoundingClientRect().left - deck.getBoundingClientRect().left + deck.scrollLeft - inset();

    deck.scrollTo({
      left: left,
      behavior: smooth && !reduced.matches ? 'smooth' : 'auto'
    });
  };

  var sync = function () {
    if (frame || !mobile.matches) return;

    frame = window.requestAnimationFrame(function () {
      frame = 0;

      var deckLeft = deck.getBoundingClientRect().left + inset();
      var best = 0;
      var distance = Infinity;

      cards.forEach(function (card, i) {
        var gap = Math.abs(card.getBoundingClientRect().left - deckLeft);
        if (gap < distance) {
          distance = gap;
          best = i;
        }
      });

      if (best !== current) setActive(best);
    });
  };

  if (prev) prev.addEventListener('click', function () { goTo(current - 1, true); });
  if (next) next.addEventListener('click', function () { goTo(current + 1, true); });

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { goTo(i, true); });
  });

  deck.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);

  if (mobile.addEventListener) {
    mobile.addEventListener('change', function () {
      deck.scrollLeft = 0;
      setActive(0);
    });
  } else {
    mobile.addListener(function () {
      deck.scrollLeft = 0;
      setActive(0);
    });
  }
})();
(function () {
  var rail = document.querySelector('.app-proof-rail');
  var nav = document.querySelector('[data-proof-nav]');
  if (!rail || !nav) return;

  var cards = Array.prototype.slice.call(rail.querySelectorAll('.app-proof-card'));
  if (!cards.length) return;

  var prev = nav.querySelector('[data-rail-prev]');
  var next = nav.querySelector('[data-rail-next]');
  var dotsWrap = nav.querySelector('[data-rail-dots]');
  var titles = cards.map(function (card) {
    var caption = card.querySelector('figcaption strong');
    return caption ? caption.textContent.trim() : 'Prince Studio screenshot';
  });
  var scales = [1, 0.84, 0.72, 0.62, 0.54];
  var drops = [0, 14, 28, 42, 54];
  var opacities = [1, 0.94, 0.82, 0.7, 0.58];
  var dots = [];
  var active = 0;
  var frame = 0;
  var touch = null;
  var suppressClick = false;

  cards.forEach(function (card, i) {
    if (card.classList.contains('is-active')) active = i;
    var button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'Show screenshot ' + (i + 1) + ': ' + titles[i]);
    button.addEventListener('click', function () { setActive(i); });
    if (dotsWrap) dotsWrap.appendChild(button);
    dots.push(button);
    card.addEventListener('click', function () {
      if (i !== active) setActive(i);
    });
  });

  var setCard = function (card, index, x, y, scale, opacity, depth) {
    card.style.setProperty('--proof-x', x.toFixed(2) + 'px');
    card.style.setProperty('--proof-y', y + 'px');
    card.style.setProperty('--proof-scale', scale);
    card.style.setProperty('--proof-opacity', opacity);
    card.style.zIndex = String(10 - depth);
    card.classList.toggle('is-active', index === active);
  };

  var layout = function () {
    var width = cards[0].offsetWidth;
    var half = rail.clientWidth / 2;
    if (!width || !half) return;

    var available = Math.max(0, half - width / 2 - 4);
    var leftCount = active;
    var rightCount = cards.length - 1 - active;
    var cap = Math.min(width * 0.22, 54);
    var leftPeek = leftCount ? Math.min(cap, available / leftCount) : 0;
    var rightPeek = rightCount ? Math.min(cap, available / rightCount) : 0;

    var activeCard = cards[active];
    setCard(activeCard, active, 0, 0, 1, 1, 0);

    var placeSide = function (items, direction, peek) {
      var edge = width / 2;
      items.forEach(function (item) {
        var depth = item.depth;
        var scale = scales[Math.min(depth, scales.length - 1)];
        var x = edge + peek - (scale * width / 2);
        edge += peek;
        setCard(
          item.card,
          item.index,
          direction * x,
          drops[Math.min(depth, drops.length - 1)],
          scale,
          opacities[Math.min(depth, opacities.length - 1)],
          depth
        );
      });
    };

    var left = [];
    var right = [];
    cards.forEach(function (card, i) {
      if (i === active) return;
      if (i < active) left.push({ card: card, index: i, depth: active - i });
      else right.push({ card: card, index: i, depth: i - active });
    });

    left.sort(function (a, b) { return a.depth - b.depth; });
    right.sort(function (a, b) { return a.depth - b.depth; });

    placeSide(left, -1, leftPeek);
    placeSide(right, 1, rightPeek);
  };

  var setActive = function (index) {
    active = Math.max(0, Math.min(cards.length - 1, index));

    cards.forEach(function (card, i) {
      if (i === active) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });

    dots.forEach(function (dot, i) {
      var current = i === active;
      dot.classList.toggle('is-active', current);
      if (current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    if (prev) prev.disabled = active === 0;
    if (next) next.disabled = active === cards.length - 1;

    layout();
  };

  if (prev) prev.addEventListener('click', function () { setActive(active - 1); });
  if (next) next.addEventListener('click', function () { setActive(active + 1); });

  rail.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActive(active - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActive(active + 1);
    }
  });

  rail.addEventListener('touchstart', function (event) {
    if (event.touches.length !== 1) return;
    touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });

  rail.addEventListener('touchend', function (event) {
    if (!touch) return;
    var point = event.changedTouches[0];
    var dx = point.clientX - touch.x;
    var dy = point.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    suppressClick = true;
    setActive(active + (dx < 0 ? 1 : -1));
    window.setTimeout(function () { suppressClick = false; }, 350);
  }, { passive: true });

  rail.addEventListener('touchcancel', function () {
    touch = null;
  }, { passive: true });

  rail.addEventListener('click', function (event) {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);

  var refresh = function () {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(layout);
  };

  window.addEventListener('resize', refresh);
  if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(rail);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  refresh();

  setActive(active);
})();