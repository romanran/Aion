require("./base.js")();

let q = new Promise((resolve, reject) => {
	fs.stat('config.json', (err, stat) => {
		if (err == null) {
			resolve();
		} else if (err.code == 'ENOENT') {
			// file does not exist
			fs.readFile('config-sample.json', 'utf8', (err, data) => {
				let data_p = JSON.parse(data);
				data_p.path = "localhost/your_project_name";
				fs.writeFile('config.json', JSON.stringify(data_p,null,2), (err)=>{
					resolve();
				});
			});
		} else {
			console.log('error: ', err.code);
			reject();
		}

	});
});

q.then((data)=>{
	const project = require("../config.json");
	const bs_conf = require("./bs-config.js");
	const stripColorCodes = require('stripcolorcodes');
	const deb = function (s) {
		console.log(s)
	};
	const bs = require("browser-sync").create();
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
		awaitWriteFinish: {
			stabilityThreshold: 50, //(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
			pollInterval: 20 // (default: 100). File size polling interval.
		}
	};
	var watcher = chokidar.watch(['bin/**', '../package.json', '../config.json'], watcher_opts);
	watcher.on('all', (e, where) => {
		beep(3);
		console.log("RESTART THE NODE".bold.red);
		process.exit();
	});
});
