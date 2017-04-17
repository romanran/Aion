require('../main/base.js')();
const util = require('util');

class Dev {
	constructor(){
		this.i = 0;
	}
	
	start() {
		this.i++;
		_.unset(this, 'Aion');
		let Aion = cleanRequire(paths.main + '/Aion');
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
					this.Aion.watcher.close();
					this.Aion.stop().then(e=>{
						this.start();
					});
					break; 
			}
		});
	}
}

new Dev().start();
