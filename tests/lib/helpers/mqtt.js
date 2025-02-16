/**
 * Copyright (c) 2019 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

//-------------------------------------------------------------------------------------------------------
// Helper Functions
//-------------------------------------------------------------------------------------------------------

var mqtt = require('mqtt');
var config = require("../../test-config-mqtt.json");

function setCredential(connector, deviceToken, deviceId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    connector.setCredential(deviceId, deviceToken);
    cb(null, "OK");
}

function submitData(connector, value, deviceToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }
    var ts = new Date().getTime();

    var data = {
        deviceId: deviceId,
        body: {
            accountId: accountId,
            on: ts,
            data: [{
                componentId: cid,
                value: Buffer.isBuffer(value.value) ? value.value : value.value.toString(),
                on: value.ts
            }]
        }
    };

    //the next few lines are needed as workaround to work with current sdk
    //once SDK has been updated this can be removed ...
    data.convertToMQTTPayload = function(){
	     delete this.convertToMQTTPayload;
	      return this;
    };
    data.did = data.deviceId;
    data.accountId = data.body.accountId;
    // ...until here

    connector.data(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            if (response) {
                cb(null, response);
            }
        }
    });
}

function submitDataList(connector, valueList, deviceToken, accountId, deviceId, cidList, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: deviceToken,
        deviceId: deviceId,
        body: {
            accountId: accountId,
            on: valueList[0].ts,
            data: []
        }
    };

    valueList.forEach(function(element){
        var toPush = {
            componentId: cidList[element.component],
            value: (typeof element.value === 'string' || Buffer.isBuffer(element.value)) ? element.value : element.value.toString(),
            on: element.ts
        };
        if (element.loc) {
            toPush.loc = element.loc;
        }
        if (element.attributes !== undefined){
            toPush.attributes = element.attributes;
        }
        data.body.data.push(toPush);
    });
    //the next few lines are needed as workaround to work with current sdk
    //once SDK has been updated this can be removed ...
    data.convertToMQTTPayload = function(){
	     delete this.convertToMQTTPayload;
	      return this;
    };
    data.did = data.deviceId;
    data.accountId = data.body.accountId;
    // ...until here

    connector.data(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            if (response) {
                cb(null, response);
            }
        }
    });
}

var clients = {};

function closeMqttConnection(deviceId) {
    clients[deviceId].end();
    clients[deviceId] = null;
}

function openMqttConnection(deviceToken, deviceId, topics, cbManager, cb, address, options) {
    if (clients[deviceId]) {
        closeMqttConnection(deviceId);
    }

    if (!options) {
        options = {};
    }
    options.username = deviceId;
    options.password = deviceToken;
    if (!address) {
        address = config.connector.mqtt.host + ":" + config.connector.mqtt.port;
        if (config.connector.mqtt.secure) {
            address = "mqtts://" + address;
            options.rejectUnauthorized = false;
        } else {
            address = "mqtt://" + address;
        }
    }

    var client = mqtt.connect(address, options);
    client.on('connect', function() {
        client.subscribe(topics, function(err, t) {
            if (err) {
                cb(err);
                return;
            }
            cb();
        });
    });

    client.on('message', function(topic, message) {
        cbManager.cb(message, topic);
    });

    clients[deviceId] = client;
}

module.exports={
    openMqttConnection: openMqttConnection,
    closeMqttConnection: closeMqttConnection,
    setCredential: setCredential,
    submitData: submitData,
    submitDataList: submitDataList
};
