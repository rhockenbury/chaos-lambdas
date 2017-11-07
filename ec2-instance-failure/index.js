
// WARNING: This code may irreversibly kill AWS resources. Be careful

var AWS = require('aws-sdk');
var config = {
    'region': 'us-east-1',
    'probability': 20,
    'groups': ['asg-name-1', 'asg-name-2'],
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

    ec2.describeInstances(function(err, data) {
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
                inst.Tags.forEach(function(tag) {
                    if (tag.Key === 'aws:autoscaling:groupName') {
                        if (config.groups) {
                            if (config.groups.indexOf(tag.Value) !== -1) {
                                candidates.push(inst.InstanceId);
                            }
                        }
                    }
                });
            });
        });

        console.log('Candidates: %j', candidates);
        var numInstances = candidates.length;

        if (numInstances === 0) {
            console.log('No suitable instances found');
            return context.done(null);
        }

        var random = Math.floor(Math.random() * numInstances);
        var target = candidates[random];

        console.log('Going to terminate instance with id = %s', target);

        ec2.terminateInstances({
            InstanceIds: [target]
        }, function(err, data) {
            if (err) {
                return context.done(err, null);
            }

            console.log('Instance %s terminated', target);

            if (config.snsTopic) {
                var params = {
                    Message: 'Chaos lambda has terminated EC2 instance ' + target,
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
