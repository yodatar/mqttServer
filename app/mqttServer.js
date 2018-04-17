// MQTT core functions
var mosca = require('mosca');
var mqtt = require('mqtt');

// Database handling
const mongod = require('mongod');

// thingspeak broker
var thingSpeak = require('./clients/thingSpeak/thingSpeakClient');


/**
 * LOCAL installation of MongoDB database for testing purposes
 * configuration:
 */
var mongo_con = 'mongodb://localhost:27017/mqtt';
// default
var mqttServer_con = '192.168.0.234';
var mqttServer_port = 4000;


/**
 * mqtt setup for Mosca based mqtt server
 */
var mqttSettings = {
    backend: {
        type: 'mongo',
        url: mongo_con,
        pubsubCollection: 'acc', // storing accelerometer data
        mongo: {}
    },
    type: 'mqtt',
    //logger : {level: 'info'},
    mqtt: mqtt,
    json: true,
    host: mqttServer_con,
    persistence: {
        factory: mosca.persistence.Mongo,
        url: mongo_con
    },
    http: {
        port: mqttServer_port,
        bundle: false,
        static: './'
    }
};

// MongoDB server to listen on.
const db = new mongod({
    port: 27017,
    dbpath: "data"
});


var server;

db.open((err) => {
    if (err === null) {

        // server bound to port 27017.
        server = new mosca.Server(mqttSettings);


        server.on('ready', setup);

        function setup() {
            console.log(`MQTT server is up and listening on ${mqttServer_port}`);
        }


        // fired when a message is published
        server.on('published', function (packet) {
            var clientId = '';
            try {
                clientId = (packet.payload.clientId != 'undefined') ? ('Client: ' + packet.payload.clientId) : ('Client: ' + packet.clientId);
            } catch (e) {
                console.log(e.toString());
            } finally {

                // filter out $SYS publish messages
                (!packet.topic.startsWith('\$SYS')) ? console.log('PUBLISHED', clientId, 'Topic: ' + packet.topic) : null;
            }

            processMessage(packet);

        });

        // fired when a client subscribes
        server.on('subscribed', (topic, client) => {
            console.log('SUBSCRIBED', 'Client:', client.id + ', Topic:', topic);
        });

        // fired when a client connects
        server.on('clientConnected', function (client) {
            console.log('CONNECTED', 'Client:', client.id);
        });

        // fired when a client disconnects
        server.on('clientDisconnected', function (client) {
            console.log('DISCONNECTED', 'Client:', client.id);
        });

    } else {
        console.log('Unable to connect to MongoDB.', err);
    }
});


function processMessage(packet) {

    // process admin commands
    if (packet.topic.startsWith("admin")) {


        // Invoke ThingSpeak broker
        if (packet.topic.endsWith("thingspeak/start")) {
            thingSpeak.connect(mqttServer_con, mqttServer_port);
        }
    }

}
