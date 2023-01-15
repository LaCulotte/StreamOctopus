import { App } from "../app";
import { Core } from "../core";

export class BroadcastChannel {
    subscriptions: Map<String, Set<string>> = new Map();
    channelName: string;
    core: Core;
    
    constructor(channelName: string, core: Core) {
        this.channelName = channelName;
        this.subscriptions.set("any", new Set());
        this.core = core;
    }

    subscribe(appId: string, src: string = undefined) {
        if(src === undefined) {
            this.subscriptions.get("any").add(appId);
        } else {
            let sub = this.subscriptions.get(src);
            if (sub === undefined)
                this.subscriptions.set(src, sub = new Set());
            
            sub.add(appId);
        }
    }

    broadcastMessage(srcAppId: string, message: any) {
        let appAlreadySent = new Set();
        let anySubs = this.subscriptions.get("any");

        let msgToSend = {
            type: "broadcast",
            id: message.id,
            src: srcAppId,
            channel: this.channelName,
            content: message.content
        };

        for(let appId of anySubs) {
            if(!appAlreadySent.has(appId)) {
                let app = this.core.getApp(appId);
                if(app)
                    app.send(msgToSend);

                appAlreadySent.add(appId);
            }
        }
        
        let srcSubs = this.subscriptions.get(srcAppId);
        if (srcSubs === undefined) 
            return;

        for(let appId of anySubs) {
            if(!appAlreadySent.has(appId)) {
                let app = this.core.getApp(appId);
                if(app)
                    app.send(msgToSend);
                // Technically useless but keep in in case of further implementations
                appAlreadySent.add(appId);
            }
        }
    }

    removeApp(appId: string) {
        let subNamesToDel = [];

        for (let subName in this.subscriptions) {
            let sub = this.subscriptions.get(subName);

            sub.delete(appId);
            if(sub.size == 0 && subName != "any")
                subNamesToDel.push(subName);
        }

        for(let subName of subNamesToDel)
            this.subscriptions.delete(subName);
    }

    isEmpty() : boolean {
        if (!this.subscriptions.has("any"))
            return true;
        
        for(let apps of this.subscriptions.values()) {
            if (apps.size > 0)
                return false;
        }

        return true;
    }
}