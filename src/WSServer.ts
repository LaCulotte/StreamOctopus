import WebSocket from "ws";
import { IncomingMessage } from "http";
import { Core } from "./core";
import { logger } from "./logger";

export class WebSocketServer {
    pendingWs : Set<WebSocket> = new Set<WebSocket>();

    server : WebSocket.Server | undefined;
    port : number;

    core : Core;

    pingInterval: NodeJS.Timer = undefined;

    constructor(core : Core, port: number) {
        this.core = core;
        this.port = port;
    }

    launch() {
        this.server = new WebSocket.Server({ port: this.port }, () => {logger.info(`[${this.logHeader}] Listening on port ${this.port}.`)});
        this.server.on("connection", (socket, req) => { this.onConnection(socket, req); })

        if (this.pingInterval != undefined) 
            clearInterval(this.pingInterval);

        setInterval(this.heartbeat.bind(this), 5000);
    }

    onConnection(socket : WebSocket, req : IncomingMessage) {
        logger.info(`[${this.logHeader}] New app incoming.`);
        
        socket.onmessage = this.firstOnMessage.bind(this);
        socket.onclose = (event) => { logger.info(`[${this.logHeader}] Connection closed before receiving first message.`); this.pendingWs.delete(socket); };
        // @ts-ignore
        socket.isAlive = 5;
        socket.on("pong", this.hearbeat_pong);
    }

    firstOnMessage(messageEvent : WebSocket.MessageEvent) {
        try {
            let data = JSON.parse(messageEvent.data.toString());
            logger.info(`[${this.logHeader}] Received First message : ${JSON.stringify(data)}`);
            switch(data.type) {
                case "init":
                    this.onInitData(data, messageEvent.target);
                    return;
                    break;
                default:
                    logger.error(`[${this.logHeader}] First message's type was not init! Closing connection.`);
                    break;
            }
        } catch(e) {
            logger.error(`[${this.logHeader}] Caught exception while reading app's first message : ${e}. Closing connection.`);
        }
        // This code should be in a function/directly in fail case
        messageEvent.target.close();
        this.pendingWs.delete(messageEvent.target);
    }

    onInitData(data : any, sourceSocket : WebSocket) {
        this.pendingWs.delete(sourceSocket);
        sourceSocket.onclose = null;
        sourceSocket.onmessage = null;

        this.core.addApp(data, sourceSocket);
    }

    heartbeat() {
        if(this.server != undefined) {
            this.server.clients.forEach((socket) => {
                // @ts-ignore
                if(socket.isAlive <= 0) return socket.terminate();
                
                // @ts-ignore
                socket.isAlive -= 1;
                socket.ping();
            });
        }
    }

    hearbeat_pong() {
        // @ts-ignore
        this.isAlive = 5;
    }

    get logHeader() {
        return `WebSocketServer`;
    }
}
