const project = require("../config.json");
const app = require(project.path);
const http = require("http");
const server = http.createServer(app.server);
server.listen(8000);
console.log("SERVER START".bold.green);
