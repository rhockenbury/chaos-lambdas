chaos-lambdas
=======
A suite of lambdas for testing AWS architecture resiliency

# These functions may destroy AWS resources.  Always run with care.

#### For an introduction, [check out the blog post](https://www.rylerhockenbury.com/blog/chaos-in-the-cloud-open-sourcing-my-chaos-lambdas).

#### For questions or bugs, [open an issue](https://github.com/rhockenbury/chaos-lambdas/issues).

These Lambdas can be automated by setting up a Cloudwatch event to trigger the Lambda on a recurring basis.  For example, to execute every 15 minutes during business hours: `*/15 14-20 ? * MON-FRI *`

## ec2-az-outage

Simulates an availability zone outage by terminating all EC2 instances in an availability zone

### Parameters:

region - Target region

probability - Probability to run function

zones - List of AZ zones within region

exclusions - List of instance ids that should not be terminated

snsTopic - SNS topic for notifications

### Permissions:

Use `AmazonEC2FullAccess` policy

## ec2-instance-failure

Terminates an EC2 instance at random chosen from a list of instances belonging to a configured set of auto scaling groups

### Parameters:

region - Target region

probability - Probability to run function

groups - List of auto scaling groups

snsTopic - SNS topic for notifications

### Permissions:

Use `AmazonEC2FullAccess` policy

## ecs-task-failure

Stops an ECS task at random chosen from a list of tasks belonging to a configured set of ECS services

### Parameters:

region - Target region

probability - Probability to run function

services - List of ECS services

snsTopic - SNS topic for notifications

### Permissions:

Use `AmazonECS_FullAccess` policy

## rds-az-failure

Triggers an RDS AZ failover by rebooting the RDS instance with a forced failover

### Parameters:

region - Target region

probability - Probability to run function

instance - List of RDS instance identifiers

snsTopic - SNS topic for notifications

### Permissions:

Use `AmazonRDSFullAccess` policy
