$(function () {

    var messagesPanel = $('.messagesPanel');

    var messagesCountSel = $('.messagesCount');
    var clientCountSel = $('.clientCount');

    var messagesSel = $('ul.messages');
    var lastMessageSel = $('.lastMessageSel');



    var outputSel = $("#thingSpeakOutput");


    // Functions
    var client, appendMessage, processMessage, appendLog;
    var messagesCount = 0;
    var clientCount = 0;


    var dataMessages = [];
    var selectedDataMessages = [];

    var selectableMessage = $('.selectableMessage');

    /** __________________________________________________________________________________
     *
     *      ADMIN CONNECT
     */

    //Sec-WebSocket-Protocol: mqtt
    //Upgrade: websocket
    var connectUpgrade = 'ws://';
    var connectPort = ':1883';
    var connectServer = '192.168.0.234';
    var txtIpAddress = $("#ip-address");
    //var connectServer = 'localhost';
    var inputUsername = 'admin';

    var btnToggleConnect = $('#btn-toggle-connect');
    var btnToggleThingSpeak = $('#btn-toggle-thingspeak');


    var btnPublishPair = $('#btn-publish-pair');
    var btnPublishNonpair = $('#btn-publish-nonpair');
    var btnPublishNothandshake = $('#btn-publish-nothandshake');
    var btnDeselectDataMessages = $('#btn-deselect-datamessages');

    btnToggleConnect.on('click', function (e) {
        e.preventDefault();

        /**
         * Connect
         */
        if (!client || !client.connected) {

            connectServer = txtIpAddress.val();

            client = mqtt.connect(connectUpgrade + connectServer + connectPort, {
                clean: true,
                clientId: inputUsername,
                qos: 0
            });

            client.on('connect', function () {

                client.subscribe('#', {qos: 0});
                client.subscribe('$SYS/#', {qos: 0});

                // UI changes
                btnToggleConnect.find(".fa-toggle-off")
                    .addClass("fa-toggle-on").removeClass("fa-toggle-off");
                btnToggleConnect.find(".caption").html(connectServer);
                btnToggleConnect.find(".sub-caption").html(connectServer);

                btnToggleConnect
                    .addClass("panel-green").removeClass("panel-red")
                    .addClass("btn-disconnect").removeClass("btn-connect");

                btnToggleThingSpeak.removeClass("btn-connect-disabled");

                //client.publish('hi', 'hola', 1);
            });

            /**
             * Message received
             */
            client.on('message', function (topic, message) {
                processMessage(topic, message);
            });
        }

        /**
         * Disconnect
         */
        if (client && client.connected) {
            client.end();

            // UI changes
            btnToggleConnect.find(".fa-toggle-on")
                .addClass("fa-toggle-off").removeClass("fa-toggle-on");
            btnToggleConnect.find(".caption").html("...");
            btnToggleConnect.find(".sub-caption").html("Disconnected");

            btnToggleConnect
                .addClass("panel-red").removeClass("panel-green")
                .addClass("btn-connect").removeClass("btn-disconnect");

            btnToggleThingSpeak.addClass("btn-connect-disabled");
        }
    });


    processMessage = function (topic, message) {

        messagesCountSel.html(++messagesCount);

        try {
            message = JSON.parse(message)
        } catch (e) {
            //console.log(e);
            message = {id: String.fromCharCode.apply(null, message)};
        }

        /**
         * Notifications - Log
         */
        if (topic.startsWith("$SYS")) {

            if (topic.endsWith('new/clients')) {
                clientCountSel.html(++clientCount);
            }
            if (topic.endsWith('disconnect/clients')) {
                clientCountSel.html(clientCount == 0 ? 0 : --clientCount);
            }
        }


        console.log(topic + message);

        appendLog(topic, message);
    };

    appendLog = function (topic, message) {
        var timestamp = message.id,
            timestampDate = new Date(),
            id = (message.clientId != null) ? message.clientId : message.id;
        var messageIcon = 'fa-cloud-upload';


        if (topic.endsWith('new/clients')) {
            messageIcon = 'fa-user-plus';
            topic = 'new/clients';
        }
        if (topic.endsWith('disconnect/clients')) {
            messageIcon = 'fa-user-times';
            topic = 'disconnect/clients';
        }
        if (topic.endsWith('new/subscribes')) {
            messageIcon = 'fa-rss';
            topic = 'new/subscribes';
        }
        if (topic.endsWith('new/unsubscribes')) {
            messageIcon = 'fa-rss-square';
            topic = 'new/unsubscribes';
        }


        if (isNaN(timestamp) == false) {
            timestampDate = new Date(timestamp);
        }

        var isDataMessage = topic.startsWith("data/acc");

        var messageClass = isDataMessage ? 'selectableMessage' : '';

        var mess =
            '<li class="left clearfix ' + messageClass + ' " data-id="' + message.id + '">' +
            '<span class="log-img pull-left"><i class="fa fa-lg ' + messageIcon + ' fa-fw"></i></span>' +
            '<div class="log-body clearfix"><div class="header">' +
            '<strong class="primary-font">' + topic + '</strong>' +
            '<div class="pull-right text-muted"><i class="fa fa fa-clock-o fa-fw">' +
            '</i> ' + timestampDate.toLocaleTimeString() + '.' + timestampDate.getMilliseconds() + '</div>' +
            '</div><p>' + id + '</p></div></li>';

        messagesSel.append(mess);

        if (isDataMessage) {
            mess =
                '<li class="left clearfix"><div class="log-body">' +
                '<strong class="primary-font">' + id + '</strong>' +
                '<div class="pull-right text-muted"><i class="fa fa fa-clock-o fa-fw">' +
                '</i> ' + timestampDate.toLocaleTimeString() + '.' + timestampDate.getMilliseconds() + '</div></div></li>';

            lastMessageSel.prepend(mess);
            lastMessageSel.find(":nth-child(3)").remove();


            dataMessages.push(message);

            console.log(dataMessages);
            outputSel.append("<p>" + JSON.stringify(message) + "</p>");
            outputSel.scrollTop(outputSel[0].scrollHeight);

        }

        messagesPanel.scrollTop(messagesPanel[0].scrollHeight);
    };


    /** ___________________________________________________________________________________
     *
     *      PUBLISH MESSAGE
     */
    var btnPublish = $('#btn-publish');
    var inputTopic = $('.input-topic');
    var inputMessage = $('.input-message');


    function createPairMessage() {
        if(selectedDataMessages.length == 2) {
            var msg = {
                message1: selectedDataMessages[0],
                message2: selectedDataMessages[1]
            };

            return JSON.stringify(msg);
        }
    }

    function publishMessage(topic, payload) {
        if(client.connected) {
            client.publish(topic, payload, 0);
        }
    }

    btnPublish.on('click', function (e) {
        e.preventDefault();

        client.publish(inputTopic, {id: inputUsername, payload: inputMessage.value}, 0);
        inputMessage.value = '';
    });


    // PAIR - 0
    btnPublishPair.on('click', function (e) {
        e.preventDefault();

        var msg = createPairMessage();
        if(msg != null ) {
            publishMessage("data/paired/pair", msg);
        }
    });

    // NON PAIR - 1
    btnPublishNonpair.on('click', function (e) {
        e.preventDefault();

        var msg = createPairMessage();
        if(msg != null ) {
            publishMessage("data/paired/nonpair", msg);
        }
    });

    // NOT HANDSHAKE - 2
    btnPublishNothandshake.on('click', function (e) {
        e.preventDefault();

        var msg = createPairMessage();
        if(msg != null ) {
            publishMessage("data/paired/nothandshake", msg);
        }
    });



    /** ___________________________________________________________________________________
     *
     *      THINGSPEAK CONNECT
     */
    btnToggleThingSpeak.on('click', function (e) {
        e.preventDefault();


        if (!btnToggleThingSpeak.hasClass("btn-connect-disabled")) {

            client.publish('admin/thingspeak/start');

            btnToggleThingSpeak.find(".fa-toggle-off")
                .addClass("fa-toggle-on").removeClass("fa-toggle-off");
            //btnToggleThingSpeak.find(".caption").html("...");
            btnToggleThingSpeak.find(".sub-caption").html("Connected");

            btnToggleThingSpeak
                .addClass("panel-green").removeClass("panel-red");
            //.addClass("btn-disconnect").removeClass("btn-connect");



        }
    });


    /** _________________________________________________________________________________________
     *
     *      Pair selection
     */

    $("body").on("click", ".selectableMessage", function (e) {
        e.preventDefault();

        var $this = $(this);
        var searchId = $this.data('id');


        if ($this.hasClass('selectedMessage')) {
            deselectMessage($this, searchId);
        } else {
            selectMessage($this, searchId);
        }
    });

    function selectMessage($this, searchId) {
        // max 2 messages can be selected
        if (selectedDataMessages.length < 2) {
            $.each(dataMessages, function (i) {
                if (dataMessages[i].hasOwnProperty('id') && dataMessages[i].id == searchId) {
                    $this.addClass('selectedMessage');

                    // add message to selected
                    selectedDataMessages.push(dataMessages[i]);
                }
            });

            if (selectedDataMessages.length == 2) {
                btnPublishPair.prop('disabled', false);
                btnPublishNonpair.prop('disabled', false);
                btnPublishNothandshake.prop('disabled', false);
            } else {
                btnPublishPair.prop('disabled', true);
                btnPublishNonpair.prop('disabled', true);
                btnPublishNothandshake.prop('disabled', true);
            }
        }
    }

    function deselectMessage($this, searchId) {

        $.each(selectedDataMessages, function (i) {
            if (selectedDataMessages[i] != null
                && selectedDataMessages[i].hasOwnProperty('id')
                && selectedDataMessages[i].id == searchId) {

                $this.removeClass('selectedMessage');

                // remove message from selected
                selectedDataMessages.splice(selectedDataMessages.indexOf(dataMessages[i]), 1);

                btnPublishPair.prop('disabled', true);
                btnPublishNonpair.prop('disabled', true);
                btnPublishNothandshake.prop('disabled', true);
            }
        });
    }

    /**
     * Deselect messages
     */
    btnDeselectDataMessages.on('click', function (e) {
        e.preventDefault();

        selectedDataMessages = [];
        $(".selectableMessage").removeClass("selectedMessage");
    });


});