/**
 * Thingspeak Cloud API
 */
var ThingSpeakClient = require('thingspeakclient');
var thingSpeakClient = new ThingSpeakClient();
var httpRequest = require('http_request');


/**
 * Public custom channel on https://thingspeak.com/channels
 * https://thingspeak.com/channels/446727
 *
 * http://api.thingspeak.com/channels/446727/feed.csv?start=2017-07-01&end=2019-07-09
 */
var writeKey = '7OQSL6WL8V9XUJLI';
var readKey = '77I5WW0HEWXBPOJZ';
var channelID = 446727;


/**
 * Register on channel
 */
thingSpeakClient.attachChannel(channelID, {writeKey: writeKey, readKey: readKey});

/**
 * When updateChannel is invoked, receive an response
 * @param err
 * @param resp
 */
function callBackThingSpeak(err, resp) {
    if (!err && resp > 0) {
        console.log('callBackThingSpeak: ' + resp);
    }
    else {
        console.log(err);
    }
}


/**
 * Transform to ThingSpeak channel message format
 *  [
     {
     created_at: "1970-01-03T15:26:13+01:00",
     entry_id: 24,                  // server-side assignment
     field1: "phone"                // clientId
     field2: "224772291565621"      // MessageId
     field3: "-1.1492168",          // x
     field4: "-2.4516625",          // y
     field5: "-1.3311762",          // z
     field6: "smartphone"           // clientId paired
     field7: "224772291565333"      // messageId paired
     },
     { ...
 * @param payload
 * @returns {{write_api_key: string, updates: Array}}
 */
function transformToTSChannelMessage(payload, topic) {
    //console.log('\x1b[36m%s\x1b[0m','payload: '+ JSON.stringify(payload));

    var commonSize = 0,
        pairFlag = null;

    var payloadTransformed = {"write_api_key": writeKey, "updates": []};

    try {
        var message1 = payload.message1;
        var message2 = payload.message2;
    } catch(e) {
        console.log(e);
        return null;
    }


    if (message1.x != null && message2.x != null) {
        commonSize = message1.x.length < message2.x.length ? message1.x.length : message2.x.length;
    } else {
        return null;
    }

    //
    commonSize = 100;

    /**
     * Flag if pair of samples were gathered from
     * real pair handshake == 0
     * not pair handshake == 1
     * not handshake gesture == 2
     *
     */
    if(topic.endsWith("pair")) {
        pairFlag = 0;
    }
    if(topic.endsWith("nonpair")) {
        pairFlag = 1;
    }
    if(topic.endsWith("nothandshake")) {
        pairFlag = 2;
    }

    console.log('pairFlag:',pairFlag);

    for (var i=0; i < commonSize; i++) {
        var t,x,y,z;
        try {
            x = message1.x[i];
            y = message1.y[i];
            z = message1.z[i];
            t = new Date(message1.messageId);
        } catch (e) {
            t = new Date();
            x = 0;
            y = 0;
            z = 0;
        }
        payloadTransformed.updates.push(
            {
                "created_at": t,
                "field1": message1.clientId,
                "field2": message1.messageId,
                "field3": x,
                "field4": y,
                "field5": z,
                "field6": message2.clientId, // paired client ID
                "field7": message2.messageId, // paired message ID
                "field8": pairFlag
            });
    }

    for (var i=0; i < commonSize; i++) {
        var t,x,y,z;
        try {
            x = message2.x[i];
            y = message2.y[i];
            z = message2.z[i];
            t = new Date(message2.messageId);
        } catch (e) {
            t = new Date();
            x = 0;
            y = 0;
            z = 0;
        }
        payloadTransformed.updates.push(
            {
                "created_at": t,
                "field1": message2.clientId,
                "field2": message2.messageId,
                "field3": x,
                "field4": y,
                "field5": z,
                "field6": message1.clientId, // paired client ID
                "field7": message1.messageId, // paired message ID
                "field8": pairFlag
            });
    }


    console.log(payloadTransformed);
    return payloadTransformed;
}


/**
 *  { error_code: 'error_too_many_requests',
     message: 'Too Many Requests',
     details: 'Please wait before making another request.' }
 */
function resendMessage(payload, topic) {
    console.log("\x1b[33m Resend data in 3 seconds... \x1b[0m");
    setTimeout(function(){
        exports.update(payload, topic);
    }, 3000);
}

/**
 * Push to channel
 * one by one
 * @param payload
 */
exports.singleUpdate = function (payload) {
    thingSpeakClient.updateChannel(channelID, payload, callBackThingSpeak);
};


/**
 * Multiple data feeds packed in one post
 */
exports.update = function (payload, topic) {

    var payloadTransformed = transformToTSChannelMessage(payload, topic);

    if (payloadTransformed != null) {
        try {
            var messageId1 = new Date(payload.message1.messageId);
            var messageId2 = new Date(payload.message2.messageId);
            console.log('\x1b[36m%s\x1b[0m','Paired data to ThingSpeak: ' +
                messageId1.toLocaleTimeString() + '.' + messageId1.getMilliseconds(),
                " - ",
                messageId2.toLocaleTimeString() + '.' + messageId2.getMilliseconds(),
                "\x1b[0m" );
        } catch(e) {
            console.log(e);
        }


        /**
         * POST
         */
        httpRequest.post('https://api.thingspeak.com/channels/' + channelID + '/bulk_update.json', {
            body: payloadTransformed,
            dataType: 'json',
            headers: {
                "Content-Type": "application/json",
                "time_format": "absolute",
                "write_api_key": writeKey
            }
        })
            .then(function (response) {
                // Get the response body
                console.log("\x1b[33m ",response.getBody()," \x1b[0m");

                if(response != null) {
                    var code = response.getCode();

                    if(code == '429') {
                      resendMessage(payload, topic);
                    }
                }
            });
    }

};
