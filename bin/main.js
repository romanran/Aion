require("./base.js")();
var nrc = require('node-run-cmd');
var stripColorCodes = require('stripcolorcodes');
var deb = function(s){console.log(s)};

(function(){
	TDS = {
		failure: function(file, id, err){
//			console.log(err);
			notifier.notify({
				title:"Error in "+id+" for "+file+": ",
				message: stripColorCodes(err)
			});
			beep(2);
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
	deb: deb
}
