const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Database handling
const mongod = require('mongod');
/**
 * LOCAL installation of MongoDB database for testing purposes
 * configuration:
 */
// server bound to port 27017.
var mongo_con = 'mongodb://localhost';
var mongo_db = 'mqtt';
var mongo_port = 27017;
var mongo_name = 'handshake';
var db, collection;

exports.getMongoConection = function () {
    return mongo_con + ':' + mongo_port;
};

exports.getMongoName = function () {
    return mongo_name;
};

// Use connect method to connect to the db
exports.connect = function connect(callback) {

    // MongoDB connector
    const dbConnector = new mongod({
        port: mongo_port,
        dbpath: "data"
    });

    dbConnector.open((err) => {
        if (err === null) {

            MongoClient.connect(mongo_con + ':' + mongo_port, (err, client) => {
                if (err == null && client != null) {
                    console.log(`MongoDB is up and listening on port ${mongo_port}`);
                    db = client.db(mongo_db);
                    collection = db.collection(mongo_name);
                    //client.close();
                    callback(null);

                } else {
                    console.log('Unable to connect to MongoDB:', err);
                    callback(err);
                }
            });
        }
    });
};

const insertDocuments = function(object) {
    collection.insertMany([object], function(err, result) {
        assert.equal(err, null);
        assert.equal(3, result.result.n);
        assert.equal(3, result.ops.length);
        console.log("Inserted", result);
    });
};

const findDocuments = function(db, callback, cond) {
    const collection = db.collection('documents');

    collection.find(cond).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records", docs);
        callback(docs);
    });
}