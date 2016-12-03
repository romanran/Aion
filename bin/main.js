var hello = require("./hello.js");

if(process.env.npm_config_greet){
	hello.greet(process.env.npm_config_greet);
}
