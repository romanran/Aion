/* TODO: 
 -* DONE return a promise on all of the builders, run all one after another OR
 run all of the builds in separate window (fork)
 */

class Aion {

	constructor(opts) {
		const pck = require('../../package.json');
		console.success('  ______   __                     \r\n \/      \\ |  \\                    \r\n|  $$$$$$\\ \\$$  ______   _______  \r\n| $$__| $$|  \\ \/      \\ |       \\ \r\n| $$    $$| $$|  $$$$$$\\| $$$$$$$\\\r\n| $$$$$$$$| $$| $$  | $$| $$  | $$\r\n| $$  | $$| $$| $$__\/ $$| $$  | $$\r\n| $$  | $$| $$ \\$$    $$| $$  | $$\r\n \\$$   \\$$ \\$$  \\$$$$$$  \\$$   \\$$   v' + pck.version + '\r\n                                  \r\n ');
		this.possible = ['css', 'js', 'img', 'svg', 'font'];
		this.builders = [];
		this.builders_q = [];
		this.Builders = {};
		this.opts = opts;
	}

	static checkFile(path) {
		const q = promise();
		fs.stat(path, (err, stat) => {
			if (err) {
				return q.resolve(err);
			}
			return q.resolve();
		});
		return q.q;
	}

	checkConfig() {
		const q = promise();
		Aion.checkFile(paths.project + '/src/config.json').then(err => {
			if (err) {
				if (err.code === 'ENOENT') {
					console.error('No config file!');
					const config = require('./config-prompt');
					return config().then(q.resolve);
				}
				return q.reject(err);
			}
			return q.resolve();
		});
		return q.q;
	}

	init(done) {
		const q = promise();
		const init_tasks = [
			end => {
				if (_.hasIn(this.opts, 'config')) {
					Aion.checkFile(this.opts.config).then(() =>{
						let paths = require(path.resolve(this.opts.config));
						_.forEach(paths, (o, i) => {
							global.paths[i] = path.resolve(o);
						});
						return end();
					}).catch(end);
				} else {
					end();
				}
			}, end => {
				this.loadProjectConfig().then(e => {
					this.loadDeps();
					end(null);
				}).catch(end);
			}
		];

		asynch.series(init_tasks, (err, data) => {
			if (err) {
				return !!done ? done(err) : q.reject(err);
			}
			return !!done ? done(null) : q.resolve();
		});
		return q.q;
	}

	serve() {
		const tasks = [
			done => {
				if (this.project.bs) {
					const ip = require('ip');
					const portscanner = require('portscanner');

					let spinner = new Spinner(ch_loading('Starting Browser-sync %s'));
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
					let child = exec('npm start --color --ansi', {
						cwd: this.project.path,
						maxBuffer: 1024 * 2048,
						stdio: 'inherit'
					});
					child.stdout.on('data', function (data) {
						console.log(data);
					});
					done();
				} else {
					done();
				}
			}
		];
		return new Promise((res, rej) => {
			asynch.series(tasks, (err, data) => {
				if (err) {
					return handleError(err);
				}
				res();
			});
		});
	}


	loadProjectConfig() {
		return new Promise((resolve, reject) => {
			this.checkConfig().then(() => {
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
		this.init().then(() => {
			this.bs = require('browser-sync').create(this.project.name);
			this.watch();
			this.watchSelf().q.then(this.serve.bind(this));
		}).catch(handleError);
	}

	stop() {
		console.success('--   AION stopped   --');
		_.forEach(this.builders, builder => {
			this.stopWatch.call(builder);
		});

		return new Promise((res, rej) => {
			if (this.project.bs && _.hasIn(this, 'bs.exit')) {
				this.bs.exit();
			}
			if (this.project.server) {
				res();
			} else {
				res();
			}
		});
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
		return new Promise((resolve, reject) => {
			if (_.indexOf(this.possible, type) >= 0) {
				let builder = new this.Builders[type](this.project);
				switch (type) {
					case 'css':
						builder.startLess();
						builder.build().then(resolve);
						break;
					case 'js':
						builder.buildAll().then(resolve);
						break;
					case 'img':
						builder.build().then(resolve);
						break;
					case 'svg':
						builder.buildAll().then(resolve);
						break;
					case 'font':
						builder.build().then(resolve);
						break;
				}
			} else if (_.isEmpty(type) || typeof (type) === 'object') {
				let array = this.possible;
				if (typeof (type) === 'object' && !_.isNull(type)) {
					if (type.indexOf('all') < 0) {
						array = type;
					}
				}
				const build = (i) => {
					setTimeout(() => {
						if (i === array.length) {
							return resolve();
						}
						return this.build(array[i]).then(build.bind(this, ++i));
					}, 20);
				};
				build(0);
			}
		});
	}

	watchSelf() {
		const q = promise();
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
							this.showMenu();
							break;
						case 'rs' || 'restart':
							this.stop().then(() => {
								this.start();
							});
							break;
						case 'q' || 'quit':
							this.quit();
							break;
						case 'h' || 'help':
							let color = 'cyan';
							console.log('type in the ' + ch_loading('string') + ' and hit enter:');
							console.log(ch_loading('s') + ' or ' + ch_loading('stop') + ' to stop(PAUSE) the builders from watching changes in files and show Aion menu');
							console.log(ch_loading('rs') + ' or ' + ch_loading('restart') + ' to restart builders');
							console.log(ch_loading('q') + ' or ' + ch_loading('quit') + ' to shutdown watchers and exit the process');
							console.log(ch_loading('h') + ' or ' + ch_loading('help') + ' for list of command');
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
			} else {
				this.interface.resume();
			}

			console.log(' ');
			console.success('--   AION ready   --');
			console.info('-- Type in "s" to stop(PAUSE) watching, "h" for the list of all available commands --');
			q.resolve();
		});
		return q;
	}

	showMenu() {
		const menu = require(paths.main + '/stopped-menu').bind(this);
		menu().then(answers => {
			switch (answers.choice) {
				case 'resume':
					this.start();
					break;
				case 'quit':
					this.quit();
					break;
				case 'build':
					this.build(answers.builders).then(() => {
						this.showMenu();
					});
					break;
			}
		});
	}
	
}
module.exports = Aion;
