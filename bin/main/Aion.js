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
		this.builders_q = [];
		this.Builders = {};
	}

	static checkConfig() {
		return new Promise((resolve, reject) => {
			fs.stat(paths.project + '/src/config.json', (err, stat) => {
				if (err) {
					if (err.code == 'ENOENT') {
						deb('No config file!'.red.bold);
						const config = require('./config-prompt');
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
					this.loadConfig().then(e => {
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
						const exec = require('child_process').exec;
						exec('npm start', {
							cwd: this.project.path
						}, (error, stdout, stderr) => {
//							done(error);
						});
                        done();
					} else {
						done();
					}
				}
			], (err, data) => {
				if (err) {
					return handleError(err);
				}
				deb('-- AION task runner initiated --'.green.bold);
				res();
			});
		});
	}


	loadConfig() {
		return new Promise((resolve, reject) => {
			Aion.checkConfig().then(() => {
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
			if (_.findIndex(this.project.builders, type) >= 0) {
				let builder = new this.Builders[type](this.project);
				builder.watchAll();
				this.builders.push(builder);
				this.builders_q.push(builder.q);
			}
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

	start() {
		this.serve().then(() => {
			this.watch();
			this.watchSelf();
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
                res();
			} else {
				res();
			}
		});
		return q;
	}

	quit() {
		if (this.interface) {
			this.interface.close();
		}
		this.stop().then(function () {
			process.exit();
		});
	}

	build(type) {
		if (_.indexOf(this.possible, type) >= 0) {
			let builder = new this.Builders[type](this.project);
			switch (type) {
				case 'css':
					builder.startLess();
					builder.build();
					break;
				case 'js':
					builder.buildAll();
					break;
				case 'img':
					builder.build();
					break;
				case 'svg':
					builder.buildAll();
					break;
				case 'font':
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

		Promise.all(this.builders_q).then(e => {
			let ready = true;
			if (_.isUndefined(this.interface)) {
				const readline = require('readline');
				this.interface = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
					terminal: false
				});

				this.interface.on('line', _.debounce((line) => {
					if (!ready) {
						return 0;
					}
					this.interface.pause();
					switch (_.toLower(line)) {
						case 's' || 'stop':
                            this.stop();
							const menu = require(paths.main + '/stopped-menu').bind(this);
							menu().then(answers => {
								//							deb(JSON.stringify(answers, null, '  '));
								switch (answers.choice) {
									case 'resume':
										this.start();
										this.interface.resume();
										break;
									case 'quit':
										this.quit();
										break;
									case 'build':
										_.forEach(answers.builders, this.build.bind(this));
										this.interface.resume();
										break;
								}
							});
							break;
						case 'rs' || 'restart':
							this.stop().then(() => {
								this.serve().then(() => {
									this.watch();
									this.watchSelf();
								});
							});
							break;
						case 'q' || 'quit':
							this.quit();
							break;
						case 'h' || 'help':
							let color = 'cyan';
							console.log('type in the ' + 'string' [color] + ' and hit enter:');
							console.log('s' [color] + ' or ' + 'stop' [color] + ' to stop the builders from watching changes in files and show Aion menu');
							console.log('rs' [color] + ' or ' + 'restart' [color] + ' to restart builders');
							console.log('q' [color] + ' or ' + 'quit' [color] + ' to shutdown watchers and exit the process');
							console.log('h' [color] + ' or ' + 'help' [color] + ' for list of command');
							this.interface.resume();
							break;
						default:
							console.log('Type in "h" or "help" and hit enter for the list of available commands');
							this.interface.resume();
					}
				}, 100));
				this.interface.on('pause', () => {
					ready = false;
				});
				this.interface.on('resume', () => {
					ready = true;
				});
			}
			
			console.log(' ');
			console.log('--   AION ready   --'.green.bold);
			console.log('-- Type in "s" to stop, "h" for list of commands --'.bold.yellow);

		});
	}
}
module.exports = Aion;
