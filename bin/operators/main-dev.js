require("../main/base.js")();

const Aion = require(paths.main+'/Aion');
let build_tool = new Aion();
build_tool.serve().then( () => {
	build_tool.watch();
});