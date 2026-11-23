# Domain 1: Data Ingestion and Transformation
How to get data into AWS, turn it into something useful, orchestrate the pipeline flow, and the programming concepts behind it.

## Domain 1 introduction
### Ingestion and integration
- Data ingestion: moving data from point A to point B.
- Data integration: combining several sources into a new dataset (example: advertising plus web analytics into a user profile). This is part of transformation.
- Ways to ingest: direct database connection, change data capture, API, message queue, event streaming, file export, object storage (Amazon S3).
- Ways to transform: queries, modeling, transformations.

### Four task statements
- 1.1 Perform data ingestion: throughput, latency, streaming and batch.
- 1.2 Transform and process data: ETL pipeline, volume, velocity, variety, distributed computing.
- 1.3 Orchestrate data pipelines: scheduling, dependencies, event-driven, serverless workflow.
- 1.4 Apply programming concepts: CI/CD, SQL, infrastructure as code, data structures (graph, tree).

### Question patterns
- Questions on errors, limits, throttling => focus on Amazon DynamoDB, Amazon RDS, Amazon Kinesis (named by the instructor).
- Combine data from many sources into a new dataset => data integration, part of transformation.
- Move data as is to a target => data ingestion.

## Lesson 1: Perform data ingestion
### Lifecycle and core concepts
- Stages: generation, storage, ingestion, transformation, serving.
- Generation is the source system. The data engineer uses its data but does not control the system.
- Two big concepts: batch vs streaming, push vs pull.
- Flow: producer (database, mobile, application) to ingestion tool to consumer (EC2, AWS database, Lambda).

### Replayability
- The pipeline can reprocess data when it fails or when the logic changes.
- Design event-driven: Amazon S3, Amazon Kinesis, Amazon EventBridge fire events when new data arrives.
- Test idempotency: the same data processed many times with nothing lost or duplicated.
- Add checkpoints so processing can resume from the last successful point.
- Keep raw or intermediate data in S3 (versioning, compliance, replay). Deploy with CloudFormation or AWS CDK.

### S3, Athena, Redshift examples
- TSV files in S3: register them in Amazon Athena, then run ad hoc SQL queries. Convert to Parquet for faster queries.
- BI team needs a warehouse: load into Amazon Redshift, join with S3 data through Redshift Spectrum.
- Athena table stays updated as new data arrives: AWS Glue crawler.
- COPY is slow from one large gzip file: split it into smaller files, a multiple of the number of slices. COPY uses MPP and loads in parallel. Set the distribution key.

### Service per use case
- Data lake: S3, no schema up front. Warehouse or lakehouse: Redshift and Redshift Spectrum.
- Big data processing: Amazon EMR. Real-time analytics: Kinesis and Amazon MSK.
- Operational analytics (application monitoring, logs, clickstream) near real time: Amazon OpenSearch Service.
- Transactional (small data, fast): DynamoDB and RDS. AWS DMS uses the transaction log for CDC, engine migration (Oracle to Aurora), and ongoing replication to S3.

### Five Vs of data
- Variety: types of data. Volume: size and growth, watch the record size limit per service.
- Velocity: tell real time from near real time. Services for spiky traffic: Kinesis, MSK, OpenSearch, Lambda.
- Veracity: quality and completeness (example: an IoT sensor goes down).
- Value: the most important V. Processing data that has no value is wasted money.

### Kinesis family
- Streaming: many small events (around 1 KB), hot data, bounded by time or event count.
- Kinesis Data Firehose: buffers for a set period, then writes to S3, Redshift, OpenSearch Service. Note: now called Amazon Data Firehose.
- Kinesis Data Streams: real time, low latency, custom applications.
- Amazon Managed Service for Apache Flink (formerly Kinesis Data Analytics): stream analytics with SQL or Flink.
- Kinesis Video Streams: video, audio, thermal imagery, radar. Kinesis Agent: reads files and sends them to Streams or Firehose.
- Hot shard (write throttled): UpdateShardCount to add shards, random partition key, set alarms on metrics.

### Other ingestion services and batch
- MSK to replace an existing Kafka cluster, you pay for the cluster even when idle. Kinesis is serverless, you pay for throughput.
- Amazon AppFlow: from SaaS. AWS Transfer Family: FTP and SFTP to S3. AWS DataSync: on-premises NFS and SMB. Snow Family: very large data.
- Batch: large payloads, scheduled hourly up to weekly, for cold data. EMR (Spark plus JDBC) or AWS Glue (fully managed ETL, JDBC, Glue Studio).
- Stateful: ElastiCache for Redis, RDS. Stateless: Lambda, API Gateway, S3.

### Question patterns
- Ad hoc queries on files in S3 => Amazon Athena.
- Athena table must update when new data arrives => Glue crawler.
- Data warehouse plus data in S3 => Redshift plus Redshift Spectrum.
- Redshift COPY slow from one large file => split into a multiple of the number of slices.
- Kinesis Data Streams throttled => UpdateShardCount plus random partition key.
- New streaming, pay per throughput => Kinesis. Migrating existing Kafka => MSK.
- SaaS => AppFlow. FTP or SFTP => Transfer Family. On-premises NFS or SMB => DataSync. Very large data => Snow Family.
- Ongoing replication of database changes to S3 => AWS DMS.
- Logs and clickstream near real time with search => OpenSearch Service.

## Lesson 2: Transform and process data
### Modeling, OLTP, OLAP
- Know conceptual, logical, physical models, normalization, and data vault.
- OLTP: real-time transactions, current state, small storage, fast response (orders, payments).
- OLAP: analysis and reporting, history, star or snowflake schema, storage from terabytes to petabytes.
- Transformation: change data types, standardize formats, drop bad data, aggregate for reports or ML features.
- Transformation can happen during ingestion. Example: Firehose writing Parquet.

### Processing services
- Cloud computing: Lambda, EMR, Glue, Redshift. Distributed: EMR, AWS Batch, Step Functions.
- Lambda for light validation and transforms, for example on each CSV file that lands in S3.
- AWS Glue: serverless, Python or Spark engine, data in S3.
- Glue Data Catalog gives a logical view over DMS output files (one prefix per table). Query through Athena or use in EMR and Glue ETL code.
- Glue crawler infers the schema and fills the catalog automatically.

### Glue vs EMR vs Flink
- EMR: full Hadoop (Spark, Hive, Hudi, HBase, Presto, Pig), more capable than Glue, but not fully managed.
- Spark on EMR: create a cluster, set memory and executor cores, submit jobs with spark-submit, scale up or down.
- Glue: fully managed, enough for cleansing, enrichment, data movement.
- Flink: basic SQL transformations. Complex transformations move to EMR or Glue.

### Architecture examples
- Secure IoT near real time: Firehose to S3, Lambda removes sensitive data before it is stored.
- Web logs on EC2: Kinesis Agent to Firehose, to S3 and to Flink, then a second Firehose to OpenSearch, visualized in Kibana.
- Reduce Redshift load when joining history in S3: Redshift Spectrum external table.
- Enrich CloudWatch Logs with DynamoDB: CloudWatch Logs subscription to Firehose, Lambda to enrich, destination S3.

### Troubleshooting
- Check service logs, data quality at each stage, then mapping, filter, and aggregation logic.
- Glue has a development mode and a debugging mode. Debug with a small dataset.
- Optimization: partitioning, parallelism, memory and executor tuning, caching.
- Incremental processing for new data only. Retry for temporary issues.
- Unit, integration, and end-to-end tests in staging.

### Connectivity and data APIs
- JDBC: Java API. Set up the driver, open the port in the security group inbound rules, URL holds host, port, database name.
- ODBC: install the driver, create a DSN, the application connects through the DSN.
- RDS, Aurora, Redshift reduce manual JDBC or ODBC setup.
- Data API: API Gateway (auth, rate limiting, caching, versioning) plus Lambda. Security: IAM, Certificate Manager, API keys, OAuth.
- Cache: ElastiCache or API Gateway cache. Monitoring: CloudWatch. CI/CD: CodePipeline and CodeBuild.

### Question patterns
- Serverless Spark, only cleansing and movement => AWS Glue.
- Need cluster control and the Hadoop ecosystem => Amazon EMR.
- Basic stream transformation with SQL => Managed Service for Apache Flink.
- Light validation of each file in S3 => Lambda.
- Automatic schema for files in S3 => Glue crawler plus Data Catalog.
- Join S3 history without loading Redshift => Redshift Spectrum.
- IoT near real time, remove sensitive data => Firehose plus Lambda, to S3.
- Enrich CloudWatch Logs => subscription to Firehose plus Lambda.
- Expose data to other systems securely => API Gateway plus Lambda plus IAM.

## Lesson 3: Orchestrate data pipelines
### Pipeline concepts
- Know the architectures: data warehouse, data lake, lakehouse, Lambda, Kappa, data mesh. Reference: Well-Architected Framework, six pillars.
- Pipeline: a set of tasks in a defined order, sequential or parallel. The order is called a workflow.
- Serverless orchestration: Step Functions and Lambda.
- Airflow requires a DAG, Step Functions does not.
- Correction Notice: the video says "Directed Acrylic Graph". The correct term is Directed Acyclic Graph, a directed graph with no cycles.
- Many small files as one batch: send a manifest file, S3 event notification only for the "manifest" prefix, then check each file. Still event-driven.

### Failures and retries
- Data quality (receiving JSON when CSV is expected) and code errors: hard failure.
- Endpoint errors: a temporary network issue is a soft failure, wrong permissions is a hard failure.
- Dependency errors: within or between pipelines.
- Step Functions: interval 10 seconds, backoff rate 1.5, waits of 10, 15, 22.5 seconds.
- Alerts: Amazon SNS topic with an email subscription.

### Service choices
- Serverless: AWS Data Pipeline and Step Functions. Managed open source: Amazon MWAA. Specialized: Glue workflows.
- Data Pipeline: scheduled ETL between AWS and on-premises, supports on-premises JDBC. The instructor picks it for less complex environments.
- Step Functions: visual low code or Amazon States Language (JSON), for more complex environments. Triggered by EventBridge or API.
- Glue workflows: when the pipeline is purely Glue components, use triggers. Other services through a Glue Python shell job with Boto3.
- MWAA: managed Airflow, DAGs written in Python.
- Note: AWS Data Pipeline has been in maintenance mode since 2024. CloudWatch Events is now part of EventBridge.

### Pipeline examples
- Raw zone from Firehose, DMS, DataSync. S3 triggers a Lambda that runs a crawler.
- A CloudWatch Events rule triggers Glue ETL to Parquet in the processed zone, then SNS sends an email.
- Step Functions with EMR: Lambda submits a Spark job, waits, checks status, goes to success or failure.
- A Choice state reads the job status. A Catch statement runs a notification Lambda on error.
- Athena over data in two Regions: a Glue crawler in one Region catalogs all Regions.

### Best practices
- Distributed processing, auto scaling, partitioning.
- Fault-tolerant storage: S3 or EFS. Backup: S3 or AWS Backup.
- CloudWatch alarms. Retries with Step Functions or Glue workflows.
- Data validation, testing, version control, CI/CD.

### Question patterns
- Pipeline of only Glue crawlers and jobs => Glue workflows.
- Glue workflow needs EMR or SQS => Python shell job with Boto3.
- Managed Airflow => Amazon MWAA.
- Many sequential jobs, complex, no separate application => Step Functions.
- Process a batch only after all files are complete => manifest file plus S3 event prefix filter.
- Retry with growing waits => Step Functions backoff rate.
- Email on failure or completion => SNS.
- Athena query across Regions => one Glue crawler cataloging all Regions.

## Lesson 4: Apply programming concepts
### SQL vs Spark
- SQL: standard and widely known. Spark: more flexible for complex processing with latency and throughput requirements.
- Spark on AWS: Glue (serverless), EMR, ECS or EKS, partners such as Databricks.
- Target in Redshift means ELT, use SQL.
- Transform in Spark then load into the warehouse means ETL, the warehouse load stays focused on user queries.
- Redshift: the parser and optimizer build a query plan, the execution engine sends code to the compute nodes.

### ETL tools
- EMR: Hadoop, Spark, HBase, Presto, YARN, Tez, Pig, one to thousands of nodes.
- Data Pipeline: data nodes and activities (S3 data node, Hive activity on EMR, Redshift copy activity).
- Glue Studio: visual SQL-based transformations on the Spark engine for users without Spark skills. Glue DataBrew: transformations on a set of files.
- Athena column names: alphanumeric characters and underscores only (/var/log becomes var_log).

### Runtime optimization
- Parallel and batch processing.
- Parquet or ORC, compression, partitions by date or Region.
- Filter data early, incremental processing.
- Tune memory and parallelism, monitor with CloudWatch.

### IaC, CI/CD, Lambda
- CloudFormation or CDK for repeatable deployments. AWS SAM for Lambda, Step Functions, DynamoDB.
- Templates in CodeCommit or GitHub, CI/CD runs on each commit. Note: CodeCommit has not accepted new customers since 2024.
- Lambda: set memory, concurrency limit, timeout, retries. Asynchronous invocation when no immediate response is needed.
- Provisioned concurrency to prewarm. Lambda in a VPC adds latency.

### Data structures and algorithms
- Data structures: relational, NoSQL, warehouse, distributed file system, message queue, tree, hash table.
- An algorithm built for one data structure becomes inefficient on another. Large sorts: Quicksort or Merge Sort.
- Example: large customer data in HDFS on EMR, processed with MapReduce.
- Data lost in a Kinesis Java consumer: idempotent processing and a shard iterator at the position before the error.

### Question patterns
- Transformation target in Redshift => SQL (ELT).
- Reduce warehouse load => Spark on Glue or EMR, then load (ETL).
- SQL transformations without Spark skills => Glue Studio. Transformations on a set of files => Glue DataBrew.
- Athena columns with slashes, spaces, dots => replace with underscores.
- Deploy a serverless pipeline => AWS SAM. Repeatable infrastructure => CloudFormation or CDK.
- Lambda needs prewarming => provisioned concurrency.
- Data lost in a Kinesis consumer => idempotent processing plus GetShardIterator.
- Slow job on large data => Parquet, partitions, compression, early filtering.

## Key numbers and limits
- Example streaming payload: around 1 KB per event.
- Number of files for Redshift COPY: a multiple of the number of slices.
- Step Functions retry: interval 10 seconds, backoff 1.5, waits of 10, 15, 22.5 seconds.
- Batch: hourly, daily, weekly.
- OLAP: terabytes to petabytes.
- Well-Architected: six pillars. Five Vs of data. Five lifecycle stages.
- Kinesis Data Streams capacity is counted per shard.
- Athena column names: alphanumeric characters and underscores only.

## Exam traps
- Data Streams (real time, custom applications) vs Firehose (buffered, near real time, straight to the destination).
- Real time vs near real time, read the keywords.
- Kinesis vs MSK: a new solution means Kinesis, replacing existing Kafka means MSK.
- Glue (fully managed) vs EMR (more complete, you manage the cluster).
- Flink is only for basic SQL transformations.
- DataSync vs Transfer Family vs Snow Family vs AppFlow: tell them apart by protocol and source.
- A hard failure is not fixed by retrying. A soft failure can be.
- Triggering only on the manifest file still counts as event-driven.
- Glue workflows only fit when the pipeline is purely Glue.
- Stateful (ElastiCache, RDS) vs stateless (Lambda, API Gateway, S3).

## Additional resources
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
