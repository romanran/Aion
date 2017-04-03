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
		
		this.watcher = chokidar.watch(paths.project + '/src/FONTS/**/*.*', this.watcher_opts);
		this.watcher.on( 'all', this.move.bind(this) );

	}
	
	buildAll(){
		this.move();
	}
	
	move( e, where ){
		where = where.replace(/\\/g, "/");
		let dest = path.parse(where);
		if( e.indexOf('add') >= 0 || e.indexOf('change') >= 0 ){
			fs.copy(where, _.replace(dest.dir, 'src/FONTS', 'dist/fonts')+'/'+dest.base, {overwrite: true}, err =>{
				if(err){
					console.error("ERROR: ".red, err);
				}else{
					console.log(dest.base+' moved'.green);	
				}
			});
		}
	}
}
module.exports = FontBuilder;
