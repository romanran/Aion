require("./base.js")();

const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

imagemin(['IMG/*.{jpg,png}'], '../dist/images', {
	plugins: [
		imageminMozjpeg(),
		imageminPngquant({quality: '65-80'})
	]
}).then(files => {
	let total = 0;
	for(let i in files){
		let src = "IMG/"+path.basename( files[i].path );
		let src_s = fs.statSync(src)["size"];
		let src_dest = fs.statSync(files[i].path)["size"];
		let saved = parseInt((src_s - src_dest )/ 1024);
		console.log("  "+path.basename(files[i].path)+" ✔".green +" saved: "+(saved+"kB").bold);
		total += saved;
	}
	console.log("  Sum of space saved: "+(total+"kB").bold.green);
});
