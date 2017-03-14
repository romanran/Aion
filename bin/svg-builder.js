class SvgBuilder{

	constructor(){
		
		this.svgstore = require('svgstore');
		const svgmin = require('svgo');

		this.opts = {
			inline: true,
		};
		this.symbol_watcher_opts = {
			ignoreInitial: true,
			awaitWriteFinish:{
				stabilityThreshold: 50,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
				pollInterval:20 // (default: 100). File size polling interval.
			}
		};
		this.watcher_opts = {
			ignoreInitial: true,
			ignored: '../src/SVG/symbols/**',
			awaitWriteFinish:{
				stabilityThreshold: 50,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
				pollInterval:20 // (default: 100). File size polling interval.
			}
		};
		let svgo_conf = {plugins: [
			{removeViewBox: false},
			{removeUselessDefs: false},
			{cleanupIDs: false} ,
			{removeRasterImages: false}
		]};

		this.svgo = new svgmin( svgo_conf );
		
	}

	minify(dest, err, data){
		if(err){
			console.log("ERROR".red, err);
			return 1;
		}
		svgo.optimize(data, result => {
			if(result.error){
				console.log((result.error+'').red);
				return false;
			}
			fs.writeFile("../dist/svg/"+dest, result.data, (err) => {
			  if (err) throw err;
				console.log(dest+" file minified");
			});
		});
	}
	
	watchAll(){
		
		console.log("Watching SVG files...".bold);
		
		this.watcher = chokidar.watch('../src/SVG/*.svg', this.watcher_opts);
		this.symbols_watcher = chokidar.watch('../src/SVG/symbols/*.svg', this.symbol_watcher_opts);
		
		this.symbols_watcher.on('all', this.buildSymbols.bind(this));
		
		this.watcher.on( 'all', this.move.bind(this) );

	}
	buildSymbols( e, where ){
		where = where.replace(/\\/g, "/");
		console.log((e.toUpperCase()).bold+" in file "+(where).bold);			
		console.log("  ---- SVG SYMBOLS build initialized ----   ".bgWhite.black);

		let sprites = this.svgstore( this.opts );
		glob( "../src/SVG/symbols/*.svg", (er, files) => {
			files.forEach(file => {
				sprites.add(path.basename(file, '.svg'), fs.readFileSync(file, 'utf8'));
			});
//			fs.writeFile("../dist/svg/symbols.min.svg", sprites.toString());
			minify("symbols.min.svg", null, sprites.toString());
		} );
		
	}
	
	buildAll(){
		this.buildSymbols();
		this.move();
	}
	
	move( e, where ){
		console.log("  ---- SVG moving initialized ----   ".bgWhite.black);
		where = where.replace(/\\/g, "/");
		glob( "../src/SVG/**/*.svg", {ignore:['../src/SVG/symbols/**']}, (er, files)=> {
			files.forEach(file => {
				let dest = file.split("/").splice(3).join("/");
				mkdirp("../dist/svg/"+path.dirname(dest), err =>{
					if(err){
						console.error("ERROR: ".red, err);
					}else{
						fs.readFile(file, 'utf8', this.minify.bind(this, dest) );
					}
				});
			})
		} );
	}
}
module.exports = SvgBuilder;
