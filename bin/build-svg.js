require("./base.js")();
var svgstore = require('svgstore');
let opts = {
	inline: true,
};
var sprites = svgstore(opts);
glob("SVG/symbols/*.svg", function (er, files) {
	files.forEach(file => {
		let g = sprites.add(path.basename(file, '.svg'), fs.readFileSync(file, 'utf8'));
	})
	fs.writeFileSync("../dist/svg/symbols.min.svg", sprites);
});

glob("SVG/**/*.svg",{ignore:['SVG/symbols/**']}, function (er, files) {
	files.forEach(file => {
		let dest = file.split("/").splice(1).join("/");
		mkdirp("../dist/svg/"+path.dirname(dest),function(err){
			err ? console.error(err) : fs.createReadStream(file).pipe( fs.createWriteStream( "../dist/svg/"+dest ) );
		});
	})
});
