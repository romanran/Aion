const chalk = require('chalk');
const glob = require('multi-glob').glob;
const path = require('path');
const fs = require('fs-extra');
const util = require('util');
const _ = require('lodash');
const beep = require('beepbeep');
const chokidar = require('chokidar');
const notifier = require('node-notifier');
const asynch = require('async');
const Spinner = require('cli-spinner').Spinner;


const deb = function (s) {
	console.log.apply(console, arguments);
};

console.info = function() {
	arguments = _.map(arguments, arg => {
		return chalk.bold.cyan(arg);
	});
	console.log.apply(console, arguments);
};

console.error = function() {
	arguments = _.map(arguments, arg => {
		return chalk.bold.red(arg);
	});
	console.log.apply(console, arguments);
};

console.success = function() {
	arguments = _.map(arguments, arg => {
		return chalk.bold.green(arg);
	});
	console.log.apply(console, arguments);
};

ch_loading = chalk.cyan.bold;

const stopTimer = function (file) {
	console.timeEnd('exec time for ' + file);
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
	console.error(err);
	return 1;
};

const promise = function(){
	let resolve, reject;
	let q = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return {q: q, resolve: resolve, reject: reject};
};

const cleanRequire = function (path){
	delete require.cache[require.resolve(path)];
	return require(path);
};

module.exports = function () {
	this.chalk = chalk;
	this.glob = glob;
	this.path = path;
	this.fs = fs;
	this.asynch = asynch;
	this.beep = beep;
	this.util = util;
	this.notifier = notifier;
	this.chokidar = chokidar;
	this._ = _;
	this.paths = paths;
	this.deb = deb;
	this.promise = promise;
	this.handleError = handleError;
	this.Spinner = Spinner;
	this.cleanRequire = cleanRequire;
};
