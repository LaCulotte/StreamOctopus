import WebSocket from "ws";
import { Core } from "./core";

export class App {
    connection : WebSocket;
    id : string;
    type : string;
    core: Core;

    endCallback : (app: App) => any;
    
    constructor(core: Core, wsConnection: WebSocket, id : string, type: string, endCallback : (app: App) => any) {
        this.core = core;
        this.connection = wsConnection;
        this.type = type;
        this.id = id;
        this.endCallback = endCallback;

        try {            
            this.connection.onmessage = (event) => {
                console.log(`[${this.logHeader}] New message : ${event.data.toString()}`);
            };
            
            this.connection.onclose = this.onWSClose.bind(this);
            this.connection.onmessage = this.onMessage.bind(this);

            this.connection.send('{"type": "init", "data": "OK"}');
        } catch(e) {
            this.connection.send(`{"type": "init", "data": ${e}}`);
        }
    }

    onMessage(msgEvent : WebSocket.MessageEvent) {
        console.log("New message : ");
        console.log(msgEvent.data.toString());
        let message = JSON.parse(msgEvent.data.toString());

        switch(message.type.toLowerCase()) {
        case "broadcast":
            console.log(`[${this.logHeader}] Broadcasting message to ${message.channel}`);
            this.core.broadcast(this.id, message.channel, message.data);
            break;

        case "subscribe":
            console.log(`[${this.logHeader}] Subscribing to broadcast ${message.channel}`);
            this.core.subscribe(this.id, message.channel);
            break;
            
        case "sendTo":
            console.log(`[${this.logHeader}] sending message to ${message.dst}`);
            this.core.sendTo(this.id, message.dst, message.data);
            break;
            
        default:
            console.error(`[${this.logHeader}] Unknown message type received : ${message.type}`);
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