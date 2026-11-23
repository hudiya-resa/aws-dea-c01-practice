// Materi belajar DEA-C01 (bahasa Indonesia), disusun dari exam guide resmi v1.1 (12 Des 2025).
// Daftar skill resmi per task dibuat otomatis di js/guide.js; `notes` di sini = ringkasan sendiri.
window.MATERI = {
  info: `
    <table class="tbl"><tbody>
      <tr><td>Kode ujian</td><td><b>DEA-C01</b> (AWS Certified Data Engineer - Associate)</td></tr>
      <tr><td>Format</td><td>65 soal (50 dinilai + 15 tidak dinilai, tidak ditandai) · <b>130 menit</b> · multiple choice (1 dari 4) dan multiple response (2+ dari 5+)</td></tr>
      <tr><td>Skor</td><td>Skala 100-1.000, lulus <b>720</b>. Kompensatori: tidak perlu lulus per domain. Tidak ada penalti menebak, jadi jangan kosongkan jawaban.</td></tr>
      <tr><td>Biaya</td><td>USD 150. Kamu punya voucher diskon 50% dari kelulusan AIF-C01 (cek di AWS Certification Account → Benefits).</td></tr>
      <tr><td>Bobot domain</td><td>D1 Ingestion & Transformation <b>34%</b> · D2 Data Store Management <b>26%</b> · D3 Operations & Support <b>22%</b> · D4 Security & Governance <b>18%</b></td></tr>
      <tr><td>Di luar cakupan</td><td>Training/inferensi ML, sintaks spesifik bahasa pemrograman, menarik kesimpulan bisnis dari data.</td></tr>
    </tbody></table>
    <h4>Versi guide: v1.1, berlaku kapan?</h4>
    <p>Guide <b>v1.1 terbit 12 Desember 2025</b>. AWS menyatakan perubahan guide dipublikasikan minimal sebulan sebelum masuk ke ujian, jadi v1.1 berlaku di ujian sejak sekitar <b>pertengahan Januari 2026</b>. Kode ujian tetap DEA-C01. Per 5 Nov 2026 belum ada versi yang lebih baru; cek <a href="https://docs.aws.amazon.com/aws-certification/latest/data-engineer-associate-01/dea-01-revisions.html" target="_blank" rel="noopener">halaman Revisions</a> sebelum ujian.</p>
    <h4>Apa yang baru di v1.1 (prioritaskan, banyak materi lama belum membahas)</h4>
    <ul>
      <li><b>1.2.10</b> Integrasi LLM untuk pemrosesan data (Bedrock dari Glue/Lambda/Step Functions, Redshift/Athena ML functions).</li>
      <li><b>2.1.7</b> Open table format (Apache Iceberg) dan <b>Amazon S3 Tables</b>.</li>
      <li><b>2.1.8</b> Tipe vector index: <b>HNSW vs IVF</b> (pgvector di Aurora PostgreSQL, OpenSearch).</li>
      <li><b>2.2.6</b> Business data catalog: <b>Amazon SageMaker Catalog</b>.</li>
      <li><b>2.4.6</b> Konsep vektorisasi: embedding, chunking, <b>Bedrock Knowledge Bases</b>.</li>
      <li><b>4.1.7</b> Domain, domain unit dan project di <b>SageMaker Unified Studio</b>.</li>
      <li><b>4.5.6 / 4.5.7</b> Akses data lewat project SageMaker Catalog, framework governance dan pola data sharing (data mesh, publish/subscribe).</li>
      <li>Layanan baru in-scope: Aurora, Amazon Q, Bedrock, Kendra, AWS Data Exchange, S3 Tables. Keluar dari scope: Cloud9, CodeCommit, AWS SCT.</li>
    </ul>
    <h4>Cara membaca soal DEA</h4>
    <ol>
      <li><b>Baca kalimat terakhir dulu.</b> Kualifier (<i>MOST cost-effective</i>, <i>LEAST operational overhead</i>, <i>lowest latency</i>, <i>most secure</i>) yang memilih di antara dua opsi yang sama-sama "jalan".</li>
      <li><b>Tangga operational overhead:</b> fitur bawaan / zero-ETL → serverless managed → managed cluster → self-managed di EC2. Pilih anak tangga tertinggi yang tetap memenuhi semua syarat.</li>
      <li><b>Latensi → tier layanan:</b> milidetik/real-time = Kinesis Data Streams / MSK + Lambda/Flink. Near real-time (≥ detik-menit) = Firehose, Redshift streaming ingestion. Jam/harian = Glue, EMR batch.</li>
      <li><b>Masalah performa/biaya Athena, Spectrum, Glue</b> hampir selalu: format kolumnar (Parquet/ORC), partisi, ukuran file yang pas (±128 MB-1 GB, hindari small files).</li>
      <li>Setiap syarat di soal ada untuk <b>mengeliminasi</b> satu opsi ("urutan harus terjaga", "harus bisa replay", "tanpa ubah kode", "data harus tetap di Region X").</li>
    </ol>
    <p class="small muted">Di aplikasi ini: tag <b>Skill x.y.z</b> berarti sumber menyebut skill persisnya. Tag <b>Task x.y*</b> berarti task ditebak otomatis dari kata kunci (sumber hanya memberi domain). Tag <b>baru v1.1</b> = menyentuh skill yang ditambahkan Des 2025.</p>`,

  plan: `
    <h4>Rencana 4 minggu (±1,5 jam/hari)</h4>
    <table class="tbl"><thead><tr><th>Minggu</th><th>Fokus</th><th>Latihan di app</th></tr></thead><tbody>
      <tr><td>1</td><td>D1: Kinesis/Firehose/MSK, DMS, Glue ETL, EMR, Step Functions vs MWAA, Lambda + Kinesis</td><td>Latihan per task 1.1-1.4, target ≥70%</td></tr>
      <tr><td>2</td><td>D2: S3 + lifecycle, Redshift (dist/sort key, COPY/UNLOAD, Spectrum, data sharing), DynamoDB, Glue Catalog & crawler, Iceberg/S3 Tables, vector</td><td>Task 2.1-2.4 + filter "baru v1.1"</td></tr>
      <tr><td>3</td><td>D3 + D4: Athena, CloudWatch/CloudTrail, data quality (Glue DQ, DataBrew), IAM, Lake Formation, KMS, Macie, SageMaker Unified Studio</td><td>Task 3.x, 4.x · mock exam pertama (65 soal / 130 menit)</td></tr>
      <tr><td>4</td><td>Ulang domain terlemah dari hasil mock, tab <b>Salah</b> sampai pending habis</td><td>2-3 mock exam, target ≥80% sebelum booking</td></tr>
    </tbody></table>
    <p>Sebagai Data Engineer yang sudah pakai Airflow, dbt, Spark, Kafka dan PostgreSQL, kamu tinggal memetakan konsep ke layanan AWS: Airflow → <b>MWAA</b>, Kafka → <b>MSK</b>, Spark → <b>Glue / EMR</b>, PostgreSQL → <b>RDS/Aurora</b>, warehouse → <b>Redshift</b>, data lake → <b>S3 + Glue Catalog + Athena + Lake Formation</b>. Yang biasanya paling perlu dihafal adalah detail Redshift, Kinesis, Lake Formation dan IAM/KMS.</p>
    <h4>Sumber resmi gratis</h4>
    <ul>
      <li><a href="https://docs.aws.amazon.com/aws-certification/latest/data-engineer-associate-01/data-engineer-associate-01.html" target="_blank" rel="noopener">Exam guide DEA-C01 v1.1</a> (daftar skill lengkap ada di tiap task di atas)</li>
      <li><a href="https://skillbuilder.aws/" target="_blank" rel="noopener">AWS Skill Builder</a>: <i>Exam Prep Standard Course: AWS Certified Data Engineer - Associate</i> dan <i>Official Practice Question Set</i> (20 soal resmi, gratis)</li>
      <li><a href="https://aws.amazon.com/certification/certified-data-engineer-associate/" target="_blank" rel="noopener">Halaman sertifikasi</a> (jadwal, harga, sample questions)</li>
      <li>Whitepaper: <i>Build Modern Data Streaming Architectures on AWS</i>, <i>AWS Well-Architected Data Analytics Lens</i></li>
    </ul>
    <h4>Sumber terbuka yang dipakai bank soal ini</h4>
    <ul>
      <li><a href="https://github.com/itsIbrahimKhalil/aws-dea-c01-study-guide" target="_blank" rel="noopener">itsIbrahimKhalil/aws-dea-c01-study-guide</a> (CC BY 4.0): 2 practice exam + drill topik v1.1 (155 soal), diselaraskan ke guide v1.1, fakta dicek Sep 2026. Juga punya 46 topic guide yang bagus untuk dibaca.</li>
      <li><a href="https://github.com/savemycert/dea-c01-study-guide" target="_blank" rel="noopener">savemycert/dea-c01-study-guide</a> (CC BY 4.0): 20 soal dengan pembahasan per opsi dan langkah penalaran, plus catatan per domain dan glossary.</li>
      <li><a href="https://github.com/erBhushanPawar/aws-dea-c01" target="_blank" rel="noopener">erBhushanPawar/aws-dea-c01</a> (MIT): 245 soal skenario dengan pembahasan per opsi. Sebagian pengecoh mudah ditebak, jadi pakai untuk pemanasan, bukan ukuran kesiapan.</li>
    </ul>
    <p class="small muted">Situs "exam dump" sengaja tidak dipakai. Kalau pembahasan meragukan, cek dokumentasi AWS; dokumentasi yang menang.</p>`,

  tasks: {
    '1.1': {
      notes: `
        <table class="tbl"><thead><tr><th>Kebutuhan di soal</th><th>Jawaban umum</th></tr></thead><tbody>
          <tr><td>Real-time, banyak consumer membaca data yang sama, bisa replay, urutan per key</td><td><b>Kinesis Data Streams</b> (retensi 24 jam default, s/d 365 hari)</td></tr>
          <tr><td>Kirim stream ke S3/Redshift/OpenSearch/Splunk tanpa kode, konversi ke Parquet</td><td><b>Amazon Data Firehose</b> (buffer ukuran/waktu, near real-time)</td></tr>
          <tr><td>Sudah pakai Kafka, butuh kompatibilitas API Kafka</td><td><b>Amazon MSK</b> (provisioned / serverless), MSK Connect</td></tr>
          <tr><td>Migrasi DB + ikuti perubahan (insert/update/delete)</td><td><b>AWS DMS</b> full load + CDC</td></tr>
          <tr><td>Tarik data dari SaaS (Salesforce, ServiceNow, Google Analytics)</td><td><b>Amazon AppFlow</b></td></tr>
          <tr><td>File via SFTP/FTPS dari partner</td><td><b>AWS Transfer Family</b></td></tr>
          <tr><td>Pindah file on-prem (NFS/SMB) ke S3/EFS terjadwal</td><td><b>AWS DataSync</b>; offline/TB-PB tanpa bandwidth: <b>Snow Family</b></td></tr>
          <tr><td>Perubahan item DynamoDB memicu proses</td><td><b>DynamoDB Streams</b> + Lambda</td></tr>
        </tbody></table>
        <ul>
          <li><b>Shard Kinesis</b>: tulis 1 MB/s atau 1.000 record/s, baca 2 MB/s dibagi ke semua consumer. Banyak consumer saling berebut → <b>Enhanced fan-out</b> (2 MB/s per consumer per shard). Throttle saat tulis (<code>ProvisionedThroughputExceeded</code>) → tambah shard atau perbaiki partition key yang "panas"; trafik tak terduga → mode <b>on-demand</b>.</li>
          <li><b>Lambda dari Kinesis</b> (event source mapping): <code>IteratorAge</code> naik = consumer tertinggal → naikkan <b>parallelization factor</b> (1-10 batch paralel per shard, urutan per key tetap terjaga), batch size, atau tambah shard. Error berulang → <b>bisect batch on error</b>, max retry, on-failure destination (SQS/SNS).</li>
          <li><b>Penjadwalan</b>: EventBridge Scheduler / rule cron, Airflow (MWAA), trigger terjadwal Glue untuk job dan crawler. <b>Event-driven</b>: S3 Event Notifications (ke Lambda/SQS/SNS) atau S3 → EventBridge (filter lebih kaya, banyak target).</li>
          <li><b>Replayability</b>: simpan data mentah (S3 raw zone, retensi Kinesis/Kafka) supaya pipeline bisa diulang. <b>Stateful</b> (window, agregasi berjalan, Flink) vs <b>stateless</b> (tiap record berdiri sendiri, Lambda).</li>
          <li><b>Rate limit</b>: exponential backoff + jitter, SQS sebagai penyangga, DynamoDB on-demand / auto scaling, RDS Proxy untuk koneksi Lambda yang membludak.</li>
          <li><b>IP allowlist</b>: security group / NACL, NAT gateway dengan Elastic IP supaya sumber eksternal bisa allowlist IP tetap.</li>
        </ul>`,
    },
    '1.2': {
      notes: `
        <table class="tbl"><thead><tr><th>Layanan</th><th>Kapan dipilih</th></tr></thead><tbody>
          <tr><td><b>AWS Glue ETL</b> (Spark/Python shell, serverless)</td><td>ETL batch/streaming tanpa kelola cluster. DPU, worker type G.1X/G.2X, <b>job bookmark</b> untuk incremental, <b>Flex</b> untuk job tidak mendesak (lebih murah), auto scaling.</td></tr>
          <tr><td><b>Amazon EMR</b> (EC2 / EKS / Serverless)</td><td>Butuh kontrol penuh Spark/Hive/Presto/HBase, library khusus, job besar dan panjang. Hemat: Spot untuk task node, Graviton, transient cluster. EMR Serverless = tanpa kelola cluster.</td></tr>
          <tr><td><b>Lambda</b></td><td>Transformasi ringan per event, maks 15 menit, memori s/d 10 GB, /tmp s/d 10 GB.</td></tr>
          <tr><td><b>Redshift</b> (ELT SQL)</td><td>Transformasi di dalam warehouse, stored procedure, materialized view.</td></tr>
          <tr><td><b>ECS/EKS, AWS Batch</b></td><td>Container yang sudah ada, job batch panjang di container.</td></tr>
        </tbody></table>
        <ul>
          <li><b>CSV → Parquet</b>: Glue job, Athena CTAS, Firehose record format conversion (pakai skema Glue Catalog). Parquet + Snappy = kolumnar, scan lebih sedikit, Athena lebih murah.</li>
          <li><b>Troubleshooting Spark/Glue</b>: OOM di driver/executor → worker lebih besar, hindari <code>collect()</code>; banyak small files → <code>groupFiles</code>/coalesce; data skew → salting key, repartition; lihat Spark UI dan CloudWatch metrics job.</li>
          <li><b>Koneksi sumber</b>: JDBC/ODBC lewat Glue connection di dalam VPC (butuh subnet + security group yang self-referencing), Athena federated query untuk sumber non-S3.</li>
          <li><b>Data API</b>: API Gateway + Lambda di depan data, Redshift Data API dan RDS Data API (tanpa kelola koneksi), AppSync untuk GraphQL.</li>
          <li><b>3V</b>: volume (besarnya), velocity (kecepatan datang), variety (terstruktur tabel, semi-terstruktur JSON/Avro, tidak terstruktur gambar/teks).</li>
          <li><b>LLM untuk data (baru v1.1)</b>: panggil <b>Amazon Bedrock</b> dari Lambda/Glue/Step Functions untuk klasifikasi, ekstraksi entitas, ringkasan, normalisasi teks bebas. Volume besar tanpa butuh real-time → <b>Bedrock batch inference</b> (lebih murah). Step Functions punya integrasi langsung ke Bedrock InvokeModel.</li>
        </ul>`,
    },
    '1.3': {
      notes: `
        <table class="tbl"><thead><tr><th>Orkestrator</th><th>Pilih jika</th></tr></thead><tbody>
          <tr><td><b>AWS Step Functions</b></td><td>Serverless, visual, integrasi langsung 200+ layanan, retry/catch per langkah, Map state untuk paralel. Standard (s/d 1 tahun, exactly-once) vs Express (≤5 menit, volume tinggi).</td></tr>
          <tr><td><b>Amazon MWAA</b></td><td>Tim sudah punya DAG Airflow, butuh operator/plugin open source, dependensi kompleks lintas sistem.</td></tr>
          <tr><td><b>Glue workflows / triggers</b></td><td>Pipeline yang isinya hanya crawler + Glue job.</td></tr>
          <tr><td><b>EventBridge</b></td><td>Event-driven dan jadwal (Scheduler), memicu pipeline ketika sesuatu terjadi.</td></tr>
        </tbody></table>
        <ul>
          <li><b>Resiliensi</b>: retry dengan backoff, dead-letter queue (SQS), idempoten (upsert/MERGE, bukan insert buta), checkpoint, multi-AZ.</li>
          <li><b>Notifikasi</b>: SNS (fan-out ke email, SMS, Lambda, SQS), SQS (antrian, decoupling, DLQ). Gagal job Glue → EventBridge rule pada event "Glue Job State Change" → SNS.</li>
          <li>Pengecoh umum: menulis "orkestrator sendiri" pakai Lambda yang memanggil Lambda, atau cron di EC2. Hampir selalu kalah dari Step Functions/MWAA soal overhead.</li>
        </ul>`,
    },
    '1.4': {
      notes: `
        <ul>
          <li><b>Lambda concurrency</b>: reserved concurrency (jatah dan batas atas), provisioned concurrency (hindari cold start). Untuk sumber stream, concurrency = shard × parallelization factor.</li>
          <li><b>Storage di Lambda</b>: /tmp (ephemeral, s/d 10 GB), <b>EFS mount</b> untuk file bersama/model besar (Lambda harus di VPC), layer untuk library.</li>
          <li><b>IaC</b>: CloudFormation (YAML/JSON), <b>AWS CDK</b> (bahasa pemrograman → CloudFormation), <b>AWS SAM</b> (singkatan CloudFormation untuk serverless: Lambda, Step Functions, DynamoDB, API Gateway; <code>sam build</code>, <code>sam deploy</code>).</li>
          <li><b>CI/CD</b>: CodePipeline + CodeBuild (test, build) + CodeDeploy, atau GitHub Actions. Test unit untuk transformasi, test data di staging, deploy bertahap.</li>
          <li><b>Optimasi kode</b>: filter dan proyeksi sedini mungkin (predicate pushdown), hindari loop per baris (pakai operasi vektor/Spark), batch request API, reuse koneksi di luar handler Lambda.</li>
          <li><b>Distributed computing</b>: data dibagi ke banyak node, shuffle mahal. <b>Struktur data</b>: tree (B-tree index, hierarki), graph (relasi, Neptune), hash (partisi, lookup).</li>
          <li>Git untuk version control tetap diuji secara konsep (branch, merge, pull request); CodeCommit sendiri sudah keluar dari scope.</li>
        </ul>`,
    },
    '2.1': {
      notes: `
        <table class="tbl"><thead><tr><th>Pola akses</th><th>Data store</th></tr></thead><tbody>
          <tr><td>Analitik SQL besar, join, BI</td><td><b>Redshift</b> (provisioned RA3 / Serverless)</td></tr>
          <tr><td>Data lake murah, query ad hoc</td><td><b>S3 + Athena</b> (bayar per TB di-scan)</td></tr>
          <tr><td>Key-value / dokumen, latensi milidetik skala besar</td><td><b>DynamoDB</b> (DAX untuk cache mikrodetik)</td></tr>
          <tr><td>Key-value super cepat in-memory dan durable</td><td><b>MemoryDB</b></td></tr>
          <tr><td>OLTP relasional</td><td><b>RDS / Aurora</b></td></tr>
          <tr><td>Graph</td><td><b>Neptune</b>; dokumen kompatibel MongoDB: <b>DocumentDB</b>; Cassandra: <b>Keyspaces</b></td></tr>
          <tr><td>Full-text search, log analytics, vektor</td><td><b>OpenSearch Service</b></td></tr>
        </tbody></table>
        <ul>
          <li><b>Akses data tanpa memindahkan</b>: Redshift <b>Spectrum</b> (query data S3 dari Redshift), <b>federated query</b> (query langsung RDS/Aurora PostgreSQL/MySQL), <b>materialized view</b> (hasil pra-hitung, bisa auto refresh), <b>zero-ETL integration</b> (Aurora/RDS/DynamoDB → Redshift otomatis).</li>
          <li><b>Lock</b>: Redshift memakai lock tabel saat DDL/DML bersamaan; lihat <code>STV_LOCKS</code>, hentikan sesi dengan <code>PG_TERMINATE_BACKEND</code>. RDS: row-level lock, deadlock.</li>
          <li><b>Apache Iceberg (baru v1.1)</b>: transaksi ACID, time travel, schema & partition evolution, MERGE/UPDATE/DELETE di data lake. Butuh pemeliharaan: compaction small files, expire snapshot, hapus orphan file. Di bucket biasa → <b>Glue Data Catalog table optimizers</b>. <b>Amazon S3 Tables</b> (table bucket) = Iceberg terkelola dengan maintenance otomatis.</li>
          <li><b>Vector index (baru v1.1)</b>: <b>HNSW</b> = graf berlapis, recall dan kecepatan query tinggi, memori besar, build lambat. <b>IVF</b> = vektor dikelompokkan ke cluster (centroid), build cepat dan hemat memori, recall sedikit lebih rendah, perlu data latih untuk cluster. Aurora PostgreSQL + <b>pgvector</b> mendukung keduanya (ivfflat, hnsw); OpenSearch juga.</li>
        </ul>`,
    },
    '2.2': {
      notes: `
        <ul>
          <li><b>Glue Data Catalog</b> = technical metastore (kompatibel Hive) yang dipakai Athena, Redshift Spectrum, EMR, Glue. Satu catalog per Region per akun.</li>
          <li><b>Crawler</b>: memindai S3/JDBC, menebak skema, membuat/memperbarui tabel dan partisi. Supaya satu tabel (bukan ratusan): prefix konsisten, skema seragam, opsi "Create a single schema for each S3 path". Jadwalkan atau picu setelah data masuk.</li>
          <li><b>Sinkronisasi partisi</b>: <code>MSCK REPAIR TABLE</code> (lambat untuk banyak partisi), <code>ALTER TABLE ADD PARTITION</code>, crawler, atau <b>partition projection</b> di Athena (partisi dihitung dari pola, tanpa metastore, cocok untuk partisi tanggal yang sangat banyak).</li>
          <li><b>Connection</b>: Glue connection (JDBC, MongoDB, Kafka, dll) dengan VPC/subnet/SG untuk crawler dan job.</li>
          <li><b>Business catalog (baru v1.1)</b>: <b>Amazon SageMaker Catalog</b> (penerus DataZone) di SageMaker Unified Studio. Menambah konteks bisnis: glosarium, deskripsi, metadata form, publish aset dan alur subscribe/approve. Technical catalog = skema; business catalog = arti dan kepemilikan data.</li>
        </ul>`,
    },
    '2.3': {
      notes: `
        <ul>
          <li><b>COPY</b> (S3 → Redshift): paralel per slice, jadi pecah data jadi banyak file (kelipatan jumlah slice, 1 MB-1 GB setelah kompresi), pakai manifest bila perlu, satu COPY per tabel (bukan banyak COPY bersamaan). <b>UNLOAD</b> (Redshift → S3): bisa ke Parquet, paralel, terenkripsi.</li>
          <li><b>Storage class S3</b>: Standard → Standard-IA (min 30 hari) → One Zone-IA → Glacier Instant Retrieval (milidetik) → Glacier Flexible Retrieval (menit-jam) → Glacier Deep Archive (≤12/48 jam, termurah). Pola akses tidak diketahui → <b>Intelligent-Tiering</b>.</li>
          <li><b>Lifecycle</b>: transition antar class dan <b>expiration</b> (hapus setelah N hari), bisa per prefix/tag, juga untuk noncurrent version dan multipart upload yang tidak selesai.</li>
          <li><b>Versioning</b> melindungi dari hapus/timpa tidak sengaja; <b>Object Lock</b> (WORM, compliance/governance mode) untuk retensi legal. <b>DynamoDB TTL</b> menghapus item kedaluwarsa gratis.</li>
          <li><b>Hapus untuk kebutuhan hukum</b> (mis. right to be forgotten): Iceberg/Athena DELETE, atau tulis ulang partisi; ingat juga hapus versi lama dan backup.</li>
          <li><b>Resiliensi</b>: S3 Cross-Region/Same-Region Replication, AWS Backup, snapshot Redshift lintas Region, DynamoDB PITR dan global tables, RDS Multi-AZ dan read replica.</li>
        </ul>`,
    },
    '2.4': {
      notes: `
        <ul>
          <li><b>Redshift</b>: distribution style <b>KEY</b> (tabel fakta besar yang sering di-join pada kolom yang sama), <b>ALL</b> (dimensi kecil disalin ke semua node), <b>EVEN</b>, <b>AUTO</b>. <b>Sort key</b> untuk kolom filter rentang (tanggal) → zone map melewati blok. Kompresi kolom (ENCODE AUTO, AZ64, ZSTD). Star schema, denormalisasi wajar.</li>
          <li><b>DynamoDB</b>: desain dari pola akses. Partition key dengan kardinalitas tinggi (hindari hot partition), sort key untuk query rentang, <b>GSI</b> (key berbeda, kapan saja) vs <b>LSI</b> (partition key sama, harus dibuat saat tabel dibuat), single-table design.</li>
          <li><b>Data lake / Lake Formation</b>: zona raw → cleaned → curated, partisi berdasarkan kolom filter umum (tanggal, region), jangan terlalu banyak partisi kecil.</li>
          <li><b>Schema evolution</b>: Parquet/Avro/Iceberg mendukung tambah kolom; Glue Schema Registry untuk stream (kompatibilitas BACKWARD/FORWARD); crawler bisa update skema atau mengabaikan perubahan.</li>
          <li><b>Konversi skema</b>: <b>DMS Schema Conversion</b> (terkelola, di konsol DMS) untuk heterogen (Oracle → Aurora PostgreSQL). AWS SCT adalah tool desktop lama, sudah keluar dari daftar in-scope.</li>
          <li><b>Lineage</b>: SageMaker Catalog (lineage OpenLineage dari Glue/Redshift), SageMaker ML Lineage Tracking untuk artefak ML.</li>
          <li><b>Vektorisasi (baru v1.1)</b>: teks dipecah jadi <b>chunk</b>, diubah jadi <b>embedding</b> (mis. Amazon Titan Text Embeddings), disimpan di vector store, dicari dengan kemiripan (cosine, Euclidean). <b>Bedrock Knowledge Bases</b> mengurus ingest dari S3, chunking, embedding dan sinkronisasi ke vector store (OpenSearch Serverless, Aurora pgvector, S3 Vectors, dll) untuk RAG.</li>
        </ul>`,
    },
    '3.1': {
      notes: `
        <ul>
          <li><b>Athena</b>: SQL serverless di atas S3 (Trino). Workgroup untuk memisahkan tim, batas data scan per query, lokasi hasil terenkripsi. CTAS / INSERT INTO untuk ETL ringan. Query result reuse dan partition projection mempercepat.</li>
          <li><b>Glue DataBrew</b>: persiapan data visual tanpa kode, 250+ transformasi, recipe yang bisa dijadwalkan, profiling. Untuk analis atau "no-code". <b>SageMaker Unified Studio</b> (baru v1.1): satu tempat untuk notebook, SQL, ETL visual dan katalog.</li>
          <li><b>SDK</b>: boto3 dan lainnya untuk memanggil layanan dari kode; Redshift Data API tanpa driver JDBC.</li>
          <li><b>Troubleshooting MWAA/Step Functions</b>: log task Airflow di CloudWatch, plugin/requirements gagal install, kapasitas worker; Step Functions lihat execution history dan state yang gagal.</li>
          <li><b>EventBridge</b>: rule berbasis pola event atau jadwal, target Lambda/Step Functions/Glue; EventBridge Scheduler untuk jadwal satu kali atau berulang dengan timezone.</li>
        </ul>`,
    },
    '3.2': {
      notes: `
        <ul>
          <li><b>Visualisasi</b>: Amazon QuickSight (sekarang bagian dari <b>Amazon Quick</b>), SPICE in-memory, dashboard. DataBrew juga punya visual profil data.</li>
          <li><b>Verifikasi dan bersihkan</b>: Athena SQL, notebook Jupyter, SageMaker Data Wrangler, Lambda.</li>
          <li><b>SQL yang perlu lancar</b>: GROUP BY, HAVING, window function (<code>ROW_NUMBER</code>, <code>RANK</code>, <code>LAG/LEAD</code>), rolling average (<code>AVG() OVER (ORDER BY tanggal ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)</code>), pivot (CASE WHEN atau PIVOT), LEFT JOIN untuk menjaga baris dengan nilai nol, CREATE VIEW dan materialized view.</li>
          <li><b>Athena notebook (Spark)</b>: eksplorasi interaktif PySpark tanpa cluster.</li>
          <li><b>Provisioned vs serverless</b>: provisioned (Redshift RA3, EMR on EC2, MSK provisioned) lebih murah untuk beban stabil tinggi dan bisa di-tuning; serverless (Redshift Serverless, Athena, Glue, EMR Serverless) bayar sesuai pakai, cocok untuk beban tidak menentu atau jarang.</li>
        </ul>`,
    },
    '3.3': {
      notes: `
        <ul>
          <li><b>CloudWatch</b>: metrics (Glue job metrics, Kinesis <code>IteratorAge</code>, Redshift CPU/queue), alarm → SNS, dashboard. <b>Metric filter</b> mengubah pola teks di log menjadi metrik. <b>Logs Insights</b> untuk query log.</li>
          <li><b>CloudTrail</b>: siapa memanggil API apa, kapan, dari mana. Management events (default) vs data events (mis. S3 GetObject, harus diaktifkan).</li>
          <li><b>Troubleshoot Glue/EMR</b>: Spark UI, continuous logging, job run insights, error koneksi VPC (SG, endpoint S3), timeout, OOM, skew. EMR: log di S3, step gagal, kapasitas node.</li>
          <li><b>Performa Redshift</b>: WLM / concurrency scaling, vacuum dan analyze (otomatis), dist key yang salah (data redistribusi besar), sort key, query monitoring rules, Advisor.</li>
          <li><b>Analisis log volume besar</b>: Athena di atas S3, OpenSearch (search/dashboards), EMR untuk log sangat besar.</li>
        </ul>`,
    },
    '3.4': {
      notes: `
        <ul>
          <li><b>AWS Glue Data Quality</b>: aturan <b>DQDL</b> (<code>IsComplete "id"</code>, <code>Uniqueness "id" &gt; 0.99</code>, <code>ColumnValues</code>, <code>RowCount</code>), rekomendasi aturan otomatis, dijalankan di Data Catalog atau di dalam job ETL, hasil ke CloudWatch/EventBridge, bisa menghentikan pipeline.</li>
          <li><b>DataBrew</b>: profile job (statistik, null, duplikat) dan ruleset kualitas data.</li>
          <li><b>Konsistensi</b>: cek jumlah baris sumber vs target, checksum, dedup dengan window function, constraint di tahap curated.</li>
          <li><b>Sampling</b>: random, stratified (proporsi per kelompok terjaga), systematic (tiap n), untuk profil cepat data besar.</li>
          <li><b>Data skew</b>: sebagian key jauh lebih banyak → satu task Spark lambat. Atasi dengan salting, broadcast join untuk tabel kecil, Adaptive Query Execution, repartition; di Redshift dengan dist key yang lebih rata.</li>
        </ul>`,
    },
    '4.1': {
      notes: `
        <ul>
          <li><b>Security group</b> (stateful, allow saja) vs NACL (stateless, subnet). Glue connection butuh SG dengan aturan self-referencing.</li>
          <li><b>IAM role</b> untuk layanan (Lambda execution role, Glue role, Redshift role untuk COPY dari S3); manusia lewat IAM Identity Center/federasi, bukan access key permanen.</li>
          <li><b>Secrets Manager</b>: simpan kredensial DB dengan <b>rotasi otomatis</b> (RDS, Redshift, DocumentDB terintegrasi). Parameter Store: konfigurasi dan secret sederhana, tanpa rotasi bawaan, lebih murah.</li>
          <li><b>VPC endpoint</b>: gateway endpoint (S3, DynamoDB, gratis) dan interface endpoint (<b>PrivateLink</b>, layanan lain) supaya trafik tidak lewat internet. Endpoint policy dan <b>S3 Access Points</b> membatasi akses.</li>
          <li><b>Managed vs unmanaged</b>: managed (RDS, Glue) AWS yang patch/backup; unmanaged (DB di EC2) kamu yang mengurus semuanya.</li>
          <li><b>SageMaker Unified Studio (baru v1.1)</b>: <b>domain</b> (wadah organisasi, terhubung ke IAM Identity Center), <b>domain unit</b> (pengelompokan per lini bisnis/tim, mewarisi kebijakan), <b>project</b> (ruang kerja kolaborasi dengan anggota, resource dan izin sendiri).</li>
        </ul>`,
    },
    '4.2': {
      notes: `
        <ul>
          <li><b>Least privilege</b>: custom policy dengan action dan resource spesifik, condition key (<code>aws:SourceVpce</code>, <code>s3:prefix</code>, <code>aws:PrincipalTag</code>). Explicit deny selalu menang.</li>
          <li><b>RBAC vs ABAC</b>: role-based (izin per role); tag-based / attribute-based (izin mengikuti tag principal dan resource, skala baik ketika resource bertambah). Di Lake Formation: <b>LF-Tags</b> (LF-TBAC) untuk ratusan tabel.</li>
          <li><b>Lake Formation</b>: izin terpusat database/tabel/<b>kolom</b>/<b>baris</b>/<b>sel</b> (data filter) untuk Athena, Redshift Spectrum, EMR, Glue. Cross-account sharing lewat RAM. Daftarkan lokasi S3, cabut izin IAMAllowedPrincipals.</li>
          <li><b>Redshift</b>: GRANT ke user/group/role, RBAC bawaan, row-level security, dynamic data masking, column-level grant.</li>
          <li><b>Penyimpanan kredensial aplikasi</b>: Secrets Manager (rotasi) atau Parameter Store SecureString.</li>
        </ul>`,
    },
    '4.3': {
      notes: `
        <ul>
          <li><b>KMS</b>: AWS managed key vs <b>customer managed key</b> (kontrol key policy, rotasi, audit, dibutuhkan untuk cross-account). Envelope encryption. SSE-S3, <b>SSE-KMS</b> (S3 Bucket Key mengurangi biaya panggilan KMS), SSE-C, client-side.</li>
          <li><b>Lintas akun</b>: key policy di akun pemilik mengizinkan principal akun lain + IAM policy di akun penerima. Data terenkripsi KMS yang di-share wajib dua lapis ini.</li>
          <li><b>In transit</b>: TLS (paksa dengan <code>aws:SecureTransport</code> di bucket policy), <code>require_ssl</code> di Redshift, SSL di RDS. <b>Before transit</b> = enkripsi sisi klien sebelum dikirim.</li>
          <li><b>Masking & anonimisasi</b>: Redshift dynamic data masking, Glue transform Detect PII (redact/hash), DataBrew (mask, hash, encrypt), tokenization, Lake Formation column filter untuk menyembunyikan kolom.</li>
          <li>EMR: security configuration untuk enkripsi at rest (EBS, S3) dan in transit (sertifikat PEM).</li>
        </ul>`,
    },
    '4.4': {
      notes: `
        <ul>
          <li><b>CloudTrail</b> trail ke S3 (multi-Region, organisasi), log file validation untuk integritas. <b>CloudTrail Lake</b>: simpan dan query event dengan SQL tanpa pipeline sendiri, retensi panjang.</li>
          <li><b>CloudWatch Logs</b>: log aplikasi, retensi per log group, subscription filter ke Firehose/Lambda/OpenSearch, export ke S3.</li>
          <li><b>Analisis</b>: Athena (log di S3, termasuk CloudTrail dan S3 access log), CloudWatch Logs Insights (cepat untuk log di CloudWatch), OpenSearch (pencarian dan visual).</li>
          <li><b>Volume besar</b>: EMR untuk memproses log sangat besar. Redshift audit logging (connection, user activity) ke S3/CloudWatch.</li>
        </ul>`,
    },
    '4.5': {
      notes: `
        <ul>
          <li><b>Redshift data sharing</b>: share data live antar cluster/workgroup/akun/Region tanpa copy (RA3/Serverless). Data dijual/dibeli ke pihak luar: <b>AWS Data Exchange</b>.</li>
          <li><b>PII</b>: <b>Amazon Macie</b> memindai S3 dan menemukan data sensitif, hasilnya bisa dipakai untuk tag dan kebijakan Lake Formation. Glue Detect PII untuk data di dalam job.</li>
          <li><b>Kedaulatan data / Region</b>: SCP di AWS Organizations dengan <code>aws:RequestedRegion</code> untuk melarang Region lain, batasi tujuan replikasi dan backup (copy AWS Backup, CRR) hanya ke Region yang diizinkan.</li>
          <li><b>AWS Config</b>: riwayat perubahan konfigurasi resource dan aturan kepatuhan (mis. bucket harus terenkripsi), remediation otomatis.</li>
          <li><b>SageMaker Catalog projects (baru v1.1)</b>: produsen <b>publish</b> aset data ke katalog, konsumen <b>subscribe</b>, pemilik menyetujui, lalu akses diberikan otomatis (lewat Lake Formation/Redshift) ke project konsumen.</li>
          <li><b>Framework governance & pola sharing (baru v1.1)</b>: terpusat (satu tim data) vs <b>data mesh</b> (domain sebagai pemilik "data product", governance federasi), hub-and-spoke dengan Lake Formation cross-account, Redshift data sharing, Data Exchange untuk pihak eksternal.</li>
        </ul>`,
    },
  },
};
