//--out /dev/stdout
require("./base.js")();
var UglifyJS = require("uglify-js");
console.log("---- TypeScript build initialized ----".red);
console.time("build time");
var stdin = process.openStdin();
var data = "";
stdin.on('data', function(chunk) { data += chunk; });
stdin.on('end', function() { 
	var result = UglifyJS.minify("temp/temp.js", {
		mangle: true,
		compress: {
			dead_code: true,
			global_defs: {
				DEBUG: false
			}
		}
	});
	fs.writeFileSync('../dist/js/all.min.js', result.code);
	var filename = "temp/temp.js";
	var tempFile = fs.openSync(filename, 'r');
	fs.closeSync(tempFile);
	fs.unlinkSync(filename);
	
	console.log("js build ✔".green);
	console.timeEnd( "build time" );
});
