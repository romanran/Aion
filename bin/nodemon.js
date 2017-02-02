require("./base.js")();
const nodemon = require('nodemon');
nodemon({
  script: 'bin/main.js' ,
  stdout: true,
  watch: ['bin/', 'package.json', 'config.json'],
  exitcrash: 'bin/main.js'
}).on('crash', ()=> {
  nodemon.emit('restart');
});
