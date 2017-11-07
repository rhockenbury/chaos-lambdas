
// WARNING: This code may irreversibly kill AWS resources. Be careful

var AWS = require('aws-sdk');
var config = {
    'region': 'us-east-1',
    'probability': 5,
    'instances': ['rds-instance-name'],
    'snsTopic': 'optional-sns-topic-for-alerts'
};

AWS.config.region = config.region || 'us-east-1';

exports.handler = function(event, context, callback) {

    if (randomIntFromInterval(1, 100) >= config.probability && config.probability != 100) {
        console.log('Probability says it is not chaos time');
        return context.done(null, null);
    }

    var rds = new AWS.RDS();
    var sns = new AWS.SNS();

    console.log('Starting the chaos');

    config.instances.forEach(function(instance) {
        rds.rebootDBInstance({
            'DBInstanceIdentifier': instance,
            'ForceFailover': true
        }, function(err, data) {
            if (err) {
                return context.done(err, null);
            }

            if (!data) {
                console.log('RDS instance %s reboot failed, exiting.', instance);
                return context.done(null, null);
            }

            console.log('RDS instance %s terminated', instance);

            if (config.snsTopic) {
                var params = {
                    Message: 'Chaos lambda has started failover for RDS instance ' + instance,
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
