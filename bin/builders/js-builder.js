const watcher_opts = require(paths.configs + '/watcher');
const asynch = require('async');
const babel = require('babel-core');
const es2015 = require('babel-preset-es2015');
const browserify = require('browserify');
const UglifyJS = require('uglify-js'),
	  babelify = require("babelify");

class JsBuilder {

	constructor(project) {
		this.project = project;
		this.watchers = [];
	}

	watchAll() {
		if (this.project.bs) {
			this.bs = require('browser-sync').get(this.project.name);
		}

		let watcher = chokidar.watch(paths.project + '/src/JS/**/*.js', watcher_opts);
		watcher.on('ready', e => {
			this.watchers.push(watcher);
			console.log('Watching JS files...'.bold);
		});

		watcher.on('all', (e, where) => {
			console.log(e.yellow.bold + ' in ' + path.basename(where).bold + ', starting build...');
			if (where.indexOf('wp-admin') >= 0) {
				this.compile(paths.project + '/src/JS/wp-admin/wp-admin.js');
			} else {
				this.compile(paths.project + '/src/JS/main/main.js');
			}
		});

		this.watchLibs();
	}

	buildAll() {
		this.compile(paths.project + '/src/JS/main/main.js');
		this.compile(paths.project + '/src/JS/wp-admin/wp-admin.js');
		this.buildLibs();
	}

	compile(file) {
		console.time('build time');
		console.log('Preparing files...'.bold);
		let data = '';
		let filename = path.parse(file).name;
		let bify = browserify('', {
			//			standalone: 'Bundle',
			detectGlobals: false,
		});

		bify.add(paths.project + '/src/JS/main/main.js');

		bify.transform(babelify, {presets: [es2015]});
		
		const bundler = bify.bundle().on('error', (err) => {
			if (err) {
				beep(2);
				if (_.hasIn(err, 'loc')) {
					//show build error
					let err_type = 'unknown';
					if(_.hasIn(err, 'stack')) {
						err_type = err.stack.substr(0, err.stack.indexOf(': '));
					}
					console.log((err_type).red + ' in file ' + (file).bold);
					console.log('line: ' + (err.loc.line + '').bold, 'pos: ' + (err.loc.column + '').bold);
					console.log(err.codeFrame);
					notifier.notify({
						title: err_type + ' in js build for ' + file + ': ',
						message: 'LINE: ' + err.loc.line
					});
				} else {
					handleError(err);
				}
			}
		
			notifier.notify({
				message: 'Error: ' + _.hasIn(err, 'message') ? err.message : err,
				title: 'Failed running browserify'
			});
			if (!_.isUndefined(this.bs)) {
				this.bs.notify('<span style="color: red">Failed running browserify</span>');
			}
		});

		bundler.on('data', (chunk) => {
			data += chunk.toString('utf8');
		});

		bundler.on('end', () =>{
			this.saveData(data, filename);
		});

	}

	saveData(result, name) {
		let data = result;
		const data_min = UglifyJS.minify(_.toString(data), {
			fromString: true
		});

		const handleAfter = function (end, err) {
			if (handleError(err)) {
				return 0;
			} else if (end) {
				console.log('js build ✔'.green);
				console.timeEnd('build time');
			}
		};

		fs.writeFile(paths.project + '/dist/js/' + name + '.js', data, 'utf8', handleAfter.bind(null, true));
		fs.writeFile(paths.project + '/dist/js/' + name + '.min.js', data_min.code, 'utf8', handleAfter.bind(null, false));
		//		fs.writeFile('../dist/js/all_es6.min.js', data_src_min, 'utf8', handleAfter.bind(null, false));
	}

	watchLibs() {
		let libs_watcher = chokidar.watch(paths.project + '/src/JSLIBS/*.js', watcher_opts);
		libs_watcher.on('ready', e => {
			this.watchers.push(libs_watcher);
			console.log('Watching JSLIBS files...'.bold);
		});
		libs_watcher.on('all', this.buildLibs.bind(this));
	}

	handleBrowserifyError(err){
		notifier.notify({
			message: 'Error: ' + _.hasIn(err, 'message') ? err.message : err,
			title: 'Failed running browserify'
		});
		if (!_.isUndefined(this.bs)) {
			this.bs.notify('<span style="color: red">Failed running browserify</span>');
		}
		return handleError(err);
	}

	buildLibs(e, where) {
		console.time('js libs build time');
		console.log('Preparing files...'.bold);
		this.libs_data = '';
		let bify = browserify('', {
			standalone: 'Bundle',
			noParse: false,
			detectGlobals: false
		});

		bify.add(paths.project + '/src/JSLIBS/main.js');
		const bundler = bify.bundle().on('error', this.handleBrowserifyError);
		console.log('Making JS libraries bundle...'.bold);
		bundler.on('data', (chunk) => {
			this.libs_data += chunk.toString('utf8');
		});
		bundler.on('end', this.libsFinish.bind(this));
	}

	libsFinish() {
		fs.writeFile(paths.project + '/dist/js/libs.js', _.toString(this.libs_data), 'utf8', err => {
			if (handleError(err)) return 0;
			console.log('js libraries saved ✔'.green);
		});

		console.log('Minifying compiled libraries...'.bold);
		let data_min = UglifyJS.minify(_.toString(this.libs_data), {
			fromString: true
		});

		fs.writeFile(paths.project + '/dist/js/libs.min.js', data_min.code, 'utf8', err => {
			if (handleError(err)) return 0;
			console.log('js minified libraries saved ✔'.green);
			console.timeEnd('js libs build time');
		});
	}

}

module.exports = JsBuilder;
