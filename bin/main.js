var nrc = require('node-run-cmd');
var notifier = require('node-notifier');
var stripColorCodes = require('stripcolorcodes');
var deb = function(s){console.log(s)};
var glob = require("glob");
(function(){
	TDS = {
		failure: function(file, id, err){
//			console.log(err);
			notifier.notify({
				title:"Error in "+id+" for "+file+": ",
				message: stripColorCodes(err)
			});
		},
	};
	return TDS;
})();

function runCmd(cmd, id="build", file=""){
	nrc.run(cmd, {shell: true, verbose: true, onError: TDS.failure.bind(this, file, id)});
}
module.exports={
	runCmd: runCmd,
	glob: glob,
	deb: deb
}
