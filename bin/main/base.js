const colors = require('colors');
const glob = require("multi-glob").glob;
const path = require('path');
const fs = require('fs-extra');
const util = require('util');
const lodash = require('lodash');
const beep = require('beepbeep');
const chokidar = require('chokidar');
const notifier = require('node-notifier');
const asynch = require('async');
const Spinner = require('cli-spinner').Spinner;

const deb = function (s) {
	console.log.apply(console, arguments);
}

const stopTimer = function (file) {
	console.timeEnd("exec time for " + file);
};
const paths = require(path.resolve('./bin/config/paths.js'));

const handleError = function (err) {
	if(!err){
		return 0;
	}
	if (_.hasIn(err, 'message')) {
		err = err.message;
	}
	err = _.toString(err);
	console.log(err.bold.red);
	return 1;
}

const cleanRequire = function (path){
	delete require.cache[require.resolve(path)];
	return require(path);
}


module.exports = function () {
	this.colors = colors;
	this.glob = glob;
	this.path = path;
	this.fs = fs;
	this.asynch = asynch;
	this.beep = beep;
	this.util = util;
	this.notifier = notifier;
	this.stopTimer = stopTimer;
	this.chokidar = chokidar;
	this._ = lodash;
	this.paths = paths;
	this.deb = deb;
	this.handleError = handleError;
	this.Spinner = Spinner;
	this.cleanRequire = cleanRequire;
};
