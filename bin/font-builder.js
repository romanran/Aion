class FontBuilder{

	constructor(){
		this.watcher_opts = {
			ignoreInitial: true,
			awaitWriteFinish:{
				stabilityThreshold: 50,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
				pollInterval:20 // (default: 100). File size polling interval.
			}
		};

	}

	convert(){
	
	}
	
	watchAll(){
		
		console.log("Watching FONT files...".bold);
		
		this.watcher = chokidar.watch('../src/FONTS/**/*.*', this.watcher_opts);
		this.watcher.on( 'all', this.move.bind(this) );

	}
	
	buildAll(){
		this.move();
	}
	
	move( e, where ){
		where = where.replace(/\\/g, "/");
		let dest = (where).split("/").splice(3).join("/");
		if( e.indexOf('add') >= 0 || e.indexOf('change') >= 0 ){
			fs.copy(where, "../dist/fonts/"+dest, {overwrite: true}, err =>{
				if(err){
					console.error("ERROR: ".red, err);
				}else{
					console.log(path.dirname(dest)+' moved'.green);	
				}
			});
		}
	}
}
module.exports = FontBuilder;
