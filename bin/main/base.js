const colors = require('colors');
const glob = require("multi-glob").glob;
const path = require('path');
const fs = require('fs-extra');
const mkdirp = require('mkdirp');
const util = require('util');
const lodash = require('lodash');
const beep = require('beepbeep');
const chokidar = require('chokidar');
const notifier = require('node-notifier');
const asynch = require('async');

const deb = function(s) {
	console.log.apply(console, arguments);
}

const stopTimer = function (file) {
	console.timeEnd("exec time for " + file);
};
const paths = require(path.resolve('./bin/config/paths.js'));

module.exports = function () {
	this.colors = colors;
	this.glob = glob;
	this.path = path;
	this.fs = fs;
	this.asynch = asynch;
	this.beep = beep;
	this.mkdirp = mkdirp;
	this.util = util;
	this.notifier = notifier;
	this.stopTimer = stopTimer;
	this.chokidar = chokidar;
	this._ = lodash;
	this.paths = paths;
	this.deb = deb;
};
