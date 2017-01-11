let colors = require('colors');
let glob = require("glob");
let path = require('path');
let fs = require('fs');
let mkdirp = require('mkdirp');
let util = require('util');
let lodash = require('lodash');
let beep = require('beepbeep');
let chokidar = require('chokidar');
let notifier = require('node-notifier');
let prompt = require('prompt');
let stopTimer = function (file) {
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
	this._ = lodash;
};
