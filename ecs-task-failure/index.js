
// WARNING: This code may irreversibly kill AWS resources. Be careful

var AWS = require('aws-sdk');
var config = {
    'region': 'us-east-1',
    'probability': 80,
    'services': ['ecs-service-name-1', 'ecs-service-name-2'],
    'snsTopic': 'optional-sns-topic-for-alerts'
};

AWS.config.region = config.region || 'us-east-1';

exports.handler = function(event, context, callback) {

    if (randomIntFromInterval(1, 100) >= config.probability && config.probability != 100) {
        console.log('Probability says it is not chaos time');
        return context.done(null, null);
    }

    var ecs = new AWS.ECS();
    var sns = new AWS.SNS();

    console.log('Starting the chaos');

    ecs.listClusters(function(err, data) {
        if (err) {
            return context.done(err, null);
        }

        if (!data || data.clusterArns.length === 0) {
            console.log('No clusters found, exiting.');
            return context.done(null, null);
        }

        // for each cluster, find the running tasks within the configured
        // services, and randomly stop one task in each service
        data.clusterArns.forEach(function(clusterArn) {
            config.services.forEach(function(serviceName) {
                ecs.listTasks({
                    cluster: clusterArn,
                    serviceName: serviceName,
                    desiredStatus: 'RUNNING'
                }, function(err, data) {
                    if (err) {
                        return context.done(err, null);
                    }

                    if (!data || data.taskArns.length === 0) {
                        console.log('No tasks found for cluster %s and service %s', clusterArn, serviceName);
                        return context.done(null, null);
                    }

                    var candidates = data.taskArns;

                    console.log('Candidates for service %s: %j', serviceName, candidates);
                    var random = Math.floor(Math.random() * data.taskArns.length);
                    var target = candidates[random];

                    console.log('Going to terminate task with id = %s for service %s', target, serviceName);

                    ecs.stopTask({
                        task: target,
                        cluster: clusterArn,
                        reason: 'Stopped by chaos lambda'
                    }, function(err, data) {
                        if (err) {
                            return context.done(err, null);
                        }

                        console.log('Task %s stopped', target);

                        if (config.snsTopic) {
                            var params = {
                                Message: 'Chaos lambda has stopped ECS task ' + target + ' for service ' + serviceName,
                                Subject: 'Chaos Lambda Event',
                                TopicArn: config.snsTopic
                            };

                            sns.publish(params, context.done);
                        }
                    });
                });
            })
        });
    })
};

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
