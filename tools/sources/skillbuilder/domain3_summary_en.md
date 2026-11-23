# Domain 3: Data Operations and Support
This domain covers running pipelines automatically, analyzing data, monitoring pipelines, and keeping data quality high.

## Domain 3 introduction
### Domain scope
- Data operations puts data management (quality, governance, security) into practice.
- Four task statements: 3.1 automate data processing, 3.2 analyze data, 3.3 maintain and monitor data pipelines, 3.4 ensure data quality.
- 3.2 covers provisioned vs serverless trade-offs, SQL, visualization, cleansing, aggregation, rolling average, grouping, pivoting.
- 3.3 covers logging application data, logging access to AWS services, performance tuning, and observability.
- 3.4 covers data skew, data validation, and data profiling.
- The big theme: repeatable and reliable transformation processes.

### Question patterns
- Pipeline must be repeatable and reliable => pick the automated option (IaC, orchestration, automated checks), not manual steps.
- Question mentions aggregation, rolling average, grouping, or pivoting => task 3.2, pick the analytics service that supports that operation.
- Question about pipeline logs, audit, and metrics => task 3.3, monitoring and traceability services.

## Lesson 1: Automate data processing by using AWS services
### Infrastructure as code and CI/CD
- A CloudFormation template can create the whole pipeline: S3 bucket, EventBridge rule, Lambda, SNS topic, Step Functions, Glue job, Glue crawler.
- Example flow: a file lands in S3, EventBridge triggers a validation Lambda, Lambda starts the state machine, the state machine runs a Glue job, then a Glue crawler updates the Data Catalog. SNS sends a notification on failure.
- Store templates in S3 or CodeCommit for access and versioning.
- CodePipeline automates CI/CD. Committing a Python file to CodeCommit triggers CodeBuild for build, integration, and unit tests.
- Continuous delivery adds end-to-end tests: ingest a file, run the transformation, validate the output.
- Note: CodeCommit has been closed to new customers since July 2024, but it can still show up in questions.

### Orchestration: Amazon MWAA vs Step Functions
- Amazon MWAA is managed Apache Airflow. Workflows are written as DAGs of tasks with dependencies (Spark job, Glue job, AWS Batch job).
- Step Functions is a serverless service built on state machines. Each state can run a task, make a decision, or wait for an event.
- Step Functions has built-in error handling, retries, and workflow visualization.
- MWAA fits complex, flexible, code-based workflows. Step Functions fits serverless, event-driven workflows with AWS services.

### Troubleshooting MWAA
- Check CloudWatch Logs for errors and exceptions, then the Apache Airflow logs themselves.
- Check IAM roles and permissions for MWAA, the DAGs, and related services (Glue, S3, EMR).
- Make sure DAG dependencies and file references are correct, and external services are reachable from the MWAA environment.
- Adjust worker node count and size to avoid out-of-memory errors.
- Test DAGs locally or in a test environment first, and use the latest Airflow and plugin versions.

### Consume and maintain data APIs
- Lambda calls APIs and processes responses, triggered by events or API Gateway.
- API Gateway gives a managed endpoint for external clients and can act as a frontend for Lambda.
- The AWS SDK handles authentication, request signing, and response parsing.
- Monitor error rate and latency with CloudWatch.
- Caching with API Gateway caching or ElastiCache. Throttling and rate limiting in API Gateway prevent abuse.
- Secure with IAM and OAuth. API versioning keeps backward compatibility. Lambda layers manage dependencies and shrink the package.

### Queries and events
- Athena fits quick exploration with no infrastructure setup and pay per query. Results can be downloaded or saved to S3.
- An EventBridge rule matches events by pattern (attributes, custom event bus), then sends them to one or more targets.
- API calls to EventBridge are logged by CloudTrail. EventBridge schema registry is an optional feature for managing event schemas.
- Step Functions example: a Lambda checks the file extension, a Choice state decides. Supported files go to a second Lambda, unsupported files trigger an SNS notification.
- CloudTrail does not log S3 object-level data events by default. Create a trail that logs both management and data events.
- An EventBridge rule with service S3, specific operations and bucket, and a state machine target starts the workflow when a file arrives.

### Question patterns
- Complex code-based workflow, DAG, Airflow => Amazon MWAA.
- Serverless, event-driven workflow with built-in retries => Step Functions.
- Rebuild pipeline infrastructure consistently => CloudFormation template.
- Commit code, then automatic build and unit tests => CodePipeline with CodeBuild.
- Trigger processing when a new file lands in S3 via CloudTrail and EventBridge => enable CloudTrail data events, since they are not logged by default.
- API flooded with requests => throttling and rate limiting in API Gateway.
- Slow API responses because the backend is overloaded => API Gateway caching or ElastiCache.
- MWAA DAG fails => check CloudWatch Logs and Airflow logs, then IAM, dependencies, and worker size.

## Lesson 2: Analyze data by using AWS services
### Data manipulation operations
- Aggregation summarizes many records into one value: Redshift (sum, average, count), Athena (GROUP BY), OpenSearch Service (date histogram, term aggregation).
- Rolling average computes the average over a window to smooth out fluctuations: Redshift (AVG window function) and QuickSight (moving calculation).
- Grouping: Redshift and Athena (GROUP BY), QuickSight (dimensions and aggregations).
- Pivoting turns rows into columns: Redshift (PIVOT clause) and QuickSight (pivot table).

### Services for data consumers
- QuickSight: interactive dashboards and ad hoc analysis.
- AWS Glue DataBrew: visual data preparation with no code.
- Athena: SQL on S3 data. Redshift: SQL for large datasets. EMR: Spark and Hadoop.
- AWS Glue: discover, catalog, transform, and automatically generate ETL code.
- AWS Data Pipeline: data orchestration across AWS services and on premises. Note: Data Pipeline is in maintenance mode and does not accept new customers.
- Lake Formation: secure access to data from many sources in a data lake.

### Example scenarios
- A script on EC2 cleans S3 data into CSV for spreadsheets every 8 hours, then dashboards and search are needed. Solution: move to Lambda, send results to OpenSearch, trigger with EventBridge every 8 hours.
- IoT sensor data with cost-effective daily visual reports: an EMR transient cluster aggregates every night then terminates automatically, reports in QuickSight.
- EMR has two cluster types: transient and persistent.

### SQL across services
- SQL syntax is consistent even though each service runs it differently. RDS and Aurora use SQL for CRUD.
- DynamoDB supports PartiQL, a SQL-compatible query language for structured, semi-structured, nested, and schemaless data.
- Amazon DocumentDB is MongoDB compatible and can use SQL-like queries.
- Athena can run Spark applications through Python or the Athena notebook APIs. EMR provides Jupyter Notebook for Spark code.

### Data verification and cleaning
- Lambda for custom validation and enrichment. Athena for SQL-based verification.
- QuickSight for visual exploration. Jupyter Notebooks for complex cleaning.
- SageMaker Data Wrangler to prepare data for ML models.
- One workflow commonly uses several services together.

### Question patterns
- Rolling or moving average => Redshift window function or QuickSight moving calculation.
- Pivot rows into columns => Redshift PIVOT clause or QuickSight pivot table.
- Dashboard plus search or log analytics => Amazon OpenSearch Service.
- Cost-effective daily batch on EMR => transient cluster that terminates automatically.
- Interactive dashboards for business users => QuickSight.
- Clean and normalize data visually with no code => AWS Glue DataBrew.
- Query DynamoDB with SQL-like syntax => PartiQL.
- MongoDB-compatible database => Amazon DocumentDB.
- Prepare data for ML models => SageMaker Data Wrangler.
- Replace cron on EC2 without servers => Lambda triggered by EventBridge.

## Lesson 3: Maintain and monitor data pipelines
### Monitoring and observability
- Data side: check inputs, outputs, and schema. Run quality tests on inputs and transformation results so you can flag issues, roll back, and find the root cause.
- Operational metrics: query queue length, query concurrency, memory usage, storage utilization, network latency, disk I/O.
- Refactor slow queries. If the query is already good, tune the database (cluster or cache tables) or scale up compute.
- Tools: CloudWatch, X-Ray, CloudWatch Logs Insights, GuardDuty, Inspector, Security Hub. Applications must be instrumented for traces, metrics, and logs.

### Logging application data
- CloudWatch Logs stores logs and sends notifications when a threshold is reached.
- CloudWatch Events delivers system events in near real time using rules. Note: CloudWatch Events is now part of EventBridge.
- EventBridge routes events from your own apps, SaaS, and AWS services to targets such as Lambda.
- X-Ray gives end-to-end tracing for distributed applications and microservices.
- Lambda logs every invocation automatically. ALB access logs record request time, client IP, user agent.
- RDS has an error log, slow query log, and general log.
- A log group is a container for log streams. It can be created with CloudFormation. CloudWatch Logs default retention is forever, so set a retention policy for cost and retention rules.

### Traceability and audit
- CloudTrail records every API call: who, what, when. Logs go to S3 or CloudWatch Logs.
- AWS Config records resource configuration history. AWS Managed Rules assess compliance against best practices.
- CloudFormation StackSets deploy CloudTrail, CloudWatch, and Config configuration across many accounts and Regions.
- VPC Flow Logs capture IP traffic for network interfaces in a VPC.
- Security Hub combines GuardDuty, Inspector, and Config findings in one dashboard.
- Macie sends policy findings and sensitive data findings to EventBridge as events, and to Security Hub if publication settings are configured. Macie does not send logs to CloudWatch Logs.

### Performance troubleshooting
- Compare CPU, memory, network, disk I/O, and database performance against a baseline.
- Check the AWS Health Dashboard first before debugging the application.
- Read application logs in CloudWatch Logs, then the specific Lambda, RDS, or EC2 logs.
- VPC Flow Logs and Network Load Balancer access logs help spot latency and packet loss.
- Case: Kinesis Data Streams with 40 shards, KCL consumers in an Auto Scaling group, results to DynamoDB: CPU below 35 percent and no ProvisionedThroughputExceededException. So increase DynamoDB write capacity.
- Redshift with long running queries: configure scaling on workload management (WLM) queues through the parameter group, so short queries do not wait in line.

### Error handling per service
- Managed services handle many errors themselves. In EMR and Kinesis Data Streams, you program the error behavior yourself.
- New Hadoop application on EMR: enable debugging, test with a small representative subset of data, run steps one at a time.
- Kinesis Data Streams: producer issues (cannot connect, slow writes) and consumer issues (record problems, slow reads).
- Managed Service for Apache Flink: common issues are stream access, lost data, processing failures, application errors. Investigate through CloudWatch Logs.
- Flink can detect anomalies with random cut forest, then Lambda takes action. Note: RANDOM_CUT_FOREST comes from Kinesis Data Analytics for SQL, which AWS has discontinued.
- Firehose retries until the retry duration runs out, then backs up to the S3 backup bucket. If the S3 destination or S3 backup fails, it retries until the retention period runs out. Note: it is now called Amazon Data Firehose.

### Question patterns
- Who changed what and when => CloudTrail.
- Resource configuration history and compliance checks => AWS Config with Managed Rules.
- Deploy logging configuration across many accounts and Regions => CloudFormation StackSets.
- Tracing requests across microservices => X-Ray.
- Automatic remediation of Macie findings (bucket made public) => EventBridge rule to Lambda, not CloudWatch Logs.
- CloudWatch Logs cost keeps growing => set a retention policy.
- Kinesis and consumers healthy but latency high, results to DynamoDB => increase DynamoDB write capacity.
- Short Redshift queries stuck behind long queries => configure WLM queues through the parameter group.
- Anomaly detection on streaming data => Managed Service for Apache Flink with random cut forest.

## Lesson 4: Ensure data quality
### Principles
- Consumers must trust the data. Work backwards from the customer: who uses it, how it is used, what they need.
- Publishing no data is better than publishing bad data. Automated checks must be able to stop the pipeline.
- Duplicates in a primary key column: send a notification. The process does not always have to stop completely.
- Place checks before, during, and after transformation. Too many checks cause false positives, too few let problems through.

### Data profiling and validation
- Profiling looks at nulls, distribution, anomalies, cardinality, relationships between fields, and statistics (min, max, mean, median, standard deviation).
- DataBrew builds profiles with no code. Athena and Redshift for profiling with SQL. EMR Spark for custom scripts. There are also tools in AWS Marketplace.
- Validation has four dimensions: completeness, consistency, accuracy, integrity.
- Checks during processing: DataBrew recipes for empty fields, formats, and uniqueness. EMR Spark for custom checks.
- Lambda for complex checks and remediation, Step Functions for orchestration based on validation results. Data Wrangler for missing values and duplicates.

### Duplicates in Redshift
- Case: CSV in S3, a Glue crawler fills the Data Catalog, a Glue job writes to Redshift, then duplicates appear after a rerun.
- Solution: the Glue job writes to a staging table, then replaces existing rows in the target before the new data is stored.
- Merge: join the staging table with the target, then update and insert. An upsert through the Glue job removes duplicates.

### Data sampling
- S3 Select pulls a subset of data from an S3 object with SQL-like queries. Note: S3 Select is not available to new customers since July 2024.
- Athena and Redshift: LIMIT clause.
- EMR Spark: systematic, random, or stratified sampling.
- Data Wrangler: sampling for balanced datasets. DataBrew: filter a subset through transformations.

### Data skew
- Data skew is uneven distribution across partitions or nodes, which creates bottlenecks.
- Detection: CloudWatch custom metrics (records per partition or key, processing time) with threshold alarms.
- Glue ETL: CloudWatch metrics and Glue job bookmarks, which make the job resume from the last processed record.
- EMR Spark: detailed logging to CloudWatch Logs, look for long tasks, uneven task distribution, skewed partitions. Real time: Spark Streaming with Kinesis or Kafka.
- Handling: partitioning keys with a hash function, load balancing, replicating hotspot data, shuffling, dynamic repartitioning.
- Skew joins: bloom filter or skew join algorithm. EMR has automatic skew join optimization. Redshift has adaptive join (hash join or sort merge join).
- Pre-processing (data binning, feature scaling, log transformation) and smaller tasks help even out the load.

### Partitioning and bucketing in Athena
- Common strategy: partition by date (year, month, day). A WHERE filter on partition columns reads only the matching S3 prefixes.
- Partitioning and bucketing both reduce the data Athena scans.
- A bucket here is not an S3 bucket. A bucket is a file, a hash function decides each record's bucket, and the bucket number is in the file name.
- Engine v2 supports Hive bucketing. Engine v3 also supports Spark bucketing. Default is Hive. For Spark, set bucketing_format to spark in TBLPROPERTIES.

### Redshift Spectrum and DataBrew rules
- Join historical data in S3 (registered in the Data Catalog) with Redshift tables: Redshift Spectrum external table, then join with SQL.
- DataBrew rules: completeness (nulls), format (email, phone number), range (numeric ranges), uniqueness (duplicates).
- DataBrew flags records that fail, gives statistics and visualizations, and can be automated.

### Question patterns
- Duplicates in Redshift after a Glue job rerun => staging table, then merge or upsert.
- Profiling or data quality rules with no code => AWS Glue DataBrew.
- Join S3 data with Redshift tables without moving the data => Redshift Spectrum.
- Reduce data scanned by Athena => partitioning by date and bucketing.
- Athena dataset bucketed with Spark => set bucketing_format to spark in TBLPROPERTIES.
- Slow joins from key skew on EMR => skew join optimization.
- Monitor skew and send alerts => CloudWatch custom metrics and alarms.
- Glue job must resume from the last record => Glue job bookmarks.
- Quick sample of a few rows => LIMIT in Athena or Redshift.

## Key numbers and limits
- Domain 3 has 4 task statements (3.1 to 3.4).
- CloudTrail does not log S3 object-level data events by default.
- CloudWatch Logs default retention: never expires.
- EC2 every-8-hours scenario is replaced by Lambda triggered by EventBridge every 8 hours.
- Kinesis scenario: 40 shards, CPU below 35 percent, no ProvisionedThroughputExceededException.
- EMR has 2 cluster types: transient and persistent.
- Validation has 4 dimensions. DataBrew lists 4 example rules.
- Quality checks at 3 points: before, during, after transformation.
- Athena engine v2: Hive bucketing. Engine v3: Hive and Spark. Default is Hive.

## Exam traps
- MWAA for code-based workflows (DAGs). Step Functions for serverless, event-driven workflows.
- Macie does not send logs to CloudWatch Logs. Automatic remediation goes through EventBridge.
- CloudTrail records API calls. AWS Config records configuration history and compliance.
- Without CloudTrail data events, S3 object-level events are not logged and CloudTrail-based EventBridge rules do not fire.
- When latency is high, check metrics before adding shards or instances. If CPU is low and there is no throughput exception, the problem is in another component.
- Check the AWS Health Dashboard before blaming your own application.
- A bucket in Athena is not an S3 bucket.
- "Cost-effective" for periodic EMR jobs points to a transient cluster.
- In EMR and Kinesis Data Streams, you must program error handling yourself.
- Dashboard with search and log analytics points to OpenSearch, not QuickSight.
- More quality checks is not always better.

## Additional resources
- Workflow Orchestration (https://docs.aws.amazon.com/whitepapers/latest/best-practices-building-data-lake-for-games/workflow-orchestration.html)
- Untitled, cloud storage types (https://aws.amazon.com/what-is/cloud-storage/)
- Untitled, Python Glue sample with Medicaid data (https://docs.aws.amazon.com/glue/latest/dg/aws-glue-programming-python-samples-medicaid.html)
- AWS Step Functions (http://aws.amazon.com/step-functions/)
- Amazon Managed Workflows for Apache Airflow (http://aws.amazon.com/managed-workflows-for-apache-airflow/)
- Untitled, Amazon S3 tutorials (https://docs.aws.amazon.com/AmazonS3/latest/userguide/tutorials.html)
- Using Apache Spark in Amazon Athena (https://docs.aws.amazon.com/athena/latest/ug/notebooks-spark.html)
- Data Warehousing on AWS (https://docs.aws.amazon.com/whitepapers/latest/data-warehousing-on-aws/data-warehousing-on-aws.html)
- Data Processing (https://docs.aws.amazon.com/step-functions/latest/dg/use-cases-data-processing.html)
- PartiQL: A SQL-Compatible Query Language for Amazon DynamoDB (https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ql-reference.html)
- Untitled, Amazon Redshift Management Guide (https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html)
- Untitled, EMR orchestration with Apache Livy (https://aws.amazon.com/blogs/big-data/build-a-concurrent-data-orchestration-pipeline-using-amazon-emr-and-apache-livy/)
- Amazon SageMaker Notebook Instances (https://docs.aws.amazon.com/sagemaker/latest/dg/nbi.html)
- DevOps Guidance (https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/devops-guidance.html)
- What Is AWS Glue DataBrew? (https://docs.aws.amazon.com/databrew/latest/dg/what-is.html)
- Untitled, Kinesis Data Streams quotas and limits (https://docs.amazonaws.cn/en_us/streams/latest/dev/service-sizes-and-limits.html)
