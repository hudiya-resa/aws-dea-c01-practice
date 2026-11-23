# AWS Certified Data Engineer - Associate (DEA-C01) practice

A static practice site for the DEA-C01 exam. It runs in the browser with no build step and no dependencies, and saves
progress in `localStorage`. The interface and the study notes are in Indonesian; the questions and the domain summary
are in English. Indonesian readme: [README.id.md](README.id.md).

The real exam has 65 questions (50 scored, 15 unscored), 130 minutes, a scaled score from 100 to 1,000, and a pass mark
of 720. Questions are multiple choice or multiple response. Content follows exam guide v1.1 (published 12 December
2025). Check the
[revisions page](https://docs.aws.amazon.com/aws-certification/latest/data-engineer-associate-01/dea-01-revisions.html)
for anything newer.

## Run it

Open the GitHub Pages site, or serve the folder locally:

```bash
python -m http.server 8767
```

then open <http://localhost:8767>. On Windows, `start.bat` does the same.

## What is in it

- Timed mock exam: 65 questions in 130 minutes by default, drawn to match the official domain weights (34, 26, 22 and
  18 percent). Options are shuffled unless an explanation refers to an option letter.
- Practice mode with an explanation after each question and a hint button.
- After a wrong answer: the correct option, why your choice was wrong, the full explanation, key concept, exam tip, and
  notes on every option.
- Study notes (Materi): exam facts, what changed in v1.1, the 17 tasks and 120 skills from the guide, a four-week plan,
  and free official resources.
- Missed questions, history, and a searchable question bank filtered by domain, task, source, or new v1.1 topics.
- Domain summary (`summary.html`, Indonesian version in `ringkasan.html`): key points, "if the question mentions X,
  pick Y" tables, numbers, and exam traps for each lesson of the four AWS Skill Builder "Domain Review" courses. These
  are personal notes written from the course videos. The course transcripts are not included.

## Question bank (420 questions)

| Domain | Weight | Questions |
|---|---|---|
| D1 Data Ingestion and Transformation | 34% | 127 |
| D2 Data Store Management | 26% | 118 |
| D3 Data Operations and Support | 22% | 90 |
| D4 Data Security and Governance | 18% | 85 |

All questions come from free, openly licensed banks whose authors wrote them from the AWS documentation:

- [itsIbrahimKhalil/aws-dea-c01-study-guide](https://github.com/itsIbrahimKhalil/aws-dea-c01-study-guide) (CC BY 4.0):
  155 questions written for guide v1.1, each tagged with a skill ID.
- [savemycert/dea-c01-study-guide](https://github.com/savemycert/dea-c01-study-guide) (CC BY 4.0): 20 questions with
  step-by-step reasoning.
- [erBhushanPawar/aws-dea-c01](https://github.com/erBhushanPawar/aws-dea-c01) (MIT): 245 scenario questions. Some
  distractors are easy, so treat them as warm-up.

The last two banks only give a domain, so their task is guessed from keywords (shown as `Task x.y*`). No exam dump
sites were used. If an answer looks wrong, the AWS documentation wins.

## Rebuilding

```bash
sh tools/fetch_sources.sh
python tools/h2t.py tools/sources/aws-exam-guide/*.html
python -I tools/build_bank.py
python -I tools/build_ringkasan.py
```

`build_bank.py` writes `js/questions/*.js` and `js/guide.js`. `build_ringkasan.py` builds both summary pages from the
markdown in `tools/sources/skillbuilder/`.

Unofficial study material, not affiliated with or endorsed by AWS.
