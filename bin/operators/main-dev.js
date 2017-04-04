require("../main/base.js")();
const Aion = require(paths.main+'/Aion');
let build_tool = new Aion();

function start(){
	build_tool.serve().then( () => {
		build_tool.watch();
	}).catch(err=>{
		deb(err);
		setTimeout(start, 2000);
	});
}
start();