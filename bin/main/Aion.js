/* TODO: 
 - return a promise on all of the builders, run all one after another OR
   run all of the builds in separate window (fork)
*/
require('./base.js')();

class Aion {

	constructor() {
		deb('  ______   __                     \r\n \/      \\ |  \\                    \r\n|  $$$$$$\\ \\$$  ______   _______  \r\n| $$__| $$|  \\ \/      \\ |       \\ \r\n| $$    $$| $$|  $$$$$$\\| $$$$$$$\\\r\n| $$$$$$$$| $$| $$  | $$| $$  | $$\r\n| $$  | $$| $$| $$__\/ $$| $$  | $$\r\n| $$  | $$| $$ \\$$    $$| $$  | $$\r\n \\$$   \\$$ \\$$  \\$$$$$$  \\$$   \\$$\r\n                                  \r\n'.green.bold);
		this.possible = ['js', 'img', 'css', 'svg', 'font'];
		this.loadConfig();
		this.loadDeps();
		deb('-- AION task runner initiated --'.green.bold);
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

		this.project = cleanRequire(paths.project + '/src/config.json');
		this.bs_conf = cleanRequire(paths.configs + '/bs-config.js');
	}

	loadDeps() {
		this.LessBuilder = cleanRequire(paths.builders + '/less-builder.js');
		this.SvgBuilder = cleanRequire(paths.builders + '/svg-builder.js');
		this.ImgBuilder = cleanRequire(paths.builders + '/img-builder.js');
		this.JsBuilder = cleanRequire(paths.builders + '/js-builder.js');
		this.FontBuilder = cleanRequire(paths.builders + '/font-builder.js');
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
			asynch.series([
				done => {
					if (this.project.bs) {
						this.bs = require('browser-sync').create(this.project.name);
						const ip = require('ip');
						const portscanner = require('portscanner');

						let spinner = new Spinner('Starting Browser-sync %s'.cyan.bold);
						spinner.setSpinnerString(18);
						spinner.start();

						let this_ip = ip.address();
						portscanner.findAPortNotInUse(3000, 3100, this_ip, (err, port) => {
							this.bs_conf.proxy = {
								target: this.project.proxy,
								ws: true
							};
							this.bs_conf.host = this_ip;
							this.bs_conf.port = port;
							this.bs_process = this.bs.init(this.bs_conf);
							this.bs_process.emitter.on('init', () => {
								deb('');
								spinner.stop(true);
								done();
							});
						});
					} else {
						done();
					}
				},
				done => {
					if (this.project.server) {
						const nodemon = require('nodemon');
						this.nodemon = nodemon({
							script: this.project.script,
							stdout: true,
							cwd: this.project.path
						});
						this.nodemon.on('start', () => {
							done();
						});
						this.nodemon.on('crash', () => {
							this.nodemon.emit('restart');
						});
					} else {
						done();
					}
				}
			], (err, data) => {
				res();
			});
		});
	}

	toggleBS() {
		if (this.project.bs) {
			if (this.bs.paused) {
				this.bs.resume();
			} else {
				this.bs.pause();
			}
		}
	}
	stop() {
		let q = new Promise((res, rej) => {
			if (this.project.bs && _.hasIn(this, 'bs.exit')) {
				this.bs.exit();
			}
			if (this.project.server) {
				this.nodemon.emit('quit');
				this.nodemon.once('exit', () => {
					res();
				});
			} else {
				res();
			}
		});
		return q;
	}

	build(type) {
		if (_.indexOf(this.possible, type) >= 0 || _.isEmpty(type) || type === 'all') {
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

	emit(event, data) {
		this.emitter.emit(event, data);
	}

	watchSelf() {
		const events = cleanRequire('events');
		_.unset(this, ['emitter', 'watcher']);
		this.emitter = new events.EventEmitter();
		this.watcher = chokidar.watch(['**/*.js', 'package.json', paths.project + 'src/config.js'], {
			cwd: paths.base,
			ignoreInitial: true
		});
		this.watcher.on('all', e => {
			this.emit('message', {
				message: 'Change in the Aion, restarting...',
				event: 'restart'
			});
		});
	}
}
module.exports = Aion;
