# Domain 4: Data Security and Governance
Securing data pipelines: who can get in, what they can do, encryption and masking, audit logs, and data privacy and governance.

## Domain 4 introduction
### What the domain covers
- Data is protected in transit and at rest with encryption, tokenization, masking, obfuscation, and access control.
- Five task statements: 4.1 authentication, 4.2 authorization, 4.3 encryption and masking, 4.4 logs for audit, 4.5 privacy and governance.
- Must know: IAM roles, policies, groups, network security, password policies, and encryption.

### Question patterns
- Network access to resources in a VPC => security groups and network ACLs
- Personal data and storage location per country => PII and data sovereignty (task 4.5)
- End-to-end data protection => combine encryption, masking, and access control

## Lesson 1: Apply authentication mechanisms
### Identity in AWS
- Authentication confirms who you are. Authorization decides what you can access after that.
- Methods: password-based, certificate-based, role-based. Know their use cases and security level.
- Ways to sign in: root user, IAM user, assume an IAM role, or federated identity.
- IAM Identity Center: workforce sign-in, multi-account access, and SSO to SAML 2.0 applications.
- IAM user is for one person or application, with permanent credentials. An IAM role can be assumed by anyone who needs it, with temporary credentials.
- You cannot sign in as an IAM group. Groups only grant permissions to many users.
- A service calls another service using the calling principal's permissions, a service role, or a service-linked role.

### Policies
- Types: identity-based (attached to users, groups, roles), resource-based (attached to resources such as an S3 bucket or KMS key), and trust policies.
- An IAM role needs two policies: a trust policy (who can assume it) and an identity-based policy (what it can do).
- Without an explicit allow, the AWS default is deny.
- AWS managed policies are maintained by AWS and cannot be changed. Customer managed policies are your own and can be attached to many identities.
- An inline policy is one to one with an identity and is deleted when the identity is deleted.

### Policies on endpoints and services
- Access through an S3 access point works only if both the access point policy and the bucket policy allow it. Or the bucket delegates access control to the access point.
- Users have no permission to manage VPC endpoints by default. The condition key `ec2:VpceServicePrivateDnsName` restricts endpoints by private DNS name.
- API Gateway has two permission models: API management (developers) and API execution (callers). Set the method authorization type to `AWS_IAM` so callers must send credentials.
- API Gateway to Lambda: an IAM role with a trust policy for API Gateway plus the `lambda:InvokeFunction` permission.
- An interface VPC endpoint to CloudFormation can have an endpoint policy, for example to deny creating stacks through that endpoint.

### Network, certificates, secrets
- Network protection: security groups, network ACLs, private subnets, bastion hosts, NAT gateways, route tables, AWS VPN, Direct Connect, VPC Flow Logs, Security Hub, Network Firewall.
- ACM creates, stores, and renews SSL/TLS X.509 certificates. You can import third-party certificates, or export AWS Private CA certificates for internal PKI.
- Secret lifecycle: create, store, use, destroy.
- Secrets Manager integrates with IAM (including resource-based policies on secrets) and KMS (AWS managed key or customer managed key).
- Scheduled automatic rotation for RDS, Redshift, DocumentDB. Other secrets (API keys, OAuth tokens) use a custom Lambda function.

### Question patterns
- Temporary credentials, cross-account access, or federation => IAM role
- Workforce SSO to many accounts => IAM Identity Center
- TLS certificates created and renewed automatically => ACM
- Who can assume a role => trust policy
- Access point permissions not taking effect => check the bucket policy, both must allow
- Automatic rotation of RDS or Redshift passwords => Secrets Manager
- QuickSight fails to import Athena data from a new S3 bucket, insufficient permissions error => allow that bucket in the QuickSight console, because QuickSight needs its own authorization (cross-service)

## Lesson 2: Apply authorization mechanisms
### Principles
- The goal is least privilege for authenticated principals.
- Policies can be built and tested as code in a pipeline.
- IAM Access Analyzer continuously looks for resources that can be accessed from outside the account. AWS Organizations enforces policies across many accounts.

### RBAC and ABAC
- RBAC: access based on roles. Easier to manage.
- ABAC: access based on attributes and tags on the principal, resource, environment, or application state.
- Choose ABAC when users need permissions across roles, roles are hard to define, or permissions depend on dynamic parameters.
- Example: roles tagged `access-project` heart, star, bolt. One policy grants access when the role tag matches the resource tag.
- ABAC is granular but takes more work up front. The two can be combined (hybrid).

### Amazon Redshift
- Users are managed with `CREATE USER` and `ALTER USER`, or through a JDBC/ODBC driver that creates a temporary password.
- Only a superuser can create and drop users. A superuser has owner rights on all databases.
- With RBAC, grants and revokes happen at the role level, without changing each object's permissions.

### Lake Formation and Parameter Store
- Lake Formation controls data lake access down to database, table, column, row, and cell level, for IAM and external identity providers.
- It applies when data is accessed through Redshift Spectrum, Athena, Glue ETL, and EMR for Spark.
- LF-Tags are attached to databases, tables, or columns, replacing thousands of permission definitions with a few tags.
- Lake Formation can manage Redshift datashare permissions centrally.
- Parameter Store (Systems Manager) stores configuration and secrets, but has no automatic rotation. Store secrets in Secrets Manager and reference them from Parameter Store, with the name starting with `/`.

### Question patterns
- Resources accessible from outside the account => IAM Access Analyzer
- One policy for many projects based on tags => ABAC
- Simple permissions that follow job function => RBAC
- Data lake access down to column, row, or cell => Lake Formation
- Thousands of table permissions hard to manage => LF-Tags
- Configuration plus secrets that need rotation => Secrets Manager, referenced from Parameter Store
- Who can create or drop Redshift users => superuser

## Lesson 3: Ensure data encryption and masking
### KMS, CloudHSM, TLS
- AWS KMS creates and controls keys, integrates with almost every service, and with CloudTrail to log key usage.
- Use CloudHSM when you must manage the HSM devices directly. AWS handles hardware, patching, and backups. You handle scaling plus crypto accounts and credentials.
- In KMS and CloudHSM, plaintext keys cannot be used outside the HSM.
- Traffic between data centers is encrypted at the physical layer. Traffic within a VPC and between peered VPCs across Regions is encrypted at the network layer. All AWS endpoints support TLS.
- TLS termination with your own certificates: NLB, ALB, CloudFront, API Gateway.
- Note: the transcript says "hardware security models", meaning hardware security modules.

### Encryption at rest and EMR
- Know encryption at rest for EBS, S3, RDS, Redshift, ElastiCache, Lambda, EMR, Glue, SageMaker. SQS has SSE for sensitive messages.
- Know the difference between client-side and server-side encryption.
- Encrypted EBS on EMR does not mean the local disks are encrypted. Turn on local disk encryption in the security configuration.
- EBS encryption happens on the EC2 host. The OS sees unencrypted data unless there is end-to-end encryption.
- Encrypted root volumes on all EMR nodes: custom AMI. Copy the snapshot to a KMS-encrypted target, then use the custom AMI ID in the CloudFormation template.

### Tokenization, masking, salt
- Encryption uses an algorithm and a key, and can be decrypted. Tokenization replaces data with a random token without a mathematical process, and the mapping is kept in a token vault.
- Tokens cannot be mapped back without the tokenization system. Example: recurring credit card payments.
- Anonymization removes sensitive data. Masking hides it with altered values.
- Salt: new random data per password, combined and then hashed, stored with the hash. The salt does not need to be encrypted.
- Serverless tokenization example: Cognito, API Gateway, Lambda, KMS, DynamoDB client-side encryption library, a cipher database and an application database. Lambda reaches DynamoDB through a gateway endpoint and KMS through an interface endpoint.
- Redshift Dynamic Data Masking (DDM) masks data at query time without changing stored data. It can work per role, per cell with conditional columns, and with several policies on one column.

### Question patterns
- Must manage your own HSM devices => CloudHSM
- Central keys with usage logs => KMS plus CloudTrail
- EMR EBS encrypted, are local disks safe? => no, turn it on in the security configuration
- Encrypted root volumes on EMR nodes => custom AMI with KMS-encrypted EBS root
- Replace sensitive data with random values through a vault => tokenization
- Store password hashes safely => random salt per password
- Sensitive data masked at Redshift query time => Dynamic Data Masking
- Queue for sensitive messages => SQS with SSE

## Lesson 4: Prepare logs for audit
### Retention and CloudTrail Lake
- HIPAA and PCI require data to be kept for a set period, be searchable, and then be deleted according to the rules.
- CloudWatch Logs keeps logs forever by default. Set a retention policy on the log group.
- CloudTrail Lake: central SQL queries over events across accounts and Regions, including activity from outside AWS.
- An event data store holds one category only: CloudTrail events, Config configuration items, Audit Manager evidence, or events from outside AWS. Combine them with SQL JOIN.
- Trails do not support tag-based authorization, event data stores do.

### EMR and log analysis
- EMR writes logs on the primary node, `/mnt/var/log/`, and can archive them to S3.
- CloudTrail records all EMR API calls. A trail delivers continuously to S3. Without a trail, only recent events in Event history.
- CloudWatch Logs Insights to find the cause of problems. Fields are discovered automatically for Route 53, Lambda, CloudTrail, VPC, and JSON logs.
- Athena CloudWatch connector: log groups become schemas, log streams become tables, the `all_log_streams` view covers all streams.
- Log groups can be streamed to OpenSearch Service in near real time through a subscription.
- Note: CloudWatch Events is now part of Amazon EventBridge.

### Question patterns
- SQL queries on CloudTrail events across accounts and Regions => CloudTrail Lake
- Combine CloudTrail events and Config items => two event data stores, SQL JOIN
- Logs must not be kept forever => retention policy on the log group
- Find the cause of an error from logs => CloudWatch Logs Insights
- Query CloudWatch logs with SQL => Athena CloudWatch connector
- Near real-time log analysis => subscription to OpenSearch Service
- Long-term EMR API call history => trail to S3

## Lesson 5: Understand data privacy and governance
### Protection across the lifecycle
- Field-level encryption encrypts only sensitive fields and keeps the payload structure. Full payload encryption makes the payload unusable until it is all decrypted.
- Protect data as early as possible at ingestion. CloudFront plus Lambda@Edge protects data at the edge so downstream systems never see it.
- Example pipeline: IoT Core (MQTT), Kinesis Data Firehose to S3, Glue ETL calling Amazon Comprehend to detect sensitive data, Lake Formation restricting analyst access in Athena.
- Note: Kinesis Data Firehose is now called Amazon Data Firehose.

### Sensitive data discovery
- Scheduled scans (default four times a day, every 6 hours), before the crawler and after redaction or tokenization.
- Scanning adds at least 5 to 10 minutes, growing linearly with object size, plus a constant startup time per job.
- Components: raw, scanning, manual review, and scanned buckets. Macie scans, Step Functions orchestrates Lambda, EventBridge triggers the schedule, SNS sends notifications, API Gateway receives the reviewer's decision.
- What is missing: a backup plan, a DR plan, and a data privacy strategy so backups or replication do not go to a prohibited Region (data sovereignty).

### Data lake backup
- Storage admins use S3 versioning, Same-Region Replication, Cross-Region Replication, and Object Lock.
- AWS Backup creates backup plans (frequency, retention) in one account or many accounts through Organizations. A backup vault has its own policy, key, and lock.
- Backing up the raw bucket is usually enough because derived data can be rebuilt. If raw holds PII, back up de-identified data.
- Select buckets by tag, for example "data protection level" = "critical".
- Continuous backup for PITR, periodic for compliance. Copy to destination sends to a vault in another account or Region. Encryption uses the vault's KMS key.
- AWS Backup Audit Manager reports backup compliance through custom frameworks.

### Redshift and AWS Config
- A Redshift user cannot be dropped while it still owns or has permissions on datashare objects.
- Confidential columns in a Redshift table: column-level GRANT and REVOKE. Lake Formation plus Redshift Spectrum also works.
- AWS Config records a configuration item for each resource through describe or list API calls, including related resources (example: change a security group and the related instances are recorded too).
- Items are delivered through the configuration stream to S3. Each Config rule uses a Lambda function. Notifications can go to SNS.

### Question patterns
- Encrypt only sensitive fields => field-level encryption
- Protect data at the edge during ingestion => CloudFront plus Lambda@Edge
- Find sensitive data in S3 on a schedule => Macie, with Step Functions and EventBridge
- Detect PII inside Glue ETL => Amazon Comprehend
- Backup or replication to a prohibited Region => data privacy strategy (data sovereignty)
- Central backup across accounts => AWS Backup with Organizations
- Restore S3 to a specific point in time => continuous backup (PITR)
- Backup compliance reports => AWS Backup Audit Manager
- Confidential Redshift columns for specific users => column-level GRANT and REVOKE
- Track resource configuration changes => AWS Config

## Key numbers and limits
- Domain 4 has five task statements.
- Secret lifecycle: four phases.
- Built-in Secrets Manager rotation: RDS, Redshift, DocumentDB.
- An IAM role needs two policies.
- Lake Formation control levels: database, table, column, row, cell.
- Layers between the OS and EBS: three (local disk, EBS volume, volume presented to the VM).
- CloudWatch Logs default retention is unlimited.
- EMR default logs: primary node, `/mnt/var/log/`.
- CloudTrail Lake: one event data store per category. CloudWatch metrics show data ingested during the last hour or over the retention period.
- Sensitive data scan: default every 6 hours (four times a day), adds at least 5 to 10 minutes.
- Referencing Secrets Manager from Parameter Store: name starts with `/`.

## Exam traps
- Authentication and authorization are often swapped.
- IAM user has permanent credentials, IAM role has temporary credentials.
- AWS managed policies cannot be edited. Reusable custom permissions: customer managed policy, not inline.
- An access point policy alone is not enough, the bucket policy must also allow.
- User permissions do not automatically apply to services. QuickSight needs its own permission to S3.
- Parameter Store has no automatic rotation, Secrets Manager does.
- KMS and CloudHSM look similar. CloudHSM only when the question asks for direct control over the HSM.
- Encrypted EBS on EMR does not encrypt the local disks.
- Tokenization is not encryption, there is no mathematical process.
- Anonymization removes, masking hides. Salt does not need to be encrypted.
- Redshift DDM does not change stored data.
- CloudTrail trails do not support tag authorization, CloudTrail Lake event data stores do.
- Without a trail, CloudTrail does not deliver events to S3, only recent Event history.
- Backup vaults are separate from S3 Object Lock and bucket policies.

## Additional resources
- What Is IAM? (https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- Untitled, types of cloud storage (https://aws.amazon.com/what-is/cloud-storage/#:~:text=a%20massive%20scale.-,What%20are%20the%20types%20of%20cloud%20storage%3F,has%20its%20own%20use%20cases.)
- Untitled, Glue Python Medicaid sample (https://docs.aws.amazon.com/glue/latest/dg/aws-glue-programming-python-samples-medicaid.html)
- What Is AWS Certificate Manager? (https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)
- Example IAM Identity-Based Policies (https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_examples.html)
- Untitled, Amazon S3 tutorials (https://docs.aws.amazon.com/AmazonS3/latest/userguide/tutorials.html)
- AmazonDynamoDBFullAccess (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AmazonDynamoDBFullAccess.html)
- IAMFullAccess (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/IAMFullAccess.html)
- AWSCodeCommitPowerUser (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AWSCodeCommitPowerUser.html)
- AWSKeyManagementServicePowerUser (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AWSKeyManagementServicePowerUser.html)
- Untitled, Amazon Redshift management guide (https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html)
- Untitled, EMR and Apache Livy orchestration pipeline (https://aws.amazon.com/blogs/big-data/build-a-concurrent-data-orchestration-pipeline-using-amazon-emr-and-apache-livy/)
- AWS Access Levels (https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_understand-policy-summary-access-level-summaries.html#access_policies_access-level)
- AmazonMobileAnalyticsWriteOnlyAccess (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AmazonMobileAnalyticsWriteOnlyAccess.html)
- AmazonEC2ReadOnlyAccess (https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AmazonEC2ReadOnlyAccess.html)
- Untitled, Kinesis Data Streams quotas (https://docs.amazonaws.cn/en_us/streams/latest/dev/service-sizes-and-limits.html)
- Delegating Access Control to Access Points (https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-points-policies.html#access-points-delegating-control)
- What Is Amazon API Gateway? (https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- How Amazon API Gateway Works with IAM (https://docs.aws.amazon.com/apigateway/latest/developerguide/security_iam_service-with-iam.html)
- Insufficient Permissions When Using Athena with Amazon QuickSight (https://docs.aws.amazon.com/quicksight/latest/user/troubleshoot-athena-insufficient-permissions.html)
- Consolidate and Query AWS CloudTrail Data across Accounts and Regions Using AWS CloudTrail Lake (https://aws.amazon.com/blogs/mt/consolidate-and-query-aws-cloudtrail-data-across-accounts-and-regions-using-aws-cloudtrail-lake/)
- Tutorial: Detecting and Redacting PII Data with S3 Object Lambda and Amazon Comprehend (https://docs.aws.amazon.com/AmazonS3/latest/userguide/tutorial-s3-object-lambda-redact-pii.html)
