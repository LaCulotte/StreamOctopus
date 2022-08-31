import { Core } from "./core";
import { WebSocketServer } from "./WSServer";
import yargs from "yargs";

const argv = yargs
    .option("port", {
        alias: "p",
        description: "Octopus server's port.",
        type: "number",
        default: 8000
    })
    .help()
    .argv;

// @ts-ignore
let port: number = argv.port;

let core = new Core();
let test = new WebSocketServer(core, port);
test.launch();