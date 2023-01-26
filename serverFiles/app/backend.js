var webApp;
if(!webApp) {
    webApp = new WebOctopusApp();
    webApp.connect("ws://localhost:8000");
}

webApp.parent_onInit = webApp.onInit;
webApp.onInit = function(message) {
    if(!webApp.parent_onInit(message))
        return false;

    webApp.subscribeToBroadcast("SynchroWebApp-Discover");
    return true;
}

var idMap = {};
var currentId = 0;

document.old_getElementById = document.getElementById
document.getElementById = function(elementId) {
    if(idMap[elementId])
        return document.old_getElementById(idMap[elementId]);
    
    return document.old_getElementById(elementId);
};

function changeId(elem) {
    if(!(elem instanceof Element))
    return;

    let newId = `$__${currentId++}`;
    if(elem.id.length > 0) {
        idMap[elem.id] = newId;
    }

    elem.id = newId;
}

function changeIdsRecus(elem) {
    changeId(elem);

    for(let child of elem.children) {
        changeIdsRecus(child);    
    }
}
changeIdsRecus(document.documentElement);

var mutationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        console.log(mutation);

        switch (mutation.type) {
        case "attributes":
            if (mutation.attributeName == "id") {
                // If an id is changed by an external source
                if(! /^\$__/g.test(mutation.target.id)) {
                    // In case if id changes are stacked one after the other
                    if(idMap[mutation.oldValue]) {
                        let internId = idMap[mutation.oldValue];
                        delete idMap[mutation.oldValue];
                        idMap[mutation.target.id] = internId;
                        mutation.target.id = internId;
                    } else {
                        for (let externId in idMap) {
                            if(idMap[externId] == mutation.oldValue) {
                                delete idMap[externId];
                                idMap[mutation.target.id] = mutation.oldValue;
                                mutation.target.id = mutation.oldValue;
                            }
                        }
                    }
                }
            } else {
                // Add appid to broadcast channel ?
                webApp.sendBroadcast("SynchroWebApp-BackendChange", {
                    "type": mutation.type,
                    "id": mutation.target.id,
                    "attributeName": mutation.attributeName,
                    "value": mutation.target[mutation.attributeName]
                });
            }
            break;
        case "childList":
            // send target id and new nodes whole text and placement and removed nodes placement
            for (let added of mutation.addedNodes) {
                changeId(added);
            }

            webApp.sendBroadcast("SynchroWebApp-BackendChange", {
                "type": mutation.type,
                "id": mutation.target.id,
                "innerHTML": mutation.target.innerHTML
                // "attributeName": mutation.attributeName,
                // "value": mutation.target[mutation.attributeName]
            });
            break;

        case "characterData":
            // TODO : get parent id and previous sibling (if one); client side => if sibling : get next sibling else get parent's first elem => if CharacterData => change text
            webApp.sendBroadcast("SynchroWebApp-BackendChange", {
                "type": mutation.type,
                "id": mutation.target.parentNode.id,
                "innerHTML": mutation.target.parentNode.innerHTML
                // "attributeName": mutation.attributeName,
                // "value": mutation.target[mutation.attributeName]
            });
            break;
        }
    });
});

mutationObserver.observe(document.documentElement, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true
});

webApp.parent_onDirect = webApp.onDirect;
webApp.onDirect = function(message) {
    if(webApp.parent_onDirect(message))
        return true;

    switch(message.content.type.toLowerCase()) {
    case "init":
        this.sendDirect(message.src, document.getElementsByTagName("body")[0].innerHTML, false, message.id);
        return;
    }
}

webApp.parent_onBroadcast = webApp.onBroadcast;
webApp.onBroadcast = function(message) {
    // if(this.s super.onBroadcast(message))
    //     return;
    if(this.parent_onBroadcast(message))
        return true;

    switch(message.channel) {
    case "SynchroWebApp-Discover":
        this.sendDirect(message.src, {
            type: "SynchroWebApp-Discover-Answer",
            desc: "SALUT :)"
        });
        return;
    }
}