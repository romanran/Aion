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
						const exec = require('child_process').exec;
						exec('npm start', {cwd: this.project.path},(error, stdout, stderr) => {
							done(error);
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
			if(_.findIndex(this.project.builders, type) >= 0){
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
		if(_.isUndefined(this.interface)){
			const readline = require('readline');
			this.interface = readline.createInterface({
			  input: process.stdin,
			  output: process.stdout,
			  terminal: true
			});
		}

		Promise.all(this.builders_q).then(e => {
			console.log(' ');
			console.log('--   AION ready   --'.green.bold);
			console.log('-- Type in "s" or "stop" to stop the Aion --  '.bold.yellow);
			if(this.interface){
			   this.interface.resume();
		    }
			this.interface.once('line', (line) => {
				switch (line){
					case 's' || 'stop':
						this.emit('message', {
							message: 'Stopping the Aion...',
							event: 'stop'
						});	
					break;
					case 'rs' || 'restart':
						this.emit('message', {
							message: 'Restarting...',
							event: 'restart'
						});	
					break;
				}
			});
		});
	}
}
module.exports = Aion;
