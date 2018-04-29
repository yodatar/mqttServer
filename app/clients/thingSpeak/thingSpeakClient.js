
var thingSpeakAdapter = require('./thingSpeakAdapter');
var thingSpeakClient;


/**
 * Client name
 */
var clientName = 'thingSpeakClient';

exports.connect = function (ip,port) {

    // TODO
    if (thingSpeakClient != null && thingSpeakClient.connected) {
        return;
    }

    var mqtt = require('mqtt');

    /**
     * Attach ThingSpeak Client
     */
    try {
        thingSpeakClient = mqtt.connect('ws://' + ip + ":" + port, {
            clean: false,
            clientId: clientName
        });

    } catch(e) {
        console.log('FAILED', clientName, 'mqtt.connect: ' + e);
    }


    thingSpeakClient.on('connect', function () {

        // Subscribe to accelerometer data
        thingSpeakClient.subscribe("data/paired/#", {qos: 0});
        thingSpeakClient.subscribe("admin/thingspeak/#", {qos: 2});

        //client.publish('topic', 'payload', 1);
    });

    thingSpeakClient.on('message', function (topic, message) {
        //console.log(new Date().toISOString().slice(0, 19).replace('T', ' ') + ': ' + Array.prototype.join.call(arguments, ' :::: '));

        /**
         * Accelerometer data to be sent to ThingSpeak cloud
         */
        if (topic.startsWith('data/paired')) {
            try {
                var payload = JSON.parse(message.toString('utf8'));

                thingSpeakAdapter.update(payload, topic);

            } catch(e) {
                console.log('update FAILED', e);
            }

        }

        //thingSpeakClient.end();
    });
};
