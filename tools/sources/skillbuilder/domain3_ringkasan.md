# Domain 3: Data Operations and Support
Domain ini membahas cara menjalankan pipeline secara otomatis, menganalisis data, memantau pipeline, dan menjaga kualitas data.

## Domain 3 introduction
### Isi domain
- Data operations menjalankan data management (quality, governance, security) dalam praktik.
- Empat task statement: 3.1 automate data processing, 3.2 analyze data, 3.3 maintain and monitor data pipelines, 3.4 ensure data quality.
- 3.2 mencakup trade-off provisioned vs serverless, SQL, visualisasi, cleansing, aggregation, rolling average, grouping, pivoting.
- 3.3 mencakup logging data aplikasi, logging akses ke layanan AWS, performance tuning, dan observability.
- 3.4 mencakup data skew, data validation, dan data profiling.
- Tema besarnya: proses transformasi yang repeatable dan reliable.

### Pola soal
- Pipeline harus bisa diulang dan andal => pilih yang otomatis (IaC, orchestration, check otomatis), bukan langkah manual.
- Soal menyebut aggregation, rolling average, grouping, atau pivoting => task 3.2, pilih layanan analisis yang mendukung operasi itu.
- Soal tentang log, audit, dan metric pipeline => task 3.3, layanan monitoring dan traceability.

## Lesson 1: Automate data processing by using AWS services
### Infrastructure as code dan CI/CD
- CloudFormation template bisa membuat seluruh pipeline: S3 bucket, EventBridge rule, Lambda, SNS topic, Step Functions, Glue job, Glue crawler.
- Contoh alur: file masuk S3, EventBridge memicu Lambda validasi, Lambda memulai state machine, state machine menjalankan Glue job, lalu Glue crawler memperbarui Data Catalog. SNS memberi notifikasi kalau gagal.
- Template disimpan di S3 atau CodeCommit untuk akses dan versi.
- CodePipeline mengotomatiskan CI/CD. Commit file Python ke CodeCommit memicu CodeBuild untuk build, integrasi, dan unit test.
- Continuous delivery menambah end-to-end test: ingest file, jalankan transformasi, validasi output.
- Catatan: CodeCommit sudah ditutup untuk pelanggan baru sejak Juli 2024, tapi masih bisa muncul di soal.

### Orchestration: Amazon MWAA vs Step Functions
- Amazon MWAA adalah Apache Airflow managed. Workflow ditulis sebagai DAG berisi task dengan dependency (Spark job, Glue job, AWS Batch job).
- Step Functions adalah layanan serverless berbentuk state machine. Tiap state bisa menjalankan task, membuat keputusan, atau menunggu event.
- Step Functions punya error handling, retry, dan visualisasi workflow bawaan.
- MWAA cocok untuk workflow kompleks yang fleksibel dan berbasis kode. Step Functions cocok untuk workflow serverless dan event-driven dengan layanan AWS.

### Troubleshooting MWAA
- Cek CloudWatch Logs untuk error dan exception, lalu log Apache Airflow sendiri.
- Periksa IAM role dan permission untuk MWAA, DAG, dan layanan terkait (Glue, S3, EMR).
- Pastikan dependency dan file reference DAG benar, dan layanan eksternal bisa diakses dari environment MWAA.
- Sesuaikan jumlah dan ukuran worker node supaya tidak out-of-memory.
- Uji DAG di lokal atau test environment dulu, pakai versi Airflow dan plugin terbaru.

### Consume dan maintain data API
- Lambda memanggil API dan memproses respons, dipicu event atau API Gateway.
- API Gateway memberi endpoint managed untuk klien eksternal dan bisa jadi frontend untuk Lambda.
- AWS SDK menangani authentication, signing request, dan parsing respons.
- Pantau error rate dan latency dengan CloudWatch.
- Caching dengan API Gateway caching atau ElastiCache. Throttling dan rate limiting di API Gateway mencegah penyalahgunaan.
- Amankan dengan IAM dan OAuth. API versioning menjaga backward compatibility. Lambda layers mengatur dependency dan mengecilkan package.

### Query dan events
- Athena cocok untuk eksplorasi cepat tanpa setup infrastruktur dan bayar per query. Hasil bisa diunduh atau disimpan ke S3.
- EventBridge rule mencocokkan event berdasarkan pattern (atribut, custom event bus), lalu mengirim ke satu atau lebih target.
- API call ke EventBridge dicatat CloudTrail. EventBridge schema registry adalah fitur opsional untuk mengelola event schema.
- Contoh Step Functions: Lambda cek ekstensi file, Choice state memutuskan. File didukung diproses Lambda kedua, file tidak didukung memicu notifikasi SNS.
- CloudTrail tidak mencatat object-level data events S3 secara default. Buat trail yang mencatat management dan data events.
- EventBridge rule dengan service S3, operasi dan bucket tertentu, dan target state machine memulai workflow saat file masuk.

### Pola soal
- Workflow kompleks berbasis kode, DAG, Airflow => Amazon MWAA.
- Workflow serverless dan event-driven dengan retry bawaan => Step Functions.
- Bangun ulang infrastruktur pipeline secara konsisten => CloudFormation template.
- Commit kode lalu otomatis build dan unit test => CodePipeline dengan CodeBuild.
- Picu proses saat file baru masuk S3 lewat CloudTrail dan EventBridge => aktifkan CloudTrail data events, karena default tidak dicatat.
- API kebanjiran request => throttling dan rate limiting di API Gateway.
- Respons API lambat karena backend terbebani => API Gateway caching atau ElastiCache.
- DAG MWAA gagal => cek CloudWatch Logs dan log Airflow, lalu IAM, dependency, dan ukuran worker.

## Lesson 2: Analyze data by using AWS services
### Operasi manipulasi data
- Aggregation merangkum banyak record jadi satu nilai: Redshift (sum, average, count), Athena (GROUP BY), OpenSearch Service (date histogram, term aggregation).
- Rolling average menghitung rata-rata dalam window untuk meratakan fluktuasi: Redshift (window function AVG) dan QuickSight (moving calculation).
- Grouping: Redshift dan Athena (GROUP BY), QuickSight (dimensions dan aggregations).
- Pivoting mengubah baris jadi kolom: Redshift (PIVOT clause) dan QuickSight (pivot table).

### Layanan untuk data consumer
- QuickSight: dashboard interaktif dan ad hoc analysis.
- AWS Glue DataBrew: visual data preparation tanpa kode.
- Athena: SQL di data S3. Redshift: SQL untuk dataset besar. EMR: Spark dan Hadoop.
- AWS Glue: discover, catalog, transform, dan generate kode ETL otomatis.
- AWS Data Pipeline: orkestrasi data antar layanan AWS dan on-premises. Catatan: Data Pipeline sudah maintenance mode, tidak menerima pelanggan baru.
- Lake Formation: akses aman ke data dari banyak sumber di data lake.

### Contoh skenario
- Script di EC2 tiap 8 jam membersihkan data S3 jadi CSV untuk spreadsheet, lalu butuh dashboard dan search. Solusi: pindah ke Lambda, kirim hasil ke OpenSearch, picu dengan EventBridge tiap 8 jam.
- Data sensor IoT dengan laporan visual harian yang cost-effective: EMR transient cluster agregasi tiap malam lalu otomatis terminate, laporan di QuickSight.
- EMR punya dua jenis cluster: transient dan persistent.

### SQL di berbagai layanan
- Sintaks SQL konsisten walau tiap layanan menjalankannya berbeda. RDS dan Aurora memakai SQL untuk CRUD.
- DynamoDB mendukung PartiQL, bahasa query kompatibel SQL untuk data terstruktur, semi-structured, nested, dan schemaless.
- Amazon DocumentDB kompatibel MongoDB dan bisa memakai query mirip SQL.
- Athena bisa menjalankan aplikasi Spark lewat Python atau Athena notebook APIs. EMR menyediakan Jupyter Notebook untuk kode Spark.

### Verifikasi dan cleaning data
- Lambda untuk validasi dan enrichment custom. Athena untuk verifikasi berbasis SQL.
- QuickSight untuk eksplorasi visual. Jupyter Notebooks untuk cleaning kompleks.
- SageMaker Data Wrangler untuk menyiapkan data bagi model ML.
- Satu workflow wajar memakai beberapa layanan sekaligus.

### Pola soal
- Rolling atau moving average => Redshift window function atau QuickSight moving calculation.
- Pivot baris jadi kolom => Redshift PIVOT clause atau pivot table QuickSight.
- Dashboard plus fitur search atau log analytics => Amazon OpenSearch Service.
- Batch harian cost-effective di EMR => transient cluster yang otomatis terminate.
- Dashboard interaktif untuk business user => QuickSight.
- Clean dan normalize data secara visual tanpa kode => AWS Glue DataBrew.
- Query DynamoDB dengan sintaks mirip SQL => PartiQL.
- Database kompatibel MongoDB => Amazon DocumentDB.
- Siapkan data untuk model ML => SageMaker Data Wrangler.
- Ganti cron di EC2 tanpa server => Lambda dipicu EventBridge.

## Lesson 3: Maintain and monitor data pipelines
### Monitoring dan observability
- Sisi data: cek input, output, dan schema. Jalankan quality test di input dan hasil transformasi supaya bisa flag issue, rollback, dan cari root cause.
- Metric operasi: query queue length, query concurrency, memory usage, storage utilization, network latency, disk I/O.
- Query lambat direfactor. Kalau query sudah bagus, tune database (cluster atau cache tabel) atau scale up compute.
- Tool: CloudWatch, X-Ray, CloudWatch Logs Insights, GuardDuty, Inspector, Security Hub. Aplikasi harus di-instrument untuk traces, metrics, dan logs.

### Logging data aplikasi
- CloudWatch Logs menyimpan log dan memberi notifikasi saat threshold tercapai.
- CloudWatch Events mengirim system events near real-time dengan rule. Catatan: CloudWatch Events sekarang bagian dari EventBridge.
- EventBridge merutekan event dari aplikasi sendiri, SaaS, dan layanan AWS ke target seperti Lambda.
- X-Ray memberi end-to-end tracing untuk aplikasi terdistribusi dan microservices.
- Lambda otomatis mencatat tiap invocation. ALB access logs mencatat request time, client IP, user agent.
- RDS punya error log, slow query log, dan general log.
- Log group adalah wadah log streams. Bisa dibuat lewat CloudFormation. Default retensi CloudWatch Logs selamanya, atur retention policy untuk biaya dan aturan retensi.

### Traceability dan audit
- CloudTrail mencatat semua API call: siapa, apa, kapan. Log dikirim ke S3 atau CloudWatch Logs.
- AWS Config mencatat riwayat konfigurasi resource. AWS Managed Rules menilai kepatuhan terhadap best practice.
- CloudFormation StackSets men-deploy konfigurasi CloudTrail, CloudWatch, dan Config ke banyak akun dan Region.
- VPC Flow Logs mencatat IP traffic network interface di VPC.
- Security Hub menggabungkan finding GuardDuty, Inspector, dan Config ke satu dashboard.
- Macie mengirim policy finding dan sensitive data finding ke EventBridge sebagai event, dan ke Security Hub kalau publication settings diatur. Macie tidak mengirim log ke CloudWatch Logs.

### Troubleshooting performa
- Bandingkan CPU, memory, network, disk I/O, dan performa database dengan baseline.
- Cek AWS Health Dashboard dulu sebelum debug aplikasi.
- Baca log aplikasi di CloudWatch Logs, lalu log spesifik Lambda, RDS, atau EC2.
- VPC Flow Logs dan Network Load Balancer access logs membantu melihat latency dan packet loss.
- Kasus Kinesis Data Streams 40 shard, consumer KCL di Auto Scaling group, hasil ke DynamoDB: CPU di bawah 35 persen dan tidak ada ProvisionedThroughputExceededException. Jadi naikkan write capacity DynamoDB.
- Redshift dengan long running query: atur scaling pada workload management (WLM) queue lewat parameter group, supaya query pendek tidak antre.

### Error handling per layanan
- Managed service menangani banyak error sendiri. Di EMR dan Kinesis Data Streams, kamu yang memprogram perilaku saat error.
- Aplikasi Hadoop baru di EMR: aktifkan debugging, uji dengan subset data kecil yang representatif, jalankan step satu per satu.
- Kinesis Data Streams: masalah producer (gagal connect, lambat menulis) dan consumer (masalah record, menerima lambat).
- Managed Service for Apache Flink: masalah umum adalah akses stream, data hilang, gagal proses, error aplikasi. Selidiki lewat CloudWatch Logs.
- Flink bisa mendeteksi anomali dengan random cut forest, lalu Lambda bertindak. Catatan: RANDOM_CUT_FOREST berasal dari Kinesis Data Analytics for SQL, yang sudah dihentikan AWS.
- Firehose retry sampai retry duration habis, lalu backup ke S3 backup bucket. Kalau tujuan S3 atau backup S3 gagal, retry sampai retention period habis. Catatan: namanya sekarang Amazon Data Firehose.

### Pola soal
- Siapa mengubah apa dan kapan => CloudTrail.
- Riwayat konfigurasi resource dan cek compliance => AWS Config dengan Managed Rules.
- Deploy konfigurasi logging ke banyak akun dan Region => CloudFormation StackSets.
- Tracing request di microservices => X-Ray.
- Remediasi otomatis finding Macie (bucket jadi publik) => EventBridge rule ke Lambda, bukan CloudWatch Logs.
- Biaya log CloudWatch Logs terus naik => atur retention policy.
- Kinesis dan consumer sehat tapi latency tinggi, hasil ke DynamoDB => naikkan write capacity DynamoDB.
- Query pendek di Redshift tertahan query panjang => atur WLM queue lewat parameter group.
- Deteksi anomali di data streaming => Managed Service for Apache Flink dengan random cut forest.

## Lesson 4: Ensure data quality
### Prinsip
- Konsumen harus percaya pada data. Kerja mundur dari pelanggan: siapa pemakai, bagaimana dipakai, apa yang dibutuhkan.
- Tidak menerbitkan data lebih baik daripada menerbitkan data buruk. Check otomatis harus bisa menghentikan pipeline.
- Duplikat di kolom primary key: kirim notifikasi. Proses tidak selalu harus dihentikan seluruhnya.
- Taruh check sebelum, selama, dan sesudah transformasi. Terlalu banyak check memicu false positive, terlalu sedikit membuat masalah lolos.

### Data profiling dan validation
- Profiling melihat null, distribusi, anomali, cardinality, relasi antar field, dan statistik (min, max, mean, median, standard deviation).
- DataBrew membuat profil tanpa kode. Athena dan Redshift untuk profiling dengan SQL. EMR Spark untuk script custom. Ada juga tool di AWS Marketplace.
- Validation punya empat dimensi: completeness, consistency, accuracy, integrity.
- Check saat pemrosesan: DataBrew recipes untuk field kosong, format, dan uniqueness. EMR Spark untuk check custom.
- Lambda untuk check kompleks dan remediasi, Step Functions untuk orkestrasi berdasarkan hasil validasi. Data Wrangler untuk missing value dan duplikat.

### Duplikat di Redshift
- Kasus: CSV di S3, Glue crawler mengisi Data Catalog, Glue job menulis ke Redshift, lalu muncul duplikat setelah dijalankan ulang.
- Solusi: Glue job menulis ke staging table, lalu mengganti baris yang sudah ada di target sebelum data baru disimpan.
- Merge: join staging table dengan target, lalu update dan insert. Upsert lewat Glue job menghilangkan duplikat.

### Data sampling
- S3 Select mengambil subset data dari object S3 dengan query mirip SQL. Catatan: S3 Select tidak tersedia untuk pelanggan baru sejak Juli 2024.
- Athena dan Redshift: LIMIT clause.
- EMR Spark: systematic, random, atau stratified sampling.
- Data Wrangler: sampling untuk dataset seimbang. DataBrew: filter subset lewat transformasi.

### Data skew
- Data skew adalah distribusi tidak rata antar partition atau node, sehingga muncul bottleneck.
- Deteksi: CloudWatch custom metrics (record per partition atau key, waktu proses) dengan alarm threshold.
- Glue ETL: CloudWatch metrics dan Glue job bookmarks, yang membuat job lanjut dari record terakhir yang diproses.
- EMR Spark: logging detail ke CloudWatch Logs, cari task lama, distribusi task tidak rata, partition yang skew. Real-time: Spark Streaming dengan Kinesis atau Kafka.
- Penanganan: partitioning key dengan hash function, load balancing, replikasi data hotspot, shuffling, dynamic repartitioning.
- Skew join: bloom filter atau skew join algorithm. EMR punya skew join optimization otomatis. Redshift punya adaptive join (hash join atau sort merge join).
- Pre-processing (data binning, feature scaling, log transformation) dan task yang lebih kecil membantu meratakan beban.

### Partitioning dan bucketing di Athena
- Strategi umum: partisi per tanggal (year, month, day). Filter WHERE di kolom partisi hanya membaca prefix S3 terkait.
- Partitioning dan bucketing sama-sama mengurangi data yang dipindai Athena.
- Bucket di sini bukan S3 bucket. Bucket adalah file, hash function menentukan bucket tiap record, dan nomor bucket ada di nama file.
- Engine v2 mendukung Hive bucketing. Engine v3 juga mendukung Spark bucketing. Default Hive. Untuk Spark, set bucketing_format ke spark di TBLPROPERTIES.

### Redshift Spectrum dan DataBrew rules
- Join data histori di S3 (terdaftar di Data Catalog) dengan tabel Redshift: Redshift Spectrum external table, lalu join dengan SQL.
- DataBrew rules: completeness (null), format (email, nomor telepon), range (rentang angka), uniqueness (duplikat).
- DataBrew menandai record yang tidak lolos, memberi statistik dan visualisasi, dan bisa diotomatiskan.

### Pola soal
- Duplikat di Redshift setelah Glue job dijalankan ulang => staging table lalu merge atau upsert.
- Profiling atau data quality rule tanpa kode => AWS Glue DataBrew.
- Join data S3 dengan tabel Redshift tanpa memindahkan data => Redshift Spectrum.
- Kurangi data yang dipindai Athena => partitioning per tanggal dan bucketing.
- Dataset Athena di-bucket dengan Spark => set bucketing_format ke spark di TBLPROPERTIES.
- Join lambat karena key skew di EMR => skew join optimization.
- Pantau skew dan kirim alert => CloudWatch custom metrics dan alarm.
- Glue job harus lanjut dari record terakhir => Glue job bookmarks.
- Sampling cepat beberapa baris => LIMIT di Athena atau Redshift.

## Angka dan batas penting
- Domain 3 punya 4 task statement (3.1 sampai 3.4).
- CloudTrail tidak mencatat object-level data events S3 secara default.
- Retensi default CloudWatch Logs: tanpa batas.
- Skenario EC2 tiap 8 jam diganti Lambda yang dipicu EventBridge tiap 8 jam.
- Skenario Kinesis: 40 shard, CPU di bawah 35 persen, tanpa ProvisionedThroughputExceededException.
- EMR punya 2 jenis cluster: transient dan persistent.
- Validation punya 4 dimensi. DataBrew menyebut 4 contoh rule.
- Quality check di 3 titik: sebelum, selama, sesudah transformasi.
- Athena engine v2: Hive bucketing. Engine v3: Hive dan Spark. Default Hive.

## Jebakan ujian
- MWAA untuk workflow berbasis kode (DAG). Step Functions untuk workflow serverless event-driven.
- Macie tidak mengirim log ke CloudWatch Logs. Remediasi otomatis lewat EventBridge.
- CloudTrail mencatat API call. AWS Config mencatat riwayat konfigurasi dan compliance.
- Tanpa CloudTrail data events, event object-level S3 tidak tercatat dan rule EventBridge berbasis CloudTrail tidak terpicu.
- Saat latency tinggi, cek metric dulu sebelum menambah shard atau instance. Kalau CPU rendah dan tidak ada throughput exception, masalahnya di komponen lain.
- Cek AWS Health Dashboard sebelum menyalahkan aplikasi sendiri.
- Bucket di Athena bukan S3 bucket.
- Kata "cost-effective" untuk job berkala di EMR mengarah ke transient cluster.
- Di EMR dan Kinesis Data Streams, error handling harus diprogram sendiri.
- Dashboard dengan search dan log analytics mengarah ke OpenSearch, bukan QuickSight.
- Lebih banyak quality check tidak selalu lebih baik.

## Sumber tambahan
- Workflow Orchestration (https://docs.aws.amazon.com/whitepapers/latest/best-practices-building-data-lake-for-games/workflow-orchestration.html)
- Tanpa judul, tipe cloud storage (https://aws.amazon.com/what-is/cloud-storage/)
- Tanpa judul, contoh Python Glue data Medicaid (https://docs.aws.amazon.com/glue/latest/dg/aws-glue-programming-python-samples-medicaid.html)
- AWS Step Functions (http://aws.amazon.com/step-functions/)
- Amazon Managed Workflows for Apache Airflow (http://aws.amazon.com/managed-workflows-for-apache-airflow/)
- Tanpa judul, tutorial Amazon S3 (https://docs.aws.amazon.com/AmazonS3/latest/userguide/tutorials.html)
- Using Apache Spark in Amazon Athena (https://docs.aws.amazon.com/athena/latest/ug/notebooks-spark.html)
- Data Warehousing on AWS (https://docs.aws.amazon.com/whitepapers/latest/data-warehousing-on-aws/data-warehousing-on-aws.html)
- Data Processing (https://docs.aws.amazon.com/step-functions/latest/dg/use-cases-data-processing.html)
- PartiQL: A SQL-Compatible Query Language for Amazon DynamoDB (https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ql-reference.html)
- Tanpa judul, Amazon Redshift Management Guide (https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html)
- Tanpa judul, orkestrasi EMR dengan Apache Livy (https://aws.amazon.com/blogs/big-data/build-a-concurrent-data-orchestration-pipeline-using-amazon-emr-and-apache-livy/)
- Amazon SageMaker Notebook Instances (https://docs.aws.amazon.com/sagemaker/latest/dg/nbi.html)
- DevOps Guidance (https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/devops-guidance.html)
- What Is AWS Glue DataBrew? (https://docs.aws.amazon.com/databrew/latest/dg/what-is.html)
- Tanpa judul, Kinesis Data Streams quotas and limits (https://docs.amazonaws.cn/en_us/streams/latest/dev/service-sizes-and-limits.html)
