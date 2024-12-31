const url = new URL(window.location.href);
var appId = undefined;

function setupClickEventHandler() {
    document.addEventListener("click", (event) => {
        console.log(event);
    });
}

function processAttributes(content) {
    let elem = document.getElementById(content.id);

    if(elem) {
        elem[content.attributeName] = content.value;
    }
}

function processTemp(content) {
    let elem = document.getElementById(content.id);
    
    if(elem)
        elem.innerHTML = content.innerHTML
}

function processBackendMessage(content) {
    switch(content.type) {
    case "attributes":
        processAttributes(content);
        break;
    case "childList":
    case "characterData":
        processTemp(content);
    }
}

function init() {
    webApp.onDirect = function(message) {
        if(webApp.parent_onDirect(message))
            return true;
        
        return false;
    }

    webApp.subscribeToBroadcast("SynchroWebApp-BackendChange");
    webApp.sendDirect(appId, {
        type: "init"
    }, true).then((message) => {
        document.getElementById("body").innerHTML = message.content;
        // catchEventHandlersRecurs(document.getElementById("body"));
        
        webApp.parent_onBroadcast = webApp.onBroadcast
        webApp.onBroadcast = function(message) {
            if(webApp.parent_onBroadcast(message))
                return true;
            
            switch(message.channel) {
            case "SynchroWebApp-BackendChange":
                if (message.src == appId)
                    processBackendMessage(message.content);
            }
        }

        setupClickEventHandler();
    });
}

function setupWebApp() {
    webApp.onDirect = function(message) {
        if(webApp.parent_onDirect(message))
            return true;
        
        switch(message.content.type) {
            case "SynchroWebApp-Discover-Answer":
                appId = message.src;
                document.title = message.content.desc;
                init();
                return;
        }
    }
    
    webApp.sendBroadcast("SynchroWebApp-Discover", {});
}


var webApp;
if(!webApp)
    webApp = new WebOctopusApp();

webApp.parent_onDirect = webApp.onDirect;
if(webApp.connected) {
    setupWebApp();
} else {
    // webApp.oninit = setupWebApp;
    webApp.connect(`ws://${window.location.host}:8000`);
}
