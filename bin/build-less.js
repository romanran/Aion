console.log("---- POSTCSS/LESS build initialized ----");

//var cli = require('cli'), options = cli.parse();
var main = require("../bin/main.js");
var updateRule = require('postcss-sprites').updateRule;
main.glob("LESS/*.less", function (er, files) {
	files.forEach(file => {
		var dest_file= file.substring( file.lastIndexOf("/")+1, file.lastIndexOf("."));
		var build_less = 'lessc -sm=on --autoprefix --clean-css '+file+' | postcss -c bin/postcss_opts.json > ../dist/css/'+dest_file+'.css';
		main.runCmd(build_less, "LESS build");
	});
});
