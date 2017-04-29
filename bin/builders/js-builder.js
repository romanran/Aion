const watcher_opts = require(paths.configs + '/watcher');
const asynch = require('async');
const babel = require('babel-core');
const es2015 = require('babel-preset-es2015');
const browserify = require('browserify');
const UglifyJS = require('uglify-js'),
	  babelify = require('babelify');
const inq = require('inquirer');

class JsBuilder {

	constructor(project) {
		this.project = project;
		this.watchers = [];
	}
	
	watchMain(){
		if (this.project.bs) {
			this.bs = require('browser-sync').get(this.project.name);
		}
		console.log('Starting JS watcher...'.cyan);
		let watcher = chokidar.watch(paths.project + '/src/JS/**/*.js', watcher_opts);
		watcher.on('ready', e => {
			this.watchers.push(watcher);
			console.log('Watching JS files...'.bold);
		});

		watcher.on('all', (e, where) => {
			console.log(e.yellow.bold + ' in ' + path.basename(where).bold + ', starting build...');
			if (where.indexOf('wp-admin') >= 0) {
				this.handleCompile(paths.project + '/src/JS/wp-admin/wp-admin.js');
			} else {
				this.handleCompile(paths.project + '/src/JS/main/main.js');
			}
			watcher.close();
		});
	}
	
	handleCompile(file){
		console.log('  ---- JS build initialized ----  '.bgCyan.black);
		this.compile(file)
			.then(this.saveData.bind(this))
			.catch(err=>{
				this.watchMain();
				handleError(err);
			});
	}
	
	watchAll() {
		console.log('Caching project JS files...');
		this.compile(paths.project + '/src/JS/main/main.js')
			.then(() => {
				this.watchMain();
			})
			.catch(err=>{
				handleError(err);
				this.watchMain();
			});
		this.watchLibs();
	}

	buildAll() {
		this.handleCompile(paths.project + '/src/JS/main/main.js');
		this.buildLibs();
	}

	compile(file) {
		const q = promise();
		console.time('build time');
		let data = '';
		let filename = path.parse(file).name;
		let bify = browserify('', {
			standalone: false,
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
					q.reject(err);
				} else {
					q.reject(err);
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
			q.resolve({data: data, filename: filename});
		});
		return q.q;
	}

	saveData(result) {
		const name = result.filename;
		let data = result.data;
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
		this.watchMain();
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
		this.libs_data = '';
		let bify = browserify('', {
			standalone: false,
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
