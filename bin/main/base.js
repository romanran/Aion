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

const colors =  {
	css: '#4ec6ff',
	js: '#F39C11',
	img: '#00E11A',
	svg: '#564bff',
	font: '#ff4b64'
};

const deb = function (s) {
	console.log.apply(console, arguments);
};

console.info = function() {
	const args = _.map(arguments, arg => {
		return chalk.bold.cyan(arg);
	});
	console.log.apply(console, args);
};

console.error = function() {
	const args = _.map(arguments, arg => {
		return chalk.bold.red(arg);
	});
	console.log.apply(console, args);
};

console.success = function() {
	const args = _.map(arguments, arg => {
		return chalk.bold.green(arg);
	});
	console.log.apply(console, args);
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
	this.colors = colors;
	this.deb = deb;
	this.promise = promise;
	this.handleError = handleError;
	this.Spinner = Spinner;
	this.cleanRequire = cleanRequire;
};
