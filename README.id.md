English version: [README.md](README.md)

# AWS Certified Data Engineer - Associate (DEA-C01): latihan ujian lokal

Situs mock exam lokal tanpa dependensi untuk **DEA-C01**. Engine-nya sama dengan `aws-ai-practitioner-prep` (turunan
`redis-operator-prep`): mock exam berwaktu, pembahasan per opsi saat salah, tab **Materi** berbahasa Indonesia.

**Format ujian asli:** 65 soal (50 dinilai + 15 tidak dinilai), 130 menit, skor skala 100-1.000, lulus 720, USD 150.
Tipe soal: multiple choice dan multiple response.

**Versi materi:** exam guide **v1.1, terbit 12 Des 2025**. AWS menerbitkan perubahan guide minimal sebulan sebelum masuk
ujian, jadi v1.1 berlaku sejak sekitar pertengahan Januari 2026. Kode ujian tetap DEA-C01. Cek
[halaman Revisions](https://docs.aws.amazon.com/aws-certification/latest/data-engineer-associate-01/dea-01-revisions.html)
untuk versi yang lebih baru.

## Menjalankan

Klik dua kali `start.bat` (Windows) atau jalankan `./start.sh`, atau:

```bash
python -m http.server 8767
```

lalu buka <http://localhost:8767>. Progres disimpan di `localStorage` browser.

## Fitur

- **Mock exam**: default 65 soal / 130 menit, diambil acak sesuai bobot domain resmi (34/26/22/18%). Opsi diacak,
  kecuali soal yang pembahasannya menyebut huruf opsi.
- **Mode latihan**: pembahasan langsung setelah tiap soal, tombol hint (kata kunci soal).
- **Saat salah**: jawaban benar, "Kenapa jawabanmu salah" untuk opsi yang kamu pilih, pembahasan, konsep kunci, tip ujian,
  pembahasan semua opsi, link materi.
- **Materi**: info ujian, perubahan v1.1, 17 task dengan 120 skill resmi (skill baru/diubah di v1.1 ditandai), ringkasan
  Indonesia, tombol latihan per task, rencana 4 minggu, sumber resmi gratis.
- **Salah**, **Riwayat**, **Bank soal** (filter domain/task/sumber/"topik baru v1.1").

## Bank soal (420 soal)

| Domain | Bobot | Soal |
|---|---|---|
| D1 Data Ingestion and Transformation | 34% | 127 |
| D2 Data Store Management | 26% | 118 |
| D3 Data Operations and Support | 22% | 90 |
| D4 Data Security and Governance | 18% | 85 |

389 single, 31 multiple response, 54 menyentuh skill baru v1.1, 39 diberi catatan nama layanan lama.

Hanya bank gratis berlisensi terbuka yang menulis soal sendiri dari dokumentasi AWS:

- [itsIbrahimKhalil/aws-dea-c01-study-guide](https://github.com/itsIbrahimKhalil/aws-dea-c01-study-guide) (CC BY 4.0):
  155 soal (2 practice exam + drill v1.1), ditulis untuk guide v1.1, fakta dicek Sep 2026. Tiap soal punya skill ID.
- [savemycert/dea-c01-study-guide](https://github.com/savemycert/dea-c01-study-guide) (CC BY 4.0): 20 soal dengan
  langkah penalaran.
- [erBhushanPawar/aws-dea-c01](https://github.com/erBhushanPawar/aws-dea-c01) (MIT): 245 soal skenario. Sebagian
  pengecohnya terlalu mudah, jadi anggap pemanasan.

Dua sumber terakhir hanya memberi domain, jadi task-nya ditebak dari kata kunci (tag `Task x.y*`). Situs "exam dump"
sengaja tidak dipakai. Kalau ada jawaban yang meragukan, dokumentasi AWS yang menang.

Materi latihan tidak resmi dan tidak berafiliasi dengan AWS.

## Memperbarui

```bash
sh tools/fetch_sources.sh
python tools/h2t.py tools/sources/aws-exam-guide/*.html
python -I tools/build_bank.py
```

`build_bank.py` menulis `js/questions/*.js` dan `js/guide.js` (skill resmi dari `tools/sources/aws-exam-guide/*.txt`).
Ringkasan materi ada di `js/materi.js`.

## Ringkasan domain (Skill Builder)

`summary.html` (bahasa Inggris, tautan "Ringkasan domain" di menu atas) dan `ringkasan.html` (bahasa Indonesia) merangkum keempat kursus "Domain N Review" DEA-C01 di AWS
Skill Builder. Isinya poin penting, tabel "kalau soal menyebut X, pilih Y", angka, dan jebakan ujian per lesson.
Sumber markdown-nya ada di `tools/sources/skillbuilder/` (`domainN_ringkasan.md` untuk ID, `domainN_summary_en.md` untuk EN).

Transkrip mentah tidak ikut di repo karena materi AWS. Setelah mengedit file ringkasan, bangun ulang kedua halaman dengan `python -I tools/build_ringkasan.py`.
