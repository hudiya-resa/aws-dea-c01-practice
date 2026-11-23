# Domain 1: Data Ingestion and Transformation
Cara memasukkan data ke AWS, mengubahnya jadi berguna, mengatur alur pipeline, dan konsep pemrograman di baliknya.

## Domain 1 introduction
### Ingestion dan integration
- Data ingestion: memindahkan data dari titik A ke titik B.
- Data integration: menggabungkan beberapa sumber jadi dataset baru (contoh: advertising plus web analytics jadi user profile). Ini bagian dari transformation.
- Cara ingest: direct database connection, change data capture, API, message queue, event streaming, file export, object storage (Amazon S3).
- Cara transform: queries, modeling, transformations.

### Empat task statement
- 1.1 Perform data ingestion: throughput, latency, streaming dan batch.
- 1.2 Transform and process data: ETL pipeline, volume, velocity, variety, distributed computing.
- 1.3 Orchestrate data pipelines: jadwal, dependency, event-driven, serverless workflow.
- 1.4 Apply programming concepts: CI/CD, SQL, infrastructure as code, data structure (graph, tree).

### Pola soal
- Soal error, limit, throttling => fokus ke Amazon DynamoDB, Amazon RDS, Amazon Kinesis (disebut instruktur).
- Gabung data banyak sumber jadi dataset baru => data integration, bagian dari transformation.
- Pindah data apa adanya ke target => data ingestion.

## Lesson 1: Perform data ingestion
### Lifecycle dan konsep dasar
- Stage: generation, storage, ingestion, transformation, serving.
- Generation adalah source system. Data engineer memakai datanya tapi tidak mengendalikan sistemnya.
- Dua konsep besar: batch vs streaming, push vs pull.
- Alur: producer (database, mobile, aplikasi) ke alat ingestion ke consumer (EC2, database AWS, Lambda).

### Replayability
- Pipeline bisa memproses ulang data saat gagal atau logika berubah.
- Rancang event-driven: Amazon S3, Amazon Kinesis, Amazon EventBridge memicu event saat data baru datang.
- Uji idempotent: data sama diproses berkali kali tanpa hilang atau dobel.
- Pasang checkpoint supaya bisa lanjut dari titik terakhir yang sukses.
- Simpan raw atau intermediate data di S3 (versioning, compliance, replay). Deploy dengan CloudFormation atau AWS CDK.

### Contoh S3, Athena, Redshift
- File TSV di S3: daftarkan ke Amazon Athena lalu query ad hoc dengan SQL. Ubah ke Parquet supaya query lebih cepat.
- Tim BI butuh warehouse: masukkan ke Amazon Redshift, gabungkan dengan data S3 lewat Redshift Spectrum.
- Tabel Athena ikut update saat data baru tiba: AWS Glue crawler.
- COPY lambat dari satu gzip besar: pecah jadi file kecil, jumlahnya kelipatan jumlah slice. COPY memakai MPP dan memuat paralel. Atur distribution key.

### Service per use case
- Data lake: S3, tanpa schema di awal. Warehouse atau lakehouse: Redshift dan Redshift Spectrum.
- Big data processing: Amazon EMR. Real-time analytics: Kinesis dan Amazon MSK.
- Operational analytics (monitoring aplikasi, log, clickstream) near real time: Amazon OpenSearch Service.
- Transactional (data kecil, cepat): DynamoDB dan RDS. AWS DMS memakai transaction log untuk CDC, migrasi engine (Oracle ke Aurora), dan replikasi terus ke S3.

### Lima V data
- Variety: jenis data. Volume: ukuran dan pertumbuhan, perhatikan batas ukuran record per service.
- Velocity: bedakan real time dan near real time. Service untuk traffic naik turun: Kinesis, MSK, OpenSearch, Lambda.
- Veracity: kualitas dan kelengkapan (contoh sensor IoT mati).
- Value: V paling penting. Data yang diolah tapi tidak bernilai adalah buang uang.

### Keluarga Kinesis
- Streaming: banyak event kecil (sekitar 1 KB), hot data, dibatasi waktu atau jumlah event.
- Kinesis Data Firehose: buffer sesuai periode lalu tulis ke S3, Redshift, OpenSearch Service. Catatan: sekarang bernama Amazon Data Firehose.
- Kinesis Data Streams: real time, latency rendah, aplikasi custom.
- Amazon Managed Service for Apache Flink (dulu Kinesis Data Analytics): analitik stream pakai SQL atau Flink.
- Kinesis Video Streams: video, audio, thermal imagery, radar. Kinesis Agent: baca file lalu kirim ke Streams atau Firehose.
- Hot shard (write throttled): UpdateShardCount untuk tambah shard, random partition key, pasang alarm metrik.

### Service ingestion lain dan batch
- MSK untuk mengganti cluster Kafka yang ada, bayar cluster walau idle. Kinesis serverless, bayar throughput.
- Amazon AppFlow: dari SaaS. AWS Transfer Family: FTP dan SFTP ke S3. AWS DataSync: on-premises NFS dan SMB. Snow Family: data sangat besar.
- Batch: payload besar, jadwal per jam sampai mingguan, untuk cold data. EMR (Spark plus JDBC) atau AWS Glue (fully managed ETL, JDBC, Glue Studio).
- Stateful: ElastiCache for Redis, RDS. Stateless: Lambda, API Gateway, S3.

### Pola soal
- Query ad hoc file di S3 => Amazon Athena.
- Tabel Athena perlu update saat data baru tiba => Glue crawler.
- Data warehouse plus data di S3 => Redshift plus Redshift Spectrum.
- COPY Redshift lambat dari satu file besar => pecah jadi kelipatan jumlah slice.
- Kinesis Data Streams throttled => UpdateShardCount plus random partition key.
- Streaming baru, bayar sesuai throughput => Kinesis. Migrasi Kafka yang ada => MSK.
- SaaS => AppFlow. FTP atau SFTP => Transfer Family. NFS atau SMB on-premises => DataSync. Data sangat besar => Snow Family.
- Replikasi perubahan database terus ke S3 => AWS DMS.
- Log dan clickstream near real time dengan pencarian => OpenSearch Service.

## Lesson 2: Transform and process data
### Modeling, OLTP, OLAP
- Pahami model conceptual, logical, physical, normalization, dan data vault.
- OLTP: transaksi real time, state terbaru, storage kecil, respons cepat (order, payment).
- OLAP: analisis dan reporting, histori, star atau snowflake schema, storage terabyte sampai petabyte.
- Transformasi: ubah tipe data, standarkan format, buang data jelek, agregasi untuk report atau fitur ML.
- Transformasi bisa terjadi saat ingestion. Contoh: Firehose menulis Parquet.

### Service processing
- Cloud computing: Lambda, EMR, Glue, Redshift. Distributed: EMR, AWS Batch, Step Functions.
- Lambda untuk validasi dan transform ringan, misalnya tiap file CSV yang masuk S3.
- AWS Glue: serverless, engine Python atau Spark, data di S3.
- Glue Data Catalog memberi logical view atas file hasil DMS (satu prefix per tabel). Query lewat Athena atau dipakai di kode ETL EMR dan Glue.
- Glue crawler menebak schema dan mengisi katalog otomatis.

### Glue vs EMR vs Flink
- EMR: Hadoop penuh (Spark, Hive, Hudi, HBase, Presto, Pig), lebih mampu dari Glue, tapi tidak fully managed.
- Spark di EMR: buat cluster, atur memory dan executor cores, kirim job dengan spark-submit, scale naik atau turun.
- Glue: fully managed, cukup untuk cleansing, enrichment, data movement.
- Flink: transformasi dasar SQL. Transformasi kompleks pindah ke EMR atau Glue.

### Contoh arsitektur
- IoT aman near real time: Firehose ke S3, Lambda membuang data sensitif sebelum disimpan.
- Log web di EC2: Kinesis Agent ke Firehose, ke S3 dan ke Flink, lalu Firehose kedua ke OpenSearch, visual di Kibana.
- Kurangi beban Redshift saat join histori di S3: Redshift Spectrum external table.
- Enrich CloudWatch Logs dengan DynamoDB: subscription CloudWatch Logs ke Firehose, Lambda untuk enrich, tujuan S3.

### Troubleshooting
- Cek log service, kualitas data tiap stage, lalu logika mapping, filter, agregasi.
- Glue punya development mode dan debugging mode. Debug dengan dataset kecil.
- Optimasi: partitioning, paralel, tuning memory dan executor, caching.
- Incremental processing untuk data baru saja. Retry untuk gangguan sementara.
- Uji unit, integration, end-to-end di staging.

### Konektivitas dan data API
- JDBC: Java API. Siapkan driver, buka port di security group inbound, URL berisi host, port, nama database.
- ODBC: instal driver, buat DSN, aplikasi konek lewat DSN.
- RDS, Aurora, Redshift mengurangi konfigurasi JDBC atau ODBC manual.
- Data API: API Gateway (auth, rate limiting, caching, versioning) plus Lambda. Keamanan: IAM, Certificate Manager, API key, OAuth.
- Cache: ElastiCache atau cache API Gateway. Monitor: CloudWatch. CI/CD: CodePipeline dan CodeBuild.

### Pola soal
- Spark serverless, cukup cleansing dan movement => AWS Glue.
- Butuh kontrol cluster dan ekosistem Hadoop => Amazon EMR.
- Transformasi stream dasar pakai SQL => Managed Service for Apache Flink.
- Validasi ringan tiap file di S3 => Lambda.
- Schema otomatis untuk file di S3 => Glue crawler plus Data Catalog.
- Join histori S3 tanpa membebani Redshift => Redshift Spectrum.
- IoT near real time, buang data sensitif => Firehose plus Lambda, ke S3.
- Enrich CloudWatch Logs => subscription ke Firehose plus Lambda.
- Buka data ke sistem lain secara aman => API Gateway plus Lambda plus IAM.

## Lesson 3: Orchestrate data pipelines
### Konsep pipeline
- Kenali arsitektur: data warehouse, data lake, lakehouse, Lambda, Kappa, data mesh. Rujukan: Well-Architected Framework, enam pilar.
- Pipeline: kumpulan task dengan urutan tertentu, sekuensial atau paralel. Urutannya disebut workflow.
- Serverless orchestration: Step Functions dan Lambda.
- Airflow wajib DAG, Step Functions tidak.
- Correction Notice: video menyebut "Directed Acrylic Graph". Yang benar Directed Acyclic Graph, graph berarah tanpa siklus.
- Banyak file kecil jadi satu batch: kirim manifest file, S3 event notification hanya untuk prefix "manifest", lalu cek tiap file. Tetap event-driven.

### Kegagalan dan retry
- Data quality (dapat JSON padahal menunggu CSV) dan code error: hard failure.
- Endpoint error: jaringan sementara soft failure, permission salah hard failure.
- Dependency error: di dalam atau antar pipeline.
- Step Functions: interval 10 detik, backoff rate 1.5, jeda 10, 15, 22.5 detik.
- Alert: Amazon SNS topic dengan subscription email.

### Pilihan service
- Serverless: AWS Data Pipeline dan Step Functions. Managed open source: Amazon MWAA. Khusus: Glue workflows.
- Data Pipeline: ETL terjadwal antara AWS dan on-premises, bisa JDBC on-premises. Instruktur memilihnya untuk lingkungan kurang kompleks.
- Step Functions: visual low code atau Amazon States Language (JSON), untuk yang lebih kompleks. Dipicu EventBridge atau API.
- Glue workflows: kalau pipeline murni komponen Glue, pakai trigger. Service lain lewat Glue Python shell job dengan Boto3.
- MWAA: Airflow terkelola, DAG ditulis Python.
- Catatan: AWS Data Pipeline sudah maintenance mode sejak 2024. CloudWatch Events sekarang bagian dari EventBridge.

### Contoh pipeline
- Raw zone dari Firehose, DMS, DataSync. S3 memicu Lambda yang menjalankan crawler.
- Rule CloudWatch Events memicu Glue ETL ke Parquet di processed zone, lalu SNS kirim email.
- Step Functions dengan EMR: Lambda submit Spark job, tunggu, cek status, ke success atau failure.
- Choice state membaca job status. Catch statement menjalankan Lambda notifikasi saat error.
- Athena atas data di dua Region: Glue crawler di satu Region mengkatalog semua Region.

### Best practice
- Distributed processing, auto scaling, partitioning.
- Storage fault-tolerant: S3 atau EFS. Backup: S3 atau AWS Backup.
- CloudWatch alarm. Retry dengan Step Functions atau Glue workflows.
- Validasi data, testing, version control, CI/CD.

### Pola soal
- Pipeline murni crawler dan job Glue => Glue workflows.
- Glue workflow perlu EMR atau SQS => Python shell job dengan Boto3.
- Airflow terkelola => Amazon MWAA.
- Banyak job berurutan, kompleks, tanpa aplikasi terpisah => Step Functions.
- Proses batch hanya setelah semua file lengkap => manifest file plus filter prefix S3 event.
- Retry dengan jeda makin panjang => backoff rate Step Functions.
- Email saat gagal atau selesai => SNS.
- Query Athena lintas Region => satu Glue crawler mengkatalog semua Region.

## Lesson 4: Apply programming concepts
### SQL vs Spark
- SQL: standar dan dikenal luas. Spark: lebih fleksibel untuk proses kompleks dengan syarat latency dan throughput.
- Spark di AWS: Glue (serverless), EMR, ECS atau EKS, partner seperti Databricks.
- Target di Redshift berarti ELT, pakai SQL.
- Transform di Spark lalu load ke warehouse berarti ETL, beban warehouse fokus ke query user.
- Redshift: parser dan optimizer membuat query plan, execution engine mengirim kode ke compute node.

### Alat ETL
- EMR: Hadoop, Spark, HBase, Presto, YARN, Tez, Pig, satu sampai ribuan node.
- Data Pipeline: data node dan activity (S3 data node, Hive activity di EMR, Redshift copy activity).
- Glue Studio: transformasi visual SQL di engine Spark untuk yang tidak bisa Spark. Glue DataBrew: transformasi atas sekumpulan file.
- Nama kolom Athena hanya alfanumerik dan underscore (/var/log jadi var_log).

### Optimasi runtime
- Paralel dan batch processing.
- Parquet atau ORC, kompresi, partisi per tanggal atau Region.
- Filter data sejak awal, incremental processing.
- Tuning memory dan parallelism, monitor dengan CloudWatch.

### IaC, CI/CD, Lambda
- CloudFormation atau CDK untuk deploy berulang. AWS SAM untuk Lambda, Step Functions, DynamoDB.
- Template di CodeCommit atau GitHub, CI/CD jalan saat ada commit. Catatan: CodeCommit tidak menerima pelanggan baru sejak 2024.
- Lambda: atur memory, concurrency limit, timeout, retry. Asynchronous invocation kalau tidak perlu respons langsung.
- Provisioned concurrency untuk prewarm. Lambda di VPC menambah latency.

### Data structure dan algoritma
- Data structure: relational, NoSQL, warehouse, distributed file system, message queue, tree, hash table.
- Algoritma untuk satu data structure jadi tidak efisien di data structure lain. Sorting besar: Quicksort atau Merge Sort.
- Contoh: data pelanggan besar di HDFS di EMR, diproses dengan MapReduce.
- Data hilang di consumer Kinesis Java: idempotent processing dan shard iterator ke posisi sebelum error.

### Pola soal
- Target transformasi di Redshift => SQL (ELT).
- Kurangi beban warehouse => Spark di Glue atau EMR lalu load (ETL).
- Transformasi SQL tanpa skill Spark => Glue Studio. Transformasi sekumpulan file => Glue DataBrew.
- Kolom Athena berisi slash, spasi, titik => ganti dengan underscore.
- Deploy pipeline serverless => AWS SAM. Infrastruktur berulang => CloudFormation atau CDK.
- Lambda perlu prewarm => provisioned concurrency.
- Data hilang di consumer Kinesis => idempotent plus GetShardIterator.
- Job lambat atas data besar => Parquet, partisi, kompresi, filter awal.

## Angka dan batas penting
- Payload streaming contoh: sekitar 1 KB per event.
- Jumlah file COPY Redshift: kelipatan jumlah slice.
- Retry Step Functions: interval 10 detik, backoff 1.5, jeda 10, 15, 22.5 detik.
- Batch: per jam, harian, mingguan.
- OLAP: terabyte sampai petabyte.
- Well-Architected: enam pilar. Lima V data. Lifecycle lima stage.
- Kapasitas Kinesis Data Streams dihitung per shard.
- Nama kolom Athena: alfanumerik dan underscore saja.

## Jebakan ujian
- Data Streams (real time, aplikasi custom) vs Firehose (buffer, near real time, langsung ke tujuan).
- Real time vs near real time, baca kata kuncinya.
- Kinesis vs MSK: solusi baru pilih Kinesis, mengganti Kafka yang ada pilih MSK.
- Glue (fully managed) vs EMR (lebih lengkap, perlu kelola cluster).
- Flink hanya untuk transformasi dasar SQL.
- DataSync vs Transfer Family vs Snow Family vs AppFlow: bedakan dari protokol dan sumbernya.
- Hard failure tidak selesai dengan retry. Soft failure bisa.
- Trigger hanya pada file manifest tetap dihitung event-driven.
- Glue workflows hanya pas kalau pipeline murni Glue.
- Stateful (ElastiCache, RDS) vs stateless (Lambda, API Gateway, S3).

## Sumber tambahan
- Code Example: Data Preparation Using ResolveChoice, Lambda, and ApplyMapping (https://docs.aws.amazon.com/glue/latest/dg/aws-glue-programming-python-samples-medicaid.html)
- AWS Glue PySpark Transforms Reference (https://docs.aws.amazon.com/glue/latest/dg/built-in-transforms.html)
- How to Extract, Transform, and Load Data for Analytic Processing Using AWS Glue (Part 2) (https://aws.amazon.com/blogs/database/how-to-extract-transform-and-load-data-for-analytic-processing-using-aws-glue-part-2/)
- ETL Processing Using AWS Data Pipeline and Amazon Elastic MapReduce (https://aws.amazon.com/blogs/big-data/etl-processing-using-aws-data-pipeline-and-amazon-elastic-mapreduce/)
- AWS Data Pipeline Concepts (https://docs.aws.amazon.com/datapipeline/latest/DeveloperGuide/dp-concepts.html)
- Working with Pipelines (https://docs.aws.amazon.com/datapipeline/latest/DeveloperGuide/dp-managing-pipeline.html)
- Build a Concurrent Data Orchestration Pipeline Using Amazon EMR and Apache Livy (https://aws.amazon.com/blogs/big-data/build-a-concurrent-data-orchestration-pipeline-using-amazon-emr-and-apache-livy/)
- Overview of Workflows in AWS Glue (https://docs.aws.amazon.com/glue/latest/dg/workflows_overview.html)
- Amazon Managed Streaming for Apache Kafka (MSK) (https://aws.amazon.com/blogs/aws/amazon-managed-streaming-for-apache-kafka-msk-now-generally-available/)
- Amazon Kinesis Data Streams Quotas and Limits (https://docs.amazonaws.cn/en_us/streams/latest/dev/service-sizes-and-limits.html)
- AWS Glue Components (https://docs.aws.amazon.com/glue/latest/dg/components-overview.html)
- Overview of Amazon EMR (https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-overview.html)
- Device Communication Protocols for AWS IoT (https://docs.aws.amazon.com/iot/latest/developerguide/iot-message-broker.html)
- Orchestrate an ETL Pipeline with Validation, Transformation, and Partitioning Using AWS Step Functions (https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/orchestrate-an-etl-pipeline-with-validation-transformation-and-partitioning-using-aws-step-functions.html)
- Tuning Query Performance (https://docs.aws.amazon.com/redshift/latest/dg/c-optimizing-query-performance.html)
- Basic Git Commands (https://docs.aws.amazon.com/codecommit/latest/userguide/how-to-basic-git.html)
- GetShardIterator (https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetShardIterator.html)
