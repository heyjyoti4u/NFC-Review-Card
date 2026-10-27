/* Review Card Maker: QR + card preview + NFC write. No build step required. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    name: $('name'), link: $('link'), line: $('line'), color: $('color'), dark: $('dark'),
    linkMsg: $('linkMsg'), nfcMsg: $('nfcMsg'),
    pName: $('pName'), pLine: $('pLine'), pLink: $('pLink'),
    qrSvg: $('qrSvg'), qrFront: $('qrFront'), qrBig: $('qrBig'),
    dlPng: $('dlPng'), dlSvg: $('dlSvg'), print: $('print'), nfc: $('nfc')
  };

    var current = { url: '', matrix: null };

  function setMsg(el, text, kind) { el.textContent = text || ''; el.className = 'msg' + (kind ? ' ' + kind : ''); }

  // Validate the URL
  function checkUrl(value) {
    var v = value.trim();
    if (!v) return { ok: false, url: '', msg: '' };
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    try {
      var u = new URL(v);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('protocol');
      var host = u.hostname.toLowerCase();
      var looksGoogle = /(^|\.)(g\.page|google\.com|goo\.gl|maps\.app\.goo\.gl)$/.test(host);
      return { ok: true, url: u.toString(), warn: looksGoogle ? '' : 'This does not look like a Google review link. Please double-check it.' };
    } catch (e) {
      return { ok: false, url: '', msg: 'Invalid link. Please paste the full URL, starting with https://.' };
    }
  }

  // Build the QR matrix (M error correction level)
  function buildMatrix(text) {
    var qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    var n = qr.getModuleCount(), rows = [];
    for (var r = 0; r < n; r++) {
      var row = [];
      for (var c = 0; c < n; c++) row.push(qr.isDark(r, c));
      rows.push(row);
    }
    return rows;
  }

  var QUIET = 4; // Required quiet zone around the QR code, measured in modules

  function svgMarkup(matrix, dark, withBg) {
    var n = matrix.length, size = n + QUIET * 2, d = '';
    for (var r = 0; r < n; r++) {
      var c = 0;
      while (c < n) {
        if (matrix[r][c]) {
          var start = c;
          while (c < n && matrix[r][c]) c++;
          d += 'M' + (start + QUIET) + ' ' + (r + QUIET) + 'h' + (c - start) + 'v1h-' + (c - start) + 'z';
        } else c++;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges">' +
      (withBg ? '<rect width="100%" height="100%" fill="#fff"/>' : '') +
      '<path d="' + d + '" fill="' + dark + '"/></svg>';
  }

  function paintInto(target, matrix, dark) {
    var tmp = document.createElement('div');
    tmp.innerHTML = svgMarkup(matrix, dark, true);
    var src = tmp.firstChild;
    target.setAttribute('viewBox', src.getAttribute('viewBox'));
    target.setAttribute('shape-rendering', 'crispEdges');
    target.innerHTML = src.innerHTML;
  }

  function shortLink(url) { return url.replace(/^https?:\/\//, '').slice(0, 60); }

  function update() {
    var res = checkUrl(els.link.value);
    var shownUrl = res.ok ? res.url : (els.link.value.trim() ? '' : 'https://example.com');

    if (!els.link.value.trim()) setMsg(els.linkMsg, 'Sample QR preview. Enter your review link to generate your QR code.', 'warn');
    else if (!res.ok) setMsg(els.linkMsg, res.msg, 'err');
    else if (res.warn) setMsg(els.linkMsg, res.warn, 'warn');
    else setMsg(els.linkMsg, 'Link looks valid.', 'ok');

    current.url = res.ok ? res.url : '';
    current.matrix = shownUrl ? buildMatrix(shownUrl) : null;

    [els.qrSvg, els.qrFront, els.qrBig].forEach(function (target) {
      if (current.matrix) paintInto(target, current.matrix, els.dark.value);
      else target.innerHTML = '';
    });

    els.pName.textContent = els.name.value.trim() || 'Your Business';
    els.pLine.textContent = els.line.value.trim();
    els.pLink.textContent = res.ok ? shortLink(shownUrl) : '';
    document.documentElement.style.setProperty('--card', els.color.value);

    var ready = res.ok;
    els.dlPng.disabled = !ready; els.dlSvg.disabled = !ready; els.nfc.disabled = !ready;
  }

  // ---- Downloads ----
  function save(blob, filename) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  els.dlSvg.addEventListener('click', function () {
    if (!current.url) return;
    save(new Blob([svgMarkup(current.matrix, els.dark.value, true)], { type: 'image/svg+xml' }), 'review-qr.svg');
  });

  els.dlPng.addEventListener('click', function () {
    if (!current.url) return;
    var n = current.matrix.length, total = n + QUIET * 2;
    var scale = Math.ceil(1200 / total);             // Approximately 1200px or larger
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = total * scale;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = els.dark.value;
    for (var r = 0; r < n; r++)
      for (var c = 0; c < n; c++)
        if (current.matrix[r][c]) ctx.fillRect((c + QUIET) * scale, (r + QUIET) * scale, scale, scale);
    canvas.toBlob(function (b) { save(b, 'review-qr.png'); }, 'image/png');
  });

  els.print.addEventListener('click', function () { window.print(); });

  // ---- NFC writing (Web NFC: Chrome on Android over HTTPS) ----
  els.nfc.addEventListener('click', async function () {
    if (!current.url) return;
    if (!('NDEFReader' in window)) {
      setMsg(els.nfcMsg, 'Web NFC is not available in this browser. Use Chrome on Android or the NFC Tools app (see README).', 'err');
      return;
    }
    try {
      els.nfc.disabled = true;
      setMsg(els.nfcMsg, 'Hold the NFC card against the back of your phone…', 'warn');
      var ndef = new NDEFReader();
      await ndef.write({ records: [{ recordType: 'url', data: current.url }] });
      setMsg(els.nfcMsg, 'Success! Tap your phone against the card to test it.', 'ok');
    } catch (err) {
      var m = err && err.name === 'NotAllowedError' ? 'NFC permission denied. Enable NFC in your phone settings and allow the permission.'
            : err && err.name === 'NotSupportedError' ? 'NFC is unavailable or turned off on this phone.'
            : 'Could not write to the tag: ' + (err && err.message ? err.message : 'unknown error') + '. Reposition the card and try again.';
      setMsg(els.nfcMsg, m, 'err');
    } finally {
      els.nfc.disabled = !current.url;
    }
  });

  ['input', 'change'].forEach(function (ev) {
    [els.name, els.link, els.line, els.color, els.dark].forEach(function (el) { el.addEventListener(ev, update); });
  });

  // Pre-fill the form with ?link=...&name=...
  var q = new URLSearchParams(location.search);
  if (q.get('link')) els.link.value = q.get('link');
  if (q.get('name')) els.name.value = q.get('name');
  update();
})();
