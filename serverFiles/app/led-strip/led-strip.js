var hasConfigChanged = false;
var colorPicker = new iro.ColorPicker("#color-picker", {
    // color picker options
    // Option guide: https://iro.js.org/guide.html#color-picker-options
    width: Math.max(window.innerHeight / 3, 200),
    color: "rgb(255, 0, 0)",
    borderWidth: 1,
    borderColor: "#fff",
});

document.getElementById("red-input").value = colorPicker.color.rgb.r;
document.getElementById("green-input").value = colorPicker.color.rgb.g;
document.getElementById("blue-input").value = colorPicker.color.rgb.b;

colorPicker.on('color:change', function(color) {
    document.getElementById("color-preview").style.backgroundColor = color.hexString;

    document.getElementById("red-input").value = color.rgb.r;
    document.getElementById("green-input").value = color.rgb.g;
    document.getElementById("blue-input").value = color.rgb.b;

    hasConfigChanged = true;
});

function inputChanged() {
    colorPicker.color.rgb = {
        r: document.getElementById("red-input").value,
        g: document.getElementById("green-input").value,
        b: document.getElementById("blue-input").value,
    }
    
    hasConfigChanged = true;
}

document.getElementById("red-input").addEventListener("change", inputChanged);
document.getElementById("green-input").addEventListener("change", inputChanged);
document.getElementById("blue-input").addEventListener("change", inputChanged);

document.getElementById("timer-input").addEventListener("change", () => { hasConfigChanged = true; });
document.getElementById("turn-on-input").addEventListener("change", () => { hasConfigChanged = true; });

document.getElementById("save-config").onclick = saveConfig;
document.getElementById("test-config").onclick = testAlarm;
document.getElementById("test-color").onclick = testColor;
document.getElementById("color-off").onclick = colorOff;

var statusElem = document.getElementById("octopus-status");
statusElem.innerText = "Initializing ...";

var appMap = {};
webApp.description = "Led config";
webApp.oninit = () => {
    refreshAppList();
};
webApp.fetchAndConnect();

var currAppId = undefined;
var currConfig = {};

document.getElementById("refresh-btn").onclick = refreshAppList;
document.getElementById("select-btn").onclick = () => {
    if (document.getElementById("app-select").value != "")
        fetchConfig(document.getElementById("app-select").value);
    else
        statusElem.innerText = `Invalid selection`;
};

async function refreshAppList() {
    statusElem.innerText = "Getting app list";

    document.getElementById("refresh-btn").disabled = true;
    document.getElementById("select-btn").disabled = true;
    try {
        let appList = (await webApp.getAppList()).content;
        appMap = {};

        let selectElem = document.getElementById("app-select");
        selectElem.innerText = "";
        for (let app of appList) {
            if(app.type == "led-strip") {
                let option = document.createElement("option");
                option.value = app.id;
                option.innerText = `${app.type} - `;
                if (app.desc)
                    option.innerText += app.desc;
                selectElem.appendChild(option);
            }
            
            appMap[app.id] = app;
        }

        statusElem.innerText = "App list updated";
    } catch (e) {
        statusElem.innerText = `Could not update app list : ${e}`;
    } finally {
        document.getElementById("refresh-btn").disabled = false;
        document.getElementById("select-btn").disabled = false;
    }
}

function fetchConfig(appId) {
    if (hasConfigChanged) {
        if (!confirm("Des modifications n'ont pas enregistrées et risquent d'etre perdues. Continuer ?")) 
            return;
    }

    currAppId = undefined;
    currConfig = {};
    document.getElementById("content").hidden = true;

    webApp.sendDirect(appId, {
        request: "getConfig",
    }, true).then((message) => {
        document.getElementById("content").hidden = false;
        currConfig = message.content.config;
        currAppId = appId;

        document.getElementById("red-input").value = currConfig.alarm.redMax;
        document.getElementById("green-input").value = currConfig.alarm.greenMax;
        document.getElementById("blue-input").value = currConfig.alarm.blueMax;

        document.getElementById("turn-on-input").value = currConfig.alarm.wakeupDuration;
        document.getElementById("timer-input").value = currConfig.alarm.endSleep;

        inputChanged();

        hasConfigChanged = false;
    }).catch((err) => {
        statusElem.innerText = `Could not get app config : ${err}`;
    });
}

function saveConfig() {
    currConfig.alarm.redMax = Number(document.getElementById("red-input").value);
    currConfig.alarm.greenMax = Number(document.getElementById("green-input").value);
    currConfig.alarm.blueMax = Number(document.getElementById("blue-input").value);

    currConfig.alarm.wakeupDuration = Number(document.getElementById("turn-on-input").value);
    currConfig.alarm.endSleep = Number(document.getElementById("timer-input").value);

    statusElem.innerText = "Saving ...";

    webApp.sendDirect(currAppId, {
        request: "setConfig",
        config: currConfig
    }, false);

    setTimeout(() => {
        statusElem.innerText = "Saved ✅";
    }, 300);

    hasConfigChanged = false;
}

function testAlarm() {
    if (currAppId == undefined) {
        statusElem.innerText = "Invalid device";
        return;
    }

    if (hasConfigChanged) {
        if (!confirm("Des modifications n'ont pas enregistrées. Tester quand meme ?")) 
            return;
    }

    statusElem.innerText = "Testing config ...";
    webApp.sendBroadcast("alarm", {});
}

function testColor() {
    if (currAppId == undefined) {
        statusElem.innerText = "Invalid device";
        return;
    }

    statusElem.innerText = "Testing color ...";
    webApp.sendDirect(currAppId, {
        request: "launchStatic",
        red: Number(document.getElementById("red-input").value),
        green: Number(document.getElementById("green-input").value),
        blue: Number(document.getElementById("blue-input").value),
    }, false);
}

function colorOff() {
    if (currAppId == undefined) {
        statusElem.innerText = "Invalid device";
        return;
    }

    statusElem.innerText = "Turning off...";
    webApp.sendDirect(currAppId, {
        request: "stopSequence",
    }, false);
}

window.onbeforeunload = function() {
    if (hasConfigChanged) {
        return true;
    }
}
