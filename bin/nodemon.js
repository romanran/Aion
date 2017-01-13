require("./base.js")();
const nodemon = require('nodemon');
nodemon({
  script: 'bin/main.js' ,
  stdout: true,
  watch: ['bin/', 'package.json']
});
