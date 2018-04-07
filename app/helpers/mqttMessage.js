
var message = {
    topic: 'hello',
    payload: 'abcde', // or a Buffer
    qos: 0, // 0, 1, or 2
    retain: false // or true
};


function generateMessage(topic, payload) {
    return {
        topic: topic,
        payload: payload,
        qos: 0,
        retain: false
    }
}