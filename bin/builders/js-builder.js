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
		this.files = [];
		this.watchers = [];
		this.files = [];
		
		if (!_.hasIn(this.project, 'jsFiles')) {
			this.project.jsFiles = ['main/main', 'wp-admin/wp-admin'];
		}

		for (let file of this.project.jsFiles) {
			file = path.parse(file);
			file = file.dir + '/' + file.name;
			file = `${paths.project}/src/JS/${file}.js`;
			this.files.push(file);
		}
		
		this.q = promise();
		this.loaded = this.q.resolve;
	}
	
	buildAll() {
		for (let file of this.files) {
			this.handleCompile(file);
		}
		this.handleCompile(paths.project + '/src/JSLIBS/main.js');
	}

	watchAll() {
		console.log('Caching project JS files...');
		this.ready_i = 0;
			const fileCheck = function(file, err, exists) {
			if (!exists) {
				_.pull(this.files, file);
				return 1;
			}
			this.compile(file)
				.catch(handleError)
				.then(this.watch.bind(this));
		};
		for (let file of this.files) {
			fs.pathExists(file, fileCheck.bind(this, file));
		}
		this.watchLibs();
	}
	
	watchLibs() {
		let libs_watcher = chokidar.watch(paths.project + '/src/JSLIBS/*.js', watcher_opts);
		libs_watcher.on('ready', e => {
			this.watchers.push(libs_watcher);
			console.log('Watching JSLIBS files...'.bold);
		});
		libs_watcher.on('all', (e, where) => {
			console.log('  ---- JS build initialized ----  '.bgCyan.black);
			console.log('Building libraries, it may take a while...'.cyan.bold);
			this.handleCompile(paths.project + '/src/JSLIBS/main.js').then(() => {
				this.watchLibs();
			});
			libs_watcher.close();;
		});
	}
	
	watch() {
		this.ready_i++;
		if (this.project.bs && !this.bs) {
			this.bs = require('browser-sync').get(this.project.name);
		}
		if (this.ready_i !== this.files.length) {
			return 0;
		}
		this.ready_i = 0;
		console.log('Starting JS watcher...'.cyan);
		let watcher = chokidar.watch([paths.project + '/src/JS/**/*.js'], watcher_opts);
		watcher.on('ready', e => {
			this.watchers.push(watcher);
			console.log('Watching JS files...'.bold);
			this.loaded();
		});

		watcher.on('all', (e, where) => {
			console.log('  ---- JS build initialized ----  '.bgCyan.black);
			
			console.log(e.yellow.bold + ' in ' + path.basename(where).bold + ', starting build...');
			for (let file of this.files) {
				this.handleCompile(file).then(this.watch.bind(this));
			}
			watcher.close();
			this.watchers.pop();
		});
	}

	handleCompile(file) {
		return new Promise((resolve, reject) => {
			this.compile(file)
				.then(this.saveData.bind(this))
				.catch(handleError)
				.then(resolve);
		});
	}

	compile(file) {
		const q = promise();
		let data = '';
		let filename = file.indexOf('JSLIBS') > -1 ? 'libs' : path.parse(file).name;
		console.log('Bundling files...');
		console.time(`${filename}.js`.bold);
		let bify = browserify('', {
			standalone: false,
			detectGlobals: false,
			noParse: false,
		});

		bify.add(file);

		bify.transform(babelify, {
			presets: [es2015]
		});

		const bundler = bify.bundle().on('error', err => {
			this.handleBrowserifyError(err, file);
			q.reject();
		});

		bundler.on('data', (chunk) => {
			data += chunk.toString('utf8');
		});

		bundler.on('end', () => {
			q.resolve({
				data: data,
				filename: filename
			});
		});
		return q.q;
	}

	saveData(result) {
		console.log('Minifying and saving...');
		const name = result.filename;
		let data = result.data;
		const data_min = UglifyJS.minify(_.toString(data), {
			fromString: true
		});

		const handleAfter = function (end, err) {
			if (handleError(err)) {
				return 0;
			} else if (end) {
				console.log(`${name}.js`.white + '✔'.green);
				console.timeEnd(`${name}.js`.bold);
			}
		};

		fs.writeFile(paths.project + '/dist/js/' + name + '.js', data, 'utf8', handleAfter.bind(null, true));
		fs.writeFile(paths.project + '/dist/js/' + name + '.min.js', data_min.code, 'utf8', handleAfter.bind(null, false));
	}

	handleBrowserifyError(err, file) {
		let filename = path.parse(file).name;
		if (!_.isUndefined(this.bs)) {
			this.bs.notify(`<span style="color: red">Failed running browserify ${filename}</span>`);
		}
		if (err) {
			beep(2);
			if (_.hasIn(err, 'loc')) {
				//show build error
				let err_type = 'unknown';
				if (_.hasIn(err, 'stack')) {
					err_type = err.stack.substr(0, err.stack.indexOf(': '));
				}
				console.log(err_type.red + ' in file ' + filename.bold);
				console.log('line: ' + (err.loc.line + '').bold, 'pos: ' + (err.loc.column + '').bold);
				console.log(err.codeFrame);
				notifier.notify({
					title: err_type + ' in js build for ' + file + ': ',
					message: 'LINE: ' + err.loc.line
				});
			}
		} else {
			notifier.notify({
				message: 'Error: ' + _.hasIn(err, 'message') ? err.message : err,
				title: 'Failed running browserify'
			});
		}
		
	}

}

module.exports = JsBuilder;
