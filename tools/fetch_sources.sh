#!/usr/bin/env sh
# Re-downloads the open question banks and the official exam guide, then run: python -I tools/build_bank.py
cd "$(dirname "$0")/sources"
mkdir -p ibrahim savemycert bhushan aws-exam-guide
R=https://raw.githubusercontent.com
I=$R/itsIbrahimKhalil/aws-dea-c01-study-guide/HEAD
for f in practice-exam-01 practice-exam-02 v1.1-new-topics-drill; do curl -sL "$I/practice-exams/$f.md" -o "ibrahim/$f.md"; done
curl -sL "$I/LICENSE" -o ibrahim/LICENSE
curl -sL "$R/savemycert/dea-c01-study-guide/HEAD/sample-questions.md" -o savemycert/sample-questions.md
curl -sL "$R/savemycert/dea-c01-study-guide/HEAD/LICENSE" -o savemycert/LICENSE
curl -sL "$R/erBhushanPawar/aws-dea-c01/HEAD/questions.json" -o bhushan/questions.json
curl -sL "$R/erBhushanPawar/aws-dea-c01/HEAD/LICENSE" -o bhushan/LICENSE
B=https://docs.aws.amazon.com/aws-certification/latest/data-engineer-associate-01
for p in data-engineer-associate-01 data-engineer-associate-01-domain1 data-engineer-associate-01-domain2 data-engineer-associate-01-domain3 data-engineer-associate-01-domain4 dea-01-in-scope-services dea-01-out-of-scope-services dea-01-revisions; do
  curl -sL -A "Mozilla/5.0" "$B/$p.html" -o "aws-exam-guide/$p.html"
done
echo "done - check aws-exam-guide/dea-01-revisions.html for a new guide version, then rebuild the bank"
