var appId = undefined;
var webApp = undefined;

// var configTree = undefined;
var editor = undefined;

function setup() {
    const url = new URL(window.location.href);
    appId = url.searchParams.get("appId");

    let configAreaElem = document.getElementById("configArea");

    if(!appId) {
        configAreaElem.value = "Error : No id in query string"
        return;
    }
    
    document.getElementById("appId").innerHTML = appId;

    const octopusUrl = window.localStorage.getItem("octopusAddress");
    
    if(!octopusUrl) {
        configAreaElem.value = "Error : octopusAddress is not set in local storage => Cannot connect to StreamOctopus";
        return;
    }

    webApp = new WebOctopusApp();
    webApp.oninit = fetchConfigSchema;
    webApp.connect(octopusUrl);
}

function fetchConfigSchema() {
    webApp.sendCore({
        type: "getapp",
        appId: appId
    }, true).then((message) => {
        let app = message.content;
        if (app == {}) {
            document.getElementById("appType").innerHTML = "ERROR";
            console.error("Could not get app infos");
        } else {
            document.getElementById("appType").innerHTML = app.type;
            document.getElementById("appDesc").innerHTML = app.desc;
        }
    });

    webApp.sendDirect(appId, {
        request: "getConfigSchema",
    }, true).then((message) => {
        // document.getElementById("configArea").value = JSON.stringify(message.content.configSchema);
        // configTree = new ConfigTree(message.content.configSchema);
        editor = new JSONEditor(document.getElementById("configDiv"), {  schema: message.content.configSchema, theme: 'bootstrap4' });
        editor.on("ready", () => {
            fetchConfig();
        });
    }).catch((err) => {
        if(typeof(err) == "string")
            document.getElementById("errorDiv").innerHTML =  `Could not get app config schema : ${err}`;
        else 
            document.getElementById("errorDiv").innerHTML =  `Could not get app config schema : ${JSON.stringify(err)}`;
    });
}

function fetchConfig() {
    webApp.sendDirect(appId, {
        request: "getConfig",
    }, true).then((message) => {
            // document.getElementById("configArea").value = JSON.stringify(message.content.configSchema);
        // configTree.fill(message.content.config);
        // document.getElementById("configDiv").appendChild(configTree.render());
        editor.setValue(message.content.config);
    }).catch((err) => {
        if(typeof(err) == "string")
            document.getElementById("errorDiv").innerHTML =  `Could not get app config : ${err}`;
        else 
            document.getElementById("errorDiv").innerHTML =  `Could not get app config : ${JSON.stringify(err)}`;
    });
}

function writeConfig() {
    console.log(editor.getValue());
    webApp.sendDirect(appId, {
        request: "setConfig",
        config: editor.getValue()
    }, false);
}

setup();
