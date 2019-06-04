/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
function log(key, value) {
    var item = localStorage.getItem('log') || '[]',
        array = JSON.parse(item);

    array.push({
        date: new Date().toISOString(),
        type: key,
        message: value
    });

    localStorage.setItem('log', JSON.stringify(array));
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        app.pluginInitialize();
        // socket.init();

        log('onDeviceReady', null);
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        log('receivedEvent', id);
    },
    // Initialize plugin
    pluginInitialize: function() {
        var silentBtn = document.getElementById('silent'),
            modeBtn   = document.getElementById('mode'),
            logBtn    = document.getElementById('log'),
            plugin    = cordova.plugins.backgroundMode;

        plugin.setDefaults({ color: 'F14F4D' });
        plugin.overrideBackButton();

        plugin.on('activate', app.onModeActivated);
        plugin.on('deactivate', app.onModeDeactivated);
        plugin.on('enable', app.onModeEnabled);
        plugin.on('disable', app.onModeDisabled);

        modeBtn.onclick = app.onModeButtonClicked;
        logBtn.onclick = app.onLogButtonClicked;

        if (device.platform == 'Android') {
            silentBtn.onclick = app.onSilentButtonClicked;
        } else {
            app.onSilentButtonClicked();
        }
    },
    // Read log
    onLogButtonClicked: function() {
        var localLog = JSON.parse(localStorage.getItem('log')),
            content  = '',
            textarea = document.getElementById('log-output');

        localLog.forEach(function (logEntry) {
            content += logEntry.date + ': [' + logEntry.type + '] ' + logEntry.message + '\n'; 
        });

        textarea.value = content;
    },
    // Toggle the silent mode
    onSilentButtonClicked: function() {
        var plugin   = cordova.plugins.backgroundMode,
            btn      = document.getElementById('silent'),
            isSilent = !plugin.getDefaults().silent;

        app.setButtonClass(btn, isSilent);
        plugin.setDefaults({ silent: isSilent });
    },
    // Enable or disable the backgroud mode
    onModeButtonClicked: function() {
        var plugin = cordova.plugins.backgroundMode;
        plugin.setEnabled(!plugin.isEnabled());
    },
    // Update CSS classes
    onModeEnabled: function() {
        var btn = document.getElementById('mode');
        app.setButtonClass(btn, true);
        cordova.plugins.notification.badge.requestPermission(function (granted) {
            log('badge.requestPermission', granted);
        });

        log('onModeEnabled',  null);
    },
    // Update CSS classes
    onModeDisabled: function() {
        var btn = document.getElementById('mode');
        app.setButtonClass(btn, false);

        log('onModeDisabled',  null);
    },
    // Toggle 'active' CSS class and return new status
    setButtonClass: function(el, setActive) {
        if (setActive) {
            el.className += ' active';
        } else {
            el.className = el.className.replace(' active', '');
        }
    },
    // To update the badge in intervals
    timer: null,
    // Update badge once mode gets activated
    onModeActivated: function() {
        var counter = 0;

        cordova.plugins.backgroundMode.disableWebViewOptimizations();

        app.timer = setInterval(function () {
            counter += 10;

            cordova.plugins.notification.badge.set(counter);

            if (counter % 60 === 0) {
                cordova.plugins.backgroundMode.configure({
                    title: 'Running since ' + counter + ' sec',
                    text: 'Running since ' + counter + ' sec, hell yeah!'
                });

                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }

            log('running',  'since ' + counter + ' sec');
        }, 10000);

        log('onModeActivated',  null);
    },
    // Reset badge once deactivated
    onModeDeactivated: function() {
        cordova.plugins.notification.badge.clear();
        clearInterval(app.timer);

        log('onModeDeactivated',  null);
    }
};

// var socket = {
//     _socket: null,

//     init: function() {
//         if (!window.hasOwnProperty('WebSocket'))
//             return;

//         this._socket = new WebSocket('ws://echo.websocket.org/');

//         this._socket.onopen    = function(evt) { socket.onOpen(evt); };
//         this._socket.onclose   = function(evt) { socket.onClose(evt); };
//         this._socket.onmessage = function(evt) { socket.onMessage(evt); };
//         this._socket.onerror   = function(evt) { socket.onError(evt); };
//     },

//     onOpen: function(evt) {
//         console.log('CONNECTED');
//         this.doSend('background-mode plugin rocks');
//     },

//     onClose: function(evt) {
//         console.log('DISCONNECTED');
//         log('close', 'DISCONNECTED');
//     },

//     onMessage: function(evt) {
//         console.log('RECEIVED: ' + evt.data);
//         log('message', evt.data);
//     },

//     onError: function(evt) {
//         console.log('ERROR: ' + evt.data);
//         log('error', message);
//     },

//     doSend: function(message) {
//         if (this._socket) {
//             console.log('SENT: ' + message);
//             this._socket.send(message);
//             log('send', message);
//         }
//     }
// };

app.initialize();
