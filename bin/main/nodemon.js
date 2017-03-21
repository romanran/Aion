require("./base.js")();
const nodemon = require('nodemon');

nodemon({
	script: paths.operators+'/main-dev',
	stdout: true,
	watch: [paths.base, '*.json', paths.project+'/src/config.json'],
	exitcrash: paths.operators+'/main-dev'
}).on('crash', () => {
	nodemon.emit('restart');
});