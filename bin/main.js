require("./base.js")();
var project = require("../config.json");
var bs_conf = require("./bs-config.js");
var stripColorCodes = require('stripcolorcodes');
var deb = function(s){console.log(s)};
var bs = require("browser-sync").create();
bs_conf.proxy = project.path;
bs.init(bs_conf);

require("./watch-less.js")();
require("./watch-svg.js")();
require("./watch-img.js")();
require("./watch-js.js")();
watchSvg();
watchLess();
watchImg();
watchJs();

const watcher_opts = {
		ignoreInitial: true,
		ignored: '',
		awaitWriteFinish:{
			stabilityThreshold: 50,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
			pollInterval:20 // (default: 100). File size polling interval.
		}
	};
var watcher = chokidar.watch(['bin/*.*', '../package.json', '../config.json'], watcher_opts);
watcher.on('all', (e, where) => {
	beep(3);
	console.log("RESTART THE NODE".bold.red);
	process.exit();
});
