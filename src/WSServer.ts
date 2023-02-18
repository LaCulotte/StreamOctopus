import WebSocket from "ws";
import { IncomingMessage } from "http";
import { Core } from "./core";

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
        this.server = new WebSocket.Server({ port: this.port }, () => {console.log(`[${this.logHeader}] Listening on port ${this.port}.`)});
        this.server.on("connection", (socket, req) => { this.onConnection(socket, req); })

        if (this.pingInterval != undefined) 
            clearInterval(this.pingInterval);

        setInterval(this.heartbeat.bind(this), 5000);
    }

    onConnection(socket : WebSocket, req : IncomingMessage) {
        console.log(`[${this.logHeader}] New app incoming.`);
        
        socket.onmessage = this.firstOnMessage.bind(this);
        socket.onclose = (event) => { console.log(`[${this.logHeader}] Connection closed before receiving first message.`); this.pendingWs.delete(socket); };
        // @ts-ignore
        socket.isAlive = true;
        socket.on("pong", this.hearbeat_pong);
    }

    firstOnMessage(messageEvent : WebSocket.MessageEvent) {
        try {
            let data = JSON.parse(messageEvent.data.toString());
            console.log(`[${this.logHeader}] Received First message : ${JSON.stringify(data)}`);
            switch(data.type) {
                case "init":
                    this.onInitData(data, messageEvent.target);
                    return;
                    break;
                default:
                    console.error(`[${this.logHeader}] First message's type was not init! Closing connection.`);
                    break;
            }
        } catch(e) {
            console.error(`[${this.logHeader}] Caught exception while reading app's first message : ${e}. Closing connection.`);
        }
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
                if(socket.isAlive === false) return socket.terminate();
                
                // @ts-ignore
                socket.isAlive = false;
                socket.ping();
            });
        }
    }

    hearbeat_pong() {
        // @ts-ignore
        this.isAlive = true;
    }

    get logHeader() {
        return `WebSocketServer`;
    }
}