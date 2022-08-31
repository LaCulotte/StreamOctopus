import { App } from "./app";
import WebSocket from "ws";
import { v4 } from "uuid"

export class Core {
    apps : Map<string, App> = new Map<string, App>();
    broadcastSubs : Map<string, Set<string>> = new Map<string, Set<string>>();

    constructor() {
    }

    addApp(data : any, sourceSocket : WebSocket) {
        if(!data.app || !data.app.type) {
            console.error(`[${this.logHeader}] First message did not contain app's type! Closing connection`);
            sourceSocket.close();
            return;
        }
    
        let appType : string = data.app.type;
        let id = v4();
        let newApp = new App(this, sourceSocket, id, appType, this.onAppEnd.bind(this));
        
        console.log(`[${this.logHeader}] New app is connected. Type : ${appType}; id : ${id}.`);
        this.apps.set(id, newApp);
    }
    
    onAppEnd(app: App) {
        console.log(`[${this.logHeader}] App disconnected. Type : ${app.type}; id : ${app.id}.`);
        this.apps.delete(app.id);

        let channelsToRemove: string[] = [];
        for (let channel in this.broadcastSubs) {
            let ids = this.broadcastSubs.get(channel);
            
            if(ids?.has(app.id))
                ids?.delete(app.id);
                
            if (ids?.size == 0)
                channelsToRemove.push(channel);
        }

        for (let channel of channelsToRemove)
            this.broadcastSubs.delete(channel);
    }

    subscribe(appId: string, channel: string) {
        if(!this.broadcastSubs.has(channel))
            this.broadcastSubs.set(channel, new Set<string>());

        this.broadcastSubs.get(channel)?.add(appId);
    }

    broadcast(appId: string, channel: string, message: any) {
        let ids = this.broadcastSubs.get(channel);
        if(!ids)
            return;
            
        let msgToSend = {
            type: "message",
            transport: "broadcast",
            source: appId,
            channel: channel,
            data: message
        };

        for (let id of ids) {
            if (id != appId) {
                let app = this.apps.get(id);

                app?.send(msgToSend);
            }
        }
    }

    sendTo(srcAppId: string, dstAppId: string, message: any) {
        let app = this.apps.get(dstAppId);
        if(!app)
            return;
        
        let msgToSend = {
            type: "message",
            transport: "broadcast",
            source: srcAppId,
            data: message
        };

        app?.send(msgToSend);
    }

    get logHeader() {
        return `Core`;
    }
}
