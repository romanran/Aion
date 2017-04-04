require("../main/base.js")();
const nodeFlag = require('node-flag');
const Aion = require(paths.main+'/Aion');

let build_tool = new Aion();
let type = nodeFlag.get('build');

build_tool.build(type);
