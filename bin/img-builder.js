class ImgBuilder{
	constructor(){
		this.imagemin = require('imagemin');
		this.imageminMozjpeg = require('imagemin-mozjpeg');
		this.imageminPngquant = require('imagemin-pngquant');
		this.watcher_opts = {
			ignoreInitial: true,
			awaitWriteFinish:{
				stabilityThreshold: 50,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
				pollInterval:20 // (default: 100). File size polling interval.
			}
		};
	}
	watchAll(){
		let watcher = chokidar.watch('../src/IMG/*.{jpg,jpeg,png}', this.watcher_opts);
		console.log("Watching IMAGE files...".bold);
		watcher.on('all', this.build.bind(this));
	}
	
	build(e, where){
		console.log("  ---- IMAGES build initialized ----   ".bgBlue.bold);
		this.imagemin(['../src/IMG/*.{jpg,jpeg,png}'], '../dist/images', {
			plugins: [
				this.imageminMozjpeg(),
				this.imageminPngquant({quality: '65-80'})
			]
		}).then(files => {
			let total = 0;
			for(let i =0, l = files.length; i < l; i++){
				let src = "../src/IMG/"+path.basename( files[i].path );
				let src_s = fs.statSync(src)["size"];
				let src_dest = fs.statSync(files[i].path)["size"];
				let saved = parseInt((src_s - src_dest )/ 1024);
				console.log("  "+path.basename(files[i].path)+" ✔".green +" saved: "+(saved+"kB").bold);
				total += saved;
			}
			console.log("  Sum of space saved: "+(total+"kB").bold.green);
		});	
	}
}
module.exports = ImgBuilder;
