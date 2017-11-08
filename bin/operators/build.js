require('../main/base.js')();
const nodeFlag = require('node-flag');
const Aion = require(paths.main + '/Aion');

let config_path = nodeFlag.get('config');
let project = nodeFlag.get('project');

const params = {};
if (config_path) {
	params.config = config_path;
}
// if (process.argv[2]) {
// 	project = process.argv[2].replace(/\"/g, "");
// 	params.project = project;
// 	global.paths.project = path.resolve(project);
// }

let aion = new Aion(params);
let type = nodeFlag.get('build');

aion.loadDeps();
aion.project = {};
aion.build(type).then(() =>{
	console.info(type + ' build complete');
});
