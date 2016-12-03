console.log("---- POSTCSS/LESS build initialized ----");
var exec = require('child_process').exec;
const notifier = require('node-notifier');
var build_less = 'lessc --include-path=LESS -sm=on --autoprefix --clean-css custom.less | postcss -c=postcss_opts. > ../../dist/css/ postcss';

exec(build_less, function(error, stdout, stderr) {
	if(stdout.length){
		console.log(stdout);
		var notify = 'notify -t \"LESS build error\" -m \"'+stdout+'\" -s';
		exec(notify, function(error, stdout, stderr) {
		});
	}
});
