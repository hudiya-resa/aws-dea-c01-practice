/* AWS Certified Data Engineer - Associate (DEA-C01) exam prep — single-file app logic (no dependencies).
   Engine adapted from the Redis Software Operator prep app; adds ordering/matching questions,
   per-option explanations and a study-material (Materi) view. */
(function () {
  'use strict';

  const BANK = window.QUESTION_BANK || [];
  const DOMAINS = window.DOMAINS || {};
  const WEIGHTS = window.DOMAIN_WEIGHTS || {};
  const TASKS = window.TASKS || {};
  const SOURCES = window.SOURCES || {};
  const MATERI = window.MATERI || { tasks: {} };
  const PASS_PCT = 72;          // real exam: scaled 720/1000; raw 72% is a rough proxy
  const DEFAULT_COUNT = 65;
  const DEFAULT_MINUTES = 130;
  const LS = { attempts: 'deaprep.attempts.v1', missed: 'deaprep.missed.v1', settings: 'deaprep.settings.v1' };
  const TYPE_LABEL = { single: 'Satu jawaban', multiple: 'Multiple response', ordering: 'Ordering', matching: 'Matching' };

  const $app = document.getElementById('app');
  const byId = Object.fromEntries(BANK.map(q => [q.id, q]));

  // ---------- storage ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };
  const getAttempts = () => store.get(LS.attempts, []);
  const getMissed = () => store.get(LS.missed, {});

  // ---------- utils ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // minimal inline formatting: `code` and newlines
  const fmt = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
  const pad = n => String(n).padStart(2, '0');
  const fmtTime = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const fmtDate = ts => new Date(ts).toLocaleString('id-ID');
  const letter = i => String.fromCharCode(65 + i);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const ordinal = i => `${i + 1}.`;
  // deterministic per-question option order (for Browse), keeps "All/None of the above"-style options last
  function seededOrder(q) {
    let h = 0; for (const c of q.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
    const idx = q.options.map((_, i) => i);
    if (q.fixedOrder) return idx;
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const fixed = idx.filter(i => /^(all|none|both) of the above/i.test(q.options[i]));
    return idx.filter(i => !fixed.includes(i)).concat(fixed);
  }

  // ---------- answer model (shared by every question type) ----------
  // single/multiple: selected = chosen option indices · ordering: selected = option indices in the user's order
  // matching: selected[promptIndex] = response index (-1 = not set)
  const emptySelection = q => q.type === 'matching' ? q.prompts.map(() => -1) : [];
  const isAnswered = (q, sel) => q.type === 'matching' ? sel.some(x => x >= 0) : sel.length > 0;
  function isCorrect(q, sel) {
    if (q.type === 'ordering') return sel.length === q.answer.length && q.answer.every((a, i) => sel[i] === a);
    if (q.type === 'matching') return q.answer.every((a, i) => sel[i] === a);
    return sameSet(sel, q.answer);
  }
  const isMulti = q => q.type === 'multiple' || (q.type === 'single' && q.answer.length > 1);
  function typeTag(q) {
    if (q.type === 'ordering') return `<span class="tag multi">Ordering · ${q.options.length} langkah</span>`;
    if (q.type === 'matching') return `<span class="tag multi">Matching · ${q.prompts.length} pasangan</span>`;
    return isMulti(q) ? `<span class="tag multi">Pilih ${q.answer.length}</span>` : '<span class="tag">Satu jawaban</span>';
  }
  const srcTag = q => `<span class="tag public" title="${esc((SOURCES[q.source] || {}).license || '')}">${esc((SOURCES[q.source] || {}).label || q.source)}</span>`;

  // ---------- in-page modal (replaces native confirm/alert) ----------
  function ask(message, { okText = 'OK', cancelText = 'Batal' } = {}) {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="modal-body">${esc(message)}</div><div class="modal-actions">${cancelText ? `<button class="btn secondary" data-r="0">${esc(cancelText)}</button>` : ''}<button class="btn" data-r="1" autofocus>${esc(okText)}</button></div></div>`;
      const done = r => { wrap.remove(); document.removeEventListener('keydown', onKey); resolve(r); };
      const onKey = e => { if (e.key === 'Escape') done(false); if (e.key === 'Enter') done(true); };
      wrap.querySelectorAll('button').forEach(b => b.addEventListener('click', () => done(b.dataset.r === '1')));
      document.addEventListener('keydown', onKey);
      document.body.appendChild(wrap);
      wrap.querySelector('button[data-r="1"]').focus();
    });
  }
  const notify = message => ask(message, { cancelText: '' });

  // ---------- state ----------
  let view = 'home';
  let exam = null;      // active exam session
  let timerHandle = null;

  // ---------- routing ----------
  document.querySelectorAll('.navbtn').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
  document.getElementById('brand-home').addEventListener('click', () => go('home'));

  async function go(v, arg) {
    if (exam && !exam.finished && v !== 'exam') {
      if (!(await ask('Ujian sedang berjalan. Keluar? Progres attempt ini akan hilang.', { okText: 'Keluar', cancelText: 'Tetap di sini' }))) return;
      stopTimer(); exam = null;
    }
    view = v;
    document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    window.scrollTo(0, 0);
    ({ home: renderHome, materi: () => renderMateri(arg), history: renderHistory, missed: renderMissed, browse: renderBrowse, exam: renderExam, result: () => renderResult(arg) }[v] || renderHome)();
  }

  // ---------- HOME ----------
  function renderHome() {
    const missed = getMissed();
    const missedCount = Object.values(missed).filter(m => m.pending > 0).length;
    const attempts = getAttempts();
    const last = attempts[attempts.length - 1];
    const domainCounts = {};
    BANK.forEach(q => { domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1; });
    const settings = store.get(LS.settings, {});
    const typeCounts = {};
    BANK.forEach(q => { typeCounts[q.type] = (typeCounts[q.type] || 0) + 1; });

    $app.innerHTML = `
      <div class="card">
        <h2>Mock exam berwaktu</h2>
        <p class="muted small">Format ujian asli: <b>65 soal, 130 menit</b>, lulus skor skala <b>720/1000</b> (di sini didekati dengan ≥${PASS_PCT}% benar). Soal diambil acak sesuai <b>bobot domain resmi</b> (34/26/22/18%). Tipe soal: multiple choice dan multiple response.</p>
        <div class="row" style="margin:12px 0">
          <label class="field">Jumlah soal <input type="number" id="cfg-count" min="5" max="${BANK.length}" value="${settings.count || DEFAULT_COUNT}"></label>
          <label class="field">Menit <input type="number" id="cfg-min" min="1" max="240" value="${settings.minutes || DEFAULT_MINUTES}"></label>
          <label class="field">Mode
            <select id="cfg-mode">
              <option value="exam" ${settings.mode !== 'practice' ? 'selected' : ''}>Ujian (pembahasan di akhir)</option>
              <option value="practice" ${settings.mode === 'practice' ? 'selected' : ''}>Latihan (pembahasan tiap soal)</option>
            </select>
          </label>
          <label class="field" style="justify-content:flex-end"><span>&nbsp;</span><label style="display:flex;gap:6px;align-items:center;font-size:14px"><input type="checkbox" id="cfg-unseen" ${settings.unseen ? 'checked' : ''}> Utamakan soal yang belum pernah keluar</label></label>
        </div>
        <details ${settings.domains ? 'open' : ''}>
          <summary class="small muted" style="cursor:pointer">Batasi domain (default: semua)</summary>
          <div class="checks" style="margin-top:8px" id="cfg-domains">
            ${Object.keys(DOMAINS).map(d => `<label><input type="checkbox" value="${d}" ${!settings.domains || settings.domains.includes(d) ? 'checked' : ''}> ${esc(DOMAINS[d])} <span class="muted">(${domainCounts[d] || 0})</span></label>`).join('')}
          </div>
        </details>
        <div class="row" style="margin-top:16px">
          <button class="btn" id="start-exam">Mulai</button>
          ${missedCount ? `<button class="btn secondary" id="start-missed">Ulangi ${missedCount} soal yang salah</button>` : ''}
          <button class="btn ghost" id="go-materi">Buka materi →</button>
        </div>
      </div>

      ${reviewSet().length ? `<div class="card">
        <h3 style="margin-top:0">Review topik ujianmu</h3>
        <p class="muted small">${reviewSet().length} soal orisinal untuk topik yang kamu ingat dari attempt pertama (latensi, open-source, gaya bahasa perusahaan, Guardrails, prompting, RAG, layanan AI, MLOps, explainability, AgentCore, bias), dengan pembahasan bahasa Indonesia. Q&A konsepnya ada di tab Materi.</p>
        <div class="row"><button class="btn" id="start-review">Latihan topik ini</button><button class="btn ghost" id="go-review-materi">Baca Q&A konsep →</button></div>
      </div>` : ''}

      <div class="grid">
        <div class="stat"><div class="lbl">Bank soal</div><div class="big">${BANK.length}</div><div class="small muted">${typeCounts.single || 0} single · ${typeCounts.multiple || 0} multiple response · ${BANK.filter(q => q.v11).length} topik baru v1.1</div></div>
        <div class="stat"><div class="lbl">Attempt</div><div class="big">${attempts.length}</div><div class="small muted">${last ? `Terakhir: ${last.pct}% (${last.passed ? 'LULUS' : 'BELUM'}) · ${fmtDate(last.ts)}` : 'Belum ada attempt'}</div></div>
        <div class="stat"><div class="lbl">Perlu diulang</div><div class="big">${missedCount}</div><div class="small muted">Soal yang pernah salah dan belum dijawab benar lagi</div></div>
      </div>

      <div class="card">
        <h3 style="margin-top:0">Cakupan per domain</h3>
        <table class="tbl">
          <thead><tr><th>Domain</th><th>Bobot ujian</th><th>Soal di bank</th><th>Akurasimu</th></tr></thead>
          <tbody>${Object.keys(DOMAINS).map(d => {
            const acc = accuracy(q => q.domain === d);
            return `<tr><td>${esc(DOMAINS[d])}</td><td>${WEIGHTS[d] || '—'}%</td><td>${domainCounts[d] || 0}</td><td>${acc === null ? '<span class="muted">—</span>' : acc + '%'}</td></tr>`;
          }).join('')}</tbody>
        </table>
        <p class="small muted" style="margin-bottom:0">Berdasarkan <a href="https://docs.aws.amazon.com/aws-certification/latest/data-engineer-associate-01/data-engineer-associate-01.html" target="_blank" rel="noopener">exam guide DEA-C01 v1.1</a> (terbit 12 Des 2025, berlaku di ujian sejak ±pertengahan Jan 2026). Detail di tab <b>Materi</b>.</p>
      </div>
      <div class="card small muted">
        <b>Keyboard:</b> <kbd>1</kbd>–<kbd>6</kbd> pilih opsi (single/multiple/ordering) · <kbd>←</kbd>/<kbd>→</kbd> sebelumnya/berikutnya · <kbd>F</kbd> flag · <kbd>H</kbd> hint · <kbd>Enter</kbd> cek jawaban (mode latihan)
      </div>`;

    document.getElementById('start-exam').addEventListener('click', () => {
      const count = Math.max(1, Math.min(BANK.length, +document.getElementById('cfg-count').value || DEFAULT_COUNT));
      const minutes = Math.max(1, +document.getElementById('cfg-min').value || DEFAULT_MINUTES);
      const mode = document.getElementById('cfg-mode').value;
      const unseen = document.getElementById('cfg-unseen').checked;
      const domains = [...document.querySelectorAll('#cfg-domains input:checked')].map(i => i.value);
      const allDomains = domains.length === Object.keys(DOMAINS).length;
      store.set(LS.settings, { count, minutes, mode, unseen, domains: allDomains ? null : domains });
      let pool = BANK.filter(q => domains.includes(q.domain));
      if (!pool.length) { notify('Tidak ada soal untuk domain yang dipilih.'); return; }
      if (unseen) {
        const seen = new Set(getAttempts().flatMap(a => a.items.map(i => i.id)));
        const fresh = pool.filter(q => !seen.has(q.id));
        if (fresh.length >= count) pool = fresh;
      }
      const picked = pickBalanced(pool, count);
      startExam({ questions: picked, minutes, mode, label: mode === 'exam' ? 'Mock exam' : 'Latihan' });
    });
    const sm = document.getElementById('start-missed');
    if (sm) sm.addEventListener('click', () => {
      const ids = Object.entries(getMissed()).filter(([, m]) => m.pending > 0).map(([id]) => id).filter(id => byId[id]);
      startExam({ questions: shuffle(ids.map(id => byId[id])), minutes: 0, mode: 'practice', label: 'Ulang soal salah', isMissedReview: true });
    });
    document.getElementById('go-materi').addEventListener('click', () => go('materi'));
    const sr = document.getElementById('start-review'); if (sr) sr.addEventListener('click', startReview);
    const gr = document.getElementById('go-review-materi');
    if (gr) gr.addEventListener('click', async () => { await go('materi'); document.getElementById('m-review').scrollIntoView(); });
  }

  const reviewSet = () => BANK.filter(q => q.source === 'review');
  function startReview() {
    startExam({ questions: shuffle(reviewSet()), minutes: 0, mode: 'practice', label: 'Review topik ujian' });
  }

  // pick `count` questions, spread across domains by exam weight (falls back to pool size), random within domain
  function pickBalanced(pool, count) {
    if (count >= pool.length) return shuffle(pool);
    const groups = {};
    pool.forEach(q => (groups[q.domain] = groups[q.domain] || []).push(q));
    const doms = Object.keys(groups);
    const w = d => WEIGHTS[d] || groups[d].length;
    const totalW = doms.reduce((s, d) => s + w(d), 0);
    const quotas = {};
    let assigned = 0;
    doms.forEach(d => { quotas[d] = Math.min(groups[d].length, Math.floor(count * w(d) / totalW)); assigned += quotas[d]; });
    // distribute remainder by largest fractional share, then to any domain with spare questions
    const rem = doms.map(d => ({ d, frac: (count * w(d) / totalW) - Math.floor(count * w(d) / totalW) })).sort((a, b) => b.frac - a.frac);
    for (let pass = 0; assigned < count && pass < 50; pass++) {
      for (const { d } of rem) { if (assigned >= count) break; if (quotas[d] < groups[d].length) { quotas[d]++; assigned++; } }
    }
    const out = [];
    doms.forEach(d => out.push(...shuffle(groups[d]).slice(0, quotas[d])));
    return shuffle(out);
  }

  function accuracy(pred) {
    let right = 0, total = 0;
    getAttempts().forEach(a => a.items.forEach(it => { const q = byId[it.id]; if (q && pred(q)) { total++; if (it.correct) right++; } }));
    return total ? Math.round(100 * right / total) : null;
  }

  // ---------- EXAM ----------
  function startExam({ questions, minutes, mode, label, isMissedReview }) {
    exam = {
      id: uid(), label, mode, isMissedReview: !!isMissedReview,
      items: questions.map(q => ({ id: q.id, order: q.fixedOrder ? q.options.map((_, i) => i) : shuffle(q.options.map((_, i) => i)), selected: emptySelection(q), flagged: false, checked: false, hint: false })),
      idx: 0, startedAt: Date.now(), secondsLeft: minutes ? minutes * 60 : null, finished: false,
    };
    // keep "All of the above"/"None of the above"-style options last if present
    exam.items.forEach(it => {
      const q = byId[it.id];
      if (q.type === 'ordering' || q.type === 'matching') return;
      const fixed = it.order.filter(i => /^(all|none|both) of the above/i.test(q.options[i]));
      if (fixed.length) it.order = it.order.filter(i => !fixed.includes(i)).concat(fixed);
    });
    view = 'exam';
    document.querySelectorAll('.navbtn').forEach(b => b.classList.remove('active'));
    if (exam.secondsLeft) startTimer();
    renderExam();
  }

  function startTimer() {
    stopTimer();
    timerHandle = setInterval(() => {
      if (!exam || exam.finished) return stopTimer();
      exam.secondsLeft--;
      const t = document.getElementById('timer');
      if (t) { t.textContent = fmtTime(Math.max(0, exam.secondsLeft)); t.classList.toggle('low', exam.secondsLeft <= 300); }
      if (exam.secondsLeft <= 0) { stopTimer(); finishExam(); notify('Waktu habis — ujian otomatis dikumpulkan.'); }
    }, 1000);
  }
  function stopTimer() { if (timerHandle) clearInterval(timerHandle); timerHandle = null; }

  // interactive answer area for the current exam item
  function answerInputHTML(q, it, showFeedback) {
    if (q.type === 'matching') {
      return `<div class="match">${q.prompts.map((p, pi) => {
        const sel = it.selected[pi];
        let cls = 'match-row';
        if (showFeedback) cls += sel === q.answer[pi] ? ' correct' : ' wrong';
        return `<div class="${cls}"><div class="match-prompt"><span class="key">${pi + 1}.</span>${fmt(p)}</div>
          <select data-pi="${pi}" ${showFeedback ? 'disabled' : ''}><option value="-1">— pilih —</option>${it.order.map(oi => `<option value="${oi}" ${sel === oi ? 'selected' : ''}>${esc(q.options[oi])}</option>`).join('')}</select>
          ${showFeedback && sel !== q.answer[pi] ? `<div class="small match-fix">✔ Benar: <b>${fmt(q.options[q.answer[pi]])}</b></div>` : ''}</div>`;
      }).join('')}</div>`;
    }
    if (q.type === 'ordering') {
      return `<p class="small muted" style="margin:0 0 8px">Klik langkah sesuai urutan (pertama → terakhir). Klik lagi untuk membatalkan.</p>
        <div class="options" id="options">${it.order.map(oi => {
          const pos = it.selected.indexOf(oi);
          let cls = 'opt' + (pos >= 0 ? ' selected' : '');
          if (showFeedback) cls += pos === q.answer.indexOf(oi) ? ' correct' : ' wrong';
          return `<label class="${cls}" data-oi="${oi}"><span class="key order-badge">${pos >= 0 ? pos + 1 : '·'}</span><span>${fmt(q.options[oi])}${showFeedback && pos !== q.answer.indexOf(oi) ? ` <span class="small muted">(seharusnya ke-${q.answer.indexOf(oi) + 1})</span>` : ''}</span></label>`;
        }).join('')}</div>
        ${!showFeedback && it.selected.length ? '<div style="margin-top:8px"><button class="btn ghost sm" id="btn-reset-order">Reset urutan</button></div>' : ''}`;
    }
    const multi = isMulti(q);
    return `<div class="options" id="options">${it.order.map((oi, pos) => {
      const sel = it.selected.includes(oi);
      let cls = 'opt' + (sel ? ' selected' : '');
      if (showFeedback) {
        const isC = q.answer.includes(oi);
        if (isC && sel) cls += ' correct'; else if (!isC && sel) cls += ' wrong'; else if (isC) cls += ' missed';
      }
      return `<label class="${cls}" data-oi="${oi}"><input type="${multi ? 'checkbox' : 'radio'}" name="opt" ${sel ? 'checked' : ''} ${showFeedback ? 'disabled' : ''}><span class="key">${letter(pos)}.</span><span>${fmt(q.options[oi])}</span></label>`;
    }).join('')}</div>`;
  }

  function toggleOption(q, it, oi) {
    if (q.type === 'ordering') it.selected = it.selected.includes(oi) ? it.selected.filter(x => x !== oi) : it.selected.concat(oi);
    else if (isMulti(q)) it.selected = it.selected.includes(oi) ? it.selected.filter(x => x !== oi) : it.selected.concat(oi);
    else it.selected = [oi];
  }

  function renderExam() {
    if (!exam) return go('home');
    const it = exam.items[exam.idx];
    const q = byId[it.id];
    const n = exam.items.length;
    const answered = exam.items.filter(i => isAnswered(byId[i.id], i.selected)).length;
    const showFeedback = exam.mode === 'practice' && it.checked;

    $app.innerHTML = `
      <div class="exam-header">
        <div><b>${esc(exam.label)}</b> <span class="muted small">· Soal ${exam.idx + 1} dari ${n} · ${answered} terjawab</span></div>
        <div class="row">
          ${exam.secondsLeft !== null ? `<div class="timer ${exam.secondsLeft <= 300 ? 'low' : ''}" id="timer">${fmtTime(exam.secondsLeft)}</div>` : '<div class="timer">tanpa waktu</div>'}
          <button class="btn secondary sm" id="btn-finish">${exam.mode === 'exam' ? 'Kumpulkan' : 'Selesai'}</button>
        </div>
      </div>
      <div class="progress"><div style="width:${(100 * answered / n).toFixed(1)}%"></div></div>
      <div class="card">
        <div class="qmeta">
          <span class="tag">${esc(DOMAINS[q.domain] || q.domain)}</span>
          <span class="tag" title="${esc(TASKS[q.task] || '')}${q.taskGuessed ? ' (pemetaan task otomatis)' : ''}">${q.skill ? `Skill ${esc(q.skill)}` : `Task ${esc(q.task)}${q.taskGuessed ? '*' : ''}`}</span>
          ${typeTag(q)}
          ${q.v11 ? '<span class="tag new">baru v1.1</span>' : ''}
          <span style="margin-left:auto"><button class="btn ghost sm" id="btn-flag">${it.flagged ? '🚩 Ditandai' : '⚑ Tandai'}</button></span>
        </div>
        <div class="qtext">${fmt(q.q)}</div>
        ${answerInputHTML(q, it, showFeedback)}
        ${exam.mode === 'practice' && q.hint && !showFeedback ? (it.hint ? `<div class="explain hint">💡 <b>Hint:</b> ${fmt(q.hint)}</div>` : '<div style="margin-top:10px"><button class="btn ghost sm" id="btn-hint">💡 Tampilkan hint</button></div>') : ''}
        ${showFeedback ? explanationHTML(q, it.selected) : ''}
        <div class="row" style="margin-top:16px;justify-content:space-between">
          <button class="btn secondary" id="btn-prev" ${exam.idx === 0 ? 'disabled' : ''}>← Sebelumnya</button>
          <div class="row">
            ${exam.mode === 'practice' && !it.checked ? `<button class="btn" id="btn-check" ${isAnswered(q, it.selected) ? '' : 'disabled'}>Cek jawaban</button>` : ''}
            ${exam.idx < n - 1 ? `<button class="btn ${exam.mode === 'practice' && !it.checked ? 'secondary' : ''}" id="btn-next">Berikutnya →</button>` : `<button class="btn" id="btn-finish2">${exam.mode === 'exam' ? 'Kumpulkan' : 'Selesai'}</button>`}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="small muted">Lompat ke soal (abu = terjawab, kuning = ditandai)</div>
        <div class="navgrid">${exam.items.map((x, i) => `<button class="${i === exam.idx ? 'current ' : ''}${isAnswered(byId[x.id], x.selected) ? 'answered ' : ''}${x.flagged ? 'flagged' : ''}" data-i="${i}">${i + 1}</button>`).join('')}</div>
      </div>`;

    if (!showFeedback) {
      document.querySelectorAll('#options .opt').forEach(el => el.addEventListener('click', e => {
        e.preventDefault();
        toggleOption(q, it, +el.dataset.oi);
        renderExam();
      }));
      document.querySelectorAll('.match select').forEach(s => s.addEventListener('change', () => { it.selected[+s.dataset.pi] = +s.value; renderExam(); }));
      const ro = document.getElementById('btn-reset-order'); if (ro) ro.addEventListener('click', () => { it.selected = []; renderExam(); });
    }
    const hb = document.getElementById('btn-hint'); if (hb) hb.addEventListener('click', () => { it.hint = true; renderExam(); });
    document.getElementById('btn-prev').addEventListener('click', () => { exam.idx--; renderExam(); });
    const nx = document.getElementById('btn-next'); if (nx) nx.addEventListener('click', next);
    const ck = document.getElementById('btn-check'); if (ck) ck.addEventListener('click', checkCurrent);
    document.getElementById('btn-flag').addEventListener('click', () => { it.flagged = !it.flagged; renderExam(); });
    document.getElementById('btn-finish').addEventListener('click', confirmFinish);
    const f2 = document.getElementById('btn-finish2'); if (f2) f2.addEventListener('click', confirmFinish);
    document.querySelectorAll('.navgrid button').forEach(b => b.addEventListener('click', () => { exam.idx = +b.dataset.i; renderExam(); }));
  }

  function next() {
    const it = exam.items[exam.idx];
    if (exam.mode === 'practice' && !it.checked && isAnswered(byId[it.id], it.selected)) it.checked = true; // auto-check on next
    if (exam.idx < exam.items.length - 1) { exam.idx++; renderExam(); }
  }
  function checkCurrent() { const it = exam.items[exam.idx]; if (isAnswered(byId[it.id], it.selected)) { it.checked = true; renderExam(); } }

  async function confirmFinish() {
    const un = exam.items.filter(i => !isAnswered(byId[i.id], i.selected)).length;
    const fl = exam.items.filter(i => i.flagged).length;
    let msg = 'Kumpulkan sekarang?';
    if (un) msg = `${un} soal belum dijawab (dihitung salah).` + (fl ? ` ${fl} ditandai.` : '') + ' Tetap kumpulkan?';
    else if (fl) msg = `${fl} soal masih ditandai. Tetap kumpulkan?`;
    if (await ask(msg, { okText: 'Kumpulkan', cancelText: 'Lanjut mengerjakan' })) finishExam();
  }

  function finishExam() {
    stopTimer();
    exam.finished = true;
    const items = exam.items.map(it => ({ id: it.id, order: it.order, selected: it.selected, correct: isCorrect(byId[it.id], it.selected) }));
    const right = items.filter(i => i.correct).length;
    const pct = Math.round(100 * right / items.length);
    const attempt = { id: exam.id, ts: Date.now(), label: exam.label, mode: exam.mode, durationSec: Math.round((Date.now() - exam.startedAt) / 1000), total: items.length, right, pct, passed: pct >= PASS_PCT, items, isMissedReview: exam.isMissedReview };
    // update missed tracker
    const missed = getMissed();
    items.forEach(i => {
      const m = missed[i.id] || { wrong: 0, right: 0, pending: 0, last: 0 };
      if (i.correct) { m.right++; m.pending = Math.max(0, m.pending - 1); } else { m.wrong++; m.pending = 1; }
      m.last = Date.now();
      missed[i.id] = m;
    });
    store.set(LS.missed, missed);
    const attempts = getAttempts(); attempts.push(attempt); store.set(LS.attempts, attempts.slice(-200));
    exam = null;
    go('result', attempt);
  }

  // ---------- EXPLANATIONS ----------
  function correctAnswerHTML(q) {
    if (q.type === 'ordering') return `<ol class="tight">${q.answer.map(oi => `<li>${fmt(q.options[oi])}</li>`).join('')}</ol>`;
    if (q.type === 'matching') return `<ul class="tight">${q.prompts.map((p, pi) => `<li>${fmt(p)} → <b>${fmt(q.options[q.answer[pi]])}</b></li>`).join('')}</ul>`;
    return q.answer.map(i => `<b>${fmt(q.options[i])}</b>`).join(', ');
  }

  // "why your answer was wrong": explanations of the options the user picked that are not correct
  function whyWrongHTML(q, sel) {
    const ex = q.optExpl || [];
    let rows = [];
    if (q.type === 'single' || q.type === 'multiple') {
      rows = sel.filter(oi => !q.answer.includes(oi)).map(oi => `<li><b>${fmt(q.options[oi])}</b> — ${ex[oi] ? fmt(ex[oi]) : '<span class="muted">bukan jawaban yang benar.</span>'}</li>`);
      const missedC = q.answer.filter(oi => !sel.includes(oi));
      if (sel.length && missedC.length && q.type === 'multiple') rows.push(`<li>Terlewat: ${missedC.map(oi => `<b>${fmt(q.options[oi])}</b>`).join(', ')}</li>`);
    } else if (q.type === 'matching') {
      rows = q.prompts.map((p, pi) => sel[pi] === q.answer[pi] ? '' : `<li>${fmt(p)}: kamu pilih <b>${sel[pi] >= 0 ? fmt(q.options[sel[pi]]) : '—'}</b>, benar <b>${fmt(q.options[q.answer[pi]])}</b>${(q.promptExpl || [])[pi] ? ` — ${fmt(q.promptExpl[pi])}` : ''}</li>`).filter(Boolean);
    } else if (q.type === 'ordering') {
      rows = q.answer.map((oi, pos) => sel[pos] === oi ? '' : `<li>Langkah ke-${pos + 1} seharusnya <b>${fmt(q.options[oi])}</b>${ex[oi] ? ` — ${fmt(ex[oi])}` : ''}</li>`).filter(Boolean);
    }
    return rows.length ? `<div class="whywrong"><div class="lbl">Kenapa jawabanmu salah</div><ul class="tight">${rows.join('')}</ul></div>` : '';
  }

  function allOptionsHTML(q) {
    const ex = q.optExpl || [];
    if (q.type === 'matching') {
      const pe = q.promptExpl || [];
      const extra = q.options.map((o, i) => (!q.answer.includes(i) && ex[i]) ? `<li><b>${fmt(o)}</b> (pengecoh) — ${fmt(ex[i])}</li>` : '').filter(Boolean);
      if (!pe.some(Boolean) && !extra.length) return '';
      return `<details class="optexpl"><summary>Pembahasan tiap pasangan</summary><ul class="tight">${q.prompts.map((p, pi) => pe[pi] ? `<li>${fmt(pe[pi])}</li>` : '').join('')}${extra.join('')}</ul></details>`;
    }
    if (!ex.some(Boolean)) return '';
    const order = q.type === 'ordering' ? q.answer : q.options.map((_, i) => i);
    return `<details class="optexpl"><summary>Pembahasan semua opsi</summary><ul class="tight">${order.map(oi => ex[oi] ? `<li class="${q.type !== 'ordering' && q.answer.includes(oi) ? 'ok' : ''}"><b>${fmt(q.options[oi])}</b> — ${fmt(ex[oi])}</li>` : '').join('')}</ul></details>`;
  }

  function explanationHTML(q, selected) {
    const correct = isCorrect(q, selected);
    const answered = isAnswered(q, selected);
    const src = SOURCES[q.source] || {};
    return `<div class="explain ${correct ? 'ok' : 'bad'}">
      <div class="verdict">${correct ? '✔ Benar' : (answered ? '✘ Salah' : '— Tidak dijawab')}</div>
      ${!correct ? `<div class="answer-key"><span class="lbl">Jawaban benar:</span> ${correctAnswerHTML(q)}</div>` : ''}
      ${!correct && answered ? whyWrongHTML(q, selected) : ''}
      <div class="lbl" style="margin-top:8px">Pembahasan</div>
      <div>${fmt(q.explanation)}</div>
      ${q.keyConcept ? `<div class="ref">🔑 <b>Konsep kunci:</b> ${fmt(q.keyConcept)}</div>` : ''}
      ${q.trap ? `<div class="ref">⚠ <b>Jebakan:</b> ${fmt(q.trap)}</div>` : ''}
      ${q.tip ? `<div class="ref">💡 <b>Tip ujian:</b> ${fmt(q.tip)}</div>` : ''}
      ${allOptionsHTML(q)}
      ${(q.refs || []).map(r => `<div class="ref">📖 <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a>${r.quote ? `<div class="quote">“${esc(r.quote)}”</div>` : ''}</div>`).join('')}
      ${q.scopeNote ? `<div class="ref muted">ℹ ${esc(q.scopeNote)}</div>` : ''}
      <div class="ref muted small">Sumber soal: <a href="${esc(q.sourceUrl || src.url || '#')}" target="_blank" rel="noopener">${esc(src.label || q.source)}</a> (${esc(src.license || '')}) · ${esc(q.id)}</div>
    </div>`;
  }

  // read-only rendering of a question's answer area with marks (review/browse)
  function answerReadonlyHTML(q, order, selected, marks) {
    order = order || q.options.map((_, k) => k);
    if (q.type === 'matching') {
      return `<div class="match">${q.prompts.map((p, pi) => {
        const sel = selected ? selected[pi] : -1;
        const cls = marks ? (sel === q.answer[pi] ? ' correct' : ' wrong') : '';
        return `<div class="match-row${cls}"><div class="match-prompt"><span class="key">${pi + 1}.</span>${fmt(p)}</div><div class="small">${selected ? `Jawabanmu: <b>${sel >= 0 ? fmt(q.options[sel]) : '—'}</b>` : ''}${marks && sel !== q.answer[pi] ? ` · Benar: <b>${fmt(q.options[q.answer[pi]])}</b>` : ''}</div></div>`;
      }).join('')}<div class="small muted">Pilihan: ${order.map(oi => esc(q.options[oi])).join(' · ')}</div></div>`;
    }
    if (q.type === 'ordering') {
      return `<div class="options">${order.map(oi => {
        const pos = selected ? selected.indexOf(oi) : -1;
        const cls = marks ? (pos === q.answer.indexOf(oi) ? ' correct' : ' wrong') : '';
        return `<div class="opt${cls}"><span class="key order-badge">${pos >= 0 ? pos + 1 : '·'}</span><span>${fmt(q.options[oi])}${marks ? ` <span class="small muted">(benar: ke-${q.answer.indexOf(oi) + 1})</span>` : ''}</span></div>`;
      }).join('')}</div>`;
    }
    return `<div class="options">${order.map((oi, pos) => {
      const sel = selected ? selected.includes(oi) : false; const isC = q.answer.includes(oi);
      let cls = 'opt';
      if (marks) { if (isC && sel) cls += ' correct'; else if (!isC && sel) cls += ' wrong'; else if (isC) cls += ' missed'; }
      return `<div class="${cls}"><span class="key">${letter(pos)}.</span><span>${fmt(q.options[oi])}${sel ? ' <span class="muted small">(jawabanmu)</span>' : ''}</span></div>`;
    }).join('')}</div>`;
  }

  // ---------- RESULT / REVIEW ----------
  function renderResult(attempt, wrongOnly) {
    if (!attempt) return go('home');
    const perDomain = {};
    attempt.items.forEach(i => { const q = byId[i.id]; if (!q) return; const d = perDomain[q.domain] = perDomain[q.domain] || { r: 0, t: 0 }; d.t++; if (i.correct) d.r++; });
    const perTask = {};
    attempt.items.forEach(i => { const q = byId[i.id]; if (!q) return; const d = perTask[q.task] = perTask[q.task] || { r: 0, t: 0 }; d.t++; if (i.correct) d.r++; });
    const weakTasks = Object.keys(perTask).filter(t => perTask[t].r / perTask[t].t < PASS_PCT / 100).sort();
    const shown = attempt.items.filter(i => !wrongOnly || !i.correct);
    $app.innerHTML = `
      <div class="card result-hero">
        <div class="muted small">${esc(attempt.label)} · ${fmtDate(attempt.ts)} · ${fmtTime(attempt.durationSec)} terpakai</div>
        <div class="score ${attempt.passed ? 'pass' : 'fail'}">${attempt.pct}%</div>
        <div style="font-size:20px;font-weight:700" class="${attempt.passed ? 'pass' : 'fail'}">${attempt.passed ? 'LULUS' : 'BELUM LULUS'} <span class="muted small" style="font-weight:400">(${attempt.right}/${attempt.total} benar · ambang ${PASS_PCT}%)</span></div>
        <div class="row" style="justify-content:center;margin-top:16px">
          <button class="btn" id="btn-again">Ujian baru</button>
          ${attempt.right < attempt.total ? `<button class="btn secondary" id="btn-retry-wrong">Ulangi ${attempt.total - attempt.right} yang salah</button>` : ''}
          <button class="btn ghost" id="btn-home">Beranda</button>
        </div>
      </div>
      <div class="card">
        <h3 style="margin-top:0">Per domain</h3>
        <table class="tbl"><thead><tr><th>Domain</th><th>Benar</th><th style="width:40%">Akurasi</th></tr></thead><tbody>
          ${Object.keys(perDomain).sort((a, b) => (perDomain[a].r / perDomain[a].t) - (perDomain[b].r / perDomain[b].t)).map(d => { const p = perDomain[d]; const pc = Math.round(100 * p.r / p.t); return `<tr><td>${esc(DOMAINS[d] || d)}</td><td>${p.r}/${p.t}</td><td><div class="bar"><div style="width:${pc}%;background:${pc >= PASS_PCT ? 'var(--ok)' : 'var(--bad)'}"></div></div><span class="small muted">${pc}%</span></td></tr>`; }).join('')}
        </tbody></table>
        ${weakTasks.length ? `<p class="small" style="margin-bottom:0"><b>Pelajari ulang:</b> ${weakTasks.map(t => `<a href="#" data-materi="${t}">Task ${t} · ${esc(TASKS[t] || '')}</a> (${perTask[t].r}/${perTask[t].t})`).join(' · ')}</p>` : ''}
      </div>
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Review ${wrongOnly ? `(${shown.length} salah)` : `(semua ${shown.length})`}</h3>
          <div class="row"><button class="btn secondary sm" id="btn-toggle-wrong">${wrongOnly ? 'Tampilkan semua' : 'Hanya yang salah'}</button></div>
        </div>
        ${shown.map(i => {
          const q = byId[i.id]; if (!q) return '';
          return `<div class="review-item">
            <div class="qmeta"><span class="muted">#${attempt.items.indexOf(i) + 1}</span><span class="tag">${esc(DOMAINS[q.domain] || q.domain)}</span><span class="tag">Task ${esc(q.task)}</span>${typeTag(q)}</div>
            <div class="qtext" style="font-size:15px">${fmt(q.q)}</div>
            ${answerReadonlyHTML(q, i.order, i.selected, true)}
            ${explanationHTML(q, i.selected)}
          </div>`;
        }).join('') || '<p class="muted">Tidak ada yang ditampilkan.</p>'}
      </div>`;
    document.getElementById('btn-again').addEventListener('click', () => go('home'));
    document.getElementById('btn-home').addEventListener('click', () => go('home'));
    document.getElementById('btn-toggle-wrong').addEventListener('click', () => renderResult(attempt, !wrongOnly));
    document.querySelectorAll('a[data-materi]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); go('materi', a.dataset.materi); }));
    const rw = document.getElementById('btn-retry-wrong');
    if (rw) rw.addEventListener('click', () => {
      const qs = attempt.items.filter(i => !i.correct).map(i => byId[i.id]).filter(Boolean);
      startExam({ questions: shuffle(qs), minutes: 0, mode: 'practice', label: 'Ulang yang salah', isMissedReview: true });
    });
  }

  // ---------- MATERI ----------
  const skills = t => ((window.GUIDE || { tasks: {} }).tasks[t] || {}).skills || [];
  function renderMateri(focusTask) {
    const taskCount = {};
    BANK.forEach(q => { taskCount[q.task] = (taskCount[q.task] || 0) + 1; });
    const doms = Object.keys(DOMAINS);
    $app.innerHTML = `
      <div class="card">
        <h2 style="margin-top:0">Materi DEA-C01</h2>
        <p class="muted small">Disusun mengikuti exam guide resmi <b>v1.1 (12 Des 2025)</b>. Objektif ditulis dalam bahasa Inggris seperti di guide/ujian, ringkasan dalam bahasa Indonesia. Setiap task punya tombol latihan dengan soal yang dipetakan ke task tersebut.</p>
        <div class="toc">${MATERI.review ? '<a href="#m-review">Review topik ujianmu</a>' : ''}${doms.map(d => `<a href="#m-${d}">${esc(DOMAINS[d])} <span class="muted">(${WEIGHTS[d]}%)</span></a>`).join('')}<a href="#m-plan">Rencana belajar & sumber resmi</a></div>
      </div>
      ${MATERI.review ? `<div class="card materi" id="m-review"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Review topik ujianmu (Q&A konsep)</h3><button class="btn sm" id="btn-review-practice">Latihan ${reviewSet().length} soal topik ini</button></div>${MATERI.review}</div>` : ''}
      <div class="card materi" id="m-info"><h3 style="margin-top:0">Info ujian & versi guide</h3>${MATERI.info || ''}</div>
      ${doms.map(d => `<div class="card materi" id="m-${d}">
        <h3 style="margin-top:0">${esc(DOMAINS[d])} <span class="tag">${WEIGHTS[d]}% skor</span></h3>
        ${Object.keys(TASKS).filter(t => 'd' + t.split('.')[0] === d).map(t => {
          const m = MATERI.tasks[t] || {}; const acc = accuracy(q => q.task === t);
          return `<details class="task" id="m-task-${t.replace('.', '-')}" ${focusTask === t ? 'open' : ''}>
            <summary><b>Task ${t}</b> · ${esc(TASKS[t])} <span class="muted small">· ${taskCount[t] || 0} soal${acc !== null ? ` · akurasimu ${acc}%` : ''}</span></summary>
            ${skills(t).length ? `<div class="objectives"><div class="lbl">Skill resmi (exam guide v1.1)</div><ul class="tight">${skills(t).map(k => `<li><b>${k.id}</b> ${esc(k.text)}${k.new ? ' <span class="tag new">baru v1.1</span>' : ''}${k.changed ? ' <span class="tag">diubah v1.1</span>' : ''}</li>`).join('')}</ul></div>` : ''}
            <div class="notes">${m.notes || ''}</div>
            <div class="row" style="margin-top:10px">
              <button class="btn sm" data-practice="${t}" ${taskCount[t] ? '' : 'disabled'}>Latihan task ${t} (20 soal)</button>
              <button class="btn secondary sm" data-practice-all="${t}" ${taskCount[t] ? '' : 'disabled'}>Semua ${taskCount[t] || 0} soal task ini</button>
            </div>
          </details>`;
        }).join('')}
      </div>`).join('')}
      <div class="card materi" id="m-plan"><h3 style="margin-top:0">Rencana belajar & sumber resmi</h3>${MATERI.plan || ''}</div>`;
    const practise = (t, all) => {
      const pool = BANK.filter(q => q.task === t);
      startExam({ questions: all ? shuffle(pool) : shuffle(pool).slice(0, 20), minutes: 0, mode: 'practice', label: `Latihan task ${t} · ${TASKS[t]}` });
    };
    const rp = document.getElementById('btn-review-practice'); if (rp) rp.addEventListener('click', startReview);
    document.querySelectorAll('button[data-practice]').forEach(b => b.addEventListener('click', () => practise(b.dataset.practice, false)));
    document.querySelectorAll('button[data-practice-all]').forEach(b => b.addEventListener('click', () => practise(b.dataset.practiceAll, true)));
    document.querySelectorAll('.toc a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); document.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth' }); }));
    if (focusTask) { const el = document.getElementById('m-task-' + focusTask.replace('.', '-')); if (el) el.scrollIntoView(); }
  }

  // ---------- HISTORY ----------
  function renderHistory() {
    const attempts = getAttempts().slice().reverse();
    $app.innerHTML = `<div class="card">
      <div class="row" style="justify-content:space-between"><h2 style="margin:0">Riwayat attempt</h2>${attempts.length ? '<button class="btn ghost sm" id="btn-clear">Hapus riwayat</button>' : ''}</div>
      ${attempts.length ? `<table class="tbl" style="margin-top:12px"><thead><tr><th>Waktu</th><th>Jenis</th><th>Skor</th><th>Hasil</th><th>Durasi</th><th></th></tr></thead><tbody>
        ${attempts.map(a => `<tr><td>${fmtDate(a.ts)}</td><td>${esc(a.label)}${a.mode === 'practice' ? ' <span class="muted small">(latihan)</span>' : ''}</td><td>${a.right}/${a.total} (${a.pct}%)</td><td class="${a.passed ? 'pass' : 'fail'}"><b>${a.passed ? 'LULUS' : 'BELUM'}</b></td><td>${fmtTime(a.durationSec)}</td><td><button class="btn secondary sm" data-id="${a.id}">Review</button></td></tr>`).join('')}
      </tbody></table>` : '<p class="muted">Belum ada attempt. Mulai mock exam dari Beranda.</p>'}
    </div>
    ${attempts.length ? trendHTML(attempts.slice().reverse()) : ''}`;
    document.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', () => go('result', attempts.find(a => a.id === b.dataset.id))));
    const c = document.getElementById('btn-clear');
    if (c) c.addEventListener('click', async () => { if (await ask('Hapus semua riwayat attempt dan daftar soal salah?', { okText: 'Hapus', cancelText: 'Batal' })) { store.set(LS.attempts, []); store.set(LS.missed, {}); renderHistory(); } });
  }
  function trendHTML(attempts) {
    const pts = attempts.filter(a => !a.isMissedReview).slice(-20);
    if (pts.length < 2) return '';
    const w = 600, h = 140, p = 24;
    const x = i => p + i * (w - 2 * p) / (pts.length - 1), y = v => h - p - (v / 100) * (h - 2 * p);
    return `<div class="card"><h3 style="margin-top:0">Tren skor (${pts.length} ujian terakhir)</h3>
      <svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block">
        <line x1="${p}" y1="${y(PASS_PCT)}" x2="${w - p}" y2="${y(PASS_PCT)}" stroke="#1f8f4e" stroke-dasharray="4 4"/>
        <text x="${w - p}" y="${y(PASS_PCT) - 4}" font-size="10" text-anchor="end" fill="#1f8f4e">ambang ${PASS_PCT}%</text>
        <polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${pts.map((a, i) => `${x(i)},${y(a.pct)}`).join(' ')}"/>
        ${pts.map((a, i) => `<circle cx="${x(i)}" cy="${y(a.pct)}" r="3.5" fill="${a.passed ? '#1f8f4e' : '#c62828'}"><title>${a.pct}% — ${fmtDate(a.ts)}</title></circle>`).join('')}
      </svg></div>`;
  }

  // ---------- MISSED ----------
  function renderMissed() {
    const missed = getMissed();
    const rows = Object.entries(missed).filter(([id, m]) => byId[id] && m.wrong > 0).sort((a, b) => b[1].pending - a[1].pending || b[1].wrong - a[1].wrong);
    const pending = rows.filter(([, m]) => m.pending > 0);
    $app.innerHTML = `<div class="card">
      <h2>Soal yang pernah salah</h2>
      <p class="muted small">Semua soal yang pernah kamu jawab salah. Soal keluar dari daftar <b>pending</b> setelah kamu menjawabnya benar lagi (di ujian atau review mana pun). Jumlah salah/benar adalah total sepanjang waktu.</p>
      <div class="row">
        <button class="btn" id="btn-retry" ${pending.length ? '' : 'disabled'}>Ulangi ${pending.length} pending</button>
        <button class="btn secondary" id="btn-retry-all" ${rows.length ? '' : 'disabled'}>Ulangi semua ${rows.length} yang pernah salah</button>
      </div>
    </div>
    ${rows.length ? `<div class="card"><table class="tbl"><thead><tr><th>Status</th><th>Task</th><th>Soal</th><th>Salah</th><th>Benar</th><th></th></tr></thead><tbody>
      ${rows.map(([id, m]) => { const q = byId[id]; return `<tr><td>${m.pending ? '<span class="tag" style="background:var(--bad-bg)">pending</span>' : '<span class="tag" style="background:var(--ok-bg)">beres</span>'}</td><td class="small">${esc(q.task)}</td><td>${fmt(q.q.length > 140 ? q.q.slice(0, 140) + '…' : q.q)}</td><td>${m.wrong}</td><td>${m.right}</td><td><button class="btn ghost sm" data-show="${id}">Jawaban</button></td></tr><tr class="hidden" id="ans-${id}"><td colspan="6">${explanationHTML(q, q.type === 'matching' ? q.answer.slice() : q.answer)}</td></tr>`; }).join('')}
    </tbody></table></div>` : '<div class="card muted">Belum ada yang salah — kerjakan ujian dulu.</div>'}`;
    document.getElementById('btn-retry').addEventListener('click', () => startExam({ questions: shuffle(pending.map(([id]) => byId[id])), minutes: 0, mode: 'practice', label: 'Ulang soal salah', isMissedReview: true }));
    document.getElementById('btn-retry-all').addEventListener('click', () => startExam({ questions: shuffle(rows.map(([id]) => byId[id])), minutes: 0, mode: 'practice', label: 'Ulang semua yang pernah salah', isMissedReview: true }));
    document.querySelectorAll('button[data-show]').forEach(b => b.addEventListener('click', () => document.getElementById('ans-' + b.dataset.show).classList.toggle('hidden')));
  }

  // ---------- BROWSE ----------
  function renderBrowse() {
    $app.innerHTML = `<div class="card">
      <h2>Bank soal</h2>
      <div class="filterbar">
        <input type="search" id="q-search" placeholder="Cari teks soal, opsi, pembahasan…">
        <select id="q-domain"><option value="">Semua domain</option>${Object.keys(DOMAINS).map(d => `<option value="${d}">${esc(DOMAINS[d])}</option>`).join('')}</select>
        <select id="q-task"><option value="">Semua task</option>${Object.keys(TASKS).map(t => `<option value="${t}">${t} · ${esc(TASKS[t])}</option>`).join('')}</select>
        <select id="q-type"><option value="">Semua tipe</option>${Object.keys(TYPE_LABEL).map(t => `<option value="${t}">${TYPE_LABEL[t]}</option>`).join('')}</select>
        <select id="q-source"><option value="">Semua sumber</option>${Object.keys(SOURCES).map(s => `<option value="${s}">${esc(SOURCES[s].label)}</option>`).join('')}</select>
        <label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="q-new"> Hanya topik baru v1.1</label>
        <label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="q-reveal"> Tampilkan jawaban</label>
      </div>
      <div id="q-list"></div>
    </div>`;
    const render = () => {
      const s = document.getElementById('q-search').value.trim().toLowerCase();
      const d = document.getElementById('q-domain').value;
      const t = document.getElementById('q-task').value;
      const ty = document.getElementById('q-type').value;
      const src = document.getElementById('q-source').value;
      const onlyNew = document.getElementById('q-new').checked;
      const reveal = document.getElementById('q-reveal').checked;
      const list = BANK.filter(q => (!d || q.domain === d) && (!t || q.task === t) && (!ty || q.type === ty) && (!src || q.source === src) && (!onlyNew || q.v11)
        && (!s || (q.q + ' ' + q.options.join(' ') + ' ' + (q.prompts || []).join(' ') + ' ' + q.explanation).toLowerCase().includes(s)));
      document.getElementById('q-list').innerHTML = `<div class="small muted" style="margin-bottom:8px">${list.length} soal</div>` + list.slice(0, 200).map(q => `<div class="review-item">
        <div class="qmeta"><span class="muted">${esc(q.id)}</span><span class="tag">${esc(DOMAINS[q.domain] || q.domain)}</span><span class="tag">Task ${esc(q.task)}</span>${typeTag(q)}${q.v11 ? '<span class="tag new">baru v1.1</span>' : ''}${srcTag(q)}</div>
        <div class="qtext" style="font-size:15px">${fmt(q.q)}</div>
        ${reveal ? answerReadonlyHTML(q, q.type === 'single' || q.type === 'multiple' ? seededOrder(q) : null, q.answer, q.type === 'ordering' || q.type === 'matching') : answerReadonlyHTML(q, q.type === 'single' || q.type === 'multiple' ? seededOrder(q) : null, null, false)}
        ${reveal ? explanationHTML(q, q.answer) : ''}
      </div>`).join('') + (list.length > 200 ? '<p class="muted small">Menampilkan 200 pertama — persempit pencarian.</p>' : '');
    };
    ['q-search', 'q-domain', 'q-task', 'q-type', 'q-source', 'q-new', 'q-reveal'].forEach(id => document.getElementById(id).addEventListener('input', render));
    render();
  }

  // ---------- keyboard ----------
  document.addEventListener('keydown', e => {
    if (view !== 'exam' || !exam || exam.finished || document.querySelector('.modal-backdrop')) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && document.activeElement.type !== 'radio' && document.activeElement.type !== 'checkbox') return;
    const it = exam.items[exam.idx]; const q = byId[it.id];
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (exam.idx > 0) { exam.idx--; renderExam(); } }
    else if (e.key.toLowerCase() === 'f') { it.flagged = !it.flagged; renderExam(); }
    else if (e.key.toLowerCase() === 'h' && exam.mode === 'practice' && q.hint) { it.hint = true; renderExam(); }
    else if (e.key === 'Enter' && exam.mode === 'practice') { e.preventDefault(); it.checked ? next() : checkCurrent(); }
    else if (/^[1-6]$/.test(e.key) && q.type !== 'matching') {
      if (exam.mode === 'practice' && it.checked) return;
      const pos = +e.key - 1; if (pos >= it.order.length) return;
      toggleOption(q, it, it.order[pos]);
      renderExam();
    }
  });

  // ---------- bank sanity check ----------
  (function validate() {
    const ids = new Set(); const problems = [];
    BANK.forEach(q => {
      if (ids.has(q.id)) problems.push(`duplicate id ${q.id}`); ids.add(q.id);
      if (!DOMAINS[q.domain]) problems.push(`${q.id}: unknown domain ${q.domain}`);
      if (!TASKS[q.task]) problems.push(`${q.id}: unknown task ${q.task}`);
      if (!TYPE_LABEL[q.type]) problems.push(`${q.id}: unknown type ${q.type}`);
      if (!Array.isArray(q.options) || q.options.length < 2) problems.push(`${q.id}: options`);
      if (!Array.isArray(q.answer) || !q.answer.length || q.answer.some(a => a < 0 || a >= q.options.length)) problems.push(`${q.id}: answer index`);
      if (q.type === 'matching' && (!q.prompts || q.prompts.length !== q.answer.length)) problems.push(`${q.id}: prompts/answer length`);
      if (q.type === 'ordering' && q.answer.length !== q.options.length) problems.push(`${q.id}: ordering answer length`);
      if (!q.explanation) problems.push(`${q.id}: missing explanation`);
    });
    if (problems.length) console.warn('Question bank problems:', problems);
    document.getElementById('bank-stats').textContent = `Bank: ${BANK.length} soal · ${Object.keys(DOMAINS).length} domain · progres disimpan di browser ini saja (localStorage)`;
  })();

  go('home');
})();
