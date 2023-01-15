import { Core } from "./core";

import WebSocket from "ws";

export class App {
    connection : WebSocket;
    id : string;
    description: string;
    type : string;
    core: Core;

    endCallback : (app: App) => any;
    
    constructor(core: Core, wsConnection: WebSocket, id : string, type: string, description: string, endCallback : (app: App) => any) {
        this.core = core;
        this.connection = wsConnection;
        
        this.id = id;
        this.type = type;
        this.description = description;

        this.endCallback = endCallback;

        try {            
            // this.connection.onmessage = (event) => {
            //     console.log(`[${this.logHeader}] New message : ${event.data.toString()}`);
            // };
            
            this.connection.onclose = this.onWSClose.bind(this);
            this.connection.onmessage = this.onMessage.bind(this);

            this.connection.send('{"type": "init", "data": "OK"}');
        } catch(e) {
            this.connection.send(`{"type": "init", "data": ${e}}`);
        }
    }

    onMessage(msgEvent : WebSocket.MessageEvent) {
        try {
            console.log("New message : ");
            console.log(msgEvent.data.toString());
            let message = JSON.parse(msgEvent.data.toString());

            // TODO : Check for id

            switch(message.type.toLowerCase()) {
            case "core":
                this.core.processCoreMessage(this.id, message);
                break;
                
            case "broadcast":
                console.log(`[${this.logHeader}] Broadcasting message to ${message.channel}`);
                this.core.sendBroadcast(this.id, message.channel, message);
                break;

            // case "pipeline":
            //     console.log(`[${this.logHeader}] Broadcasting message to ${message.channel}`);
            //     this.core.broadcast(this.id, message.channel, message);
            //     break;

            // case "pipelineReturn":
            //     console.log(`[${this.logHeader}] Broadcasting message to ${message.channel}`);
            //     this.core.broadcast(this.id, message.channel, message);
            //     break;

            case "direct":
                console.log(`[${this.logHeader}] sending message to ${message.dst}`);
                this.core.sendDirect(this.id, message);
                break;
                
            default:
                console.error(`[${this.logHeader}] Unknown message type received : ${message.type}`);
                break;
            }
        } catch (exception) {
            console.log(`[${this.logHeader}] Caught exception while reading incoming message : ${exception}. Incoming message : ${msgEvent.data.toString()}`);
        }
    }

    onWSClose(closeEvent: WebSocket.CloseEvent) {
        console.log(`[${this.logHeader}] WebSocket closed. Code : ${closeEvent.code}; Reason : ${closeEvent.reason}.`);
        this.endCallback(this);
    }

    send(data: any) {
        this.connection.send(JSON.stringify(data));
    }

    get logHeader() {
        return `App ${this.type}`;
    }
}