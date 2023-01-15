import { App } from "./app";
import { BroadcastChannel } from "./utils/broadcastChannel";

import { v4 } from "uuid"
import WebSocket from "ws";

export class Core {
    apps : Map<string, App> = new Map<string, App>();
    broadcastChannels : Map<string, BroadcastChannel> = new Map();

    constructor() {
    }

    addApp(data : any, sourceSocket : WebSocket) {
        if(!data.app || !data.app.type) {
            console.error(`[${this.logHeader}] First message did not contain app's type! Closing connection`);
            sourceSocket.close();
            return;
        }
    
        let appType : string = data.app.type;
        let description : string = data.app.desc || "";
        let id = v4();
        let newApp = new App(this, sourceSocket, id, appType, description, this.onAppEnd.bind(this));
        
        console.log(`[${this.logHeader}] New app is connected. Type : ${appType}; id : ${id}.`);
        this.apps.set(id, newApp);
    }
    
    onAppEnd(app: App) {
        console.log(`[${this.logHeader}] App disconnected. Type : ${app.type}; id : ${app.id}.`);
        this.apps.delete(app.id);

        let channelsToRemove: string[] = [];
        for (let channelName in this.broadcastChannels) {
            let channel = this.broadcastChannels.get(channelName);
            channel.removeApp(app.id);
            if (channel.isEmpty())
                channelsToRemove.push(channelName);            
        }

        for (let channel of channelsToRemove)
            this.broadcastChannels.delete(channel);
    }

    processCoreMessage(appId: string, message: any) {
        let app = this.getApp(appId);
        if (!app) {
            console.error(`[${this.logHeader}] Got 'core' message from unknown app of id ${appId}. Not processing message.`);
            return;
        }
        
        let content = message.content;
        if (!content || !content.type) {
            console.error(`[${this.logHeader}] Got 'core' message with invalid content (${JSON.stringify(content)}). Not processing message.`);
            return;
        }

        switch(content.type.toLowerCase()) {
            case "subscribebroadcast":
                this.subscribeToBroadcast(appId, message.id, content.channel, content.src);
                break;

            case "getapplist":
                this.returnAppList(appId, message.id);
                break;

            case "getapp":
                this.returnApp(appId, message.id, content.appId);
                break;

            case "updatedescription":
                this.updateDescription(appId, content.desc);
                break;

            default:
                console.warn(`[${this.logHeader}] Unkown 'core' message type : ${content.type}.`);
                break;
        }
    }

    subscribeToBroadcast(appId: string, msgId: string, channel: string, src: string = undefined) {
        console.log(`[${this.logHeader}] Subscribing to broadcast ${channel}`);
        try {
            if(channel === undefined)
                return;
    
            if(!this.broadcastChannels.has(channel))
                this.broadcastChannels.set(channel, new BroadcastChannel(channel, this));
    
            this.broadcastChannels.get(channel)?.subscribe(appId, src);
    
            this.sendCore(appId, msgId, {type: "subscribeBroadcastReturn", status: "OK"});
        } catch(exception) {
            console.error(`[${this.logHeader}] Could not subscribe ${appId} to ${channel} : ${exception}.`);
            this.sendCore(appId, msgId, {type: "subscribeBroadcastReturn", status: JSON.stringify(exception)});
        }
    }

    returnAppList(dstAppId: string, msgId: string) {
        let appList = [];
        for(let i of this.apps) {
            let app = this.apps.get(i[0]);

            appList.push({
                "id": app.id,
                "type": app.type,
                "desc": app.description
            });
        }

        this.sendCore(dstAppId, msgId, appList);
    }

    returnApp(dstAppId: string, msgId: string, appId: string) {
        let app = this.apps.get(appId);
        let appRet = {}
        
        if(app) {
            appRet = {
                "id": app.id,
                "type": app.type,
                "desc": app.description
            }
        }
        
        this.sendCore(dstAppId, msgId, appRet);
    }

    updateDescription(appId: string, desc : string) {
        console.log(`[${this.logHeader}] Updating description of app ${appId} : ${desc}`)

        let app = this.apps.get(appId);
        if(!app)
            return;

        app.description = desc;
    }

    sendBroadcast(srcAppId: string, channelName: string, message: any) {
        let channel = this.broadcastChannels.get(channelName);

        if(channel)
            channel.broadcastMessage(srcAppId, message);
    }

    sendDirect(srcAppId: string, message: any) {
        let dstAppId = message.dst;
        let app = this.apps.get(dstAppId);
        if(!app)
            return;
        
        let msgToSend = {
            type: "direct",
            id: message.id,
            src: srcAppId,
            content: message.content
        };

        app.send(msgToSend);
    }

    sendCore(dstAppId: string, messageId: string, content: any) {
        let app = this.apps.get(dstAppId);
        if(!app)
            return;

        if (messageId === undefined)
            messageId = v4();
        
        let msgToSend = {
            type: "core",
            id: messageId,
            content: content
        }        

        app.send(msgToSend);
    }

    getApp(appId: string) : App | undefined {
        return this.apps.get(appId)
    }

    get logHeader() {
        return `Core`;
    }
}
