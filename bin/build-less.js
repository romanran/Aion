console.log("---- POSTCSS/LESS build initialized ----");
var fs = require('fs');
var main = require("../bin/main.js");
var glob = require("glob");
var cli = require('cli'), options = cli.parse();
cli.enable("glob");
glob("LESS/*.less", function (er, files) {
	files.forEach(file => {
		var dest_file= file.substring( file.lastIndexOf("/")+1, file.lastIndexOf("."));
		console.log(dest_file);
		var build_less = 'lessc '+file+' ../dist/css/'+dest_file+'.css';
		main.runCmd(build_less);
//		cli.exec(build_less);
	});
});
