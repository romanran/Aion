var colors = require('colors');
var glob = require("glob");
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var util = require('util');
var beep = require('beepbeep');
var chokidar = require('chokidar');
var notifier = require('node-notifier');
var stopTimer = function (file) {
	console.timeEnd("exec time for " + file);
};
module.exports = function () {
	this.colors = colors;
	this.glob = glob;
	this.path = path;
	this.fs = fs;
	this.beep = beep;
	this.mkdirp = mkdirp;
	this.util = util;
	this.notifier = notifier;
	this.stopTimer = stopTimer;
	this.chokidar = chokidar;
};
