"""Convert downloaded AWS exam guide pages to plain text: python tools/h2t.py tools/sources/aws-exam-guide/*.html"""
import re,html,sys,pathlib
for f in sys.argv[1:]:
    t=pathlib.Path(f).read_text(encoding='utf-8')
    m=re.search(r'<div id="main-col-body">(.*?)<div class="prev-next"|<awsdocs-copyright',t,re.S)
    b=m.group(1) if m and m.group(1) else t
    b=re.sub(r'<(script|style)[^>]*>.*?</\1>','',b,flags=re.S)
    b=re.sub(r'<li[^>]*>','\n- ',b); b=re.sub(r'<(p|h\d|tr|br|div)[^>]*>','\n',b)
    b=html.unescape(re.sub(r'<[^>]+>','',b)); b=re.sub(r'\n\s*\n+','\n',b)
    pathlib.Path(f[:-5]+'.txt').write_text(b.strip(),encoding='utf-8')
