require("./base.js")();

function checkConfig(){
	fs.stat('../src/config.json', (err, stat) => {
		if (err == null) {
			res();
		} else if (err.code == 'ENOENT') {
			rej();
		}
	});
}
let res, rej;
let q = new Promise((resolve, reject) => {
	checkConfig();
	res = resolve;
	rej = reject;
});
q.catch((err)=>{
	setTimeout(checkConfig, 200);
});

q.then((data) => {
	const project = require("../../src/config.json");
	const bs_conf = require("./bs-config.js");
	const stripColorCodes = require('stripcolorcodes');
	const portfinder = require('portfinder');
    portfinder.basePort = 3000;
	const deb = function (s) {
		console.log(s)
	};
	const bs = require("browser-sync").create(project.name);
	if(project.server){
		const nodemon = require('nodemon');
		nodemon({
			script: project.path,
			stdout: true,
			watch: ['../app/**/*.*', '../../app/server.js'],
			exitcrash: 'bin/main.js'
		}).on('crash', () => {
			nodemon.emit('restart');
		});
	}
	if (project.bs) {
		portfinder.getPort((err, port) => {
			bs_conf.proxy = {target: project.path, ws: true};
			bs_conf.port = port;
			bs_conf.ui={port : port+1};
			bs.init(bs_conf);
		});
	}

	require("./watch-less.js")();
	require("./watch-svg.js")();
	require("./watch-img.js")();
	require("./watch-js.js")();
	watchSvg(project);
	watchLess(project);
	watchImg(project);
	new watchJs(project);

});