// Shared question-bank scaffolding. Every questions/*.js file pushes objects into window.QUESTION_BANK.
//
// Question shape (built by tools/build_bank.py):
// {
//   id: 'ib-pe1-01',                      // unique, stable (used for progress tracking)
//   domain: 'd1',                         // key from DOMAINS
//   task: '1.1',                          // task statement from the exam guide (key of TASKS)
//   skill: '1.1.7',                       // optional, when the source names the exact skill
//   taskGuessed: true,                    // optional, task picked by keyword matching (source only gave the domain)
//   type: 'single' | 'multiple',
//   q: 'Question text (supports `code` and **bold**)',
//   options: ['A', 'B', ...],
//   answer: [1],                          // correct option indices
//   optExpl: ['why A is right/wrong', …], // aligned to options
//   explanation, hint, keyConcept, tip,   // explanation required, the rest optional
//   refs: [{ title, url }],               // optional study links
//   source: 'ibrahim' | 'savemycert' | 'bhushan', sourceUrl: '...',
//   v11: true,                            // optional: touches skills added in guide v1.1
//   fixedOrder: true,                     // optional: explanation names option letters, so options are not shuffled
//   scopeNote: '...'                      // optional note about renamed / out-of-scope services
// }
window.QUESTION_BANK = [];
window.DOMAINS = {
  d1: 'D1 · Data Ingestion and Transformation',
  d2: 'D2 · Data Store Management',
  d3: 'D3 · Data Operations and Support',
  d4: 'D4 · Data Security and Governance',
};
// share of scored content per the official exam guide (v1.1, 12 Dec 2025)
window.DOMAIN_WEIGHTS = { d1: 34, d2: 26, d3: 22, d4: 18 };
window.TASKS = {
  '1.1': 'Ingestion data (streaming & batch)',
  '1.2': 'Transformasi & pemrosesan data',
  '1.3': 'Orkestrasi pipeline',
  '1.4': 'Konsep pemrograman, IaC, CI/CD',
  '2.1': 'Memilih data store',
  '2.2': 'Data catalog',
  '2.3': 'Siklus hidup data',
  '2.4': 'Data model & evolusi skema',
  '3.1': 'Otomasi pemrosesan data',
  '3.2': 'Analisis data',
  '3.3': 'Maintain & monitor pipeline',
  '3.4': 'Kualitas data',
  '4.1': 'Autentikasi',
  '4.2': 'Otorisasi',
  '4.3': 'Enkripsi & masking',
  '4.4': 'Log untuk audit',
  '4.5': 'Privasi & governance data',
};
window.SOURCES = {
  ibrahim: { label: 'DEA-C01 Study Guides', url: 'https://github.com/itsIbrahimKhalil/aws-dea-c01-study-guide', license: 'CC BY 4.0' },
  savemycert: { label: 'SaveMyCert', url: 'https://github.com/savemycert/dea-c01-study-guide', license: 'CC BY 4.0' },
  bhushan: { label: 'DEA-C01 Practice Exam', url: 'https://github.com/erBhushanPawar/aws-dea-c01', license: 'MIT' },
};
window.addQuestions = function (list) {
  list.forEach(q => window.QUESTION_BANK.push(q));
};
