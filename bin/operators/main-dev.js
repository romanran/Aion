require("../main/base.js")();
const Aion = require(paths.main+'/Aion');
let build_tool = new Aion();

function start(){
	build_tool.serve().then( () => {
		build_tool.watch();
		build_tool.eventHandler();
	}).catch(err=>{
		handleError(err);
		if(_.hasIn(build_tool, 'bs.exit')){
			build_tool.bs.exit();
		}
		setTimeout(start, 2000);
	});
}
start();