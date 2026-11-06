(function () {
  var STORAGE_KEY = 'prince-studio-blank-v1';
  var SPLIT_KEY = 'prince-studio-blank-split';
  var editors = Array.prototype.slice.call(document.querySelectorAll('[data-editor]'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-file]'));
  var viewportButtons = Array.prototype.slice.call(document.querySelectorAll('[data-viewport]'));
  var frame = document.querySelector('#bl-frame');
  var preview = document.querySelector('#bl-preview');
  var workspace = document.querySelector('#bl-workspace');
  var resizer = document.querySelector('#bl-resizer');
  var saveState = document.querySelector('#bl-save');
  var fileStatus = document.querySelector('#bl-file-status');
  var statusRight = document.querySelector('#bl-status-right');
  var cursorStat = document.querySelector('#bl-cursor');
  var sizeStat = document.querySelector('#bl-size');
  var linesStat = document.querySelector('#bl-lines');
  var consoleWrap = document.querySelector('#bl-console');
  var consoleToggle = document.querySelector('#bl-console-toggle');
  var consoleOutput = document.querySelector('#bl-console-output');
  var consoleCount = document.querySelector('#bl-console-count');
  var consoleLast = document.querySelector('#bl-console-last');
  var toast = document.querySelector('#bl-toast');
  var palette = document.querySelector('#bl-palette');
  var paletteInput = document.querySelector('#bl-palette-input');
  var paletteList = document.querySelector('#bl-palette-list');
  var paletteCount = document.querySelector('#bl-palette-count');

  if (!editors.length || !tabs.length || !frame || !preview) return;

  var editorByFile = {};
  var tabByFile = {};
  var defaults = {};

  editors.forEach(function (editor) {
    var file = editor.getAttribute('data-editor');
    editorByFile[file] = editor;
    defaults[file] = editor.value;
  });

  tabs.forEach(function (tab) {
    tabByFile[tab.getAttribute('data-file')] = tab;
  });

  var runTimer = 0;
  var saveTimer = 0;
  var toastTimer = 0;
  var activeFile = 'html';
  var split = 47;
  var draggingSplit = false;
  var consoleOpen = false;
  var logCount = 0;
  var paletteReturn = null;
  var paletteActive = 0;
  var paletteResults = [];

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getCode() {
    var code = {};
    editors.forEach(function (editor) {
      code[editor.getAttribute('data-editor')] = editor.value;
    });
    return code;
  }

  function getConsoleBridge() {
    return [
      '(function () {',
      '  function send(level, args) {',
      '    try {',
      '      var parts = [];',
      '      for (var i = 0; i < args.length; i += 1) {',
      '        var value = args[i];',
      '        if (value && typeof value === "object") {',
      '          try { parts.push(JSON.stringify(value)); } catch (error) { parts.push(String(value)); }',
      '        } else {',
      '          parts.push(String(value));',
      '        }',
      '      }',
      '      parent.postMessage({',
      '        source: "blank-console",',
      '        level: level,',
      '        text: parts.join(" ") || "(empty)",',
      '        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })',
      '      }, "*");',
      '    } catch (error) {}',
      '  }',
      '  ["log", "info", "warn", "error"].forEach(function (level) {',
      '    var original = console[level];',
      '    console[level] = function () {',
      '      send(level, Array.prototype.slice.call(arguments));',
      '      original.apply(console, arguments);',
      '    };',
      '  });',
      '  window.addEventListener("error", function (event) {',
      '    send("error", [event.message + (event.lineno ? " (line " + event.lineno + ")" : "")]);',
      '  });',
      '})();'
    ].join('\n');
  }

  function buildDocument() {
    var code = getCode();
    var safeJs = code.js.replace(/<\/script/gi, '<\\/script');

    return '<!doctype html>\n' +
      '<html lang="en">\n' +
      '<head>\n' +
      '<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<style>\n' + code.css + '\n</style>\n' +
      '</head>\n' +
      '<body>\n' + code.html + '\n' +
      '<script>\n' + getConsoleBridge() + '\n</script>\n' +
      '<script>\n' + safeJs + '\n</script>\n' +
      '</body>\n' +
      '</html>';
  }

  function setSaveState(message, saving) {
    if (!saveState) return;
    saveState.classList.toggle('is-saving', Boolean(saving));
    saveState.innerHTML = '<i></i>' + message;
  }

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(getCode()));
      setSaveState('Autosaved', false);
      return true;
    } catch (error) {
      setSaveState('Local save unavailable', true);
      return false;
    }
  }

  function runPreview() {
    window.clearTimeout(runTimer);
    frame.srcdoc = buildDocument();

    var runButton = document.querySelector('[data-action="run"]');
    if (runButton) {
      runButton.classList.remove('is-running');
      void runButton.offsetWidth;
      runButton.classList.add('is-running');
    }

    if (statusRight) {
      var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      statusRight.textContent = 'Preview updated / ' + time;
    }
  }

  function queueUpdate() {
    setSaveState('Saving', true);
    window.clearTimeout(runTimer);
    window.clearTimeout(saveTimer);

    runTimer = window.setTimeout(runPreview, 380);
    saveTimer = window.setTimeout(persist, 700);
  }

  function updateStats() {
    var active = editorByFile[activeFile];
    var position = active ? active.selectionStart : 0;
    var before = active ? active.value.slice(0, position) : '';
    var line = before.split('\n').length;
    var column = position - before.lastIndexOf('\n');
    var code = getCode();
    var chars = 0;
    var lines = 0;

    Object.keys(code).forEach(function (key) {
      chars += code[key].length;
      lines += code[key].split('\n').length;
    });

    if (cursorStat) cursorStat.textContent = 'Ln ' + line + ', Col ' + column;
    if (sizeStat) sizeStat.textContent = chars.toLocaleString('en-US') + ' chars';
    if (linesStat) linesStat.textContent = lines.toLocaleString('en-US') + ' lines';
  }

  function setActiveTab(tab) {
    var file = tab.getAttribute('data-file');
    activeFile = file;

    tabs.forEach(function (item) {
      var active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });

    editors.forEach(function (editor) {
      var active = editor.getAttribute('data-editor') === file;
      editor.classList.toggle('is-active', active);
      editor.hidden = !active;
      if (active) editor.setAttribute('aria-hidden', 'false');
      else editor.setAttribute('aria-hidden', 'true');
    });

    if (fileStatus) {
      var labels = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
      fileStatus.textContent = labels[file] + ' / UTF-8 / Spaces: 2';
    }

    updateStats();
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      setActiveTab(tab);
    });

    tab.addEventListener('keydown', function (event) {
      var next = null;

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      } else if (event.key === 'Home') {
        next = tabs[0];
      } else if (event.key === 'End') {
        next = tabs[tabs.length - 1];
      }

      if (!next) return;
      event.preventDefault();
      setActiveTab(next);
      next.focus();
    });
  });

  editors.forEach(function (editor) {
    editor.addEventListener('input', function () {
      updateStats();
      queueUpdate();
    });

    editor.addEventListener('keyup', updateStats);
    editor.addEventListener('click', updateStats);
    editor.addEventListener('select', updateStats);
    editor.addEventListener('focus', updateStats);

    editor.addEventListener('keydown', function (event) {
      if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        var start = editor.selectionStart;
        var end = editor.selectionEnd;
        editor.setRangeText('  ', start, end, 'end');
        updateStats();
        queueUpdate();
      }
    });
  });

  function setMobilePreview(enabled) {
    preview.classList.toggle('is-mobile', enabled);
    viewportButtons.forEach(function (item) {
      var active = item.getAttribute('data-viewport') === (enabled ? 'mobile' : 'desktop');
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
  }

  viewportButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setMobilePreview(button.getAttribute('data-viewport') === 'mobile');
    });
  });

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2600);
  }

  function setConsoleOpen(open) {
    if (!consoleWrap || !consoleToggle) return;
    consoleOpen = Boolean(open);
    consoleWrap.classList.toggle('is-open', consoleOpen);
    consoleToggle.setAttribute('aria-expanded', String(consoleOpen));
    if (consoleOpen && consoleOutput) {
      window.setTimeout(function () {
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
      }, 80);
    }
  }

  function consoleEmpty() {
    if (!consoleOutput) return;
    consoleOutput.innerHTML = '<p class="bl-console-empty">Console ready. Logs from your preview appear here.</p>';
  }

  function addConsole(level, text, time) {
    if (!consoleOutput) return;
    level = ['log', 'info', 'warn', 'error'].indexOf(level) >= 0 ? level : 'log';

    var empty = consoleOutput.querySelector('.bl-console-empty');
    if (empty) empty.remove();

    var row = document.createElement('div');
    var timeEl = document.createElement('time');
    var badge = document.createElement('strong');
    var message = document.createElement('span');

    row.className = 'bl-console-row is-' + level;
    timeEl.textContent = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    badge.textContent = level === 'log' ? 'log' : level;
    message.textContent = text;

    row.appendChild(timeEl);
    row.appendChild(badge);
    row.appendChild(message);
    consoleOutput.appendChild(row);

    while (consoleOutput.querySelectorAll('.bl-console-row').length > 60) {
      var first = consoleOutput.querySelector('.bl-console-row');
      if (!first) break;
      first.remove();
    }

    logCount += 1;
    if (consoleCount) consoleCount.textContent = String(logCount > 99 ? '99+' : logCount);
    if (consoleLast) consoleLast.textContent = text;
    if (consoleWrap) consoleWrap.classList.toggle('has-error', Boolean(consoleOutput.querySelector('.bl-console-row.is-error')));
    if (level === 'error' && !consoleOpen) setConsoleOpen(true);

    if (consoleOpen) consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  function clearConsole() {
    if (!consoleOutput) return;
    consoleOutput.innerHTML = '';
    consoleEmpty();
    logCount = 0;
    if (consoleCount) consoleCount.textContent = '0';
    if (consoleLast) consoleLast.textContent = 'No output yet';
    if (consoleWrap) consoleWrap.classList.remove('has-error');
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== 'blank-console') return;
    addConsole(data.level, data.text, data.time);
  });

  if (consoleToggle) {
    consoleToggle.addEventListener('click', function () {
      setConsoleOpen(!consoleOpen);
    });
  }

  function downloadPreview() {
    var blob = new Blob([buildDocument()], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'blank-starter.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast('Downloaded blank-starter.html');
  }

  function openPreview() {
    var blob = new Blob([buildDocument()], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }

  function copyPreview() {
    var text = buildDocument();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('Preview HTML copied');
      }, function () {
        fallbackCopy(text);
      });
      return;
    }

    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();

    try {
      var copied = document.execCommand('copy');
      showToast(copied ? 'Preview HTML copied' : 'Copy unavailable');
    } catch (error) {
      showToast('Copy unavailable');
    }

    area.remove();
  }

  function setFullscreen(enabled) {
    var open = typeof enabled === 'boolean' ? enabled : !preview.classList.contains('is-fullscreen');
    preview.classList.toggle('is-fullscreen', open);

    var button = document.querySelector('[data-action="fullscreen"]');
    if (button) {
      button.setAttribute('aria-pressed', String(open));
      button.title = open ? 'Exit fullscreen preview' : 'Toggle fullscreen preview';
      button.setAttribute('aria-label', button.title);
    }
  }

  function insertConsoleDemo() {
    var editor = editorByFile.js;
    if (!editor) return;

    editor.value += '\nconsole.log("Hello from the preview", new Date().toLocaleTimeString());';
    setActiveTab(tabByFile.js);
    setConsoleOpen(true);
    runPreview();
    persist();
    showToast('Console demo inserted');
  }

  function resetCode() {
    if (!window.confirm('Reset all three files to the starter code?')) return;

    editors.forEach(function (editor) {
      editor.value = defaults[editor.getAttribute('data-editor')];
    });

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {}

    setSaveState('Starter restored', false);
    runPreview();
    persist();
    setActiveTab(tabByFile.html);
    updateStats();
    showToast('Starter restored');
  }

  function saveAll() {
    if (persist()) showToast('Saved locally');
  }

  function toggleMobilePreview() {
    var next = !preview.classList.contains('is-mobile');
    setMobilePreview(next);
    showToast(next ? 'Mobile preview' : 'Desktop preview');
  }

  function applySplit(value, remember) {
    split = clamp(value, 30, 70);
    if (workspace) workspace.style.setProperty('--bl-split', split + '%');
    if (resizer) resizer.setAttribute('aria-valuenow', String(Math.round(split)));
    if (remember) {
      try { window.localStorage.setItem(SPLIT_KEY, String(split)); } catch (error) {}
    }
  }

  function restoreSplit() {
    try {
      var saved = Number(window.localStorage.getItem(SPLIT_KEY));
      if (saved >= 30 && saved <= 70) applySplit(saved, false);
    } catch (error) {}
  }

  if (resizer && workspace) {
    resizer.addEventListener('pointerdown', function (event) {
      if (window.innerWidth <= 760) return;
      event.preventDefault();
      draggingSplit = true;
      document.body.classList.add('is-resizing');

      var rect = workspace.getBoundingClientRect();

      function move(pointerEvent) {
        if (!draggingSplit) return;
        applySplit((pointerEvent.clientX - rect.left) / rect.width * 100, false);
      }

      function stop() {
        if (!draggingSplit) return;
        draggingSplit = false;
        document.body.classList.remove('is-resizing');
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', stop);
        document.removeEventListener('pointercancel', stop);
        applySplit(split, true);
      }

      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', stop);
      document.addEventListener('pointercancel', stop);
    });

    resizer.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        applySplit(split + (event.key === 'ArrowRight' ? 2 : -2), true);
      } else if (event.key === 'Home') {
        event.preventDefault();
        applySplit(30, true);
      } else if (event.key === 'End') {
        event.preventDefault();
        applySplit(70, true);
      }
    });

    resizer.addEventListener('dblclick', function () {
      applySplit(47, true);
    });
  }

  var commands = [
    {
      label: 'Run preview',
      hint: 'Ctrl Enter',
      run: function () { runPreview(); persist(); showToast('Preview updated'); }
    },
    {
      label: 'Save all files',
      hint: 'Ctrl S',
      run: saveAll
    },
    {
      label: 'Download HTML',
      run: downloadPreview
    },
    {
      label: 'Copy preview HTML',
      run: copyPreview
    },
    {
      label: 'Toggle console',
      hint: 'Ctrl `',
      run: function () { setConsoleOpen(!consoleOpen); }
    },
    {
      label: 'Clear console',
      run: clearConsole
    },
    {
      label: 'Insert console demo',
      run: insertConsoleDemo
    },
    {
      label: 'Toggle mobile preview',
      run: toggleMobilePreview
    },
    {
      label: 'Toggle fullscreen preview',
      run: function () { setFullscreen(); }
    },
    {
      label: 'Reset starter',
      run: resetCode
    }
  ];

  function renderPalette() {
    if (!paletteList || !paletteInput) return;
    var query = paletteInput.value.trim().toLowerCase();
    paletteResults = commands.filter(function (command) {
      return !query || command.label.toLowerCase().indexOf(query) !== -1;
    });

    paletteList.innerHTML = '';

    if (!paletteResults.length) {
      var empty = document.createElement('p');
      empty.className = 'bl-palette-empty';
      empty.textContent = 'No commands match "' + paletteInput.value.trim() + '".';
      paletteList.appendChild(empty);
      if (paletteCount) paletteCount.textContent = '0 commands';
      return;
    }

    paletteActive = clamp(paletteActive, 0, paletteResults.length - 1);

    paletteResults.forEach(function (command, index) {
      var item = document.createElement('button');
      var label = document.createElement('span');

      item.type = 'button';
      item.className = 'bl-palette-item' + (index === paletteActive ? ' is-active' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(index === paletteActive));
      label.textContent = command.label;
      item.appendChild(label);

      if (command.hint) {
        var hint = document.createElement('kbd');
        hint.textContent = command.hint;
        item.appendChild(hint);
      }

      item.addEventListener('mouseenter', function () {
        paletteActive = index;
        syncPaletteActive();
      });

      item.addEventListener('click', function () {
        executeCommand(command);
      });

      paletteList.appendChild(item);
    });

    if (paletteCount) {
      paletteCount.textContent = paletteResults.length + (paletteResults.length === 1 ? ' command' : ' commands');
    }
  }

  function syncPaletteActive() {
    if (!paletteList) return;
    var items = paletteList.querySelectorAll('.bl-palette-item');
    items.forEach(function (item, index) {
      var active = index === paletteActive;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      if (active) item.scrollIntoView({ block: 'nearest' });
    });
  }

  function executeCommand(command) {
    if (!command) return;
    closePalette();
    window.setTimeout(command.run, 60);
  }

  function openPalette(trigger) {
    if (!palette || !paletteInput) return;
    paletteReturn = trigger || document.activeElement;
    paletteInput.value = '';
    paletteActive = 0;
    renderPalette();

    if (typeof palette.showModal === 'function') {
      if (!palette.open) palette.showModal();
    } else {
      palette.setAttribute('open', '');
    }

    window.setTimeout(function () {
      paletteInput.focus();
      paletteInput.select();
    }, 30);
  }

  function closePalette() {
    if (!palette) return;
    if (typeof palette.close === 'function' && palette.open) palette.close();
    else palette.removeAttribute('open');
  }

  if (palette) {
    palette.addEventListener('close', function () {
      if (paletteReturn && document.contains(paletteReturn)) paletteReturn.focus();
      paletteReturn = null;
    });

    palette.addEventListener('click', function (event) {
      if (event.target !== palette) return;
      var rect = palette.getBoundingClientRect();
      var inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) closePalette();
    });
  }

  if (paletteInput) {
    paletteInput.addEventListener('input', function () {
      paletteActive = 0;
      renderPalette();
    });

    paletteInput.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        paletteActive = (paletteActive + 1) % Math.max(paletteResults.length, 1);
        syncPaletteActive();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        paletteActive = (paletteActive - 1 + Math.max(paletteResults.length, 1)) % Math.max(paletteResults.length, 1);
        syncPaletteActive();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        executeCommand(paletteResults[paletteActive]);
      }
    });
  }

  document.querySelectorAll('[data-action]').forEach(function (button) {
    var action = button.getAttribute('data-action');

    button.addEventListener('click', function () {
      if (action === 'run') {
        runPreview();
        persist();
      }

      if (action === 'reload') runPreview();
      if (action === 'open') openPreview();
      if (action === 'download') downloadPreview();
      if (action === 'palette') openPalette(button);
      if (action === 'palette-close') closePalette();
      if (action === 'clear-console') clearConsole();
      if (action === 'fullscreen') setFullscreen();
      if (action === 'reset') resetCode();
    });
  });

  document.addEventListener('keydown', function (event) {
    var mod = event.metaKey || event.ctrlKey;

    if (mod && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (palette && palette.open) closePalette();
      else openPalette(document.activeElement);
      return;
    }

    if (palette && palette.open) return;

    if (mod && event.key === 'Enter') {
      event.preventDefault();
      runPreview();
      persist();
      showToast('Preview updated');
      return;
    }

    if (mod && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveAll();
      return;
    }

    if (mod && (event.key === '1' || event.key === '2' || event.key === '3')) {
      event.preventDefault();
      var file = event.key === '1' ? 'html' : event.key === '2' ? 'css' : 'js';
      setActiveTab(tabByFile[file]);
      editorByFile[file].focus();
      return;
    }

    if (mod && event.key === '\u0060') {
      event.preventDefault();
      setConsoleOpen(!consoleOpen);
      return;
    }

    if (event.key === 'Escape' && preview.classList.contains('is-fullscreen')) {
      setFullscreen(false);
    }
  });

  function restore() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;

      var code = JSON.parse(saved);
      if (!code || typeof code.html !== 'string' || typeof code.css !== 'string' || typeof code.js !== 'string') return false;

      editors.forEach(function (editor) {
        editor.value = code[editor.getAttribute('data-editor')];
      });

      setSaveState('Restored locally', false);
      return true;
    } catch (error) {
      return false;
    }
  }

  window.addEventListener('pagehide', persist);

  restoreSplit();
  restore();
  setActiveTab(tabByFile[activeFile]);
  updateStats();
  runPreview();
})();
