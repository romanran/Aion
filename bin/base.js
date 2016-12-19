var colors = require('colors');
var glob = require("glob");
var path = require('path');
var fs 	= require('fs');
var beep = require('beepbeep');
var notifier = require('node-notifier');
var stopTimer = function(file) {
	console.timeEnd( "exec time for "+file );
};
module.exports=function(){
	this.colors= colors;
	this.glob= glob;
	this.path= path;
	this.fs= fs;
	this.beep= beep;
	this.notifier= notifier;
	this.stopTimer= stopTimer;
};
