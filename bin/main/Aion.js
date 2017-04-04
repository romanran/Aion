/* TODO: 
 - return a promise on all of the builders, run all one after another OR
   run all of the builds in separate window (fork)
*/
require("./base.js")();

class Aion {

	constructor() {
		deb('  ______   __                     \r\n \/      \\ |  \\                    \r\n|  $$$$$$\\ \\$$  ______   _______  \r\n| $$__| $$|  \\ \/      \\ |       \\ \r\n| $$    $$| $$|  $$$$$$\\| $$$$$$$\\\r\n| $$$$$$$$| $$| $$  | $$| $$  | $$\r\n| $$  | $$| $$| $$__\/ $$| $$  | $$\r\n| $$  | $$| $$ \\$$    $$| $$  | $$\r\n \\$$   \\$$ \\$$  \\$$$$$$  \\$$   \\$$\r\n                                  \r\n'.red.bold);
		deb('-- AION task runner initiated --'.green.bold);
		this.possible = ['js', 'img', 'css', 'svg', 'font'];
		this.loadConfig();
		this.loadDeps();
	}

	static checkConfig() {
		return fs.stat(paths.project + '/src/config.json', (err, stat) => {
			if (err) {
				if (err.code == 'ENOENT') {
					deb('No config file!'.red.bold);
					return 1;
				}
			}
		});
	}

	loadConfig() {
		if (Aion.checkConfig()) {
			return false;
		}

		this.project = require(paths.project + "/src/config.json");
		this.bs_conf = require(paths.configs + "/bs-config.js");
	}

	loadDeps() {
		this.LessBuilder = require(paths.builders + "/less-builder.js");
		this.SvgBuilder = require(paths.builders + "/svg-builder.js");
		this.ImgBuilder = require(paths.builders + "/img-builder.js");
		this.JsBuilder = require(paths.builders + "/js-builder.js");
		this.FontBuilder = require(paths.builders + "/font-builder.js");
	}

	watch(type) {
		if (_.indexOf(this.possible, type) >= 0 || _.isUndefined(type)) {
			switch (type) {
				case this.possible[0]:
					new this.JsBuilder(this.project).watchAll();
					break;
				case this.possible[1]:
					new this.ImgBuilder(this.project).watchAll();
					break;
				case this.possible[2]:
					new this.LessBuilder(this.project).watchAll();
					break;
				case this.possible[3]:
					new this.SvgBuilder(this.project).watchAll();
					break;
				case this.possible[4]:
					new this.FontBuilder(this.project).watchAll();
					break;
				default:
					_.forEach(this.possible, this.watch.bind(this));
					break;
			}
		}
	}

	serve() {
		return new Promise((res, rej) => {
			if (this.project.server) {
				const nodemon = require('nodemon');
				nodemon({
					script: this.project.path,
					stdout: true,
					watch: [paths.project + '/app/**/*.*', paths.project + '/app/server.js'],
					exitcrash: 'main.js'
				}).on('crash', () => {
					nodemon.emit('restart');
				});
				res();
			}

			if (this.project.bs) {
				const bs = require("browser-sync").create(this.project.name);
				const ip = require('ip');
				const portscanner = require('portscanner');
 
				let spinner = new Spinner('Starting Browser-sync %s'.cyan.bold);
				spinner.setSpinnerString(18);
				spinner.start();
				
				let this_ip = ip.address();
				portscanner.findAPortNotInUse(3000, 3100, this_ip,(err, port) => {
					this.bs_conf.proxy = {
						target: this.project.path,
						ws: true
					};
					this.bs_conf.host = this_ip;
					this.bs_conf.port = port;
					let bs_process = bs.init(this.bs_conf);
					bs_process.emitter.on("init", ()=>{
						deb('');
						spinner.stop(true);
						res();
					});
				});
			}
		});
	}

	build(type) {
		if (_.indexOf(this.possible, type) >= 0 || _.isUndefined(type) || type === 'all') {
			let builder = {};
			switch (type) {
				case this.possible[0]:
//					new this.JsBuilder(this.project).build();
					builder = new this.JsBuilder(this.project);
					builder.buildAll();
					break;
				case this.possible[1]:
					builder = new this.ImgBuilder(this.project);
					builder.build();
					break;
				case this.possible[2]:
					builder = new this.LessBuilder(this.project);
					builder.startLess().then(builder.build.bind(builder));
					break;
				case this.possible[3]:
					builder = new this.SvgBuilder(this.project);
					builder.buildAll();
					break;
				case this.possible[4]:
					builder = new this.FontBuilder(this.project);
					builder.build();
					break;
				default:
					_.forEach(this.possible, this.build.bind(this));
					break;
			}
			
		}
	}
}
module.exports = Aion;
