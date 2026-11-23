# DEA-C01 Sample Questions with Answers

20 worked practice questions for the **AWS Certified Data Engineer – Associate (DEA-C01)** exam. Try each one before you open the answer.

For many more, with the same explanation on every option, use the [DEA-C01 practice questions](https://www.savemycert.com/practice/aws-data-engineer-associate/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide) on SaveMyCert.

## Question 1

*Data Ingestion and Transformation*

**A retail company captures website clickstream events. Three applications must each process every event within seconds, reading at their own pace. A fraud-model team plans to add a fourth application next month, and it must be able to start from the events captured earlier that same day. Which ingestion service should the data engineer use?** Choose one.

- **a.** An Amazon Data Firehose stream that delivers to Amazon S3
- **b.** An Amazon SNS topic with an SQS queue for each application
- **c.** An Amazon SQS standard queue shared by the applications
- **d.** An Amazon Kinesis data stream in on-demand capacity mode

<details>
<summary>Show answer and explanation</summary>

**Answer: d**

- **a** ❌ Firehose buffers and delivers records to a destination; it has no consumer API, so applications cannot each read the events within seconds, and the S3 copy arrives only after the buffer interval.
- **b** ❌ SNS-to-SQS fan-out serves the three current applications, but SNS standard topics keep no history: a queue subscribed next month only receives events published after it subscribes.
- **c** ❌ Consumers of one SQS queue compete for messages: each message goes to one consumer and is deleted after processing, so the applications would not each see every event.
- **d** ✅ A Kinesis data stream retains records (24 hours by default) whether or not they were read, lets several consumers read the same records independently, and lets a new consumer start from TRIM_HORIZON or a timestamp to pick up earlier events.

**The concept.** Kinesis Data Streams is a retained, multi-consumer stream; Firehose is delivery only, SQS is a competing-consumer queue, and SNS standard topics deliver only to current subscribers.

**Why this is correct.** Two requirements decide it: every application reads every event independently, and a consumer added later must read events from earlier in the day. A Kinesis data stream keeps records for its retention period regardless of consumption, so any number of consumers read the same data at their own positions and a new one can start from the oldest retained record. SNS plus SQS meets the first requirement but not the second, a shared SQS queue meets neither, and Firehose exposes no read API at all.

**How to reason it out**

1. Note the latency (seconds) and that every application needs every event.
2. Note the late-joining consumer: it needs events that were published before it existed.
3. Eliminate designs without retention a new reader can rewind into (SNS, SQS, Firehose).
4. Choose the retained multi-consumer stream: Kinesis Data Streams.

> **Exam tip:** Many independent readers plus a late joiner that needs past events means a retained stream, not a queue, topic or delivery stream.

</details>

📖 Learn this topic: [Data Ingestion on AWS: Kinesis, MSK, DMS, Glue, and Batch Patterns](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-ingestion-kinesis-glue-batch/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 2

*Data Ingestion and Transformation*

**A media company ingests article-view events into an Amazon Kinesis data stream. Traffic changes unpredictably from hour to hour, and the operations team does not want to forecast, monitor or adjust shard counts. Which configuration meets these requirements with the LEAST operational overhead?** Choose one.

- **a.** Switch the data stream to on-demand capacity mode
- **b.** Replace the data stream with an Amazon MSK provisioned cluster
- **c.** Keep provisioned mode with enough shards for the busiest hour
- **d.** Keep provisioned mode and call UpdateShardCount from an alarm

<details>
<summary>Show answer and explanation</summary>

**Answer: a**

- **a** ✅ On-demand mode manages shards for you and scales write and read capacity with observed traffic, so there is no shard count to forecast or adjust.
- **b** ❌ An MSK provisioned cluster moves the capacity problem to brokers and partitions, adding operational work rather than removing it.
- **c** ❌ Sizing for the peak still requires forecasting the peak and paying for idle shards the rest of the time, and an unforecast spike still throttles.
- **d** ❌ Alarm-driven resharding works, but the team then owns the alarm thresholds, the scaling function and the UpdateShardCount quotas, which is exactly the capacity management they want to avoid.

**The concept.** Kinesis Data Streams has two capacity modes: provisioned (you choose and change the shard count) and on-demand (AWS scales shards with traffic).

**Why this is correct.** The deciding constraint is that nobody wants to plan or change capacity. On-demand mode removes shard management entirely. Alarm-driven UpdateShardCount and peak sizing both keep provisioned mode, so someone still forecasts or automates capacity, and MSK provisioned adds broker management.

**How to reason it out**

1. Identify the workload: unpredictable traffic with no capacity planning wanted.
2. Compare provisioned options: both still require choosing or automating a shard count.
3. Pick the mode in which AWS manages shards: on-demand.

> **Exam tip:** Unpredictable traffic and no shard management means Kinesis on-demand capacity mode.

</details>

📖 Learn this topic: [Data Ingestion on AWS: Kinesis, MSK, DMS, Glue, and Batch Patterns](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-ingestion-kinesis-glue-batch/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 3

*Data Ingestion and Transformation*

**An on-premises Oracle database supports a live ordering system. A data engineer must copy the existing order rows into an Amazon S3 data lake and then keep S3 current with every insert, update and delete, while placing minimal load on the source. Which approach should the engineer use?** Choose one.

- **a.** An AWS DMS task of type full load and ongoing replication
- **b.** An AWS DMS task of type CDC, started from the current time
- **c.** A nightly AWS Glue JDBC job with bookmarks on the order ID
- **d.** An AWS DMS task of type full load, rerun each night

<details>
<summary>Show answer and explanation</summary>

**Answer: a**

- **a** ✅ Full load plus CDC copies the existing rows once and then reads the database transaction log to apply inserts, updates and deletes continuously, with little load on the source.
- **b** ❌ A CDC task without a full load captures changes from its start point but never copies the rows that already exist, so the lake would be missing historical orders.
- **c** ❌ A bookmark on a monotonically increasing key picks up new rows, but it never sees updates or deletes to existing rows, and nightly runs are not continuous.
- **d** ❌ A nightly full load re-reads every table each time, which loads the source heavily and leaves S3 up to a day behind.

**The concept.** AWS DMS tasks come in three types: full load (one-time copy), CDC only (changes from a start point) and full load plus CDC (copy, then continuous changes read from the transaction log).

**Why this is correct.** The requirement has two halves: the existing rows and every later change, including deletes. Full load and ongoing replication covers both and reads changes from the redo log rather than by querying tables. Full load alone misses continuity and hammers the source, CDC only misses history, and a Glue JDBC bookmark sees only newly inserted keys.

**How to reason it out**

1. Split the requirement: historical rows plus continuous inserts, updates and deletes.
2. Note that deletes and updates require log-based change capture, not key-based incremental reads.
3. Match both halves to one DMS task type: full load plus CDC.

> **Exam tip:** Existing data plus every later change from a relational source means an AWS DMS full-load-and-CDC task.

</details>

📖 Learn this topic: [Data Ingestion on AWS: Kinesis, MSK, DMS, Glue, and Batch Patterns](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-ingestion-kinesis-glue-batch/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 4

*Data Ingestion and Transformation*

**Analysts use Amazon Athena to run monthly aggregate reports over the full history of a CSV data lake in Amazon S3. Each query reads 4 of the table's 120 columns across every row, and the Athena bill keeps rising. Which change reduces the data scanned per query by the LARGEST amount?** Choose one.

- **a.** Partition the CSV data in S3 by the year and month of each event
- **b.** Move the CSV objects to the S3 Standard-Infrequent Access class
- **c.** Compress the CSV files with gzip and keep the same table layout
- **d.** Rewrite the data as Snappy-compressed Parquet with a Glue job

<details>
<summary>Show answer and explanation</summary>

**Answer: d**

- **a** ❌ Partitioning prunes data only when queries filter on the partition columns. These reports aggregate the full history, so every partition is still read in full.
- **b** ❌ A storage class changes the storage price, not the bytes Athena scans. Queries would scan the same data and also add retrieval charges.
- **c** ❌ Athena bills on compressed bytes, so gzip does cut the scan, but every query still reads all 120 columns of every row. Columnar storage saves far more when queries touch 4 columns.
- **d** ✅ Parquet is columnar, so Athena reads only the 4 referenced columns, and per-column compression shrinks those further. That attacks both the unused 116 columns and the raw size.

**The concept.** Athena bills by bytes scanned. Row formats such as CSV force a query to read every column of every row; columnar formats such as Apache Parquet store each column separately so engines read only the referenced columns, and compress each column well.

**Why this is correct.** Queries touching 4 of 120 columns waste roughly 97% of every CSV scan. Parquet removes that waste and adds compression on top, so it beats gzip CSV, which shrinks bytes but still reads every column. Partitioning is a strong lever only when queries filter on the partition key, and these full-history reports do not. Storage classes do not change scan volume at all.

**How to reason it out**

1. Identify what Athena charges for: bytes scanned per query.
2. Note the access pattern: few columns, all rows, no selective filter.
3. Columnar layout removes unused columns from the scan; compression only shrinks what is still read.
4. Partitioning helps only with filters on the partition key, which these reports lack.

> **Exam tip:** When queries read a few columns, columnar Parquet is the biggest scan-cost lever; partitioning helps only when queries filter on the partition key.

</details>

📖 Learn this topic: [Transform and Process Data on AWS: Glue, EMR, Lambda, and Redshift](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-transformation-glue-emr-spark/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 5

*Data Ingestion and Transformation*

**A data engineering team runs a nightly ETL pipeline made up of an AWS Glue crawler that catalogs new raw files, followed by two Glue Spark jobs that must run in sequence, each starting only after its predecessor succeeds. The team wants a single visual run graph with per-step status and does not want to provision or pay for an orchestration service beyond the ETL service they already use. What should the team use?** Choose one.

- **a.** An AWS Glue workflow with a schedule trigger and conditional triggers
- **b.** An AWS Step Functions state machine with three .sync Glue task states
- **c.** An Amazon MWAA environment running a DAG with three Glue operators
- **d.** Amazon EventBridge rules matching each Glue job's state-change events

<details>
<summary>Show answer and explanation</summary>

**Answer: a**

- **a** ✅ A Glue workflow chains the crawler and both jobs with a scheduled start trigger and conditional triggers that fire on the predecessor's success, and shows each run as a graph with per-node status, all inside AWS Glue at no extra orchestration cost.
- **b** ❌ Step Functions would sequence the steps correctly, but it is an additional orchestration service billed per state transition, which the team does not want to add.
- **c** ❌ MWAA can run Glue operators, but it is a separate always-on Airflow environment the team would have to provision and pay for, which the stem rules out.
- **d** ❌ Rules on Glue state-change events can start the next step, but the chain is spread across separate rules with no single run graph or per-run view of the pipeline.

**The concept.** AWS Glue workflows are the native orchestration feature for pipelines made only of Glue crawlers and jobs: triggers (scheduled, on-demand, conditional, event) form a dependency graph that is run and monitored inside AWS Glue.

**Why this is correct.** Every step is a Glue entity and the team wants no orchestration service beyond Glue itself, plus one run graph. A Glue workflow provides exactly that: a scheduled start trigger, conditional triggers that fire when the predecessor succeeds, and a per-run graph with node status. Step Functions and MWAA would both work functionally but add a separately billed service; EventBridge rules can chain jobs but give no single run view.

**How to reason it out**

1. Check whether every step is a Glue crawler or Glue job; if so, Glue workflows can orchestrate it natively.
2. Apply the constraint: no extra orchestration service rules out Step Functions and MWAA even though both could run the jobs.
3. Check the monitoring need: one run graph with per-step status rules out a chain of separate EventBridge rules.
4. Build the workflow: scheduled start trigger on the crawler, conditional triggers on success for each job.

> **Exam tip:** All-Glue pipeline plus no extra orchestration service means AWS Glue workflows; a non-Glue step is what pushes you to Step Functions.

</details>

📖 Learn this topic: [Orchestrating Data Pipelines on AWS: Step Functions, MWAA, and Glue Workflows](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-pipeline-orchestration-step-functions-mwaa/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 6

*Data Ingestion and Transformation*

**An AWS Glue Spark job reads a 3 TB clickstream table from Amazon S3 that is cataloged with year, month and day partition columns. Each run needs only the last 7 days, but the script creates a DynamicFrame from the whole table and filters on the date afterwards. Runtime and DPU cost grow every week as history accumulates. Which change reduces runtime the most?** Choose one.

- **a.** Apply the date filter as a Python UDF over the date columns once the table loads
- **b.** Pass a push_down_predicate on the partition columns in the DynamicFrame read
- **c.** Cache the DynamicFrame as a Spark DataFrame in memory before the date filter runs
- **d.** Add workers so each partition of the table is read in parallel before the filter

<details>
<summary>Show answer and explanation</summary>

**Answer: b**

- **a** ❌ A Python UDF is opaque to the optimizer and adds JVM-to-Python serialization, and it still runs after the full read, so nothing is pruned.
- **b** ✅ A pushdown predicate is evaluated against the partition metadata in the Data Catalog before any file is read, so only the 7 matching day partitions are listed and loaded.
- **c** ❌ Caching happens after the read; it speeds up repeated access to data that never needed to be loaded, and caching 3 TB adds memory pressure.
- **d** ❌ More workers parallelize the waste: the job still lists and reads 3 TB to keep a few days of it, so DPU cost rises even if wall-clock time drops.

**The concept.** Partition pruning: when a filter is expressed on partition columns at read time, the engine resolves which partitions match from catalog metadata and never opens the others.

**Why this is correct.** The table is already partitioned by year/month/day, so the cheapest data is the data never read. Supplying push_down_predicate when creating the DynamicFrame (or filtering on partition columns before any action with the DataFrame API) prunes the read to 7 partitions. Adding workers, caching or using a UDF all act after the full 3 TB has been read; the UDF is worse still because it hides the predicate from the optimizer.

**How to reason it out**

1. Notice that the filter column is the partition key and that only a small slice of partitions is needed.
2. Ask whether each option changes how much data is read or only how fast the full read runs.
3. Choose the option that applies the filter on partition columns at read time.
4. Reject options that act after the full read (workers, cache, UDF).

> **Exam tip:** Filter on partition columns when you read (pushdown predicate), not after; reading less beats reading faster.

</details>

📖 Learn this topic: [Programming Concepts for AWS Data Engineering: IaC, CI/CD, and Lambda Tuning](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-engineering-programming-iac-cicd/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 7

*Data Ingestion and Transformation*

**An application stores customer profiles in an Amazon DynamoDB table. A data engineer must run processing logic within seconds of any profile being created or modified, using the old and new versions of the item, without changing the application code. Which solution meets these requirements?** Choose one.

- **a.** Schedule incremental exports of the table to S3 and process each export
- **b.** Turn on DynamoDB Streams and add a Lambda event source mapping
- **c.** Run an AWS Glue job at five-minute intervals that scans the table
- **d.** Turn on DynamoDB Streams and read the stream with an AWS Glue streaming job

<details>
<summary>Show answer and explanation</summary>

**Answer: b**

- **a** ❌ Incremental export to S3 works on export windows of at least 15 minutes, so changes are processed far later than within seconds.
- **b** ✅ DynamoDB Streams records every item-level change, with the NEW_AND_OLD_IMAGES view type supplying both versions, and a Lambda event source mapping invokes the function within seconds without any change to the writer.
- **c** ❌ A scheduled scan consumes read capacity, cannot see the previous version of an item, and runs minutes rather than seconds after the change.
- **d** ❌ AWS Glue streaming jobs read from Kinesis Data Streams and Apache Kafka sources, not directly from a DynamoDB stream.

**The concept.** DynamoDB Streams emits an ordered, item-level change record for every write; with the NEW_AND_OLD_IMAGES view type each record carries the item before and after the change.

**Why this is correct.** The table itself must be the trigger, because the application cannot change. DynamoDB Streams with a Lambda event source mapping reacts within seconds and provides old and new images. A Glue streaming job cannot use a DynamoDB stream as its source, and scheduled scans or incremental exports run minutes behind.

**How to reason it out**

1. Note the constraints: seconds of latency, old and new item versions, no application changes.
2. Change data must come from the table itself: DynamoDB Streams with NEW_AND_OLD_IMAGES.
3. Choose a consumer that reads DynamoDB Streams natively: a Lambda event source mapping.

> **Exam tip:** React to DynamoDB item changes without touching the writer: DynamoDB Streams plus a Lambda event source mapping.

</details>

📖 Learn this topic: [Data Ingestion on AWS: Kinesis, MSK, DMS, Glue, and Batch Patterns](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-ingestion-kinesis-glue-batch/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 8

*Data Store Management*

**An e-commerce company stores user session data that is always read and written by session ID. Traffic peaks at millions of requests per second during sales events and is near zero overnight. Every acknowledged write must survive an infrastructure failure, latency must stay in single-digit milliseconds at any scale, and the team does not want to manage servers or capacity. Which data store meets these requirements?** Choose one.

- **a.** Amazon Aurora Serverless v2 for MySQL
- **b.** Amazon ElastiCache Serverless for Valkey
- **c.** Amazon DynamoDB table in on-demand mode
- **d.** Amazon RDS for MySQL with read replicas

<details>
<summary>Show answer and explanation</summary>

**Answer: c**

- **a** ❌ Aurora Serverless v2 removes instance sizing and is durable, but all writes still go through a single writer instance, so millions of writes per second with consistent single-digit-millisecond latency is not something a relational writer delivers.
- **b** ❌ ElastiCache gives sub-millisecond reads and scales without node management, but it is a cache: replication to replicas is asynchronous, so a write acknowledged just before a failure can be lost. It does not meet the "every acknowledged write must survive" requirement as a system of record.
- **c** ✅ Correct. DynamoDB is built for known-key reads and writes at any scale with consistent single-digit-millisecond latency and durably stores every write across multiple Availability Zones. On-demand mode scales with traffic without capacity units to plan; for an announced sales event that will far exceed previous peaks, the table can be pre-warmed with warm throughput.
- **d** ❌ Read replicas scale reads only; writes still hit one primary instance whose size you manage. It fails both the write-throughput requirement and the "no capacity to manage" constraint.

**The concept.** The access pattern picks the store. Known-key reads and writes at very high request rates with predictable latency are the DynamoDB use case; durability and serverless operations narrow it further.

**Why this is correct.** Three constraints decide. Known-key access at millions of requests per second with consistent single-digit-millisecond latency rules out relational engines, which funnel writes through one writer. "Every acknowledged write must survive" rules out a cache, because ElastiCache replicates asynchronously. "No servers or capacity to manage" with traffic that swings from near zero to peak is what DynamoDB on-demand mode is for. On-demand instantly absorbs up to double a table's previous peak, so for a planned jump far beyond earlier traffic you set warm throughput in advance rather than managing capacity units. Aurora Serverless v2 is the tempting answer because it is serverless and durable, but it is still a single-writer relational database.

**How to reason it out**

1. Identify the access pattern: every read and write is by session ID, a pure key/value pattern.
2. Apply the scale and latency requirement: millions of writes per second at single-digit milliseconds excludes single-writer relational engines.
3. Apply the durability requirement: a cache with asynchronous replication can lose acknowledged writes.
4. Apply the operations constraint: on-demand capacity removes capacity planning for spiky traffic.

> **Exam tip:** Key/value access at any scale with durable writes and no capacity planning means DynamoDB on-demand; a cache is not a system of record and a relational writer does not scale out writes.

</details>

📖 Learn this topic: [Choosing an AWS Data Store: Redshift, DynamoDB, Aurora, S3, and MemoryDB](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-store-selection-redshift-dynamodb/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 9

*Data Store Management*

**A retail company wants to power BI dashboards for 300 analysts who query throughout the business day. The queries join and aggregate several terabytes of historical sales data, scan most of each table, and group by region, product and week. The company wants consistently fast response under this steady, all-day concurrent load. Which data store is the best fit?** Choose one.

- **a.** Amazon Aurora PostgreSQL with read replicas
- **b.** An Amazon Redshift provisioned RA3 cluster
- **c.** Amazon RDS for PostgreSQL on a larger instance
- **d.** Amazon Athena over partitioned Parquet in S3

<details>
<summary>Show answer and explanation</summary>

**Answer: b**

- **a** ❌ Read replicas spread concurrent readers, but Aurora is a row-oriented OLTP engine. Full-table scans and aggregations over terabytes read every column of every row and run slowly on any replica.
- **b** ✅ Correct. Redshift is a columnar, massively parallel warehouse: it reads only the referenced columns, compresses them, and spreads scans and aggregations across all slices, which is what steady, concurrent BI over terabytes needs.
- **c** ❌ A bigger instance adds CPU and memory, but the row store still reads entire rows for column aggregates and runs each query on one node; it does not parallelize terabyte scans the way an MPP warehouse does.
- **d** ❌ Athena suits ad hoc or infrequent queries and bills per terabyte scanned. For hundreds of analysts scanning most of several terabytes all day, per-query scan charges add up and response times are less consistent than a warehouse sized for the steady load.

**The concept.** Analytical workloads (large scans, joins, group-by aggregations, BI concurrency) belong in a columnar MPP warehouse; row-oriented OLTP engines and per-query lake engines fit other access patterns.

**Why this is correct.** The deciding signals are scan-heavy aggregation over terabytes and constant concurrent use. Redshift stores data by column and parallelizes each query across nodes, so it reads far less data and keeps latency steady. Athena is the cost answer when queries are occasional; with 300 analysts all day, scan-based pricing and variable latency make it the weaker choice. Aurora and RDS are row stores tuned for small transactional reads and writes; replicas or bigger instances do not change how they scan.

**How to reason it out**

1. Classify the workload: large scans, joins and group-by aggregations are analytical (OLAP).
2. Note the usage profile: hundreds of concurrent users, steady all day.
3. Eliminate row-oriented OLTP engines, however they are scaled.
4. Choose between warehouse and lake query engine by frequency: steady heavy use favors Redshift; occasional use would favor Athena.

> **Exam tip:** Scan-and-aggregate BI under steady concurrent load is Redshift; Athena wins only when queries are occasional.

</details>

📖 Learn this topic: [Choosing an AWS Data Store: Redshift, DynamoDB, Aurora, S3, and MemoryDB](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-store-selection-redshift-dynamodb/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 10

*Data Store Management*

**A company keeps its datasets in Amazon S3 and queries them from Amazon Athena, Spark jobs on Amazon EMR, and Amazon Redshift Spectrum. Each engine holds its own table definitions, and they have drifted apart. The data team wants one shared set of schemas, locations, and partitions for all three engines, with no metadata servers to operate. What should the team use?** Choose one.

- **a.** AWS Glue Data Catalog as the metastore for all three engines
- **b.** AWS Glue Schema Registry, with one registered schema per dataset
- **c.** An Apache Hive metastore on Amazon RDS shared by all three engines
- **d.** Amazon SageMaker Catalog, with each dataset published as an asset

<details>
<summary>Show answer and explanation</summary>

**Answer: a**

- **a** ✅ The Glue Data Catalog is a serverless, Hive-compatible metastore. Athena uses it by default, EMR can be configured to use it as its metastore, and Redshift Spectrum external schemas point at its databases, so one definition serves all three.
- **b** ❌ Schema Registry versions Avro, JSON Schema and Protobuf schemas for streaming producers and consumers. It records no table locations or partitions, and query engines do not resolve tables against it.
- **c** ❌ A shared external Hive metastore can serve EMR, and Athena and Spectrum can be connected to one, but the team would then run and maintain the metastore service and its database, which the stem rules out.
- **d** ❌ SageMaker Catalog is a business catalog: it adds descriptions, glossary terms and subscription workflows on top of technical assets. Engines still read schemas and partitions from a technical metastore, not from published assets.

**The concept.** A technical data catalog stores table metadata (schema, format, location, partitions) once so every engine can query data where it lives. On AWS the managed technical catalog is the AWS Glue Data Catalog.

**Why this is correct.** The requirement is one shared metadata source for three engines with no servers to run. The Glue Data Catalog meets both parts: Athena, EMR (as its Hive metastore) and Redshift Spectrum (through an external schema) all read the same tables. A Hive metastore on RDS would also give one shared definition, but it is infrastructure the team must operate. Schema Registry and SageMaker Catalog hold metadata of a different kind and are not metastores that query engines resolve tables against.

**How to reason it out**

1. Identify the need: shared table definitions (schema, location, partitions) for several query engines.
2. Separate technical metastores from schema registries and business catalogs.
3. Of the two metastores, apply the constraint: no metadata servers to operate.
4. Choose the serverless Glue Data Catalog and point each engine at it.

> **Exam tip:** Shared schemas, locations and partitions for Athena, EMR and Spectrum with nothing to run = the Glue Data Catalog.

</details>

📖 Learn this topic: [AWS Glue Data Catalog: Crawlers, Partitions, and the Hive Metastore](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-glue-data-catalog-crawlers/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 11

*Data Store Management*

**A healthcare company stores medical imaging files in Amazon S3. Each file is accessed roughly once per quarter, but when a physician requests an image it must be returned with millisecond latency. The company wants the lowest-cost storage class that meets this requirement. Which storage class should a data engineer choose?** Choose one.

- **a.** S3 Glacier Deep Archive
- **b.** S3 Standard-IA
- **c.** S3 Glacier Instant Retrieval
- **d.** S3 Glacier Flexible Retrieval

<details>
<summary>Show answer and explanation</summary>

**Answer: c**

- **a** ❌ Deep Archive is the cheapest class but standard retrievals take up to 12 hours, which fails the millisecond-latency requirement.
- **b** ❌ Standard-IA also provides millisecond access, but its storage price is higher than Glacier Instant Retrieval, so it is not the lowest-cost option for data touched only quarterly.
- **c** ✅ Glacier Instant Retrieval offers the lowest storage cost among classes that still return objects in milliseconds, and it is designed for data accessed roughly once per quarter.
- **d** ❌ Glacier Flexible Retrieval requires an asynchronous restore that takes minutes to hours, so it cannot serve images with millisecond latency.

**The concept.** S3 offers a spectrum of storage classes that trade storage price against retrieval latency and retrieval cost. The archive classes split into Glacier Instant Retrieval (milliseconds), Glacier Flexible Retrieval (minutes to hours), and Glacier Deep Archive (hours).

**Why this is correct.** The access pattern is rare (quarterly) but latency-sensitive (milliseconds). Glacier Instant Retrieval was built exactly for this: archive-level storage pricing with the same millisecond first-byte latency as Standard-IA. Standard-IA meets the latency bar but costs more to store, while Flexible Retrieval and Deep Archive are asynchronous-restore classes that can never satisfy an interactive request.

**How to reason it out**

1. List the hard requirement: millisecond retrieval eliminates any class that needs an asynchronous restore (Flexible Retrieval, Deep Archive).
2. Compare the remaining synchronous classes (Standard, Standard-IA, One Zone-IA, Glacier Instant Retrieval) on storage price for rarely accessed data.
3. Choose Glacier Instant Retrieval because it has the lowest storage cost of the synchronous classes and targets data accessed about once a quarter.

> **Exam tip:** When data is rarely accessed but must stay instantly retrievable, S3 Glacier Instant Retrieval is the lowest-cost fit.

</details>

📖 Learn this topic: [Managing the Data Lifecycle: S3 Storage Tiers, Expiration, and Redshift](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-lifecycle-s3-management/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 12

*Data Store Management*

**An Amazon Redshift warehouse has a 2 GB product dimension that is updated weekly. Five large fact tables join to it on product_id, but each fact table is distributed on a different column (customer_id, order_id and others). Query plans show the dimension being broadcast across the network for every join. How should a data engineer change the product dimension?** Choose one.

- **a.** Define a compound sort key on the dimension's product_id
- **b.** Set DISTSTYLE EVEN on the product dimension table
- **c.** Set DISTSTYLE ALL on the product dimension table
- **d.** Set DISTSTYLE KEY on the dimension's product_id column

<details>
<summary>Show answer and explanation</summary>

**Answer: c**

- **a** ❌ A sort key orders rows within each slice for block pruning; it does not change which node holds a row, so the broadcast remains.
- **b** ❌ EVEN spreads the dimension round-robin with no regard to the join column, so every join still has to broadcast or redistribute it.
- **c** ✅ Correct. A full copy of a small, rarely updated dimension sits on every node, so each fact table finds every product row locally whatever the fact table is distributed on.
- **d** ❌ KEY collocates only with tables distributed on the same column. The fact tables are distributed on other columns, so their matching rows are still on different slices.

**The concept.** Redshift distribution decides which node stores each row. KEY collocates rows with the same value of one column, ALL puts a full copy on every node, EVEN round-robins, and AUTO lets Redshift choose.

**Why this is correct.** The dimension is small and changes weekly, and it is joined from several fact tables that are each distributed on a different column. KEY on product_id would collocate with none of them, because a fact table distributed on customer_id keeps its product rows spread across all slices. ALL makes a local copy available on every node, so the broadcast step disappears for every fact table at the cost of a few GB per node and slower weekly loads. EVEN does nothing for joins, and a sort key only orders rows inside a slice.

**How to reason it out**

1. Note the table's size and update rate: small and rarely changed.
2. Check what the fact tables are distributed on: different columns, none of them product_id.
3. Rule out KEY on the dimension, since collocation needs both sides distributed on the join column.
4. Choose ALL so every node holds the dimension and no join needs to move it.

> **Exam tip:** Small, slowly changing dimensions joined from facts with different distribution keys get DISTSTYLE ALL.

</details>

📖 Learn this topic: [Data Modeling on AWS: Redshift, DynamoDB, Lake Formation & Schema Evolution](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-modeling-schema-evolution/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 13

*Data Operations and Support*

**A nightly pipeline is driven by one AWS Lambda function that starts an AWS Glue job, polls GetJobRun in a sleep loop until the job ends, and then starts the next job. As data grew, one job now runs about 50 minutes and the function times out. The team wants per-step retries, a failure branch, one inspectable record of each run, and nothing billed while the pipeline is idle. What should the data engineer do?** Choose one.

- **a.** Use a provisioned Amazon MWAA environment with a DAG that runs each Glue job
- **b.** Use an EventBridge rule on Glue Job State Change events to invoke the next step
- **c.** Have the function re-invoke itself asynchronously with the job run ID to keep polling
- **d.** Use a Step Functions Standard workflow that runs each Glue job with the .sync pattern

<details>
<summary>Show answer and explanation</summary>

**Answer: d**

- **a** ❌ Airflow would give retries, failure handling and a run view, but a provisioned MWAA environment is billed per environment-hour for as long as it exists, including the hours between nightly runs, which breaks the nothing-billed-while-idle requirement. (Amazon MWAA Serverless removes that idle charge, but it is not what this option proposes.)
- **b** ❌ Event-driven chaining removes the polling and costs nothing while idle, but each step becomes an independent invocation. Nothing ties the steps into one run with a shared history, and retries and failure routing across steps would have to be hand-built.
- **c** ❌ Self-reinvocation gets past the 15-minute limit, but it is still hand-rolled orchestration: no declarative retries, no failure branch, no single record of the run, and every hop pays for compute that only waits.
- **d** ✅ Correct. The run-a-job (.sync) integration makes the state wait for the Glue job to finish without any paid compute polling, each state takes its own Retry and Catch, every execution keeps a full event history, and Standard workflows bill per state transition with nothing running between executions.

**The concept.** Orchestrating a multi-step pipeline means waiting for long-running jobs, retrying and routing failures, and keeping a record of each run. The orchestrator that does all of that without paying for idle time is serverless Step Functions with the run-a-job integration.

**Why this is correct.** Two of the options remove the timeout, but the constraints decide. EventBridge chaining is serverless and idle-free, yet it has no notion of a run, so there is no single inspectable record and no declarative failure branch across steps. A provisioned MWAA environment provides all the orchestration features but bills per environment-hour, including while idle. A self-reinvoking Lambda only moves the polling problem around. A Step Functions Standard workflow with the Glue startJobRun.sync integration waits natively for the job, attaches Retry and Catch to each state, records every execution's history, and charges per state transition, so it is the only option that meets every requirement.

**How to reason it out**

1. List the requirements: wait for long jobs, per-step retries, a failure branch, one record per run, no idle cost.
2. Rule out options that are still hand-written orchestration (polling or self-reinvoking Lambda).
3. Check the event-driven chain against 'one record per run' and the provisioned Airflow environment against 'nothing billed while idle'.
4. Choose the serverless orchestrator whose .sync integration waits for the job without paid polling.

> **Exam tip:** When a Lambda function is polling a long job, the fix is Step Functions with the .sync integration, not a longer or self-chaining function.

</details>

📖 Learn this topic: [Automate Data Processing on AWS: Step Functions, MWAA, Lambda & EventBridge](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-automate-data-processing-lambda-glue/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 14

*Data Operations and Support*

**A data engineering team is migrating an on-premises Apache Airflow deployment to AWS. The team has more than 200 existing Python DAGs that use custom Airflow operators and plugins, and the team wants to keep the DAG code largely unchanged while AWS manages the underlying scheduler and worker infrastructure. Which service should the team use?** Choose one.

- **a.** Amazon Managed Workflows for Apache Airflow (Amazon MWAA)
- **b.** Amazon EventBridge Scheduler
- **c.** AWS Glue workflows
- **d.** AWS Step Functions

<details>
<summary>Show answer and explanation</summary>

**Answer: a**

- **a** ✅ Correct. MWAA runs open-source Apache Airflow as a managed service, so existing DAGs, custom operators, and plugins can be reused with minimal changes while AWS manages the scheduler, workers, and web server.
- **b** ❌ EventBridge Scheduler invokes individual targets on a schedule. It has no concept of multi-step dependencies, DAGs, or Airflow compatibility.
- **c** ❌ Glue workflows orchestrate only Glue jobs, crawlers, and triggers. They cannot run arbitrary Airflow DAGs or custom Python operators.
- **d** ❌ Step Functions defines workflows in Amazon States Language (JSON), not Python DAGs, so all 200 workflows would have to be rewritten from scratch.

**The concept.** Amazon MWAA is managed open-source Apache Airflow, which makes it the natural landing zone for teams that already have an Airflow investment they want to preserve.

**Why this is correct.** The deciding constraint is the existing asset: 200 Python DAGs with custom operators and plugins. MWAA runs genuine Apache Airflow, so the team uploads DAGs to an S3 bucket, declares dependencies in requirements.txt, ships plugins in plugins.zip, and the code runs essentially unchanged while AWS operates the scheduler, workers, metadata database, and web server. Step Functions would force a full rewrite into Amazon States Language, Glue workflows only chain Glue-native components, and EventBridge Scheduler is a trigger mechanism rather than an orchestrator.

**How to reason it out**

1. Identify the existing investment: Python DAGs, custom operators, and plugins that the team wants to keep.
2. Map that requirement to MWAA, the only AWS service that runs real Apache Airflow code.
3. Eliminate Step Functions (different workflow language), Glue workflows (Glue-only scope), and EventBridge Scheduler (triggering, not orchestration).

> **Exam tip:** When a scenario mentions existing Airflow DAGs that must be preserved, the answer is Amazon MWAA.

</details>

📖 Learn this topic: [Automate Data Processing on AWS: Step Functions, MWAA, Lambda & EventBridge](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-automate-data-processing-lambda-glue/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 15

*Data Operations and Support*

**An analytics team runs a few exploratory SQL queries per week against 2 TB of Parquet files in Amazon S3. The team has no data warehouse, does not want to copy or load the files anywhere, and wants charges to depend only on the data each query reads. Which service meets these requirements?** Choose one.

- **a.** An Amazon Redshift provisioned cluster querying the files through Spectrum
- **b.** Amazon Athena querying the Parquet files in place
- **c.** Amazon EMR Serverless running Spark SQL jobs against the files
- **d.** Amazon Redshift Serverless querying the files through Spectrum

<details>
<summary>Show answer and explanation</summary>

**Answer: b**

- **a** ❌ Spectrum avoids loading the files, but a provisioned cluster bills for its nodes around the clock, which a few queries a week cannot justify; it also means running a warehouse the team does not have.
- **b** ✅ Correct. Athena is serverless, reads the Parquet files where they sit through the Data Catalog, and bills per terabyte scanned, so a few weekly queries cost only what they read. Parquet's columnar layout keeps that scan small.
- **c** ❌ EMR Serverless can run Spark SQL over S3 without a cluster, but it bills for vCPU and memory used by each job application, not per data scanned, and it is a batch job service rather than an interactive SQL tool for analysts.
- **d** ❌ Serverless with Spectrum avoids copying the files and has no idle compute charge, but the Spectrum queries run on the workgroup's capacity and are billed in RPU-hours of compute, not by the data each query reads.

**The concept.** Amazon Athena is the serverless, pay-per-data-scanned SQL engine for querying files in S3 in place; Redshift earns its cost when queries are frequent and concurrent.

**Why this is correct.** Three constraints decide it: no warehouse, no copy of the data, and cost tied to the data each query reads. Athena meets all three: it queries the Parquet files in place and bills by bytes scanned. Redshift Serverless with Spectrum also avoids the copy and idle charges, but it bills RPU-hours of compute; a provisioned cluster with Spectrum avoids the copy but bills continuously for nodes; EMR Serverless bills job compute (vCPU/memory), not scanned data.

**How to reason it out**

1. Note the access pattern: a few ad hoc queries per week over files already in S3.
2. Note the constraints: no copy or load, and cost proportional to data read.
3. Eliminate options billed for always-on nodes (a provisioned cluster), even when Spectrum avoids the copy.
4. Eliminate options billed on compute time rather than data scanned (Redshift Serverless RPU-hours, EMR Serverless vCPU/memory).
5. Choose Athena, which queries S3 in place and charges per terabyte scanned.

> **Exam tip:** Infrequent ad hoc SQL over files in S3, with no copy and pay-per-scan pricing, is Athena; Redshift pays off with repetition and concurrency.

</details>

📖 Learn this topic: [Analyzing Data on AWS: Athena, Redshift SQL, QuickSight & Spark Notebooks](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-analysis-athena-quicksight-redshift/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 16

*Data Operations and Support*

**A data engineer must find out how often a specific error string appeared in yesterday's AWS Glue job output, broken down by hour. The job already writes its driver and executor output to Amazon CloudWatch Logs, and nobody will need the answer again after today. Which approach answers the question with the LEAST setup?** Choose one.

- **a.** Export the Glue job logs to Amazon S3 and query them through an Amazon Athena table
- **b.** Run a CloudWatch Logs Insights query that filters the string and counts it in 1-hour bins
- **c.** Create a subscription filter to Amazon OpenSearch Service and query the new indexes
- **d.** Create a CloudWatch metric filter for the string on the Glue job logs and graph it by hour

<details>
<summary>Show answer and explanation</summary>

**Answer: b**

- **a** ❌ This works, but it adds an export task, a table definition and a wait for the export before a single query runs. The logs are already queryable where they are.
- **b** ✅ Correct. Logs Insights queries the existing log groups in place: a filter on the string plus stats count(*) by bin(1h) returns the hourly breakdown in seconds, with nothing to provision or export.
- **c** ❌ A subscription filter only forwards events written after it is created, so yesterday's output would never reach OpenSearch. It also stands up a domain for a one-off question.
- **d** ❌ Metric filters are not retroactive: they count matching events only from the moment the filter exists, so the graph for yesterday would be empty.

**The concept.** CloudWatch Logs Insights is an interactive query engine over log groups that already exist in CloudWatch Logs. Its commands (fields, filter, parse, stats, sort) answer one-off questions without moving data.

**Why this is correct.** The two deciding facts are where the logs are and when they were written. They are already in CloudWatch Logs and the question is about the past, so the tool must query historical events in place. Logs Insights does exactly that with filter plus stats count(*) by bin(1h). The tempting metric filter and subscription filter both act only on events ingested after they are created, so they cannot see yesterday. Exporting to S3 for Athena would work but adds steps for a question nobody will ask again.

**How to reason it out**

1. Note where the logs live: already in CloudWatch Logs.
2. Note the time frame: the question is about events that have already happened, which rules out anything that only processes new events.
3. For a one-off question over existing log groups, pick Logs Insights and aggregate with stats count(*) by bin(1h).

> **Exam tip:** Ad hoc question over logs already in CloudWatch Logs: query them in place with Logs Insights; metric and subscription filters only see events from their creation onward.

</details>

📖 Learn this topic: [Monitoring Data Pipelines: CloudWatch, CloudTrail and Log Analysis](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-monitor-data-pipelines-cloudwatch/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 17

*Data Security and Governance*

**A data engineering team runs an ingestion application on Amazon EC2 instances that read files from an Amazon S3 data lake. The application authenticates with an IAM user's access keys kept in a configuration file on each instance. A security review requires that no long-term credentials remain anywhere on the instances or in the account for this workload. What should the team do?** Choose one.

- **a.** Move the IAM user's access keys into AWS Secrets Manager and rotate them on a 30-day schedule with a rotation function.
- **b.** Store the IAM user's access keys as SecureString parameters in Parameter Store and read them at startup.
- **c.** Attach an IAM role to the instances through an instance profile and rotate the user's keys on a 90-day schedule.
- **d.** Attach an IAM role to the instances through an instance profile, then delete the IAM user's access keys.

<details>
<summary>Show answer and explanation</summary>

**Answer: d**

- **a** ❌ Rotating the keys shortens their life but they are still IAM user access keys, which are long-term credentials the review requires removing.
- **b** ❌ Encrypting the keys at rest does not change what they are: the application still authenticates with a long-term IAM user credential.
- **c** ❌ Attaching the role is the right start, but keeping the IAM user keys (even rotated) leaves long-term credentials in the account and in the configuration file, failing the review.
- **d** ✅ An instance profile hands the application temporary role credentials from the instance metadata service, and deleting the keys removes the last long-term credential the review objects to.

**The concept.** Workloads that run on AWS compute should authenticate with an IAM role. For EC2, the role is attached through an instance profile and the SDKs fetch short-lived credentials from the instance metadata service, refreshing them before they expire.

**Why this is correct.** The review rules out long-term credentials entirely, so the fix must both supply a replacement identity and remove the old one. The instance profile supplies temporary credentials that AWS rotates for you; deleting the IAM user's access keys removes the long-term credential. Storing the keys in Secrets Manager or Parameter Store protects them at rest but they remain long-term keys. The near-twin that attaches the role but keeps rotating the user's keys still leaves a long-term credential behind.

**How to reason it out**

1. Identify the requirement: no long-term credentials for this workload, not merely better-protected ones.
2. Recall that IAM user access keys are long-term however they are stored or rotated.
3. Choose the option that gives the instances a role (temporary credentials) and removes the keys.

> **Exam tip:** Protecting or rotating an access key is not the same as removing it: compute on AWS should use a role, with no user keys left behind.

</details>

📖 Learn this topic: [Applying Authentication Mechanisms: IAM, Secrets Manager, and Networks](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-authentication-iam-secrets-manager/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 18

*Data Security and Governance*

**An AWS Glue ETL job connects to a self-managed PostgreSQL database running on Amazon EC2. Company policy requires the database password to change automatically every 30 days, and the job must pick up the new password without code changes or redeployment. The database team will not install additional authentication plugins. Which solution meets these requirements?** Choose one.

- **a.** Store the credentials in Secrets Manager, turn on managed rotation on a 30-day schedule, and reference the secret in the Glue connection.
- **b.** Enable IAM database authentication on the PostgreSQL server and have the Glue job connect with short-lived IAM authentication tokens instead.
- **c.** Store the credentials in Secrets Manager with a rotation Lambda function on a 30-day schedule, and reference the secret in the Glue connection.
- **d.** Store the password as an advanced SecureString parameter in Parameter Store with an Expiration policy set to 30 days.

<details>
<summary>Show answer and explanation</summary>

**Answer: c**

- **a** ❌ Managed rotation is run by the owning AWS service (for example Amazon RDS or Amazon Redshift) and is not available for a database you run yourself on EC2.
- **b** ❌ IAM database authentication is a feature of Amazon RDS and Aurora; a self-managed PostgreSQL server on EC2 cannot validate IAM authentication tokens.
- **c** ✅ A rotation Lambda function (for example built from the PostgreSQL rotation template) can change the password on any reachable PostgreSQL database, and a Glue connection that references the secret reads the current value at run time.
- **d** ❌ Parameter policies such as Expiration only delete the parameter or send notifications when it ages; Parameter Store never generates a new database password or changes it on the database.

**The concept.** Secrets Manager rotates credentials in two ways: managed rotation, which an AWS service such as Amazon RDS performs for its own databases, and rotation by a Lambda function, which works for any database or system the function can reach, including self-managed databases on EC2.

**Why this is correct.** The database is self-managed on EC2, which removes two tempting options: managed rotation exists only for databases that an AWS service manages, and IAM database authentication is an RDS/Aurora feature. Parameter Store can expire or flag an old parameter but never sets a new password on the database. A rotation Lambda function changes the password on the database and updates the secret; because the Glue connection references the secret instead of embedding the password, the job uses the new value on its next run with no code change.

**How to reason it out**

1. Note where the database runs: on EC2, so features that rely on RDS/Aurora or service-managed rotation do not apply.
2. Separate storing a secret from rotating it: only Secrets Manager with a rotation mechanism changes the password on the database.
3. Pick the rotation mechanism that supports self-managed databases: a rotation Lambda function.
4. Have the consumer reference the secret (Glue connection) so rotation needs no redeployment.

> **Exam tip:** Self-managed database on EC2: Secrets Manager rotation needs a Lambda rotation function; managed rotation and IAM database authentication are for AWS-managed databases.

</details>

📖 Learn this topic: [Applying Authentication Mechanisms: IAM, Secrets Manager, and Networks](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-authentication-iam-secrets-manager/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 19

*Data Security and Governance*

**A data engineer belongs to an IAM group that has the AmazonS3FullAccess managed policy. The production data lake bucket, in the same account, has a bucket policy with one statement: Deny s3:* to all principals when aws:SourceVpce is not the company's S3 gateway endpoint. The engineer runs aws s3 rm against an object from a laptop on the office network. What is the result?** Choose one.

- **a.** The delete is denied, because the bucket policy contains no Allow statement that names the engineer's IAM identity
- **b.** The delete succeeds, because the group's identity-based Allow is evaluated before the bucket policy
- **c.** The delete is denied, because the bucket policy's Deny matches requests not sent through the endpoint
- **d.** The delete succeeds, because a bucket policy Deny is applied just to principals from other accounts

<details>
<summary>Show answer and explanation</summary>

**Answer: c**

- **a** ❌ The request is denied, but not for this reason. In the same account, an Allow in either the identity policy or the bucket policy is enough. Without the Deny, the group policy alone would permit the delete.
- **b** ❌ Policy types are not evaluated in an order where an earlier Allow settles the outcome. All applicable identity and resource policies are combined, and an explicit Deny in any of them wins.
- **c** ✅ Correct. The laptop request does not come through the gateway endpoint, so the Deny's condition is true. An explicit Deny overrides the Allow from AmazonS3FullAccess.
- **d** ❌ A bucket policy applies to every principal it matches, including principals in the bucket owner's own account. Here the Deny names all principals.

**The concept.** IAM combines every applicable policy: requests start implicitly denied, any Allow can grant access, and an explicit Deny in any policy overrides all Allows.

**Why this is correct.** The engineer has an Allow (AmazonS3FullAccess) and the bucket policy has a conditional Deny. Because the request comes from a laptop rather than through the VPC endpoint, aws:SourceVpce does not match the endpoint ID, the Deny applies, and an explicit Deny beats every Allow. The near-twin trap is the claim that the bucket policy must also Allow the engineer: that two-sided requirement applies only across accounts. In the same account, one Allow on either side is sufficient, so without the Deny the delete would succeed.

**How to reason it out**

1. List every policy that applies: the group's identity policy and the bucket policy.
2. Check for an explicit Deny whose conditions match the request; the laptop path does not use the endpoint, so it matches.
3. Apply the rule that an explicit Deny overrides any Allow.
4. Remember that same-account access needs an Allow on only one side, so the missing bucket Allow is not the cause.

> **Exam tip:** Explicit Deny anywhere wins; within one account an Allow on either the identity or the resource side is enough.

</details>

📖 Learn this topic: [Applying Authorization Mechanisms: Lake Formation, IAM, and Redshift](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-authorization-lake-formation-iam/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

## Question 20

*Data Security and Governance*

**A data engineering team stores curated datasets in Amazon S3 with SSE-KMS. A new compliance requirement states that the team must be able to define its own key policy, enable or disable the key, and schedule key deletion. Which type of AWS KMS key satisfies these requirements?** Choose one.

- **a.** An S3 Bucket Key
- **b.** An AWS owned key
- **c.** An AWS managed key (aws/s3)
- **d.** A customer managed key

<details>
<summary>Show answer and explanation</summary>

**Answer: d**

- **a** ❌ An S3 Bucket Key is a cost-optimization feature that reduces KMS request traffic for SSE-KMS; it is not a category of KMS key and provides no policy or lifecycle control.
- **b** ❌ AWS owned keys belong to AWS service accounts, are not visible in your account, and offer no policy control, no rotation control, and no auditability of key usage in your CloudTrail.
- **c** ❌ AWS managed keys are created and managed by AWS on your behalf. You can view their key policies but cannot edit them, disable the keys, or schedule deletion.
- **d** ✅ Customer managed keys are created and owned by the account, so the team fully controls the key policy, enable/disable state, rotation configuration, and deletion scheduling.

**The concept.** AWS KMS offers three categories of keys: AWS owned keys (invisible, fully AWS-controlled), AWS managed keys (visible per-service keys such as aws/s3 that you cannot modify), and customer managed keys (created by you with full control over policy, rotation, enable/disable state, and deletion).

**Why this is correct.** Only a customer managed key gives the team authority over the key's lifecycle and access policy. The requirement lists key-policy authoring, disabling, and deletion scheduling — none of which are possible on AWS managed or AWS owned keys, because AWS retains control of those keys. Choosing a customer managed key and pointing the bucket's default encryption at it meets every stated control requirement.

**How to reason it out**

1. Identify the control requirements: custom key policy, enable/disable, and scheduled deletion.
2. Eliminate AWS owned keys (not visible in your account) and AWS managed keys (policies are read-only and lifecycle is AWS-controlled).
3. Select a customer managed key, attach the required key policy, and configure the S3 bucket's default encryption to use it.

> **Exam tip:** When a scenario demands control over key policies, rotation, disabling, or deletion, the answer is a customer managed KMS key.

</details>

📖 Learn this topic: [Data Encryption and Masking on AWS: KMS, TLS, and Anonymization](https://www.savemycert.com/revision/aws-data-engineer-associate/aws-data-encryption-masking-kms/?utm_source=github&utm_medium=readme&utm_campaign=dea-c01-study-guide)

---

[← Back to the DEA-C01 study guide](README.md)
