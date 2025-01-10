import { Core } from "./core";
import { logger } from "./logger";

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
            //     logger.info(`[${this.logHeader}] New message : ${event.data.toString()}`);
            // };
            
            this.connection.onclose = this.onWSClose.bind(this);
            this.connection.onmessage = this.onMessage.bind(this);

            this.connection.send('{"type": "init", "data": "OK"}');
        } catch(e) {
            this.connection.send(`{"type": "init", "data": ${e}}`);
            this.connection.close();
        }
    }

    onMessage(msgEvent : WebSocket.MessageEvent) {
        try {
            logger.info(`New message : ${msgEvent.data.toString()}`);
            let message = JSON.parse(msgEvent.data.toString());

            // TODO : Check for id

            switch(message.type.toLowerCase()) {
            case "core":
                this.core.processCoreMessage(this.id, message);
                break;
                
            case "broadcast":
                logger.info(`[${this.logHeader}] Broadcasting message to ${message.channel}`);
                this.core.sendBroadcast(this.id, message.channel, message);
                break;

            // case "pipeline":
            //     logger.info(`[${this.logHeader}] Broadcasting message to ${message.channel}`);
            //     this.core.broadcast(this.id, message.channel, message);
            //     break;

            // case "pipelineReturn":
            //     logger.info(`[${this.logHeader}] Broadcasting message to ${message.channel}`);
            //     this.core.broadcast(this.id, message.channel, message);
            //     break;

            case "direct":
                logger.info(`[${this.logHeader}] sending message to ${message.dst}`);
                this.core.sendDirect(this.id, message);
                break;
                
            default:
                logger.error(`[${this.logHeader}] Unknown message type received : ${message.type}`);
                break;
            }
        } catch (exception) {
            logger.info(`[${this.logHeader}] Caught exception while reading incoming message : ${exception}. Incoming message : ${msgEvent.data.toString()}`);
        }
    }

    onWSClose(closeEvent: WebSocket.CloseEvent) {
        logger.info(`[${this.logHeader}] WebSocket closed. Code : ${closeEvent.code}; Reason : ${closeEvent.reason}.`);
        this.endCallback(this);
    }

    send(data: any) {
        this.connection.send(JSON.stringify(data));
    }

    get logHeader() {
        return `App ${this.type}`;
    }
}
