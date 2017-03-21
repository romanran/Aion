require("./base.js")();

class Aion {

	constructor() {
		deb('  ______   __                     \r\n \/      \\ |  \\                    \r\n|  $$$$$$\\ \\$$  ______   _______  \r\n| $$__| $$|  \\ \/      \\ |       \\ \r\n| $$    $$| $$|  $$$$$$\\| $$$$$$$\\\r\n| $$$$$$$$| $$| $$  | $$| $$  | $$\r\n| $$  | $$| $$| $$__\/ $$| $$  | $$\r\n| $$  | $$| $$ \\$$    $$| $$  | $$\r\n \\$$   \\$$ \\$$  \\$$$$$$  \\$$   \\$$\r\n                                  \r\n'.red.bold);
		deb(' ,-- AION task runner initiated --'.green.bold);
		this.possible = ['js', 'img', 'less', 'svg', 'font'];
		this.loadConfig();
		this.loadDeps();
	}

	static checkConfig(){
		return fs.stat(paths.project + '/src/config.json', (err, stat) => {
			if (err) {
				if(err.code== 'ENOENT'){
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
		return new Promise( (res, rej) => {
			if (this.project.server) {
				const nodemon = require('nodemon');
				nodemon({
					script: project.path,
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
				const portfinder = require('portfinder');
				portfinder.basePort = 3000;
				portfinder.getPort((err, port) => {
					this.bs_conf.proxy = {
						target: this.project.path
					};
					this.bs_conf.port = port;
					this.bs_conf.ui = {
						port: port + 1
					};
					bs.init(this.bs_conf);
					res();
				});
			}
		});
	}

	build(type) {
		if (_.indexOf(this.possible, type) >= 0 || _.isUndefined(type)) {
			switch (type) {
				case this.possible[0]:
					new this.JsBuilder(this.project).build();
					break;
				case this.possible[1]:
					new this.ImgBuilder(this.project).build();
					break;
				case this.possible[2]:
					new this.LessBuilder(this.project).build();
					break;
				case this.possible[3]:
					new this.SvgBuilder(this.project).build();
					break;
				case this.possible[4]:
					new this.FontBuilder(this.project).build();
					break;
				default:
					_.forEach(this.possible, this.build.bind(this));
					break;

			}
		}
	}
}
module.exports = Aion;