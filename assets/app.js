/* Review Card Maker: QR + card preview + NFC write. Koi build step nahi. */
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

  var PLACEHOLDER = 'https://g.page/r/XXXXXXX/review';
  var current = { url: '', matrix: null };

  function setMsg(el, text, kind) { el.textContent = text || ''; el.className = 'msg' + (kind ? ' ' + kind : ''); }

  // Link sahi hai ya nahi
  function checkUrl(value) {
    var v = value.trim();
    if (!v) return { ok: false, url: '', msg: '' };
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    try {
      var u = new URL(v);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('protocol');
      var host = u.hostname.toLowerCase();
      var looksGoogle = /(^|\.)(g\.page|google\.com|goo\.gl|maps\.app\.goo\.gl)$/.test(host);
      return { ok: true, url: u.toString(), warn: looksGoogle ? '' : 'Ye Google ki link nahi lag rahi. Ek baar check kar lo.' };
    } catch (e) {
      return { ok: false, url: '', msg: 'Link galat hai. Poori link paste karo (https:// se shuru).' };
    }
  }

  // QR matrix banao (error correction M: print/scratch ke liye achha balance)
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

  var QUIET = 4; // QR ke charo taraf khali jagah (modules me), scan ke liye zaroori

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
    var shownUrl = res.ok ? res.url : PLACEHOLDER;

    if (!els.link.value.trim()) setMsg(els.linkMsg, 'Abhi sample QR dikh raha hai. Apni link daalo.', 'warn');
    else if (!res.ok) setMsg(els.linkMsg, res.msg, 'err');
    else if (res.warn) setMsg(els.linkMsg, res.warn, 'warn');
    else setMsg(els.linkMsg, 'Link theek hai ✓', 'ok');

    current.url = res.ok ? res.url : '';
    current.matrix = buildMatrix(shownUrl);

    paintInto(els.qrSvg, current.matrix, els.dark.value);
    paintInto(els.qrFront, current.matrix, els.dark.value);
    paintInto(els.qrBig, current.matrix, els.dark.value);

    els.pName.textContent = els.name.value.trim() || 'Aapka Business';
    els.pLine.textContent = els.line.value.trim();
    els.pLink.textContent = shortLink(shownUrl);
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
    var scale = Math.ceil(1200 / total);             // ~1200px ya usse bada
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

  // ---- NFC write (Web NFC: sirf Chrome Android, HTTPS) ----
  els.nfc.addEventListener('click', async function () {
    if (!current.url) return;
    if (!('NDEFReader' in window)) {
      setMsg(els.nfcMsg, 'Is browser me Web NFC nahi hai. Android Chrome use karo, ya NFC Tools app (README dekho).', 'err');
      return;
    }
    try {
      els.nfc.disabled = true;
      setMsg(els.nfcMsg, 'Ab NFC card ko phone ke peeche touch karo…', 'warn');
      var ndef = new NDEFReader();
      await ndef.write({ records: [{ recordType: 'url', data: current.url }] });
      setMsg(els.nfcMsg, 'Ho gaya ✓ Ab card ko phone se tap karke test karo.', 'ok');
    } catch (err) {
      var m = err && err.name === 'NotAllowedError' ? 'NFC permission nahi mili. Phone ki settings me NFC ON karo aur permission allow karo.'
            : err && err.name === 'NotSupportedError' ? 'Is phone me NFC nahi hai ya band hai.'
            : 'Likh nahi paaye: ' + (err && err.message ? err.message : 'unknown error') + '. Card ko thoda hilake dobara try karo.';
      setMsg(els.nfcMsg, m, 'err');
    } finally {
      els.nfc.disabled = !current.url;
    }
  });

  ['input', 'change'].forEach(function (ev) {
    [els.name, els.link, els.line, els.color, els.dark].forEach(function (el) { el.addEventListener(ev, update); });
  });

  // ?link=...&name=... se pehle se bhari hui link khol sakte ho
  var q = new URLSearchParams(location.search);
  if (q.get('link')) els.link.value = q.get('link');
  if (q.get('name')) els.name.value = q.get('name');
  update();
})();
