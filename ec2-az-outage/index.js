
// WARNING: This code may irreversibly kill AWS resources. Be careful

var AWS = require('aws-sdk');
var config = {
    'region': 'us-east-1',
    'probability': 5,
    'zones': ['us-east-1a', 'us-east-1b'],
    'exclusions': ['instance-id-1', 'instance-id-2'],
    'snsTopic': 'optional-sns-topic-for-alerts'
};

AWS.config.region = config.region || 'us-east-1';

exports.handler = function(event, context, callback) {

    if (randomIntFromInterval(1, 100) >= config.probability && config.probability != 100) {
        console.log('Probability says it is not chaos time');
        return context.done(null, null);
    }

    var ec2 = new AWS.EC2();
    var sns = new AWS.SNS();

    console.log('Starting the chaos');

    var random = Math.floor(Math.random() * config.zones.length);
    var target = config.zones[random];

    console.log('Going to terminate all instances in zone %s', target);

    ec2.describeInstances({
        Filters: [
            {
                Name: 'availability-zone',
                Values: [target]
            }
        ]}, function(err, data) {
            if (err) {
                return context.done(err, null);
            }

            if (!data || data.Reservations.length === 0) {
                console.log('No instances found, exiting.');
                return context.done(null, null);
            }

            var candidates = [];
            data.Reservations.forEach(function(res) {
                res.Instances.forEach(function(inst) {
                    if (config.exclusions.indexOf(inst.InstanceId) === -1) {
                        candidates.push(inst.InstanceId);
                    }
                });
            });

            console.log('Going to terminate instances %j', candidates);

            ec2.terminateInstances({
                InstanceIds: candidates
            }, function(err, data) {
                if (err) {
                    return context.done(err, null);
                }

                console.log('Terminated instances %j', candidates);

                if (config.snsTopic) {
                    var params = {
                        Message: 'Chaos lambda has terminated all EC2 instances in availability zone ' + target,
                        Subject: 'Chaos Lambda Event',
                        TopicArn: config.snsTopic
                    };

                    sns.publish(params, context.done);
                }
            });
    });
};

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
