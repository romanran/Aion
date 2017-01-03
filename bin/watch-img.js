function watchImg(){
	require("./base.js")();

	const imagemin = require('imagemin');
	const imageminMozjpeg = require('imagemin-mozjpeg');
	const imageminPngquant = require('imagemin-pngquant');

	const watcher_opts = {
		ignoreInitial: true,
		awaitWriteFinish:{
			stabilityThreshold: 50,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
			pollInterval:20 // (default: 100). File size polling interval.
		}
	};
	var watcher = chokidar.watch('../src/IMG/*.svg', watcher_opts);
	console.log("Watching IMAGE files...".bold);
	watcher.on('all', (e, where) => {
		console.log("  ---- IMAGES build initialized ----   ".bgOrane.black);
		imagemin(['../src/IMG/*.{jpg,png}'], '../dist/images', {
			plugins: [
				imageminMozjpeg(),
				imageminPngquant({quality: '65-80'})
			]
		}).then(files => {
			let total = 0;
			for(let i in files){
				let src = "../src/IMG/"+path.basename( files[i].path );
				let src_s = fs.statSync(src)["size"];
				let src_dest = fs.statSync(files[i].path)["size"];
				let saved = parseInt((src_s - src_dest )/ 1024);
				console.log("  "+path.basename(files[i].path)+" ✔".green +" saved: "+(saved+"kB").bold);
				total += saved;
			}
			console.log("  Sum of space saved: "+(total+"kB").bold.green);
		});
	});
}
module.exports = function(){
	this.watchImg = watchImg;
};
