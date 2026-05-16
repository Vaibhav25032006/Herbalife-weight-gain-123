/*
========================================
PRO CLOCK APP - TIMER ENGINE MODULE
FILE: timer.js
ROLE: Countdown timer (start, pause, reset)
========================================
*/

(function () {
    "use strict";

    /*
    ========================================
    TIMER ENGINE CLASS
    ========================================
    */
    class TimerEngine {
        constructor() {
            this.totalSeconds = 0;
            this.remainingSeconds = 0;

            this.interval = null;
            this.isRunning = false;
        }

        /*
        ========================================
        START TIMER
        ========================================
        */
        start(seconds) {
            if (!seconds || seconds <= 0) {
                console.error("[TIMER] Invalid time");
                return;
            }

            this.stop(); // reset previous timer

            this.totalSeconds = seconds;
            this.remainingSeconds = seconds;

            this.isRunning = true;

            console.log("[TIMER] Started:", seconds, "seconds");

            this.tick();
        }

        /*
        ========================================
        MAIN COUNTDOWN LOOP
        ========================================
        */
        tick() {
            this.interval = setInterval(() => {
                if (!this.isRunning) return;

                this.remainingSeconds--;

                console.log("[TIMER]", this.formatTime(this.remainingSeconds));

                // When timer finishes
                if (this.remainingSeconds <= 0) {
                    this.complete();
                }

            }, 1000);
        }

        /*
        ========================================
        PAUSE TIMER
        ========================================
        */
        pause() {
            this.isRunning = false;
            clearInterval(this.interval);

            console.log("[TIMER] Paused");
        }

        /*
        ========================================
        RESUME TIMER
        ========================================
        */
        resume() {
            if (this.remainingSeconds <= 0) return;

            this.isRunning = true;
            this.tick();

            console.log("[TIMER] Resumed");
        }

        /*
        ========================================
        STOP / RESET TIMER
        ========================================
        */
        stop() {
            clearInterval(this.interval);

            this.totalSeconds = 0;
            this.remainingSeconds = 0;
            this.isRunning = false;

            console.log("[TIMER] Reset");
        }

        /*
        ========================================
        COMPLETE ACTION
        ========================================
        */
        complete() {
            this.stop();

            console.log("[TIMER] Completed!");

            alert("Timer Finished!");

            // vibration support (Android Chrome)
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 400]);
            }

            // notification support
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Timer Completed!");
            }
        }

        /*
        ========================================
        FORMAT TIME (HH:MM:SS)
        ========================================
        */
        formatTime(sec) {
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;

            return (
                this.pad(h) + ":" +
                this.pad(m) + ":" +
                this.pad(s)
            );
        }

        /*
        ========================================
        PAD HELPER
        ========================================
        */
        pad(num) {
            return num < 10 ? "0" + num : num;
        }
    }

    /*
    ========================================
    AUTO INITIALIZE TIMER ENGINE
    ========================================
    */
    window.addEventListener("DOMContentLoaded", () => {
        const timer = new TimerEngine();

        window.__TIMER_ENGINE__ = timer;

        console.log("[TIMER] Ready");
    });

})();
