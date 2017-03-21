require("./base.js")();
const nodemon = require('nodemon');
const nodeFlags = require('node-flag');

nodeFlags.validFlags(['test', 't']);

nodeFlags.assign({
	t: 'test',
});

let testing = nodeFlags.isset('test') || nodeFlags.isset('t');

console.log(testing);

nodemon({
	script: paths.main+'/main.js',
	stdout: true,
	watch: [paths.base, '*.json', paths.project+'/src/config.json'],
	exitcrash: 'main.js',
	test: testing
}).on('crash', () => {
	nodemon.emit('restart');
});