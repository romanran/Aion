require('../main/base.js')();
const nodeFlag = require('node-flag');
const Aion = require(paths.main + '/Aion');

let aion = new Aion();
let type = nodeFlag.get('build');

aion.init(function(err){
	if (err) {
		console.log(err);
	}
	this.build(type);
}.bind(aion));
