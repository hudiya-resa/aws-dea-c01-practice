"""Normalize the downloaded open question banks into js/questions/*.js.

Sources (re-download with fetch_sources.sh):
  tools/sources/ibrahim/*.md            - itsIbrahimKhalil/aws-dea-c01-study-guide (CC BY 4.0), guide v1.1, checked Sep 2026
  tools/sources/savemycert/*.md         - savemycert/dea-c01-study-guide (CC BY 4.0)
  tools/sources/bhushan/questions.json  - erBhushanPawar/aws-dea-c01 (MIT)

Run:  python -I tools/build_bank.py   (from the project root)
"""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "sources"
OUT = ROOT / "js" / "questions"

IB_URL = "https://github.com/itsIbrahimKhalil/aws-dea-c01-study-guide"
SMC_URL = "https://github.com/savemycert/dea-c01-study-guide"
BP_URL = "https://github.com/erBhushanPawar/aws-dea-c01"

# Names that changed or left the in-scope list; questions that use them get a scope note.
STALE = [
    (re.compile(r"Kinesis Data Analytics", re.I), "Kinesis Data Analytics sekarang bernama Amazon Managed Service for Apache Flink. Di ujian bisa muncul nama mana pun."),
    (re.compile(r"Kinesis Data Firehose", re.I), "Kinesis Data Firehose sudah berganti nama jadi Amazon Data Firehose (guide masih memakai nama lama). Layanannya sama."),
    (re.compile(r"DataZone", re.I), "Amazon DataZone kini menjadi fondasi Amazon SageMaker Catalog di SageMaker Unified Studio; guide v1.1 memakai nama SageMaker Catalog."),
    (re.compile(r"CodeCommit|Cloud9", re.I), "AWS CodeCommit dan Cloud9 dikeluarkan dari daftar in-scope di guide v1.1 (Des 2025). Konsep version control tetap diuji, nama layanannya tidak."),
    (re.compile(r"Schema Conversion Tool|\bAWS SCT\b", re.I), "AWS SCT dikeluarkan dari daftar layanan in-scope v1.1; skill 2.4.3 sekarang menonjolkan DMS Schema Conversion."),
    (re.compile(r"AWS Data Pipeline\b", re.I), "AWS Data Pipeline sudah maintenance mode dan tidak ada di daftar in-scope. Pilihan modern: Step Functions, MWAA, Glue workflows."),
    (re.compile(r"Timestream", re.I), "Amazon Timestream tidak ada di daftar in-scope v1.1. Fokus ke pola arsitekturnya saja."),
]

# Skills added in guide v1.1 (Dec 2025). Used to tag questions from banks that do not mark them.
V11 = re.compile(r"iceberg|s3 tables|table bucket|hnsw|\bivf\b|vector|embedding|knowledge base|bedrock|\bllm|large language|sagemaker catalog|unified studio|domain units?|data mesh|datazone", re.I)

DOMAIN_NAMES = {
    "data ingestion and transformation": "d1",
    "data store management": "d2",
    "data operations and support": "d3",
    "data security and governance": "d4",
}

# Keyword hints used to place a question under a task when the source only gives the domain.
TASK_HINTS = {
    "1.1": r"kinesis data stream|\bmsk\b|kafka|\bdms\b|appflow|firehose|ingest|event notification|rate limit|throttl|replay|fan-out|fan-in|shard|transfer family|datasync|batch source|allowlist",
    "1.2": r"glue (etl|job|spark|streaming)|\bemr\b|spark|parquet|\borc\b|convert|transform|\becs\b|\beks\b|jdbc|odbc|\bdpu|join|bedrock|\bllm|large language|api gateway",
    "1.3": r"step functions|\bmwaa\b|airflow|glue workflow|orchestrat|\bsns\b|\bsqs\b|retry|dag\b|fault toleran|serverless workflow",
    "1.4": r"concurrency|cloudformation|\bcdk\b|\bsam\b|ci/cd|codepipeline|codebuild|\bgit\b|version control|\befs\b|infrastructure as code|unit test|ephemeral storage",
    "2.1": r"spectrum|federated|materialized view|dynamodb|\brds\b|aurora|memorydb|iceberg|s3 tables|table bucket|hnsw|\bivf\b|vector index|lock|data store|documentdb|neptune|keyspaces|opensearch",
    "2.2": r"crawler|data catalog|partition projection|msck|add partition|hive metastore|sagemaker catalog|business catalog|glue connection|catalog",
    "2.3": r"lifecycle|glacier|\bttl\b|versioning|unload|\bcopy\b|expire|delete|backup|replicat|intelligent-tiering|storage class|retention",
    "2.4": r"schema evolution|schema change|dist(ribution)? ?key|distkey|sort ?key|partition key|compression|lineage|schema conversion|\bsct\b|embedding|knowledge base|vectori|data model|star schema|denormal",
    "3.1": r"athena|databrew|sdk|boto3|eventbridge|lambda function|automat|emr serverless|glue job",
    "3.2": r"quicksight|amazon quick\b|visuali|dashboard|view\b|window function|rolling average|pivot|group by|notebook|provisioned|serverless",
    "3.3": r"cloudwatch|\blogs?\b|troubleshoot|alarm|metric|iteratorage|performance|slow|failed|failure|spark ui|monitor",
    "3.4": r"data quality|dqdl|null|empty|duplicate|dedup|sampl|skew|consisten|validat|anomal",
    "4.1": r"security group|vpc endpoint|privatelink|secrets manager|rotat|iam role|assume|authenticat|unified studio|federation|sso|identity center",
    "4.2": r"lake formation|iam policy|least privilege|tag-based|lf-tag|attribute-based|abac|grant|parameter store|row-level|column-level|permission",
    "4.3": r"\bkms\b|encrypt|mask|anonymi|\btls\b|\bssl\b|tokeni|hash|cmk|customer managed key",
    "4.4": r"cloudtrail|cloudtrail lake|logs insights|audit|access log",
    "4.5": r"macie|\bpii\b|sensitive|region|sovereign|aws config|data shar|datashare|\bscp\b|organization|gdpr|hipaa|data mesh|governance",
}
TASK_RX = {t: re.compile(rx, re.I) for t, rx in TASK_HINTS.items()}


def guess_task(domain, text):
    n = domain[1]
    scores = {t: len(rx.findall(text)) for t, rx in TASK_RX.items() if t.startswith(n + ".")}
    best = max(scores, key=lambda t: (scores[t], -int(t.split(".")[1])))
    return best if scores[best] else f"{n}.1"


def scope_note(text):
    for rx, note in STALE:
        if rx.search(text):
            return note
    return None


# Explanations that mention option letters would point at the wrong option once options are shuffled.
LETTER_REF = re.compile(r"\b(?:options?|answers?|choices?|unlike|than|like) \(?[A-Ea-e]\)?\b|\b[A-E] (?:and|or|nor) [A-E]\b|\([A-E]\)")


def finish(item, text):
    note = scope_note(text)
    if note:
        item["scopeNote"] = note
    if "v11" not in item and V11.search(text):
        item["v11"] = True
    blob = " ".join([item["explanation"]] + item.get("optExpl", []))
    if LETTER_REF.search(blob):
        item["fixedOrder"] = True
    return {k: v for k, v in item.items() if v not in (None, "", [], False)}


def strip_md_bold(s):
    return re.sub(r"\*\*(.+?)\*\*", r"\1", s).strip()


# ---------- itsIbrahimKhalil: "### Question N" blocks with <details> answers ----------
def ib_questions():
    out = []
    files = {"practice-exam-01": "pe1", "practice-exam-02": "pe2", "v1.1-new-topics-drill": "v11"}
    for fname, tag in files.items():
        md = (SRC / "ibrahim" / f"{fname}.md").read_text(encoding="utf-8")
        md = md.split("\n## Answer key")[0]
        parts = re.split(r"^### Question (\d+)\s*$", md, flags=re.M)
        for num, block in zip(parts[1::2], parts[2::2]):
            block = block.split("\n---")[0]
            head, _, ans = block.partition("<details>")
            opts = re.findall(r"^- \*\*([A-F])\.\*\* (.+)$", head, flags=re.M)
            stem = head.split("\n- **A.**")[0].strip()
            keys = [k for k, _ in opts]
            answer = re.search(r"\*\*Answer: ([A-F](?:, [A-F])*)\*\*", ans).group(1).split(", ")
            why = re.search(r"\*\*Why [A-F, and]+:\*\*\s*(.+?)(?:\n\n|\n\*\*Why not)", ans, re.S)
            why_not = dict(re.findall(r"^- \*\*([A-F])\*\* [—-] (.+)$", ans, flags=re.M))
            skill = re.search(r"\*\*Skill:\*\* (\d)\.(\d+)\.(\d+)", ans)
            signals = re.search(r"\*\*Signal words:\*\* (.+?) ·", ans)
            review = re.search(r"\*\*Review:\*\* \[(.+?)\]\(\.\./(.+?)\)", ans)
            expl = why.group(1).strip() if why else ""
            item = {
                "id": f"ib-{tag}-{int(num):02d}",
                "domain": f"d{skill.group(1)}",
                "task": f"{skill.group(1)}.{skill.group(2)}",
                "skill": ".".join(skill.groups()),
                "type": "multiple" if len(answer) > 1 else "single",
                "q": stem,
                "options": [strip_md_bold(t) for _, t in opts],
                "answer": [keys.index(a) for a in answer],
                "optExpl": [why_not.get(k, expl if k in answer else "") for k in keys],
                "explanation": expl,
                "hint": "Kata kunci di soal: " + signals.group(1).replace("*", "") if signals else None,
                "refs": [{"title": review.group(1), "url": f"{IB_URL}/blob/main/{review.group(2)}"}] if review else [],
                "source": "ibrahim",
                "sourceUrl": f"{IB_URL}/blob/main/practice-exams/{fname}.md",
                "v11": tag == "v11" or None,
            }
            # the right answer's optExpl duplicates the explanation; keep it short in the per-option list
            for a in answer:
                item["optExpl"][keys.index(a)] = "Jawaban benar. " + (why_not.get(a) or "Lihat pembahasan di atas.")
            out.append(finish(item, block))
    return out


# ---------- savemycert: "## Question N" blocks ----------
def smc_questions():
    md = (SRC / "savemycert" / "sample-questions.md").read_text(encoding="utf-8")
    parts = re.split(r"^## Question (\d+)\s*$", md, flags=re.M)
    out = []
    for num, block in zip(parts[1::2], parts[2::2]):
        dom = DOMAIN_NAMES[re.search(r"^\*(.+?)\*\s*$", block, flags=re.M).group(1).strip().lower()]
        stem = re.search(r"^\*\*(.+?)\*\*\s*Choose (\w+)\.", block, flags=re.M | re.S)
        opts = re.findall(r"^- \*\*([a-f])\.\*\* (.+)$", block, flags=re.M)
        keys = [k for k, _ in opts]
        answer = re.search(r"\*\*Answer: ([a-f](?:, [a-f])*)\*\*", block).group(1).split(", ")
        oexp = dict(re.findall(r"^- \*\*([a-f])\*\* [✅❌] (.+)$", block, flags=re.M))
        concept = re.search(r"\*\*The concept\.\*\* (.+)", block)
        why = re.search(r"\*\*Why this is correct\.\*\* (.+)", block)
        steps = re.findall(r"^\d+\. (.+)$", block.split("How to reason it out")[-1].split("> **Exam tip")[0], flags=re.M)
        tip = re.search(r"> \*\*Exam tip:\*\* (.+)", block)
        learn = re.search(r"📖 Learn this topic: \[(.+?)\]\((.+?)\)", block)
        expl = why.group(1).strip() if why else ""
        if steps:
            expl += "\n\nCara menalar: " + " → ".join(s.strip() for s in steps)
        text = stem.group(1) + " " + " ".join(t for _, t in opts) + " " + expl
        item = {
            "id": f"smc-{int(num):02d}",
            "domain": dom,
            "task": guess_task(dom, text),
            "taskGuessed": True,
            "type": "multiple" if len(answer) > 1 else "single",
            "q": stem.group(1).strip(),
            "options": [t.strip() for _, t in opts],
            "answer": [keys.index(a) for a in answer],
            "optExpl": [oexp.get(k, "") for k in keys],
            "explanation": expl,
            "keyConcept": concept.group(1).strip() if concept else None,
            "tip": tip.group(1).strip() if tip else None,
            "refs": [{"title": learn.group(1), "url": learn.group(2).split("?")[0]}] if learn else [],
            "source": "savemycert",
            "sourceUrl": f"{SMC_URL}/blob/main/sample-questions.md",
        }
        out.append(finish(item, text))
    return out


# ---------- erBhushanPawar: questions.json ----------
def bp_questions():
    data = json.loads((SRC / "bhushan" / "questions.json").read_text(encoding="utf-8"))
    out = []
    for q in data:
        dom = f"d{q['domain']}"
        exps = [re.sub(r"^[A-E]\s*[—–:\-]\s*(Correct|Incorrect)\.\s*", "", e).strip() for e in q["explanations"]]
        text = q["question"] + " " + " ".join(q["options"]) + " " + q.get("topic", "")
        ans = q["answer"]
        item = {
            "id": f"bp-{q['id']:03d}",
            "domain": dom,
            "task": guess_task(dom, text),
            "taskGuessed": True,
            "type": "single",
            "q": q["question"],
            "options": q["options"],
            "answer": [ans],
            "optExpl": exps,
            "explanation": exps[ans],
            "keyConcept": q.get("topic"),
            "difficulty": q.get("difficulty"),
            "source": "bhushan",
            "sourceUrl": BP_URL,
        }
        out.append(finish(item, text))
    return out


def dedupe(*banks):
    seen, out, dropped = set(), [], 0
    for bank in banks:
        for q in bank:
            key = re.sub(r"[^a-z0-9]", "", q["q"].lower())[:160]
            if key in seen:
                dropped += 1
                continue
            seen.add(key)
            out.append(q)
    return out, dropped


def validate(q):
    assert q["options"] and q["answer"], q["id"]
    assert all(0 <= a < len(q["options"]) for a in q["answer"]), q["id"]
    assert len(q.get("optExpl", q["options"])) == len(q["options"]), q["id"]
    assert q["explanation"], q["id"]


def write(name, header, qs):
    body = json.dumps(qs, ensure_ascii=False, indent=0)
    (OUT / name).write_text(f"// {header}\n// Generated by tools/build_bank.py, do not edit by hand.\nwindow.addQuestions({body});\n", encoding="utf-8")


if __name__ == "__main__":
    ib, smc, bp = ib_questions(), smc_questions(), bp_questions()
    allq, dropped = dedupe(ib, smc, bp)
    for q in allq:
        validate(q)
    by = lambda s: [q for q in allq if q["source"] == s]
    write("ibrahim.js", f"itsIbrahimKhalil DEA-C01 practice exams ({IB_URL}), CC BY 4.0, exam guide v1.1", by("ibrahim"))
    write("savemycert.js", f"SaveMyCert DEA-C01 sample questions ({SMC_URL}), CC BY 4.0", by("savemycert"))
    write("bhushan.js", f"erBhushanPawar DEA-C01 practice exam ({BP_URL}), MIT", by("bhushan"))
    print("ibrahim", len(by("ibrahim")), "savemycert", len(by("savemycert")), "bhushan", len(by("bhushan")), "duplicates dropped", dropped)
    print(sorted(Counter(q["domain"] for q in allq).items()), Counter(q["type"] for q in allq))
    print(sorted(Counter(q["task"] for q in allq).items()))
    print("v11", sum(1 for q in allq if q.get("v11")), "scope notes", sum(1 for q in allq if q.get("scopeNote")),
          "fixedOrder", sum(1 for q in allq if q.get("fixedOrder")))
    print("answer position (bhushan)", Counter(q["answer"][0] for q in by("bhushan")))


# ---------- official exam guide -> js/guide.js (skill list per task, v1.1 additions flagged) ----------
def build_guide():
    g = SRC / "aws-exam-guide"
    new = set(re.findall(r"Skill (\d+\.\d+\.\d+): ", (g / "dea-01-revisions.txt").read_text(encoding="utf-8").split("New skills added")[-1].split("Skills removed")[0]))
    changed = set(re.findall(r"Skill (\d+\.\d+\.\d+): ", (g / "dea-01-revisions.txt").read_text(encoding="utf-8").split("Changes to knowledge and skills")[-1].split("New skills added")[0]))
    tasks = {}
    for i in range(1, 5):
        txt = (g / f"data-engineer-associate-01-domain{i}.txt").read_text(encoding="utf-8")
        for t, title in re.findall(r"^Task (\d\.\d): (.+)$", txt, flags=re.M):
            tasks.setdefault(t, {"title": title.strip(), "skills": []})
        for sid, text in re.findall(r"^Skill (\d\.\d\.\d+): (.+)$", txt, flags=re.M):
            t = sid.rsplit(".", 1)[0]
            tasks[t]["skills"].append({"id": sid, "text": text.strip(), "new": sid in new, "changed": sid in changed})
    (ROOT / "js" / "guide.js").write_text(
        "// Official DEA-C01 exam guide v1.1 (12 Dec 2025) skills, generated by tools/build_bank.py from tools/sources/aws-exam-guide.\n"
        f"window.GUIDE = {json.dumps({'tasks': tasks}, ensure_ascii=False, indent=1)};\n", encoding="utf-8")
    print("guide tasks", len(tasks), "skills", sum(len(v["skills"]) for v in tasks.values()), "new", len(new), "changed", len(changed))


build_guide()
