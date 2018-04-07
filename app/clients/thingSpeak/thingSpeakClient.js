
var thingSpeak = require('./thingSpeak');
var thingSpeakClient;

var lastId='';


/**
 * Client name
 */
var clientName = 'thingSpeakClient';

exports.connect = function (ip,port) {
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
        thingSpeakClient.subscribe("data/acc", {qos: 0});
        thingSpeakClient.subscribe("admin/thingspeak/#", {qos: 2});

        //client.publish('topic', 'payload', 1);
    });

    thingSpeakClient.on('message', function (topic, message) {
        //console.log(new Date().toISOString().slice(0, 19).replace('T', ' ') + ': ' + Array.prototype.join.call(arguments, ' :::: '));

        /**
         * Accelerometer data to be sent to ThingSpeak cloud
         */
        if (topic.startsWith('data')) {
            try {
                var payload = JSON.parse(message.toString('utf8'));

                // WTF receiving same messages multiple times?!
                if(lastId != payload.id) {

                    lastId = payload.id;
                    thingSpeak.thingSpeakUpdateBulk(payload);

                }
            } catch(e) {
                console.log('thingSpeakUpdateBulk FAILED', e);
            }

        }

        //thingSpeakClient.end();
    });
};
