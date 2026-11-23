"""Bangun ringkasan.html dari tools/sources/skillbuilder/domain{1..4}_ringkasan.md.

Ringkasan ditulis dari transkrip video "Domain N Review" AWS Skill Builder. Transkripnya sendiri tidak ikut di
repo (materi AWS). Format markdown yang dibaca:
  # Domain N: nama        baris berikutnya = deskripsi
  ## Lesson ...            ### subtopik      - butir
  ### Pola soal            - kata kunci => jawaban
  ## Angka dan batas penting / ## Jebakan ujian / ## Sumber tambahan

    python -I tools/build_ringkasan.py
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "sources" / "skillbuilder"
OUT = ROOT / "ringkasan.html"
SPECIAL = {"Angka dan batas penting": "angka", "Jebakan ujian": "jebakan", "Sumber tambahan": "sumber",
           "Key numbers and limits": "angka", "Exam traps": "jebakan", "Additional resources": "sumber"}
POLA = ("pola soal", "question patterns")
NOTE = ("Catatan:", "Note:")

LANG = {
    "id": dict(
        src="domain{i}_ringkasan.md", out="ringkasan.html", other="summary.html", other_label="English",
        html_lang="id", title="Ringkasan Domain DEA-C01", brand="Ringkasan Domain Review (Skill Builder)",
        back="Kembali ke latihan", all="Semua", search="Cari (mis. Kinesis, KMS, partition)",
        only="Pola soal, angka, dan jebakan saja", collapse="Tutup semua lesson",
        th_q="Kalau soal menyebut", th_a="Pilih",
        labels={"angka": "Angka dan batas penting", "jebakan": "Jebakan ujian", "sumber": "Sumber tambahan"},
        intro='Diringkas dari transkrip video dan teks kursus "Domain 1-4 Review: AWS Certified Data Engineer - '
              'Associate (DEA-C01)" di AWS Skill Builder, diambil {tanggal}.',
        footer="Ringkasan pribadi untuk belajar, bukan materi resmi AWS. Kalau ada yang bertentangan, dokumentasi "
               "AWS dan exam guide yang menang."),
    "en": dict(
        src="domain{i}_summary_en.md", out="summary.html", other="ringkasan.html", other_label="Bahasa Indonesia",
        html_lang="en", title="DEA-C01 Domain Summary", brand="Domain Review Summary (Skill Builder)",
        back="Back to practice", all="All", search="Search (e.g. Kinesis, KMS, partition)",
        only="Question patterns, numbers and traps only", collapse="Collapse all lessons",
        th_q="If the question mentions", th_a="Pick",
        labels={"angka": "Key numbers and limits", "jebakan": "Exam traps", "sumber": "Additional resources"},
        intro='Summarized from the video transcripts and course text of "Domain 1-4 Review: AWS Certified Data '
              'Engineer - Associate (DEA-C01)" on AWS Skill Builder, fetched {tanggal}.',
        footer="Personal study notes, not official AWS material. If anything conflicts, the AWS documentation and "
               "exam guide win."),
}


def inline(s: str) -> str:
    s = html.escape(s.strip())
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\((https?://[^\s)]+)\)", r'(<a href="\1" target="_blank" rel="noopener">link</a>)', s)
    s = re.sub(r"(?<![\"=>])(https?://[^\s<)]+)", r'<a href="\1" target="_blank" rel="noopener">\1</a>', s)
    return s


def parse(md: str) -> dict:
    dom = {"title": "", "desc": "", "lessons": [], "special": {}}
    lesson = sub = None
    for raw in md.splitlines():
        line = raw.rstrip()
        if not line.strip():
            continue
        if line.startswith("# "):
            dom["title"] = line[2:].strip()
        elif line.startswith("## "):
            name = line[3:].strip()
            sub = None
            if name in SPECIAL:
                lesson = None
                dom["special"][SPECIAL[name]] = []
                cur_special = dom["special"][SPECIAL[name]]
            else:
                cur_special = None
                lesson = {"title": name, "subs": []}
                dom["lessons"].append(lesson)
        elif line.startswith("### ") and lesson is not None:
            sub = {"title": line[4:].strip(), "items": []}
            lesson["subs"].append(sub)
        elif re.match(r"^\s*[-*] ", line):
            text = re.sub(r"^\s*[-*] ", "", line)
            if lesson is None and dom["special"] and cur_special is not None:
                cur_special.append(text)
            elif sub is not None:
                sub["items"].append(text)
            elif lesson is not None:
                sub = {"title": "", "items": [text]}
                lesson["subs"].append(sub)
        elif not dom["lessons"] and not dom["special"] and dom["title"] and not dom["desc"]:
            dom["desc"] = line.strip()
        elif sub is not None and sub["items"]:
            sub["items"][-1] += " " + line.strip()
    return dom


def render_pola(items, L) -> str:
    rows = []
    for it in items:
        if "=>" in it:
            q, a = it.split("=>", 1)
            rows.append(f"<tr><td>{inline(q)}</td><td>{inline(a)}</td></tr>")
        else:
            rows.append(f'<tr><td colspan="2">{inline(it)}</td></tr>')
    return (f'<table class="pola"><thead><tr><th>{L["th_q"]}</th><th>{L["th_a"]}</th></tr></thead><tbody>'
            + "".join(rows) + "</tbody></table>")


def render_domain(i: int, d: dict, L: dict) -> str:
    out = [f'<section class="domain" id="d{i}" data-dom="{i}">',
           f'<div class="card dom-head"><h2>{inline(d["title"])}</h2><p class="muted">{inline(d["desc"])}</p></div>']
    for li, les in enumerate(d["lessons"]):
        out.append(f'<details class="card lesson" open id="d{i}l{li}"><summary><h3>{inline(les["title"])}</h3></summary>')
        for s in les["subs"]:
            is_pola = s["title"].lower().startswith(POLA)
            out.append(f'<div class="sub{" is-pola" if is_pola else ""}">')
            if s["title"]:
                out.append(f'<h4>{inline(s["title"])}</h4>')
            if is_pola:
                out.append(render_pola(s["items"], L))
            else:
                out.append("<ul>" + "".join(
                    f'<li{" class=note" if it.startswith(NOTE) else ""}>{inline(it)}</li>' for it in s["items"]
                ) + "</ul>")
            out.append("</div>")
        out.append("</details>")
    labels = L["labels"]
    for key in ("angka", "jebakan", "sumber"):
        items = d["special"].get(key)
        if items:
            out.append(f'<div class="card special sp-{key}"><h3>{labels[key]}</h3><ul>'
                       + "".join(f"<li>{inline(x)}</li>" for x in items) + "</ul></div>")
    out.append("</section>")
    return "\n".join(out)


PAGE = """<!DOCTYPE html>
<html lang="{html_lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<link rel="stylesheet" href="css/style.css">
<style>
.tabs {{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }}
.tabs button {{ border:1px solid var(--border); background:#fff; padding:7px 12px; border-radius:8px; cursor:pointer; font-size:14px; color:var(--muted); }}
.tabs button.active {{ background:var(--accent); border-color:var(--accent); color:#fff; }}
.tools {{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:16px; }}
.tools input[type=search] {{ flex:1; min-width:200px; padding:8px 10px; border:1px solid var(--border); border-radius:8px; font-size:14px; }}
.tools label {{ font-size:14px; color:var(--muted); display:flex; gap:6px; align-items:center; cursor:pointer; }}
.dom-head h2 {{ margin-bottom:4px; }}
.lesson summary {{ cursor:pointer; list-style:none; }}
.lesson summary::-webkit-details-marker {{ display:none; }}
.lesson summary h3 {{ display:inline; margin:0; font-size:17px; }}
.lesson summary::before {{ content:"\\25B8"; color:var(--accent); margin-right:8px; display:inline-block; transition:transform .15s; }}
.lesson[open] summary::before {{ transform:rotate(90deg); }}
.sub h4 {{ margin:16px 0 6px; font-size:15px; color:var(--accent-dark); }}
.sub ul {{ margin:0; padding-left:20px; line-height:1.55; }}
.sub li {{ margin:3px 0; }}
li.note {{ list-style:none; margin-left:-20px; background:var(--warn-bg); padding:6px 10px; border-radius:6px; }}
.is-pola {{ background:var(--info-bg); border-radius:8px; padding:2px 12px 12px; margin-top:14px; }}
table.pola {{ width:100%; border-collapse:collapse; font-size:14px; }}
table.pola th {{ text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:.4px; color:var(--muted); padding:6px 8px; }}
table.pola td {{ border-top:1px solid #cfdcec; padding:7px 8px; vertical-align:top; line-height:1.45; }}
table.pola td:first-child {{ width:45%; }}
.special h3 {{ margin-top:0; }}
.special ul {{ padding-left:20px; line-height:1.55; }}
.sp-jebakan {{ border-left:4px solid var(--bad); }}
.sp-angka {{ border-left:4px solid var(--ok); }}
mark {{ background:#ffe58a; padding:0 1px; }}
.hide {{ display:none !important; }}
body.only-pola .sub:not(.is-pola), body.only-pola .special:not(.sp-jebakan):not(.sp-angka) {{ display:none; }}
@media (max-width:600px) {{ table.pola td:first-child {{ width:auto; }} table.pola, table.pola tbody, table.pola tr, table.pola td {{ display:block; }} table.pola thead {{ display:none; }} table.pola td:last-child {{ border-top:none; padding-top:0; font-weight:600; }} }}
@media print {{ .topbar, .tabs, .tools, .footer {{ display:none; }} .domain {{ display:block !important; }} details.lesson {{ break-inside:avoid-page; }} }}
</style>
</head>
<body>
<header class="topbar">
  <a class="brand" href="index.html" style="text-decoration:none;color:inherit"><span class="logo">DEA</span><span>{brand}</span></a>
  <nav class="topnav">
    <a class="navbtn" id="langlink" href="{other}" style="text-decoration:none;border-color:var(--border)">{other_label}</a>
    <a class="navbtn" href="index.html" style="text-decoration:none">{back}</a>
  </nav>
</header>
<main class="container">
  <p class="muted small">{intro}</p>
  <div class="tabs" id="tabs">{tabs}<button data-tab="all">{all}</button></div>
  <div class="tools">
    <input type="search" id="q" placeholder="{search}">
    <label><input type="checkbox" id="onlyPola"> {only}</label>
    <label><input type="checkbox" id="collapse"> {collapse}</label>
  </div>
  {domains}
</main>
<footer class="footer"><span>{footer}</span></footer>
<script>
const KEY = 'dea-ringkasan-tab';
const tabs = document.querySelectorAll('#tabs button');
const doms = document.querySelectorAll('.domain');
function show(t) {{
  tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  doms.forEach(d => d.classList.toggle('hide', t !== 'all' && d.dataset.dom !== t));
  try {{ localStorage.setItem(KEY, t); }} catch (e) {{}}
}}
tabs.forEach(b => b.addEventListener('click', () => show(b.dataset.tab)));
let start = '1';
try {{ start = localStorage.getItem(KEY) || '1'; }} catch (e) {{}}
show(start);
document.getElementById('onlyPola').addEventListener('change', e => document.body.classList.toggle('only-pola', e.target.checked));
document.getElementById('collapse').addEventListener('change', e => document.querySelectorAll('details.lesson').forEach(d => d.open = !e.target.checked));
const orig = new Map();
document.querySelectorAll('li, td').forEach(el => orig.set(el, el.innerHTML));
document.getElementById('q').addEventListener('input', e => {{
  const q = e.target.value.trim().toLowerCase();
  if (q) show('all');
  const re = q ? new RegExp('(' + q.replace(/[.*+?^${{}}()|[\\]\\\\]/g, '\\\\$&') + ')', 'gi') : null;
  orig.forEach((h, el) => {{ el.innerHTML = re ? h.replace(/>([^<]+)</g, (m, t) => '>' + t.replace(re, '<mark>$1</mark>') + '<') : h; }});
  document.querySelectorAll('li, table.pola tr').forEach(el => {{
    if (el.closest('thead')) return;
    el.classList.toggle('hide', !!q && !el.textContent.toLowerCase().includes(q));
  }});
  document.querySelectorAll('.sub, .special').forEach(s => s.classList.toggle('hide', !!q && !s.querySelector('li:not(.hide), tbody tr:not(.hide)')));
  document.querySelectorAll('details.lesson').forEach(d => {{
    const any = d.querySelector('.sub:not(.hide)');
    d.classList.toggle('hide', !!q && !any);
    if (q && any) d.open = true;
  }});
}});
</script>
</body>
</html>
"""


def build(lang: str, tanggal: str):
    L = LANG[lang]
    domains, tabs = [], []
    for i in range(1, 5):
        f = SRC / L["src"].format(i=i)
        if not f.exists():
            print("tidak ada:", f)
            continue
        d = parse(f.read_text(encoding="utf-8"))
        domains.append(render_domain(i, d, L))
        short = d["title"].split(":", 1)[-1].strip() or f"Domain {i}"
        tabs.append(f'<button data-tab="{i}">D{i}: {html.escape(short)}</button>')
        n_pola = sum(len(s["items"]) for l in d["lessons"] for s in l["subs"] if s["title"].lower().startswith(POLA))
        print(f"[{lang}] domain{i}: {len(d['lessons'])} lesson, {n_pola} pola soal, "
              + ", ".join(f"{k} {len(v)}" for k, v in d["special"].items()))
    if not domains:
        return
    out = ROOT / L["out"]
    fields = {k: v for k, v in L.items() if isinstance(v, str)}
    fields["intro"] = L["intro"].format(tanggal=tanggal)
    out.write_text(PAGE.format(tabs="".join(tabs), domains="\n".join(domains), **fields), encoding="utf-8")
    print("->", out)


def main():
    import datetime
    mtime = max(f.stat().st_mtime for f in SRC.glob("domain?_ringkasan.md"))
    tanggal = datetime.date.fromtimestamp(mtime).strftime("%d-%m-%Y")
    for lang in LANG:
        build(lang, tanggal)


if __name__ == "__main__":
    main()
