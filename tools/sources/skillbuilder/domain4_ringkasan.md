# Domain 4: Data Security and Governance
Mengamankan data pipeline: siapa boleh masuk, boleh apa, enkripsi dan masking, log audit, serta privasi dan tata kelola data.

## Domain 4 introduction
### Isi domain
- Data dilindungi in transit dan at rest dengan encryption, tokenization, masking, obfuscation, dan access control.
- Lima task statement: 4.1 authentication, 4.2 authorization, 4.3 encryption dan masking, 4.4 logs for audit, 4.5 privacy dan governance.
- Yang wajib paham: IAM role, policy, group, network security, password policy, dan encryption.

### Pola soal
- Akses jaringan ke resource di VPC => security group dan network ACL
- Data pribadi dan lokasi penyimpanan per negara => PII dan data sovereignty (task 4.5)
- Proteksi data menyeluruh => gabungan encryption, masking, dan access control

## Lesson 1: Apply authentication mechanisms
### Identitas di AWS
- Authentication memastikan siapa kamu. Authorization menentukan apa yang boleh diakses setelah itu.
- Metode: password-based, certificate-based, role-based. Kenali use case dan tingkat keamanannya.
- Cara masuk: root user, IAM user, assume IAM role, atau federated identity.
- IAM Identity Center: sign-in workforce, akses multi-account, dan SSO ke aplikasi SAML 2.0.
- IAM user untuk satu orang atau aplikasi, kredensial permanen. IAM role bisa di-assume siapa saja yang butuh, kredensial sementara.
- Tidak bisa sign in sebagai IAM group. Group hanya untuk memberi izin ke banyak user.
- Service memanggil service lain lewat izin calling principal, service role, atau service-linked role.

### Policy
- Jenis: identity-based (ke user, group, role), resource-based (ke resource seperti S3 bucket atau KMS key), dan trust policy.
- IAM role butuh dua policy: trust policy (siapa boleh assume) dan identity-based policy (boleh apa).
- Tanpa allow eksplisit, default AWS adalah deny.
- AWS managed policy dikelola AWS dan tidak bisa diubah. Customer managed policy dibuat sendiri, bisa dipasang ke banyak identitas.
- Inline policy satu banding satu dengan identitas, ikut terhapus saat identitasnya dihapus.

### Policy di endpoint dan service
- Akses lewat S3 access point hanya jalan kalau access point policy dan bucket policy sama-sama mengizinkan. Atau bucket mendelegasikan kontrol ke access point.
- User default tidak punya izin mengelola VPC endpoint. Condition key `ec2:VpceServicePrivateDnsName` membatasi endpoint berdasarkan private DNS name.
- API Gateway punya dua model izin: API management (developer) dan API execution (caller). Set authorization type method ke `AWS_IAM` agar caller wajib kirim kredensial.
- API Gateway ke Lambda: IAM role dengan trust policy untuk API Gateway plus izin `lambda:InvokeFunction`.
- Interface VPC endpoint ke CloudFormation bisa diberi endpoint policy, misalnya menolak create stack lewat endpoint itu.

### Jaringan, sertifikat, secrets
- Pengaman jaringan: security group, network ACL, private subnet, bastion host, NAT gateway, route table, AWS VPN, Direct Connect, VPC Flow Logs, Security Hub, Network Firewall.
- ACM membuat, menyimpan, dan memperpanjang sertifikat SSL/TLS X.509. Bisa impor sertifikat pihak ketiga, atau ekspor sertifikat AWS Private CA untuk PKI internal.
- Siklus secret: create, store, use, destroy.
- Secrets Manager terintegrasi IAM (termasuk resource-based policy di secret) dan KMS (AWS managed key atau customer managed key).
- Rotasi otomatis terjadwal untuk RDS, Redshift, DocumentDB. Secret lain (API key, OAuth token) lewat Lambda kustom.

### Pola soal
- Kredensial sementara, akses lintas akun, atau federasi => IAM role
- SSO workforce ke banyak akun => IAM Identity Center
- Sertifikat TLS dibuat dan diperpanjang otomatis => ACM
- Siapa yang boleh assume role => trust policy
- Izin access point tidak berlaku => cek bucket policy, keduanya harus mengizinkan
- Rotasi otomatis password RDS atau Redshift => Secrets Manager
- QuickSight gagal impor data Athena dari S3 bucket baru, error insufficient permissions => izinkan bucket itu dari QuickSight console, karena QuickSight butuh otorisasi sendiri (cross-service)

## Lesson 2: Apply authorization mechanisms
### Prinsip
- Tujuannya least privilege untuk principal yang sudah terautentikasi.
- Policy bisa dibangun dan dites sebagai kode di pipeline.
- IAM Access Analyzer terus mencari resource yang bisa diakses dari luar akun. AWS Organizations menegakkan policy di banyak akun.

### RBAC dan ABAC
- RBAC: akses berdasarkan role. Lebih mudah dikelola.
- ABAC: akses berdasarkan attribute dan tag di principal, resource, environment, atau application state.
- Pilih ABAC kalau user butuh izin lintas role, role sulit didefinisikan, atau izin bergantung parameter dinamis.
- Contoh: role bertag `access-project` heart, star, bolt. Satu policy memberi akses kalau tag role sama dengan tag resource.
- ABAC granular tapi berat di awal. Keduanya bisa digabung (hybrid).

### Amazon Redshift
- User dikelola dengan `CREATE USER` dan `ALTER USER`, atau lewat JDBC/ODBC driver yang membuat temporary password.
- Hanya superuser yang bisa membuat dan menghapus user. Superuser punya hak pemilik di semua database.
- Dengan RBAC, grant dan revoke dilakukan di level role, tanpa mengubah izin tiap objek.

### Lake Formation dan Parameter Store
- Lake Formation mengatur akses data lake sampai level database, table, column, row, dan cell, untuk IAM dan external identity provider.
- Berlaku saat diakses lewat Redshift Spectrum, Athena, Glue ETL, dan EMR for Spark.
- LF-Tags dipasang ke database, table, atau column, mengganti ribuan definisi izin dengan beberapa tag.
- Lake Formation bisa mengatur izin datashare Redshift secara terpusat.
- Parameter Store (Systems Manager) menyimpan konfigurasi dan secret, tapi tanpa rotasi otomatis. Simpan secret di Secrets Manager lalu referensikan dari Parameter Store, nama diawali `/`.

### Pola soal
- Resource bisa diakses dari luar akun => IAM Access Analyzer
- Satu policy untuk banyak proyek berdasarkan tag => ABAC
- Izin sederhana mengikuti jabatan => RBAC
- Akses data lake sampai column, row, atau cell => Lake Formation
- Ribuan izin tabel sulit dikelola => LF-Tags
- Konfigurasi plus secret yang butuh rotasi => Secrets Manager, direferensikan dari Parameter Store
- Siapa yang bisa membuat atau menghapus user Redshift => superuser

## Lesson 3: Ensure data encryption and masking
### KMS, CloudHSM, TLS
- AWS KMS membuat dan mengontrol key, terintegrasi dengan hampir semua service dan dengan CloudTrail untuk log pemakaian key.
- CloudHSM dipakai kalau kamu harus mengelola langsung perangkat HSM. AWS mengurus hardware, patching, dan backup. Kamu mengurus scaling serta crypto account dan kredensial.
- Di KMS dan CloudHSM, plaintext key tidak bisa dipakai di luar HSM.
- Trafik antar data center dienkripsi di physical layer. Trafik di VPC dan antar VPC peering lintas Region dienkripsi di network layer. Semua endpoint AWS mendukung TLS.
- Terminasi TLS dengan sertifikat sendiri: NLB, ALB, CloudFront, API Gateway.
- Catatan: transkrip menulis "hardware security models", maksudnya hardware security modules.

### Enkripsi at rest dan EMR
- Pahami enkripsi at rest di EBS, S3, RDS, Redshift, ElastiCache, Lambda, EMR, Glue, SageMaker. SQS punya SSE untuk pesan sensitif.
- Pahami beda client-side dan server-side encryption.
- EBS terenkripsi di EMR tidak berarti local disk terenkripsi. Aktifkan local disk encryption di security configuration.
- Enkripsi EBS terjadi di EC2 host. OS melihat data tidak terenkripsi kecuali ada end-to-end encryption.
- Root volume semua node EMR terenkripsi: custom AMI. Salin snapshot ke target terenkripsi KMS, lalu pakai custom AMI ID di template CloudFormation.

### Tokenization, masking, salt
- Encryption memakai algoritma dan key, bisa didekripsi. Tokenization mengganti data dengan token acak tanpa proses matematis, relasinya disimpan di token vault.
- Token tidak bisa dipetakan balik tanpa sistem tokenisasi. Contoh: pembayaran kartu kredit berulang.
- Anonymization menghapus data sensitif. Masking menutupinya dengan nilai yang diubah.
- Salt: data acak baru per password, digabung lalu di-hash, disimpan bersama hash. Salt tidak perlu dienkripsi.
- Contoh tokenisasi serverless: Cognito, API Gateway, Lambda, KMS, DynamoDB client-side encryption library, cipher database dan application database. Lambda ke DynamoDB lewat gateway endpoint, ke KMS lewat interface endpoint.
- Redshift Dynamic Data Masking (DDM) menyamarkan data saat query tanpa mengubah data tersimpan. Bisa per role, per cell dengan conditional column, dan beberapa policy di satu kolom.

### Pola soal
- Harus mengelola perangkat HSM sendiri => CloudHSM
- Key terpusat dengan log pemakaian => KMS plus CloudTrail
- EBS EMR terenkripsi, local disk aman? => tidak, aktifkan di security configuration
- Root volume node EMR terenkripsi => custom AMI dengan EBS root terenkripsi KMS
- Ganti data sensitif dengan nilai acak lewat vault => tokenization
- Simpan hash password aman => salt acak per password
- Data sensitif tersamar saat query Redshift => Dynamic Data Masking
- Antrean pesan sensitif => SQS dengan SSE

## Lesson 4: Prepare logs for audit
### Retensi dan CloudTrail Lake
- HIPAA dan PCI mewajibkan data disimpan dalam periode tertentu, bisa dicari, lalu dihapus sesuai aturan.
- CloudWatch Logs default menyimpan log selamanya. Atur retention policy di log group.
- CloudTrail Lake: query SQL terpusat atas event lintas akun dan Region, termasuk aktivitas dari luar AWS.
- Event data store berisi satu kategori saja: CloudTrail events, Config configuration items, Audit Manager evidence, atau event luar AWS. Gabungkan dengan SQL JOIN.
- Trail tidak mendukung otorisasi berbasis tag, event data store mendukung.

### EMR dan analisis log
- EMR menulis log di primary node, `/mnt/var/log/`, dan bisa mengarsipkan ke S3.
- CloudTrail mencatat semua API call EMR. Trail mengirim terus ke S3. Tanpa trail, hanya event terbaru di Event history.
- CloudWatch Logs Insights untuk mencari penyebab masalah. Field otomatis ditemukan untuk Route 53, Lambda, CloudTrail, VPC, dan log JSON.
- Athena CloudWatch connector: log group jadi schema, log stream jadi table, view `all_log_streams` untuk semua stream.
- Log group bisa di-stream ke OpenSearch Service nyaris real time lewat subscription.
- Catatan: CloudWatch Events sekarang bagian dari Amazon EventBridge.

### Pola soal
- Query SQL event CloudTrail lintas akun dan Region => CloudTrail Lake
- Gabungkan CloudTrail events dan Config items => dua event data store, SQL JOIN
- Log tidak boleh disimpan selamanya => retention policy di log group
- Cari penyebab error dari log => CloudWatch Logs Insights
- Query log CloudWatch dengan SQL => Athena CloudWatch connector
- Analisis log nyaris real time => subscription ke OpenSearch Service
- Riwayat API call EMR jangka panjang => trail ke S3

## Lesson 5: Understand data privacy and governance
### Proteksi sepanjang lifecycle
- Field-level encryption mengenkripsi field sensitif saja dan menjaga struktur payload. Full payload encryption membuat payload tak terpakai sebelum didekripsi semua.
- Lindungi data sedini mungkin saat ingestion. CloudFront plus Lambda@Edge melindungi data di edge sehingga sistem downstream tidak melihatnya.
- Contoh pipeline: IoT Core (MQTT), Kinesis Data Firehose ke S3, Glue ETL memanggil Amazon Comprehend untuk mendeteksi data sensitif, Lake Formation membatasi akses analis di Athena.
- Catatan: Kinesis Data Firehose sekarang bernama Amazon Data Firehose.

### Sensitive data discovery
- Scan terjadwal (default empat kali sehari, tiap 6 jam), sebelum crawler dan setelah redaksi atau tokenisasi.
- Scan menambah minimal 5 sampai 10 menit, naik linear dengan ukuran objek, plus startup time konstan per job.
- Komponen: bucket raw, scanning, manual review, scanned. Macie memindai, Step Functions mengorkestrasi Lambda, EventBridge memicu jadwal, SNS memberi notifikasi, API Gateway menerima keputusan reviewer.
- Yang kurang: backup plan, DR plan, dan data privacy strategy agar backup atau replikasi tidak ke Region terlarang (data sovereignty).

### Backup data lake
- Storage admin memakai S3 versioning, Same-Region Replication, Cross-Region Replication, dan Object Lock.
- AWS Backup membuat backup plan (frekuensi, retensi) di satu akun atau banyak akun lewat Organizations. Backup vault punya policy, key, dan lock sendiri.
- Backup bucket raw biasanya cukup karena data turunan bisa dibuat ulang. Kalau raw berisi PII, backup data de-identified.
- Pilih bucket lewat tag, misalnya "data protection level" = "critical".
- Continuous backup untuk PITR, periodic untuk compliance. Copy to destination ke vault di akun atau Region lain. Enkripsi pakai KMS key milik vault.
- AWS Backup Audit Manager melaporkan compliance backup lewat custom framework.

### Redshift dan AWS Config
- User Redshift tidak bisa di-drop kalau masih memiliki atau punya izin atas objek datashare.
- Kolom rahasia di tabel Redshift: column-level GRANT dan REVOKE. Lake Formation plus Redshift Spectrum juga bisa.
- AWS Config mencatat configuration item tiap resource lewat API describe atau list, termasuk related resource (contoh: ubah security group, instance terkait ikut dicatat).
- Item dikirim lewat configuration stream ke S3. Tiap Config rule memakai Lambda function. Notifikasi bisa ke SNS.

### Pola soal
- Enkripsi field sensitif saja => field-level encryption
- Lindungi data di edge saat ingestion => CloudFront plus Lambda@Edge
- Temukan data sensitif di S3 terjadwal => Macie, dengan Step Functions dan EventBridge
- Deteksi PII dalam Glue ETL => Amazon Comprehend
- Backup atau replikasi ke Region terlarang => data privacy strategy (data sovereignty)
- Backup terpusat lintas akun => AWS Backup dengan Organizations
- Restore S3 ke titik waktu tertentu => continuous backup (PITR)
- Laporan compliance backup => AWS Backup Audit Manager
- Kolom rahasia Redshift untuk user tertentu => column-level GRANT dan REVOKE
- Lacak perubahan konfigurasi resource => AWS Config

## Angka dan batas penting
- Domain 4 punya lima task statement.
- Siklus secret: empat fase.
- Rotasi bawaan Secrets Manager: RDS, Redshift, DocumentDB.
- IAM role butuh dua policy.
- Level kontrol Lake Formation: database, table, column, row, cell.
- Lapisan antara OS dan EBS: tiga (local disk, EBS volume, volume yang disajikan ke VM).
- CloudWatch Logs default retensi tanpa batas.
- Log EMR default: primary node, `/mnt/var/log/`.
- CloudTrail Lake: satu event data store untuk satu kategori. CloudWatch metrics menampilkan data masuk satu jam terakhir atau selama retensi.
- Scan data sensitif: default tiap 6 jam (empat kali sehari), tambahan minimal 5 sampai 10 menit.
- Referensi Secrets Manager dari Parameter Store: nama diawali `/`.

## Jebakan ujian
- Authentication dan authorization sering ditukar.
- IAM user kredensial permanen, IAM role kredensial sementara.
- AWS managed policy tidak bisa diedit. Izin kustom yang dipakai ulang: customer managed policy, bukan inline.
- Access point policy saja tidak cukup, bucket policy juga harus mengizinkan.
- Izin user tidak otomatis berlaku untuk service. QuickSight butuh izin sendiri ke S3.
- Parameter Store tidak punya rotasi otomatis, Secrets Manager punya.
- KMS dan CloudHSM mirip. CloudHSM hanya kalau soal minta kontrol langsung atas HSM.
- EBS terenkripsi di EMR tidak mengenkripsi local disk.
- Tokenization bukan encryption, tidak ada proses matematis.
- Anonymization menghapus, masking menutupi. Salt tidak perlu dienkripsi.
- Redshift DDM tidak mengubah data tersimpan.
- Trail CloudTrail tidak mendukung otorisasi tag, event data store CloudTrail Lake mendukung.
- Tanpa trail, CloudTrail tidak mengirim event ke S3, hanya Event history terbaru.
- Backup vault terpisah dari S3 Object Lock dan bucket policy.

## Sumber tambahan
- What Is IAM? (https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- Tanpa judul, tipe cloud storage (https://aws.amazon.com/what-is/cloud-storage/#:~:text=a%20massive%20scale.-,What%20are%20the%20types%20of%20cloud%20storage%3F,has%20its%20own%20use%20cases.)
- Tanpa judul, contoh Glue Python Medicaid (https://docs.aws.amazon.com/glue/latest/dg/aws-glue-programming-python-samples-medicaid.html)
- What Is AWS Certificate Manager? (https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)
- Example IAM Identity-Based Policies (https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_examples.html)
- Tanpa judul, tutorial Amazon S3 (https://docs.aws.amazon.com/AmazonS3/latest/userguide/tutorials.html)
- AmazonDynamoDBFullAccess (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AmazonDynamoDBFullAccess.html)
- IAMFullAccess (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/IAMFullAccess.html)
- AWSCodeCommitPowerUser (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AWSCodeCommitPowerUser.html)
- AWSKeyManagementServicePowerUser (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AWSKeyManagementServicePowerUser.html)
- Tanpa judul, Amazon Redshift management guide (https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html)
- Tanpa judul, pipeline orkestrasi EMR dan Apache Livy (https://aws.amazon.com/blogs/big-data/build-a-concurrent-data-orchestration-pipeline-using-amazon-emr-and-apache-livy/)
- AWS Access Levels (https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_understand-policy-summary-access-level-summaries.html#access_policies_access-level)
- AmazonMobileAnalyticsWriteOnlyAccess (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AmazonMobileAnalyticsWriteOnlyAccess.html)
- AmazonEC2ReadOnlyAccess (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AmazonEC2ReadOnlyAccess.html)
- Tanpa judul, kuota Kinesis Data Streams (https://docs.amazonaws.cn/en_us/streams/latest/dev/service-sizes-and-limits.html)
- Delegating Access Control to Access Points (https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-points-policies.html#access-points-delegating-control)
- What Is Amazon API Gateway? (https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- How Amazon API Gateway Works with IAM (https://docs.aws.amazon.com/apigateway/latest/developerguide/security_iam_service-with-iam.html)
- Insufficient Permissions When Using Athena with Amazon QuickSight (https://docs.aws.amazon.com/quicksight/latest/user/troubleshoot-athena-insufficient-permissions.html)
- Consolidate and Query AWS CloudTrail Data across Accounts and Regions Using AWS CloudTrail Lake (https://aws.amazon.com/blogs/mt/consolidate-and-query-aws-cloudtrail-data-across-accounts-and-regions-using-aws-cloudtrail-lake/)
- Tutorial: Detecting and Redacting PII Data with S3 Object Lambda and Amazon Comprehend (https://docs.aws.amazon.com/AmazonS3/latest/userguide/tutorial-s3-object-lambda-redact-pii.html)
