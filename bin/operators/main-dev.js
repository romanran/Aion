require('../main/base.js')();
const util = require('util');

class Dev {
	constructor() {
		this.i = 0;
	}

	init() {
		this.i++;

		_.unset(this, 'Aion');
		let Aion = cleanRequire(paths.main + '/Aion');
		this.Aion = new Aion();
		this.start();
	}
	
	start(){
		this.Aion.serve().then(this.watch.bind(this)).catch(err => {
			handleError(err);
			this.Aion.stop().then(() =>{
				setTimeout(this.init.bind(this), 5000);
			});
		});	
	}

	watch() {
		this.Aion.watch();
		this.Aion.watchSelf();
		this.Aion.emitter.on('message', obj => {
			this.Aion.interface.pause();
			console.info('\n' + obj.message.bold.yellow);
			let event = obj.event;
			switch (event) {
				case 'restart':
					this.Aion.watcher.close();
					this.Aion.stop().then(e => {
						this.start();
					}).catch(e => {
						console.error(e.message);
					});
					break;
				case 'stop':
					this.Aion.stop().then(e =>{
						const menu = require(paths.main + '/stopped-menu').bind(this.Aion);
						return menu().then(answers => {
//							deb(JSON.stringify(answers, null, '  '));
							switch(answers.choice){
								case 'resume':
									this.start();
									break;
								case 'quit':
									this.Aion.interface.close();
									this.Aion.stop().then(function(){
										process.exit();
									});
									break;
								case 'build':
									_.forEach(answers.builders, this.Aion.build.bind(this.Aion));
									this.Aion.interface.resume();
							}
						});	
					});
					break;
				case 'resume':
					this.start();
					break;
			}
		});

	}
}


new Dev().init();
