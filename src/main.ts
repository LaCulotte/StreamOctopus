import { Core } from "./core";
import yargs from "yargs";

const argv = yargs
    .option("websocket-port", {
        alias: "wp",
        description: "Octopus websocket server's port.",
        type: "number",
        default: 8000
    }).option("http-port", {
        alias: "hp",
        description: "Octopus http server's port.",
        type: "number",
        default: 80
    }).option("broadcast-port", {
        alias: "bp",
        description: "Octopus server's broadcast port to signal itself to apps.",
        type: "number",
        default: 3000
    })
    .help()
    .argv;

// @ts-ignore
let wsPort: number = argv["websocket-port"];
// @ts-ignore
let httpPort: number = argv["http-port"];
// @ts-ignore
let udpPort: number = argv["broadcast-port"];

let core = new Core(wsPort, httpPort, udpPort);
core.launch();