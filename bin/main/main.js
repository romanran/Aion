require("./base.js")();

function checkConfig() {
	fs.stat(paths.project + '/src/config.json', (err, stat) => {
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
q.catch((err) => {
	setTimeout(checkConfig, 200);
});

q.then((data) => {
	const project = require(paths.project + "/src/config.json");
	const bs_conf = require(paths.configs + "/bs-config.js");
	const stripColorCodes = require('stripcolorcodes');
	const portfinder = require('portfinder');
	portfinder.basePort = 3000;
	const deb = function (s) {
		console.log(s)
	};
	const bs = require("browser-sync").create(project.name);
	if (project.server) {
		const nodemon = require('nodemon');
		nodemon({
			script: project.path,
			stdout: true,
			watch: [paths.project + '/app/**/*.*', paths.project + '/app/server.js'],
			exitcrash: 'main.js'
		}).on('crash', () => {
			nodemon.emit('restart');
		});
	}
	if (project.bs) {
		portfinder.getPort((err, port) => {
			bs_conf.proxy = {
				target: project.path
			};
			bs_conf.port = port;
			bs_conf.ui = {
				port: port + 1
			};
			bs.init(bs_conf);
		});
	}
	new Aion(project).watch();

});
class Aion {
	constructor(project) {
		this.project = project;
		this.LessBuilder = require(paths.builders + "/less-builder.js");
		this.SvgBuilder = require(paths.builders + "/svg-builder.js");
		this.ImgBuilder = require(paths.builders + "/img-builder.js");
		this.JsBuilder = require(paths.builders + "/js-builder.js");
		this.FontBuilder = require(paths.builders + "/font-builder.js");
	}

	watch() {
		//if watch all, else switch or something
		new this.JsBuilder(this.project).watchAll();
		new this.ImgBuilder(this.project).watchAll();
		new this.LessBuilder(this.project).watchAll();
		new this.SvgBuilder(this.project).watchAll();
		new this.FontBuilder(this.project).watchAll();
	}

	build() {
		new this.JsBuilder(this.project).build();
		new this.ImgBuilder(this.project).build();
		new this.LessBuilder(this.project).build();
		new this.SvgBuilder(this.project).build();
		new this.FontBuilder(this.project).build();
	}
}
