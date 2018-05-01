// mqtt server
var mqttServer = require('mosca');

// MQTT core functions
var mqtt = require('mqtt');


// thingspeak client
var thingSpeak = require('./clients/thingSpeak/thingSpeakClient');

// database client
var mongoDB = require('./clients/mongodb/mongodb');

// default
//var mqttServer_con = '147.175.152.191';
var mqttServer_con = '192.168.0.234';
var mqttServer_port = 3001;

/**
 * mqtt setup for Mosca based mqtt server
 */
var mqttSettings = {
    backend: {
        type: 'mongo',
        url: mongoDB.getMongoConection(),
        pubsubCollection: mongoDB.getMongoName(), // storing accelerometer data
        mongo: {}
    },
    type: 'mqtt',
    //logger : {level: 'info'},
    mqtt: mqtt,
    json: true,
    host: mqttServer_con,
    persistence: {
        factory: mqttServer.persistence.Mongo,
        url: mongoDB.getMongoConection()
    },
    http: {
        port: mqttServer_port,
        bundle: false,
        static: './'
    }
};

var server;
mongoDB.connect(function (err) {
    if (err === null) {

        server = new mqttServer.Server(mqttSettings);

        server.on('ready', setupCallback);

        function setupCallback() {
            console.log(`MQTT server is up and listening on ${mqttServer_port}`);
        }

        // fired when a message is published
        server.on('published', (packet) => {
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
        server.on('clientConnected', (client) => {
            console.log('CONNECTED', 'Client:', client.id);
        });

        // fired when a client disconnects
        server.on('clientDisconnected', (client) => {
            console.log('DISCONNECTED', 'Client:', client.id);
        });
    } else {
        console.log('err', err);
    }
});


/**
 * Modules initializations in runtime
 */
function processMessage(packet) {

    // process admin commands
    if (packet.topic.startsWith("admin")) {


        // Invoke ThingSpeak Client
        if (packet.topic.endsWith("thingspeak/start")) {
            thingSpeak.connect(mqttServer_con, mqttServer_port);
        }
    }

}
