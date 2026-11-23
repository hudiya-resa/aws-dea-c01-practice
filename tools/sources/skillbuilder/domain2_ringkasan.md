# Domain 2: Data Store Management
Memilih data store, membuat data catalog, mengatur lifecycle data, dan merancang data model serta schema evolution.

## Domain 2 introduction
### Isi domain
- Empat task statement: 2.1 choose a data store, 2.2 data cataloging systems, 2.3 lifecycle of data, 2.4 data models dan schema evolution.
- Storage adalah tahap ketiga data engineering lifecycle. Data disimpan berkali-kali selama di pipeline.
- Langkah pertama memilih storage: pahami use case, cara data disimpan, dan cara data diambil.
- 2.3 mencakup hot dan cold data, optimasi biaya, penghapusan data untuk kebutuhan bisnis dan hukum, retention, archiving, resiliency.

### Pola soal
- Soal memilih storage => mulai dari access pattern, baru pilih service.
- Soal biaya storage jangka panjang => pikirkan lifecycle (hot, warm, cold) dan retention.
- Data harus mudah ditemukan dan dipakai => data catalog dengan metadata lengkap.

## Lesson 1: Choose a data store
### Tiga jenis storage dasar
- Amazon S3: object storage, highly available, scalable, durable. Untuk static content, backup, media, dan storage dasar data lake.
- Amazon EFS: file storage fully managed yang dipakai bersama banyak EC2 instance.
- File storage lain: FSx for Windows File Server, FSx for Lustre, FSx for NetApp ONTAP.
- Amazon EBS: block storage persisten yang di-attach ke EC2. Untuk database dan aplikasi transaksional yang butuh low latency.

### Database dan warehouse
- Amazon RDS: managed relational database (MySQL, PostgreSQL, Oracle, SQL Server, dan lain-lain).
- DynamoDB: managed NoSQL, latency single-digit millisecond di skala berapa pun. Untuk real-time, gaming, IoT, dynamic scaling.
- Catatan: kursus menyebut DynamoDB mendukung graph, memory, dan search. Dalam praktik DynamoDB adalah key-value dan document database.
- Amazon Redshift: data warehouse skala petabyte untuk analytics dan BI, juga bisa menangani semi-structured dan unstructured data volume besar.
- AWS Lake Formation: build, secure, dan manage data lake. Bisa crawl, catalog, dan siapkan data.

### Faktor dan contoh pilihan
- Faktor performa: IOPS, scalability, durability, data access pattern.
- Highly parallel file system untuk HPC, analytics, ML skala besar: FSx for Lustre.
- In-memory caching, session storage, real-time analytics: ElastiCache.
- Redshift cocok untuk 30 TB data, banyak aggregated query dan complex join yang hanya memakai sebagian kolom. Alasannya columnar storage (I/O kecil), compression, parallel processing, dan dukungan SQL JOIN.

### Migrasi dan akses data
- COPY command memuat data file ke tabel Redshift, misalnya dari S3 atau EMR. COPY mengubah string ke data type kolom target.
- Kalau butuh konversi lain atau konversi default error, atur lewat parameter COPY.
- Data RDS: 3 bulan terbaru dipakai analitik, data lama sesekali di-join. Solusi: data lama ke S3, job harian dari RDS ke Redshift, join keduanya lewat Redshift Spectrum.
- Petabyte data key-value, akses langsung, SQL-like interface: Hive di EMR, simpan ke DynamoDB.
- EMR untuk job pendek: nyalakan dan matikan cluster, bayar per detik. Workload panjang: cluster highly available dengan auto scaling.

### Mencegah akses tidak sah (Redshift dan RDS)
- IAM untuk akses ke cluster dan resource, policy sesuai role.
- Security group, encryption, dan key di AWS KMS.
- Parameter group untuk parameter database, termasuk locking untuk concurrency.
- Database auditing, plus jadwal rutin cek access log dan audit trail.

### Pola soal
- Highly parallel file system, HPC => FSx for Lustre.
- In-memory cache, latency rendah => ElastiCache.
- File share untuk banyak EC2 => EFS. Block storage untuk database di EC2 => EBS.
- Banyak aggregated query dan join, hanya sebagian kolom => Redshift (columnar).
- Load file dari S3 atau EMR ke Redshift => COPY, atur parameter kalau konversi error.
- Data lama di S3 di-join dengan data di Redshift => Redshift Spectrum.
- Petabyte key-value dengan SQL-like interface => Hive di EMR plus DynamoDB.
- Batasi dan lacak akses Redshift atau RDS => IAM, security group, KMS, database auditing.

## Lesson 2: Understand data cataloging systems
### Apa itu data catalog
- Metadata repository: lokasi, deskripsi atau schema, dan runtime metrics data.
- Dipakai untuk federated query dan ETL saat data tersebar di banyak lokasi.
- AWS Glue Data Catalog berisi referensi source dan target ETL job. Satu metadata table mewakili satu data store.
- Biasanya diisi crawler, tapi ada cara lain menambah metadata table.
- Athena memakai catalog untuk tahu lokasi S3, format file (Parquet, CSV), dan partition.

### Lake Formation dan lintas akun
- Glue menyimpan business attribute sebagai key-value tag di level tabel. Lake Formation bisa key-value property di level kolom.
- Lake Formation mengatur permission di level database, table, dan column.
- Kasus 4 AWS account, tiap business unit hanya akses datanya: data lake storage di tiap akun, catalog ke akun pusat dengan Lake Formation.
- Lalu update S3 bucket policy dengan Lake Formation service-linked role, dan pakai Lake Formation permission untuk akses spesifik.
- User dan Glue ETL job bisa join tabel lintas akun dengan proteksi table-level dan column-level.

### Menjaga catalog tetap terbarui
- Jalankan Glue crawler setelah data baru masuk.
- Job baru di production: cek bahwa job memakai AWS Glue API untuk update catalog.
- Sinkronisasi partition penting untuk data terpartisi di S3 (tanggal, Region, kategori).
- Langkah: buat database Glue, buat crawler, tentukan partitioning schema, jalankan, jadwalkan sesuai frekuensi ingest, query dengan Athena.
- Partition yang tidak terdeteksi otomatis ditambah atau diubah lewat Glue API.

### Glue connection
- Connection untuk data source (ingest) atau data target (write).
- S3: path bucket dan pola inclusion/exclusion. RDS: endpoint, port, credential.
- Bisa test connection dulu. Connection dipakai crawler dan ETL job.

### Komponen metadata dan catalog
- Metadata: schema, data type, data source, timestamp, data quality metrics (akurasi, kelengkapan, konsistensi), ownership dan access control.
- Catalog: table dan database, table schema, partition info, lokasi (S3 path, endpoint), statistik dari crawling.
- Catalog juga: data lineage dan dependency, tag dan label, access control policy, integrasi dengan tools analytics.

### Klasifikasi data
- Klasifikasi: kelompokkan data menurut sensitivitas supaya kontrol keamanannya pas.
- IAM untuk akses. KMS untuk encryption key. VPC dan security group untuk isolasi.
- SCP di AWS Organizations mencegah member account memakai aksi atau service tertentu.
- Amazon Macie memakai ML untuk menemukan, mengklasifikasi, dan melindungi sensitive data.

### Pola soal
- Data baru harus otomatis masuk catalog => Glue crawler setelah ingest.
- Job baru harus mengisi catalog lengkap => pastikan job memakai Glue API.
- Partition baru tidak muncul di query => jadwalkan crawler, atau tambah lewat Glue API.
- Permission atau property di level kolom => Lake Formation.
- Banyak akun, tiap unit hanya akses datanya => Lake Formation cross-account plus bucket policy dengan service-linked role.
- Temukan sensitive data otomatis => Amazon Macie.
- Cegah member account memakai service tertentu => SCP.
- Crawler perlu akses RDS => Glue connection (endpoint, port, credential).

## Lesson 3: Manage the lifecycle of data
### Hot, warm, cold
- Tanya: seberapa penting data, berapa lama disimpan, seberapa sering diakses.
- Data baru biasanya lebih sering diakses.
- Semua di hot storage: cepat tapi mahal. Semua di cold: retrieval lama dan bisa ada biaya retrieval.
- Transformasi menghasilkan dataset baru yang juga harus dikelola.

### Optimasi biaya dan retention
- S3 Lifecycle policy memindahkan data ke storage class lain, atau menghapusnya untuk kebutuhan bisnis dan hukum.
- Redshift: elastic resize untuk tambah atau kurangi node dan ganti node type.
- Ketahui nilai data, cara simpan, dan siapa yang akses. Tanyakan juga apakah data bisa dibuat ulang.
- Regulasi bisa mewajibkan retention tertentu, jadi perlu retention policy dan archiving yang tetap bisa dicari.

### Resiliency dan availability
- S3 otomatis mereplikasi data ke beberapa Availability Zone.
- RDS Multi-AZ memberi automatic failover saat satu AZ gagal.
- Backup: AWS Backup, automatic snapshot, atau replikasi ke Region lain.
- S3 Versioning melindungi object dari terhapus atau ter-overwrite.

### Menghapus data lama
- DynamoDB Time to Live (TTL) menghapus item otomatis setelah timestamp tertentu.
- Kasus MSK ke Redshift, query makin lambat dan maintenance makin lama: buat time series table identik per rentang waktu.
- Hapus data lama dengan DROP TABLE, bukan DELETE besar, supaya tidak perlu VACUUM.
- Tabel kecil per waktu lebih teroptimasi untuk query. Kalau di-sort per timestamp, VACUUM bisa tidak perlu.

### Kasus S3 dan Athena
- CSV di S3 Standard di-query Athena: ubah dengan Glue ETL ke format columnar, compress, partition.
- Lifecycle: S3 Standard ke S3 Standard-IA setelah 6 bulan, lalu ke S3 Glacier setelah 2 tahun.

### Pola soal
- Data jarang diakses setelah N bulan => Lifecycle ke S3 Standard-IA.
- Archive wajib regulasi => Lifecycle ke S3 Glacier.
- Hapus item DynamoDB otomatis => TTL.
- Redshift lambat, VACUUM lama => time series table plus DROP TABLE.
- Kapasitas Redshift berubah => elastic resize.
- Failover otomatis saat AZ gagal => RDS Multi-AZ.
- Lindungi object dari terhapus => S3 Versioning.
- Query Athena atas CSV lambat dan mahal => Glue ETL ke columnar, compress, partition.

## Lesson 4: Design data models and schema evolution
### Data modeling
- Strict normalization kurang cocok untuk event data yang beragam.
- Redshift mendukung star schema, snowflake schema, dan Kimball.
- Inmon dan data vault bisa, tapi butuh transformasi tambahan dan solusi custom.
- Redshift Serverless dengan Query Editor v2: buat schema dan tabel, import data visual.

### Spark dan lineage
- EMR menjalankan Spark cluster on demand. spark.read untuk structured data dari S3, spark.sparkContext.textFile untuk raw text.
- Glue crawler menebak schema di S3 dan membuat tabel di catalog, lalu dipakai Spark.
- Athena untuk interactive SQL di S3. Comprehend untuk NLP teks unstructured.
- Data lineage melacak asal, transformasi, dan alur data. Membantu error tracking dan debugging.
- SageMaker ML Lineage Tracking mencatat input data, model, hyperparameter, transformasi, model artifact, dan inference data. Bisa diintegrasikan dengan Glue dan S3.

### Optimasi data
- RDS: index di kolom yang sering dipakai WHERE atau JOIN. DynamoDB: pilih primary key dan secondary index sesuai pola query.
- S3: partisi ke folder logis, query subset dengan Athena atau Glue.
- Redshift: distribution key dan sort key untuk sebar data merata dan kurangi data movement.
- Compression: gzip atau bzip2 di S3, compression encoding kolom di Redshift. Format Parquet atau ORC di S3.
- Cache: ElastiCache atau CloudFront. Data historis: S3 Glacier atau Glacier Deep Archive.
- DynamoDB provisioned throughput plus auto scaling. Tuning query: RDS Performance Insights, Redshift query monitoring. Transfer: DataSync atau Transfer Family.

### Jenis data dan service
- Structured: RDS, Aurora, Redshift.
- Semi-structured: DynamoDB, DocumentDB (MongoDB compatibility), Athena, S3.
- Unstructured: S3, Rekognition, Transcribe, Comprehend.

### Schema evolution
- Field bertambah atau hilang, tipe berubah (string ke integer). Tujuannya menjaga data lama dan backward compatibility.
- DynamoDB: cukup update aplikasi, data lama tanpa atribut baru tetap bisa dipakai.
- RDS dan Aurora lebih rumit: pakai AWS DMS dengan downtime minimal, atau stored procedure.
- Data lake S3 memakai schema on read: data mentah, schema diterapkan saat query lewat Athena atau Glue.
- AWS Glue mendukung schema versioning. Avro, Parquet, ORC mendukung schema evolution by design.
- Catatan: kursus menyebut Avro columnar. Avro sebenarnya row-based, yang columnar Parquet dan ORC.

### Antisipasi dan konversi schema
- Proaktif: dead letter queue, schema registry, validasi schema, versioning, backup sebelum ubah, monitoring dan alerting.
- Test schema baru: Glue, AWS Data Pipeline, atau custom script. Glue DataBrew untuk profiling data.
- Catatan: AWS Data Pipeline sudah maintenance mode dan tertutup untuk pelanggan baru.
- AWS SCT mengonversi schema dan code antar engine (data type mapping, stored procedure, index), dengan assessment masalah.
- AWS DMS bekerja bersama SCT saat migrasi ke RDS, Aurora, Redshift, dan lainnya.

### Pola soal
- Model dimensional di warehouse => Redshift star atau snowflake schema (Kimball).
- Lineage training data sampai inference => SageMaker ML Lineage Tracking.
- Join Redshift lambat karena data movement => distribution key dan sort key.
- Query RDS lambat di kolom WHERE => buat index.
- Tambah field tanpa merusak data lama di S3 => Parquet, ORC, Avro, plus Glue schema versioning.
- Ubah schema RDS dengan downtime minimal => AWS DMS atau stored procedure.
- Migrasi antar engine => SCT untuk schema dan code, DMS untuk data.
- Profiling data sebelum schema baru => Glue DataBrew.
- Record rusak karena schema berubah => dead letter queue, schema registry.

## Angka dan batas penting
- 4 task statement. Storage adalah tahap ke-3 data engineering lifecycle.
- DynamoDB: latency single-digit millisecond.
- Redshift skala petabyte. Contoh kasus 30 TB, ratusan sampai ribuan aggregated query per hari.
- Kasus RDS: 3 bulan data terbaru tetap di database.
- EMR job pendek: bayar per detik.
- Lifecycle S3: Standard-IA setelah 6 bulan, Glacier setelah 2 tahun.
- Kasus lintas akun: 4 AWS account dan satu akun data lake pusat.
- Sinkronisasi partition Glue: 6 langkah.

## Jebakan ujian
- S3 object, EFS file shared, EBS block yang di-attach ke satu EC2. Perhatikan kata "shared" dan "block-level".
- EFS dan FSx for Lustre sama-sama file storage. Kata "highly parallel" atau HPC berarti FSx for Lustre.
- Redshift Spectrum query data yang tetap di S3. Tidak perlu load ke cluster.
- Konversi tipe gagal saat COPY: jawabannya parameter COPY, bukan ganti service.
- Glue tag di level tabel, Lake Formation sampai level kolom.
- Hapus data Redshift: DROP TABLE lebih baik dari DELETE besar karena tanpa VACUUM.
- DynamoDB TTL untuk item, S3 Lifecycle untuk object. Jangan tertukar.
- Cold storage murah tapi retrieval lama dan berbiaya. Jangan pilih Glacier untuk data yang masih sering di-query.
- Macie menemukan dan mengklasifikasi sensitive data. Akses tetap diatur IAM, Lake Formation, SCP.
- SCT untuk schema dan code, DMS untuk data. Migrasi antar engine biasanya butuh keduanya.
- Inmon dan data vault bisa di Redshift tapi butuh kerja tambahan. Yang didukung langsung: star, snowflake, Kimball.

## Sumber tambahan
- What Is Cloud Storage? (https://aws.amazon.com/what-is/cloud-storage/)
- Tanpa judul, contoh Glue Python Medicaid (https://docs.aws.amazon.com/glue/latest/dg/aws-glue-programming-python-samples-medicaid.html)
- Storage Best Practices for Data and Analytics Applications (https://docs.aws.amazon.com/whitepapers/latest/building-data-lakes/building-data-lake-aws.html)
- Amazon S3 Tutorials (https://docs.aws.amazon.com/AmazonS3/latest/userguide/tutorials.html)
- Storage Options for Your Amazon EC2 Instances (https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Storage.html)
- Implementing Microservices on AWS (https://docs.aws.amazon.com/whitepapers/latest/microservices-on-aws/microservices-on-aws.html)
- Data Store (https://docs.aws.amazon.com/whitepapers/latest/microservices-on-aws/data-store.html)
- What Is Amazon Redshift? (https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html)
- Tanpa judul, blog EMR dan Apache Livy (https://aws.amazon.com/blogs/big-data/build-a-concurrent-data-orchestration-pipeline-using-amazon-emr-and-apache-livy/)
- Working with Query Editor v2 (https://docs.aws.amazon.com/redshift/latest/mgmt/query-editor-v2-using.html)
- S3DistCp (s3-dist-cp) (https://docs.aws.amazon.com/emr/latest/ReleaseGuide/UsingEMR_s3distcp.html)
- AWS Glue Data Catalog (https://docs.aws.amazon.com/prescriptive-guidance/latest/serverless-etl-aws-glue/aws-glue-data-catalog.html)
- Tanpa judul, Kinesis Data Streams quotas and limits (https://docs.amazonaws.cn/en_us/streams/latest/dev/service-sizes-and-limits.html)
- Catalog and Search (https://docs.aws.amazon.com/whitepapers/latest/building-data-lakes/data-cataloging.html)
