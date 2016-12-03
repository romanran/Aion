//var cli = require('cli'), options = cli.parse();
var main = require("../bin/main.js");
main.glob("LESS/*.less", function (er, files) {
	files.forEach(file => {
		var dest_file= file.substring( file.lastIndexOf("/")+1, file.lastIndexOf("."));
		var build_less = 'lessc -l '+file+'';
		main.runCmd(build_less, "LESS lint");
	});
});
