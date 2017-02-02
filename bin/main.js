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
	if( project.path.indexOf("localhost") >= 0){
		bs_conf.proxy = project.path;
		bs.init(bs_conf);
	}else{
		const nodemon = require('nodemon');
		nodemon({
			script: 'bin/appserver.js',
			stdout: true,
			watch: ['../app/**/*.*', '../../app/server.js'],
			exitcrash: 'bin/main.js'
		}).on('crash', ()=> {
			nodemon.emit('restart');
		});
		bs_conf.proxy = "localhost:8000";
		bs.init(bs_conf);
	}

	require("./watch-less.js")();
	require("./watch-svg.js")();
	require("./watch-img.js")();
	require("./watch-js.js")();
	watchSvg();
	watchLess();
	watchImg();
	new watchJs();

});
