//--out /dev/stdout
require("./base.js")();
var UglifyJS = require("uglify-js");
var td = require("./main.js");
console.log("   ---- TypeScript build initialized ----   ".bgCyan.black);
console.time("build time");
var stdin = process.openStdin();
var data = "";
//td.runCmd("tsc --outFile temp/temp.js --allowJs --module commonjs --pretty | exit");
var writeJS = function() {
	if(data.length > 0){
		console.log(data);
		process.exit(0);
	}
	var result = UglifyJS.minify("temp/temp.js", {
		mangle: true,
		compress: {
			dead_code: true,
			global_defs: {
				DEBUG: true
			}
		}
	});
	fs.writeFile('../dist/js/all.min.js', result.code, function(e){
		if( e !== null){
			console.log((e).red);
			if(e.syscall === 'open'){
				console.log("creating directory".yellow);
				fs.existsSync("../dist/js") || fs.mkdirSync("../dist/js");
				fs.writeFile('../dist/js/all.min.js', result.code, function(e){
					if( e === null){
						console.log("js build ✔".green);
						console.timeEnd( "build time" );
					}
				});
			}
		}else{
			console.log("js build ✔".green);
			console.timeEnd( "build time" );
		}
		var filename = "temp/temp.js";
		var tempFile = fs.openSync(filename, 'r');
		fs.closeSync(tempFile);
		fs.unlinkSync(filename);

	});
};
stdin.on('data', function(chunk) { data += chunk; });
stdin.on('end', writeJS);
