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
    // To update the badge in intervals
    timer: null,
    backgroundTimer: null,
    foregroundTimer: null,
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        app.receivedEvent('deviceready');
        app.pluginInitialize();
        // socket.init();

        log('onDeviceReady', null);
    },
    // Update DOM on a Received Event
    receivedEvent: function (id) {
        log('receivedEvent', id);
    },
    // Initialize plugin
    pluginInitialize: function () {
        var silentBtn = document.getElementById('silent'),
            modeBtn = document.getElementById('mode'),
            logBtn = document.getElementById('log'),
            calibrateBtn = document.getElementById('calibrate'),
            devicemotionBtn = document.getElementById('devicemotion'),
            accelerationBtn = document.getElementById('acceleration'),
            plugin = cordova.plugins.backgroundMode,
            counter = 0;

        plugin.setDefaults({ color: 'F14F4D' });
        plugin.overrideBackButton();

        plugin.on('activate', app.onModeActivated);
        plugin.on('deactivate', app.onModeDeactivated);
        plugin.on('enable', app.onModeEnabled);
        plugin.on('disable', app.onModeDisabled);

        modeBtn.onclick = app.onModeButtonClicked;
        logBtn.onclick = app.onLogButtonClicked;
        calibrateBtn.onclick = app.onCalibrateButtonClicked;
        devicemotionBtn.onclick = app.onDevicemotionButtonClicked;
        accelerationBtn.onclick = app.onAccelerationButtonClicked;

        if (device.platform == 'Android') {
            silentBtn.onclick = app.onSilentButtonClicked;
        } else {
            app.onSilentButtonClicked();
        }

        app.timer = setInterval(function () {
            counter += 10;

            log('allground', counter);
        }, 10000);
    },
    // Read log
    onLogButtonClicked: function () {
        var localLog = JSON.parse(localStorage.getItem('log')),
            content = '',
            textarea = document.getElementById('log-output');

        localLog.forEach(function (logEntry) {
            content += logEntry.date + ': [' + logEntry.type + '] ' + logEntry.message + '\n';
        });

        textarea.value = content;
    },
    // Toggle the silent mode
    onSilentButtonClicked: function () {
        var plugin = cordova.plugins.backgroundMode,
            btn = document.getElementById('silent'),
            isSilent = !plugin.getDefaults().silent;

        app.setButtonClass(btn, isSilent);
        plugin.setDefaults({ silent: isSilent });
    },
    // Enable or disable the backgroud mode
    onModeButtonClicked: function () {
        var plugin = cordova.plugins.backgroundMode;
        plugin.setEnabled(!plugin.isEnabled());
    },
    // Enable calibration
    onCalibrateButtonClicked: function () {
        window.addEventListener('compassneedscalibration', function (event) {
            // ask user to wave device in a figure-eight motion .
            event.preventDefault();

            log('compassneedscalibration', null);
        }, true);

        log('calibrationButton', null);
    },
    // Toggle new devicemotion listener
    onDevicemotionButtonClicked: function () {
        var btn = document.getElementById('devicemotion'),
            timestamp = + new Date();

        app.setButtonClass(btn, true);

        function processEvent(event) {
            if (timestamp + 5000 < + new Date()) {
                timestamp = + new Date();
                
                log('devicemotion', [
                    event.acceleration.x,
                    event.acceleration.y,
                    event.acceleration.z
                ]);
                log('devicemotionIG', [
                    event.accelerationIncludingGravity.x,
                    event.accelerationIncludingGravity.y,
                    event.accelerationIncludingGravity.z
                ]);
                log('devicemotionRR', [
                    event.rotationRate.x,
                    event.rotationRate.y,
                    event.rotationRate.z
                ]);
            }
        }

        window.addEventListener('devicemotion', processEvent, true);

        log('devicemotionButton', null);
    },
    // Toggle old acceleration listener
    onAccelerationButtonClicked: function () {
        var btn = document.getElementById('acceleration');

        app.setButtonClass(btn, true);

        function onSuccess(acceleration) {
            log('acceleration', acceleration);
        }

        function onError() {
            log('accelerationError', null);
        }

        var options = {
            frequency: 5000
        };

        var watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);

        log('accelerationButton', watchID);
    },
    // Update CSS classes
    onModeEnabled: function () {
        var btn = document.getElementById('mode');
        app.setButtonClass(btn, true);
        cordova.plugins.notification.badge.requestPermission(function (granted) {
            log('badge.requestPermission', granted);
        });

        log('onModeEnabled', null);
    },
    // Update CSS classes
    onModeDisabled: function () {
        var btn = document.getElementById('mode');
        app.setButtonClass(btn, false);

        log('onModeDisabled', null);
    },
    // Toggle 'active' CSS class and return new status
    setButtonClass: function (el, setActive) {
        if (setActive) {
            el.className += ' active';
        } else {
            el.className = el.className.replace(' active', '');
        }
    },
    // Update badge once mode gets activated
    onModeActivated: function () {
        var counter = 0;

        clearInterval(app.foregroundTimer);

        cordova.plugins.notification.badge.clear();

        cordova.plugins.backgroundMode.disableWebViewOptimizations();

        app.backgroundTimer = setInterval(function () {
            counter += 10;

            cordova.plugins.notification.badge.set(counter);

            if (counter % 60 === 0) {
                cordova.plugins.backgroundMode.configure({
                    title: 'In background since ' + counter + ' sec',
                    text: 'In background since ' + counter + ' sec, hell yeah!'
                });

                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }

            log('background', counter);
        }, 10000);

        log('onModeActivated', null);
    },
    // Reset badge once deactivated
    onModeDeactivated: function () {
        var counter = 0;

        clearInterval(app.backgroundTimer);

        cordova.plugins.notification.badge.clear();

        app.foregroundTimer = setInterval(function () {
            counter += 10;

            cordova.plugins.notification.badge.set(counter);

            if (counter % 60 === 0) {
                cordova.plugins.backgroundMode.configure({
                    title: 'In foreground since ' + counter + ' sec',
                    text: 'In foreground since ' + counter + ' sec, hell yeah!'
                });

                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }

            log('foreground', counter);
        }, 10000);

        log('onModeDeactivated', null);
    }
};

app.initialize();
