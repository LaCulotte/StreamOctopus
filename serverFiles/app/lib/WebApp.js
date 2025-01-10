/**
 * @typedef {import("../../node_modules/octopus-app/src/app")} OctopusAppModule
 */

const { stat } = require("fs");

/**
 * @type {OctopusAppModule}
 */
let __octopusAppWindow__ = window;
var OctopusApp = __octopusAppWindow__.OctopusApp;

class WebOctopusApp extends OctopusApp {
    type = "WebApp";

    constructor(statusElem) {
        super();

        this.statusElem = statusElem;
    }

    onInit(message) {
        if(!super.onInit(message))
            return false;

        if(this.oninit) {
            this.oninit(message);
        }
        this.showStatus("Connected !");

        return true;
    }

    async fetchAndConnect() {
        try {
            this.showStatus(`Connecting ...`);

            let res = await fetch("/api/websocketPort", {
                method: "POST"
            })

            let port = await res.text();
            this.connect(`ws://${window.location.hostname}:${port}`);
        } catch (e) {
            this.showStatus(`Error while connecting : ${e}`);
        }
    }

    showStatus(statusText) {
        if (this.statusElem) {
            this.statusElem.innerText = statusText;
        }
    }
}

var webApp = new WebOctopusApp();
