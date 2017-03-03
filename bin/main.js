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
		portfinder.getPort(3000, (err, port) => {
			bs_conf.proxy = project.path;
			bs_conf.port = port;
			let sad= bs.init(bs_conf);
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