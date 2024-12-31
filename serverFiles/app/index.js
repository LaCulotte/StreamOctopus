/**
 * @typedef {import("./WebApp")} WebOctopusApp
 */

var webApp = new WebOctopusApp(undefined);

document.getElementById("addressInput").value = `ws://${window.location.hostname}:8000`

function connect() {
    webApp.oninit = () => {
        window.localStorage.setItem("octopusAddress", webApp.url);
        refreshAppList();
        document.getElementById("refreshButton").hidden = false;
    }

    webApp.connect(document.getElementById("addressInput").value); 
}

function createLink(url, params, text) {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `<a href="${encodeURI(url)}?${queryString}">${text}</a>`;
}

async function refreshAppList() {
    document.getElementById("refreshButton").hidden = true;
    try {
        let appList = (await webApp.getAppList()).content;
        let appListElem = document.getElementById("appList");
        appListElem.innerHTML = "";
        for (let app of appList) {
            let li = document.createElement("li");
            appListElem.appendChild(li);
            li.innerHTML = app.type + " - ID: " + app.id + " - " + app.desc + " - " + createLink("/ui/config/config.html", {appId: app.id}, "Config") + "saluyt";
        }
    } finally {
        document.getElementById("refreshButton").hidden = false;
    }
}
