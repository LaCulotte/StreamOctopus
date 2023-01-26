var appId = undefined;
var webApp = undefined;

var configTree = undefined;

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
        type: "getConfigSchema",
    }, true).then((message) => {
        if (message.content.success) {
            // document.getElementById("configArea").value = JSON.stringify(message.content.configSchema);
            configTree = new ConfigTree(message.content.configSchema);
        } else {
            document.getElementById("errorDiv").innerHTML =  `Could not get app config schema : ${message.content.reason}`;
            configTree = new ConfigTree();
        }

        fetchConfig();
    }).catch((err) => {
        if(typeof(err) == "string")
            document.getElementById("errorDiv").innerHTML =  `Could not get app config schema : ${err}`;
        else 
            document.getElementById("errorDiv").innerHTML =  `Could not get app config schema : ${JSON.stringify(err)}`;
    });
}

function fetchConfig() {
    webApp.sendDirect(appId, {
        type: "getConfig",
    }, true).then((message) => {
        if (message.content.success) {
            // document.getElementById("configArea").value = JSON.stringify(message.content.configSchema);
            configTree.fill(message.content.config);
        } else {
            document.getElementById("errorDiv").innerHTML =  `Could not get app config : ${message.content.reason}`;
        }
        document.getElementById("configDiv").innerHTML = "";
        document.getElementById("configDiv").appendChild(configTree.render());
    }).catch((err) => {
        if(typeof(err) == "string")
            document.getElementById("errorDiv").innerHTML =  `Could not get app config : ${err}`;
        else 
            document.getElementById("errorDiv").innerHTML =  `Could not get app config : ${JSON.stringify(err)}`;
    });
}

function writeConfig() {
    // console.log(configTree.getConfig());
    webApp.sendDirect(appId, {
        type: "setConfig",
        config: configTree.getConfig()
    }, false);
}

setup();