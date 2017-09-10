require('../main/base.js')();
const nodeFlag = require('node-flag');
const Aion = require(paths.main + '/Aion');

let config_path = nodeFlag.get('config');
let project = nodeFlag.get('project');

const params = {};
if (config_path) {
	params.config = config_path;
}
if (project) {
	project = project.replace(/\"/g, "");
	params.project = project;
}

let aion = new Aion(params);
let type = nodeFlag.get('build');

aion.init(function(err){
	if (err) {
		handleError(err);
	} else {
		this.build(type).then(() =>{
			console.info(type + ' build complete');
		});
	}
}.bind(aion));