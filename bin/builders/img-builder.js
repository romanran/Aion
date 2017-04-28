const watcher_opts = require(paths.configs + '/watcher');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

class ImgBuilder{
	
	constructor(){
	}
	
	watchAll(){
		let watcher = chokidar.watch( paths.project + '/src/IMG/*.{jpg,jpeg,png}', watcher_opts);
		watcher.on('ready', e => {
            console.log('Watching IMAGE files...'.bold);
		    this.watchers = [watcher];
        });
		watcher.on('all', this.build.bind(this));
	}
	
	build(e, where){
		console.log('  ---- IMAGES build initialized ----   '.bgBlue.bold);
		imagemin([ paths.project +'/src/IMG/*.{jpg,jpeg,png}'], '../dist/images', {
			plugins: [
				imageminMozjpeg(),
				imageminPngquant({quality: '65-80'})
			]
		}).then(files => {
			let total = 0;
			for(let i =0, l = files.length; i < l; i++){
				let src = paths.project + '/src/IMG/'+path.basename( files[i].path );
				let src_s = fs.statSync(src)['size'];
				let src_dest = fs.statSync(files[i].path)['size'];
				let saved = parseInt((src_s - src_dest )/ 1024);
				console.log('  '+path.basename(files[i].path)+' ✔'.green +' saved: '+(saved+'kB').bold);
				total += saved;
			}
			console.log('  Sum of space saved: '+(total+'kB').bold.green);
		});	
	}
}

module.exports = ImgBuilder;
