require('../main/base.js')();
const nodeFlag = require('node-flag');
const Aion = require(paths.main + '/Aion');

let config_path = nodeFlag.get('config');
const params = {};
if (config_path) {
	params.config = config_path;
}

let aion = new Aion(params);
let type = nodeFlag.get('build');

aion.init(function(err){
	if (err) {
		handleError(err);
	} else {
		this.build(type);
	}
}.bind(aion));
