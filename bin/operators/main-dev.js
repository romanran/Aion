require('../main/base.js')();
const util = require('util');

class Dev {
	constructor(){
	}
	
	start() {
		delete require.cache[require.resolve(paths.main + '/Aion')];
		let Aion = require(paths.main + '/Aion');
		_.unset(this, 'Aion');
		this.Aion = new Aion();

		this.Aion.serve().then(this.watch.bind(this)).catch(err => {
			handleError(err);
			this.stopBS();
			setTimeout(this.start.bind(this), 5000);
		});
	}

	watch() {
		this.Aion.watchSelf();
		this.Aion.watch();
		this.Aion.emitter.on('message', obj => { 
			console.info('\n'+obj.message.bold.yellow);
			let event = obj.event;
			switch (event) {
				case 'restart':
					this.stopBS();
					this.start();
					break; 
			}
		});
	}
	
	stopBS() {
		if (_.hasIn(this.Aion, 'bs.exit')) {
			this.Aion.bs.exit();
		}
	}
}

new Dev().start();
