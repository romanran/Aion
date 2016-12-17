console.log("---- POSTCSS/LESS build initialized ----");
//var updateRule = require('../node_modules/postcss-sprites').updateRule;
//var cli = require('cli'), options = cli.parse();
var main = require("../bin/main.js");
var timers = [];
var stopTimer = function(file) {
	console.timeEnd( "exec time for "+file );
};

main.glob("LESS/*.less", function (er, files) {
	files.forEach(file => {
		var dest_file= file.substring( file.lastIndexOf("/")+1, file.lastIndexOf("."));
		timers.push("exec time for "+dest_file);
		console.time("exec time for "+dest_file);
		var build_less = 'lessc -sm=on --autoprefix '+file+' | postcss -c bin/postcss_opts.json | node ./bin/sprites.js | lessc "-" --clean-css > ../dist/css/'+dest_file+'.min.css';
		main.runCmd(build_less, "LESS build", dest_file, stopTimer);
	});
});

