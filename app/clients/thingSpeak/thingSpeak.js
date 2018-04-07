/**
 * Thingspeak Cloud API
 */
var ThingSpeakClient = require('thingspeakclient');
var thingSpeakClient = new ThingSpeakClient();
var httpRequest = require('http_request');


/**
 * Public custom channel on https://thingspeak.com/channels
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
     field1: "-1.1492168",          // x
     field2: "-2.4516625",          // y
     field3: "-1.3311762",          // z
     field4: null,                  // timestamp (unused)
     field5: "224772291565621"      // id
     },
     { ...
 * @param payload
 * @returns {{write_api_key: string, updates: Array}}
 */
function transformToTSChannelMessage(payload) {
    // console.log('\x1b[36m%s\x1b[0m','payload: '+ payload );

    var payloadTransformed = {"write_api_key": writeKey, "updates": []};

    if(payload.x != null) {
        for (var i=0; i < payload.x.length; i++) {
            var t = new Date(payload.time[i]/1000000); // microseconds to seconds
            payloadTransformed.updates.push(
                {
                    "created_at": t.toISOString(),
                    "field1": payload.clientId,
                    "field2": payload.time[i],
                    "field3": payload.x[i],
                    "field4": payload.y[i],
                    "field5": payload.z[i]
                });
        }
    } else {
        console.log(payloadTransformed);
        return null;
    }

    //console.log(payloadTransformed);
    return payloadTransformed;
}

function resendMessage(payload) {
    console.log("\x1b[33m Resend data in 3 seconds... \x1b[0m");
    setTimeout(function(){
        exports.thingSpeakUpdateBulk(payload);
    }, 3000);
}

/**
 * Push to channel
 * one by one
 * @param payload
 */
exports.thingSpeakUpdate = function (payload) {
    thingSpeakClient.updateChannel(channelID, payload, callBackThingSpeak);
};


/**
 * Multiple data feeds packed in one post
 * @param payload
 */
exports.thingSpeakUpdateBulk = function (payload) {

    var payloadTransformed = transformToTSChannelMessage(payload);

    if (payloadTransformed != null) {
        var timestamp = new Date(payload.id);
        console.log('\x1b[36m%s\x1b[0m','DATA to ThingSpeak. TimestampID: '+ timestamp.toLocaleTimeString() + '.' + timestamp.getMilliseconds(),"\x1b[0m" );

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

                    /**
                     *  { error_code: 'error_too_many_requests',
                         message: 'Too Many Requests',
                         details: 'Please wait before making another request.' } }
                     */
                    if(code == '429') {
                      resendMessage(payload);
                    }
                }
            });
    }

};
