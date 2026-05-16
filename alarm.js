/*
========================================
PRO CLOCK APP - ALARM ENGINE MODULE
FILE: alarm.js
ROLE: Handles alarms, notifications, vibration
========================================
*/

(function () {
    "use strict";

    /*
    ========================================
    ALARM ENGINE CLASS
    ========================================
    */
    class AlarmEngine {
        constructor() {
            this.alarms = [];
            this.isRunning = false;
        }

        /*
        ========================================
        INIT SYSTEM
        ========================================
        */
        init() {
            console.log("[ALARM] System initialized");
            this.isRunning = true;
            this.startLoop();
        }

        /*
        ========================================
        ADD NEW ALARM
        ========================================
        */
        addAlarm(hour, minute, message = "Alarm Ringing!") {
            this.alarms.push({
                hour: Number(hour),
                minute: Number(minute),
                message: message
            });

            console.log("[ALARM] Added:", hour, minute);
        }

        /*
        ========================================
        MAIN CHECK LOOP (EVERY SECOND)
        ========================================
        */
        startLoop() {
            setInterval(() => {
                if (!this.isRunning) return;

                const now = new Date();

                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const currentSecond = now.getSeconds();

                this.alarms.forEach((alarm) => {
                    if (
                        currentHour === alarm.hour &&
                        currentMinute === alarm.minute &&
                        currentSecond === 0
                    ) {
                        this.triggerAlarm(alarm);
                    }
                });

            }, 1000);
        }

        /*
        ========================================
        TRIGGER ALARM ACTIONS
        ========================================
        */
        triggerAlarm(alarm) {
            console.log("[ALARM TRIGGERED]", alarm.message);

            // 1. Popup alert (basic fallback)
            alert(alarm.message);

            // 2. Browser notification (if allowed)
            if ("Notification" in window) {
                if (Notification.permission === "granted") {
                    new Notification("Alarm", {
                        body: alarm.message
                    });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then((perm) => {
                        if (perm === "granted") {
                            new Notification("Alarm", {
                                body: alarm.message
                            });
                        }
                    });
                }
            }

            // 3. Mobile vibration (Android Chrome support)
            if (navigator.vibrate) {
                navigator.vibrate([300, 200, 300, 200, 300]);
            }

            // 4. Sound support (future-ready hook)
            this.playSound();
        }

        /*
        ========================================
        SOUND (OPTIONAL FUTURE FEATURE)
        ========================================
        */
        playSound() {
            try {
                const audio = new Audio("alarm.mp3");
                audio.play();
            } catch (e) {
                console.log("[ALARM] Sound not available");
            }
        }

        /*
        ========================================
        STOP SYSTEM
        ========================================
        */
        stop() {
            this.isRunning = false;
        }
    }

    /*
    ========================================
    AUTO INITIALIZE
    ========================================
    */
    window.addEventListener("DOMContentLoaded", () => {
        const alarm = new AlarmEngine();
        alarm.init();

        // expose globally so app.js can use it
        window.__ALARM_ENGINE__ = alarm;
    });

})();
