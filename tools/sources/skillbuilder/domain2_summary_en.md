# Domain 2: Data Store Management
Choosing a data store, building a data catalog, managing the data lifecycle, and designing data models and schema evolution.

## Domain 2 introduction
### What the domain covers
- Four task statements: 2.1 choose a data store, 2.2 data cataloging systems, 2.3 lifecycle of data, 2.4 data models and schema evolution.
- Storage is the third stage of the data engineering lifecycle. Data is stored many times while it moves through the pipeline.
- First step in choosing storage: understand the use case, how data is stored, and how data is retrieved.
- 2.3 covers hot and cold data, cost optimization, deleting data for business and legal needs, retention, archiving, resiliency.

### Question patterns
- Question about choosing storage => start from the access pattern, then pick the service.
- Question about long-term storage cost => think lifecycle (hot, warm, cold) and retention.
- Data must be easy to find and use => data catalog with complete metadata.

## Lesson 1: Choose a data store
### Three basic storage types
- Amazon S3: object storage, highly available, scalable, durable. For static content, backup, media, and as the base storage of a data lake.
- Amazon EFS: fully managed file storage shared by many EC2 instances.
- Other file storage: FSx for Windows File Server, FSx for Lustre, FSx for NetApp ONTAP.
- Amazon EBS: persistent block storage attached to EC2. For databases and transactional apps that need low latency.

### Databases and warehouses
- Amazon RDS: managed relational database (MySQL, PostgreSQL, Oracle, SQL Server, and others).
- DynamoDB: managed NoSQL, single-digit millisecond latency at any scale. For real-time, gaming, IoT, dynamic scaling.
- Note: the course says DynamoDB supports graph, memory, and search. In practice DynamoDB is a key-value and document database.
- Amazon Redshift: petabyte-scale data warehouse for analytics and BI, can also handle large volumes of semi-structured and unstructured data.
- AWS Lake Formation: build, secure, and manage a data lake. Can crawl, catalog, and prepare data.

### Factors and example choices
- Performance factors: IOPS, scalability, durability, data access pattern.
- Highly parallel file system for HPC, analytics, large-scale ML: FSx for Lustre.
- In-memory caching, session storage, real-time analytics: ElastiCache.
- Redshift fits 30 TB of data with many aggregated queries and complex joins that use only some columns. Reasons: columnar storage (less I/O), compression, parallel processing, and SQL JOIN support.

### Migration and data access
- The COPY command loads data files into a Redshift table, for example from S3 or EMR. COPY converts strings to the data type of the target column.
- If you need other conversions, or the default conversion fails, set it with COPY parameters.
- RDS data: the latest 3 months are used for analytics, older data is joined now and then. Solution: move old data to S3, run a daily job from RDS to Redshift, join both with Redshift Spectrum.
- Petabytes of key-value data, direct access, SQL-like interface: Hive on EMR, store in DynamoDB.
- EMR for short jobs: start and stop the cluster, pay per second. Long workloads: highly available cluster with auto scaling.

### Preventing unauthorized access (Redshift and RDS)
- IAM for access to clusters and resources, policies by role.
- Security groups, encryption, and keys in AWS KMS.
- Parameter groups for database parameters, including locking to control concurrency.
- Database auditing, plus a regular schedule to review access logs and audit trails.

### Question patterns
- Highly parallel file system, HPC => FSx for Lustre.
- In-memory cache, low latency => ElastiCache.
- File share for many EC2 instances => EFS. Block storage for a database on EC2 => EBS.
- Many aggregated queries and joins, only some columns => Redshift (columnar).
- Load files from S3 or EMR into Redshift => COPY, set parameters if conversion fails.
- Old data in S3 joined with data in Redshift => Redshift Spectrum.
- Petabytes of key-value data with a SQL-like interface => Hive on EMR plus DynamoDB.
- Limit and track Redshift or RDS access => IAM, security groups, KMS, database auditing.

## Lesson 2: Understand data cataloging systems
### What a data catalog is
- Metadata repository: location, description or schema, and runtime metrics of the data.
- Used for federated queries and ETL when data is spread across many locations.
- AWS Glue Data Catalog holds references to the sources and targets of ETL jobs. One metadata table represents one data store.
- Usually filled by a crawler, but there are other ways to add metadata tables.
- Athena uses the catalog to know the S3 location, file format (Parquet, CSV), and partitions.

### Lake Formation and cross-account
- Glue stores business attributes as key-value tags at the table level. Lake Formation supports key-value properties at the column level.
- Lake Formation controls permissions at the database, table, and column level.
- Case with 4 AWS accounts, each business unit can access only its own data: data lake storage in each account, catalog in a central account with Lake Formation.
- Then update the S3 bucket policy with the Lake Formation service-linked role, and use Lake Formation permissions for specific access.
- Users and Glue ETL jobs can join tables across accounts with table-level and column-level protection.

### Keeping the catalog up to date
- Run the Glue crawler after new data arrives.
- New job in production: check that the job uses the AWS Glue API to update the catalog.
- Partition sync matters for partitioned data in S3 (date, Region, category).
- Steps: create a Glue database, create a crawler, define the partitioning schema, run it, schedule it to match ingest frequency, query with Athena.
- Partitions that are not detected automatically are added or changed through the Glue API.

### Glue connections
- A connection for a data source (ingest) or a data target (write).
- S3: bucket path and inclusion/exclusion patterns. RDS: endpoint, port, credentials.
- You can test the connection first. Connections are used by crawlers and ETL jobs.

### Metadata and catalog components
- Metadata: schema, data types, data source, timestamps, data quality metrics (accuracy, completeness, consistency), ownership and access control.
- Catalog: tables and databases, table schema, partition info, location (S3 path, endpoint), statistics from crawling.
- Catalog also: data lineage and dependencies, tags and labels, access control policies, integration with analytics tools.

### Data classification
- Classification: group data by sensitivity so the security controls fit.
- IAM for access. KMS for encryption keys. VPC and security groups for isolation.
- SCPs in AWS Organizations stop member accounts from using certain actions or services.
- Amazon Macie uses ML to discover, classify, and protect sensitive data.

### Question patterns
- New data must enter the catalog automatically => Glue crawler after ingest.
- New job must fill the catalog completely => make sure the job uses the Glue API.
- New partitions do not show up in queries => schedule the crawler, or add them through the Glue API.
- Permissions or properties at the column level => Lake Formation.
- Many accounts, each unit accesses only its own data => Lake Formation cross-account plus bucket policy with the service-linked role.
- Discover sensitive data automatically => Amazon Macie.
- Stop member accounts from using certain services => SCP.
- Crawler needs access to RDS => Glue connection (endpoint, port, credentials).

## Lesson 3: Manage the lifecycle of data
### Hot, warm, cold
- Ask: how important is the data, how long is it kept, how often is it accessed.
- New data is usually accessed more often.
- Everything in hot storage: fast but expensive. Everything in cold: slow retrieval and possible retrieval fees.
- Transformations create new datasets that also need managing.

### Cost optimization and retention
- S3 Lifecycle policies move data to another storage class, or delete it for business and legal needs.
- Redshift: elastic resize to add or remove nodes and change node type.
- Know the value of the data, how it is stored, and who accesses it. Also ask whether the data can be recreated.
- Regulations can require a certain retention, so you need a retention policy and archiving that stays searchable.

### Resiliency and availability
- S3 automatically replicates data across multiple Availability Zones.
- RDS Multi-AZ gives automatic failover when one AZ fails.
- Backup: AWS Backup, automatic snapshots, or replication to another Region.
- S3 Versioning protects objects from being deleted or overwritten.

### Deleting old data
- DynamoDB Time to Live (TTL) deletes items automatically after a given timestamp.
- Case MSK to Redshift, queries get slower and maintenance takes longer: create a sequence of identical time series tables, one per time range.
- Delete old data with DROP TABLE, not a large DELETE, so no VACUUM is needed.
- Small tables per time range are better optimized for queries. If sorted by timestamp, VACUUM may not be needed.

### S3 and Athena case
- CSV in S3 Standard queried by Athena: convert with Glue ETL to a columnar format, compress, partition.
- Lifecycle: S3 Standard to S3 Standard-IA after 6 months, then to S3 Glacier after 2 years.

### Question patterns
- Data rarely accessed after N months => Lifecycle to S3 Standard-IA.
- Archive required by regulation => Lifecycle to S3 Glacier.
- Delete DynamoDB items automatically => TTL.
- Redshift slow, VACUUM takes long => time series tables plus DROP TABLE.
- Redshift capacity changes => elastic resize.
- Automatic failover when an AZ fails => RDS Multi-AZ.
- Protect objects from deletion => S3 Versioning.
- Athena queries over CSV slow and expensive => Glue ETL to columnar, compress, partition.

## Lesson 4: Design data models and schema evolution
### Data modeling
- Strict normalization does not fit varied event data well.
- Redshift supports star schema, snowflake schema, and Kimball.
- Inmon and data vault are possible, but need extra transformation and custom solutions.
- Redshift Serverless with Query Editor v2: create schemas and tables, import data visually.

### Spark and lineage
- EMR runs Spark clusters on demand. spark.read for structured data from S3, spark.sparkContext.textFile for raw text.
- Glue crawler infers the schema in S3 and creates tables in the catalog, which Spark then uses.
- Athena for interactive SQL on S3. Comprehend for NLP on unstructured text.
- Data lineage tracks the origin, transformations, and flow of data. Helps error tracking and debugging.
- SageMaker ML Lineage Tracking records input data, models, hyperparameters, transformations, model artifacts, and inference data. Can be integrated with Glue and S3.

### Data optimization
- RDS: indexes on columns often used in WHERE or JOIN. DynamoDB: choose the primary key and secondary indexes to match query patterns.
- S3: partition into logical folders, query subsets with Athena or Glue.
- Redshift: distribution key and sort key to spread data evenly and reduce data movement.
- Compression: gzip or bzip2 in S3, column compression encoding in Redshift. Parquet or ORC format in S3.
- Cache: ElastiCache or CloudFront. Historical data: S3 Glacier or Glacier Deep Archive.
- DynamoDB provisioned throughput plus auto scaling. Query tuning: RDS Performance Insights, Redshift query monitoring. Transfer: DataSync or Transfer Family.

### Data types and services
- Structured: RDS, Aurora, Redshift.
- Semi-structured: DynamoDB, DocumentDB (MongoDB compatibility), Athena, S3.
- Unstructured: S3, Rekognition, Transcribe, Comprehend.

### Schema evolution
- Fields added or removed, types changed (string to integer). The goal is to keep old data usable and keep backward compatibility.
- DynamoDB: just update the application, old data without the new attributes still works.
- RDS and Aurora are harder: use AWS DMS with minimal downtime, or stored procedures.
- S3 data lakes use schema on read: raw data, schema applied at query time through Athena or Glue.
- AWS Glue supports schema versioning. Avro, Parquet, ORC support schema evolution by design.
- Note: the course calls Avro columnar. Avro is actually row-based, the columnar ones are Parquet and ORC.

### Anticipating and converting schemas
- Proactive: dead letter queue, schema registry, schema validation, versioning, backup before changes, monitoring and alerting.
- Test a new schema: Glue, AWS Data Pipeline, or a custom script. Glue DataBrew for data profiling.
- Note: AWS Data Pipeline is in maintenance mode and closed to new customers.
- AWS SCT converts schemas and code between engines (data type mapping, stored procedures, indexes), with an assessment of issues.
- AWS DMS works with SCT when migrating to RDS, Aurora, Redshift, and others.

### Question patterns
- Dimensional model in a warehouse => Redshift star or snowflake schema (Kimball).
- Lineage from training data to inference => SageMaker ML Lineage Tracking.
- Slow Redshift joins due to data movement => distribution key and sort key.
- Slow RDS queries on WHERE columns => create an index.
- Add fields without breaking old data in S3 => Parquet, ORC, Avro, plus Glue schema versioning.
- Change RDS schema with minimal downtime => AWS DMS or stored procedure.
- Migration between engines => SCT for schema and code, DMS for data.
- Data profiling before a new schema => Glue DataBrew.
- Broken records due to schema changes => dead letter queue, schema registry.

## Key numbers and limits
- 4 task statements. Storage is stage 3 of the data engineering lifecycle.
- DynamoDB: single-digit millisecond latency.
- Redshift is petabyte scale. Example case: 30 TB, hundreds to thousands of aggregated queries per day.
- RDS case: the latest 3 months of data stay in the database.
- EMR short jobs: pay per second.
- S3 Lifecycle: Standard-IA after 6 months, Glacier after 2 years.
- Cross-account case: 4 AWS accounts and one central data lake account.
- Glue partition sync: 6 steps.

## Exam traps
- S3 is object, EFS is shared file, EBS is block attached to one EC2 instance. Watch for the words "shared" and "block-level".
- EFS and FSx for Lustre are both file storage. "Highly parallel" or HPC means FSx for Lustre.
- Redshift Spectrum queries data that stays in S3. No need to load it into the cluster.
- Type conversion fails during COPY: the answer is COPY parameters, not a different service.
- Glue tags are at the table level, Lake Formation goes down to the column level.
- Deleting Redshift data: DROP TABLE beats a large DELETE because no VACUUM is needed.
- DynamoDB TTL is for items, S3 Lifecycle is for objects. Do not mix them up.
- Cold storage is cheap but retrieval is slow and costs money. Do not pick Glacier for data that is still queried often.
- Macie discovers and classifies sensitive data. Access is still controlled by IAM, Lake Formation, SCPs.
- SCT for schema and code, DMS for data. Migration between engines usually needs both.
- Inmon and data vault are possible in Redshift but need extra work. Supported directly: star, snowflake, Kimball.

## Additional resources
- What Is Cloud Storage? (https://aws.amazon.com/what-is/cloud-storage/)
- Untitled, Glue Python Medicaid example (https://docs.aws.amazon.com/glue/latest/dg/aws-glue-programming-python-samples-medicaid.html)
- Storage Best Practices for Data and Analytics Applications (https://docs.aws.amazon.com/whitepapers/latest/building-data-lakes/building-data-lake-aws.html)
- Amazon S3 Tutorials (https://docs.aws.amazon.com/AmazonS3/latest/userguide/tutorials.html)
- Storage Options for Your Amazon EC2 Instances (https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Storage.html)
- Implementing Microservices on AWS (https://docs.aws.amazon.com/whitepapers/latest/microservices-on-aws/microservices-on-aws.html)
- Data Store (https://docs.aws.amazon.com/whitepapers/latest/microservices-on-aws/data-store.html)
- What Is Amazon Redshift? (https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html)
- Untitled, EMR and Apache Livy blog (https://aws.amazon.com/blogs/big-data/build-a-concurrent-data-orchestration-pipeline-using-amazon-emr-and-apache-livy/)
- Working with Query Editor v2 (https://docs.aws.amazon.com/redshift/latest/mgmt/query-editor-v2-using.html)
- S3DistCp (s3-dist-cp) (https://docs.aws.amazon.com/emr/latest/ReleaseGuide/UsingEMR_s3distcp.html)
- AWS Glue Data Catalog (https://docs.aws.amazon.com/prescriptive-guidance/latest/serverless-etl-aws-glue/aws-glue-data-catalog.html)
- Untitled, Kinesis Data Streams quotas and limits (https://docs.amazonaws.cn/en_us/streams/latest/dev/service-sizes-and-limits.html)
- Catalog and Search (https://docs.aws.amazon.com/whitepapers/latest/building-data-lakes/data-cataloging.html)
