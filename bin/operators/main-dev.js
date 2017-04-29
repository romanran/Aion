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
			this.stop();
			setTimeout(this.init.bind(this), 5000);
		});	
	}

	watch() {
		this.Aion.watchSelf();
		this.Aion.watch();
		this.Aion.emitter.on('message', obj => {
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
					this.Aion.stop();
					break;
				case 'resume':
					this.start();
					break;
			}
		});

	}
}


new Dev().init();
