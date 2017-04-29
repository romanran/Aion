/* TODO: 
 - return a promise on all of the builders, run all one after another OR
   run all of the builds in separate window (fork)
*/

require('./base.js')();

class Aion {

	constructor() {
		deb('  ______   __                     \r\n \/      \\ |  \\                    \r\n|  $$$$$$\\ \\$$  ______   _______  \r\n| $$__| $$|  \\ \/      \\ |       \\ \r\n| $$    $$| $$|  $$$$$$\\| $$$$$$$\\\r\n| $$$$$$$$| $$| $$  | $$| $$  | $$\r\n| $$  | $$| $$| $$__\/ $$| $$  | $$\r\n| $$  | $$| $$ \\$$    $$| $$  | $$\r\n \\$$   \\$$ \\$$  \\$$$$$$  \\$$   \\$$\r\n                                  \r\n'.green.bold);
		this.possible = ['css', 'js', 'img', 'svg', 'font'];
		this.builders = [];
		this.Builders = {};

	}

	static checkConfig() {
		return new Promise((resolve, reject) => {
			fs.stat(paths.project + '/src/config.json', (err, stat) => {
				if (err) {
					if (err.code == 'ENOENT') {
						deb('No config file!'.red.bold);
						const config = require('./config');
						return config().then(resolve);
					}
					return reject(err);
				}
				return resolve();
			});
		});
	}

	serve() {
		return new Promise((res, rej) => {
			asynch.series([
				done => {
					this.loadConfig().then(e=>{
						this.loadDeps();
						return done(null);
					}).catch(err => {
						return done(err);	
					});	
				},
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
				if(err){
					return handleError(err);
			    }
				deb('-- AION task runner initiated --'.green.bold);
				res();
			});
		});
	}
	
	
	loadConfig() {
		return new Promise((resolve, reject) => {
			Aion.checkConfig().then(() =>{
				this.project = cleanRequire(paths.project + '/src/config.json');
				this.bs_conf = cleanRequire(paths.configs + '/bs-config.js');
				return resolve();
			}).catch(err => {
				return reject(err);
			});
		});
	}

	loadDeps() {
		_.forEach(this.possible, type => {
			this.Builders[type] = cleanRequire(`${paths.builders}/${type}-builder.js`);
		});
	}

	watch(type) {
		if (_.indexOf(this.possible, type) >= 0) {
			let builder = new this.Builders[type](this.project);
			builder.watchAll();
			this.builders.push(builder);
		} else if (_.isUndefined(type)) {
			_.forEach(this.possible, this.watch.bind(this));
		}
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

	stopWatch() {
		_.forEach(this.watchers, watcher => {
			watcher.close();
		});
	}

	stop() {
		_.forEach(this.builders, builder => {
			this.stopWatch.call(builder);
		});
		
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
		if (_.indexOf(this.possible, type) >= 0) {
			let builder = new this.Builders[type](this.project);
			switch (type) {
				case this.possible[0]: //js
					builder.buildAll();
					break;
				case this.possible[1]: //img
					builder.build();
					break;
				case this.possible[2]: //css
					builder.startLess().then(builder.build.bind(builder));
					break;
				case this.possible[3]: //svg
					builder.buildAll();
					break;
				case this.possible[4]: //font
					builder.build();
					break;
			}
		} else if (_.isEmpty(type) || type === 'all') {
			_.forEach(this.possible, this.build.bind(this));
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
		
		const stdin = process.stdin;
		stdin.setRawMode( true );
		stdin.resume();
		stdin.setEncoding( 'utf8' );
		stdin.on('data', (key) => {
			if (key === '\u0003') process.exit();
			if (key === 's'){
				this.emit('message', {
					message: 'Stopping the Aion...',
					event: 'stop'
				});	
			}
			if (key === 'r'){
				this.emit('message', {
					message: 'Resuming the Aion...',
					event: 'resume'
				});	
			}
		});
	}
}
module.exports = Aion;
