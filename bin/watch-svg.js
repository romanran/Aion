function watchSvg(){
	require("./base.js")();
	var svgstore = require('svgstore');
	var svgmin = require('svgo');

	let opts = {
		inline: true,
	};
	const watcher_opts = {
		ignoreInitial: true,
		awaitWriteFinish:{
			stabilityThreshold: 50,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
			pollInterval:20 // (default: 100). File size polling interval.
		}
	};
	const watcher_opts2 = {
		ignoreInitial: true,
		ignored: '../src/SVG/symbols/**',
		awaitWriteFinish:{
			stabilityThreshold: 50,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
			pollInterval:20 // (default: 100). File size polling interval.
		}
	};
	const svgo_conf = {plugins: [
		{removeViewBox: false},
		{removeUselessDefs: false},
		{cleanupIDs: false} ,
		{removeRasterImages: false}
	]};

	var svgo = new svgmin(svgo_conf);
	var sprites = svgstore(opts);
	var watcher = chokidar.watch('../src/SVG/*.svg', watcher_opts2);
	var symbols_watcher = chokidar.watch('../src/SVG/symbols/*.svg', watcher_opts);

	function minify(dest, err, data){
		if(err){
			console.log("ERROR".red, err);
			return 1;
		}
		svgo.optimize(data, function(result) {
			fs.writeFile("../dist/svg/"+dest, result.data, (err) => {
			  if (err) throw err;
				console.log(dest+" file minified");
			});
		});
	}

	console.log("Watching SVG files...".bold);
	symbols_watcher.on('all', (e, where) => {
		where = where.replace(/\\/g, "/");
		console.log((e.toUpperCase()).bold+" in file "+(where).bold);
		console.log("  ---- SVG SYMBOLS build initialized ----   ".bgWhite.black);

		glob("../src/SVG/symbols/*.svg", function (er, files) {
			files.forEach(file => {
				sprites.add(path.basename(file, '.svg'), fs.readFileSync(file, 'utf8'));
			})
//			fs.writeFile("../dist/svg/symbols.min.svg", sprites.toString());
			minify("symbols.min.svg", null, sprites.toString());
		});
	});
	watcher.on('all', (e, where) => {
		console.log("  ---- SVG moving initialized ----   ".bgWhite.black);
		where = where.replace(/\\/g, "/");
		glob("../src/SVG/**/*.svg",{ignore:['../src/SVG/symbols/**']}, function (er, files) {
			files.forEach(file => {
				let dest = file.split("/").splice(3).join("/");
				mkdirp("../dist/svg/"+path.dirname(dest),function(err){
					if(err){
						console.error("ERROR".red, err);
					}else{
						fs.readFile(file, 'utf8', minify.bind("", dest) );
					}
				});
			})
		});
	});
}
module.exports=function(){
	this.watchSvg = watchSvg;
};
