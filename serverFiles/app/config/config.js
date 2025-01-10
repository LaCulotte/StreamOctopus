var statusElem = document.getElementById("octopus-status");
statusElem.innerText = "Initializing ...";

var webApp = new WebOctopusApp();
var appMap = {};
webApp.oninit = () => {
    statusElem.innerText = "Connected !";
    refreshAppList();
};

var editor = undefined;
var currAppId = undefined;

document.getElementById("refresh-btn").onclick = refreshAppList;
document.getElementById("edit-btn").onclick = () => {
    if (document.getElementById("app-select").value != "")
        fetchConfigSchema(document.getElementById("app-select").value);
    else
        statusElem.innerText = `Invalid selection`;
};
document.getElementById("save-btn").onclick = saveConfig;

fetch("/api/websocketPort", {
        method: "POST"
    }).then(async (res) => {
        let port = await res.text();
        console.log(port);
        webApp.connect(`ws://${window.location.hostname}:${port}`);
    });
// document.getElementById("addressInput").value = `ws://${window.location.hostname}:8000`

async function refreshAppList() {
    statusElem.innerText = "Getting app list";

    document.getElementById("refresh-btn").disabled = true;
    document.getElementById("edit-btn").disabled = true;
    try {
        let appList = (await webApp.getAppList()).content;
        appMap = {};

        let selectElem = document.getElementById("app-select");
        selectElem.innerText = "";
        for (let app of appList) {
            if(app.type != "WebApp") {
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
        statusElem.innerHTML = `Could not update app list : ${e}`;
    } finally {
        document.getElementById("refresh-btn").disabled = false;
        document.getElementById("edit-btn").disabled = false;
    }
}

async function fetchConfigSchema(appId) {
    currAppId = appId;
    document.getElementById("save-div").hidden = true;

    webApp.sendDirect(appId, {
        request: "getConfigSchema",
    }, true).then((message) => {
        if (editor !== undefined) {
            editor.destroy();
        }

        editor = new JSONEditor(document.getElementById("config-div"), {
            schema: message.content.configSchema, 
            theme: 'bootstrap4' 
        });
        
        editor.on("ready", () => {
            fetchConfig(appId);
        });
    }).catch((err) => {
        if(typeof(err) == "string")
            statusElem.innerText = `Could not get app config schema : ${err}`;
        else 
            statusElem.innerText = `Could not get app config schema : ${JSON.stringify(err)}`;
    });
}

function fetchConfig(appId) {
    webApp.sendDirect(appId, {
        request: "getConfig",
    }, true).then((message) => {
        if (editor === undefined)
            throw new Error("editor === undefined !!");

        editor.setValue(message.content.config);
        document.getElementById("save-div").hidden = false;
   }).catch((err) => {
        if(typeof(err) == "string")
            statusElem.innerText = `Could not get app config : ${err}`;
        else 
            statusElem.innerText = `Could not get app config : ${JSON.stringify(err)}`;
    });
}

function saveConfig() {
    if (currAppId === undefined || editor === undefined) {
        return;
    }

    document.getElementById("save-icon").innerText = ""; 

    console.log(editor.getValue());
    webApp.sendDirect(currAppId, {
        request: "setConfig",
        config: editor.getValue()
    }, false);
    
    setTimeout(() => {
        document.getElementById("save-icon").innerText = "✅";
    }, 300);
}

