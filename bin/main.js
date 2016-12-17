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
		done: function(callback, file, err){
			if(typeof callback == "function"){
				callback(file);
			}
			err == 0 ? console.log("success") : console.log("failure");
		},
		log: function(data){
			console.log(data);
		}
	};
	return TDS;
})();

function runCmd(cmd, id="build", file="", callback=""){
	nrc.run(cmd, {shell: true, verbose: false, onData: TDS.log, onError: TDS.failure.bind("", file, id), onDone: TDS.done.bind("", callback, file)});
}
module.exports={
	runCmd: runCmd,
	glob: glob,
	deb: deb
}
