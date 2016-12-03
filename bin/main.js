var nrc = require('node-run-cmd');

var deb = function(s){console.log(s)};
(function(){
	TDS = {
		done: function(data) {
		   console.log("Command done");
		},
		failure: function(err){
			console.log(err);
			runCmd("notify -m \"Error running script\" " );
			process.exit(0);
		},
	};
	return TDS;
})();
var nrc_opts = {shell: true, onError: TDS.failure, onDone: TDS.done};
function runCmd(cmd){
	console.log(cmd);
	nrc.run(cmd, nrc_opts);
}
module.exports={
	runCmd: runCmd
}
