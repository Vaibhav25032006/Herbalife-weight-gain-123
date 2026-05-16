/*
========================================
PRO CLOCK APP - MAIN CONTROLLER
FILE: app.js
ROLE: Initialize all frontend modules
========================================
*/

(function () {
    "use strict";

    // Wait for DOM ready
    document.addEventListener("DOMContentLoaded", initApp);

    function initApp() {
        console.log("[PRO CLOCK] App initializing...");

        // Check required elements
        if (!document.getElementById("clock")) {
            console.error("Clock element missing in HTML");
            return;
        }

        // Start core modules
        startClockEngine();
        initThemeSystem();
        initAlarmSystem();
        initTimerSystem();
        initStopwatchSystem();

        console.log("[PRO CLOCK] App fully loaded");
    }

    /*
    ========================================
    CLOCK ENGINE START
    ========================================
    */
    function startClockEngine() {
        const clockEl = document.getElementById("clock");
        const dateEl = document.getElementById("date");
        const dayEl = document.getElementById("day");

        function updateClock() {
            const now = new Date();

            let h = now.getHours();
            let m = now.getMinutes();
            let s = now.getSeconds();

            // Format
            h = h < 10 ? "0" + h : h;
            m = m < 10 ? "0" + m : m;
            s = s < 10 ? "0" + s : s;

            clockEl.textContent = `${h}:${m}:${s}`;
            dateEl.textContent = now.toLocaleDateString();
            dayEl.textContent = now.toLocaleDateString("en-US", {
                weekday: "long"
            });

            // Smooth native-like update
            requestAnimationFrame(updateClock);
        }

        updateClock();
    }

    /*
    ========================================
    THEME SYSTEM
    ========================================
    */
    function initThemeSystem() {
        window.toggleTheme = function () {
            document.body.classList.toggle("dark-mode");
        };
    }

    /*
    ========================================
    ALARM SYSTEM (OFFLINE LOGIC)
    ========================================
    */
    function initAlarmSystem() {
        window.setAlarmFromInput = function () {
            const hour = document.getElementById("alarm-hour").value;
            const minute = document.getElementById("alarm-minute").value;

            if (!hour || !minute) {
                alert("Enter valid time");
                return;
            }

            setInterval(() => {
                const now = new Date();

                if (
                    now.getHours() == hour &&
                    now.getMinutes() == minute &&
                    now.getSeconds() == 0
                ) {
                    alert("ALARM RINGING!");

                    if (navigator.vibrate) {
                        navigator.vibrate([300, 100, 300]);
                    }
                }
            }, 1000);
        };
    }

    /*
    ========================================
    TIMER SYSTEM
    ========================================
    */
    function initTimerSystem() {
        window.startTimer = function (seconds) {
            let time = seconds;

            const interval = setInterval(() => {
                console.log("Timer:", time);

                time--;

                if (time < 0) {
                    clearInterval(interval);
                    alert("TIME COMPLETED");
                }
            }, 1000);
        };
    }

    /*
    ========================================
    STOPWATCH SYSTEM
    ========================================
    */
    function initStopwatchSystem() {
        let time = 0;
        let running = false;
        let interval = null;

        window.startStopwatch = function () {
            if (running) return;

            running = true;

            interval = setInterval(() => {
                time++;
                console.log("Stopwatch:", time);
            }, 1000);
        };

        window.stopStopwatch = function () {
            running = false;
            clearInterval(interval);
        };

        window.resetStopwatch = function () {
            time = 0;
            console.log("Stopwatch reset");
        };
    }

})();
