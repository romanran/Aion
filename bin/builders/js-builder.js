const watcher_opts = require(paths.configs + '/watcher');
const babel = require('babel-core');
const es2015 = require('babel-preset-es2015');
const browserify = require('browserify');
const UglifyJS = require('uglify-js'),
	babelify = require('babelify');

class JsBuilder {

	constructor(project) {
		this.project = project;
		this.files = [];
		this.watchers = [];
		this.no_libs = false;
		this.watch_i = 0;

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
		console.log('  ---- JS build initialized ----  ');
		this.done = promise();
		let promises = [];
		for (let file of this.files) {
			promises.push(this.handleCompile(file));
		}
		promises.push(this.handleCompile(paths.project + '/src/JSLIBS/main.js'));
		Promise.all(promises).then(this.done.resolve);
		return this.done.q;
	}

	watchAll() {
		console.log('Caching project JS files...');
		const file = paths.project + '/src/JSLIBS/main.js';
		fs.pathExists(file, this.watchLibs.bind(this, file));
		let promises = [];
		const fileCheck = function (file, err, exists) {
			if (!exists) {
				_.pull(this.files, file);
				return 1;
			}
			promises.push(this.compile(file));
		};

		for (let file of this.files) {
			fs.pathExists(file, fileCheck.bind(this, file));
		}
		Promise.all(promises).then(this.watch.bind(this));
	}

	watchLibs(file, err, exists) {
		if (!exists) {
			this.no_libs = true;
			return 0;	
		}
		let libs_watcher = chokidar.watch(paths.project + '/src/JSLIBS/*.js', watcher_opts);
		libs_watcher.on('ready', e => {
			this.watchers.push(libs_watcher);
			console.log('Watching JSLIBS files...');
		});
		libs_watcher.on('all', (e, where) => {
			console.log('  ---- JS build initialized ----  ');
			console.log(ch_loading('Building libraries, it may take a while...'));
			this.handleCompile(file).then(() => {
				this.watchLibs(paths.project + '/src/JSLIBS/main.js', 0, true);
				if (!!this.bs) {
					this.bs.reload();
				}
			});
			libs_watcher.close();
		});
	}

	watch() {
		if (this.project.bs && !this.bs) {
			this.bs = require('browser-sync').get(this.project.name);
		}
		let watcher = chokidar.watch([paths.project + '/src/JS/**/*.js'], watcher_opts);
		watcher.on('ready', e => {
			this.watchers.push(watcher);
			console.log(chalk.bold('Watching JS files...'));
			if (!this.watch_i) {
				this.loaded();
			}
			this.watch_i++;
		});

		let promises = [];
		
		watcher.on('all', (e, where) => {
			console.log('  ---- JS build initialized ----  ');
			console.log(chalk.yellow(e) + ' in ' + chalk.bold(path.basename(where)) + ', starting build...');
			for (let file of this.files) {
				promises.push(this.handleCompile(file));
			}
			Promise.all(promises).then(e => {
				if (!!this.bs) {
					this.bs.reload();
				}
				this.watch();
			});
			watcher.close();
			this.watchers.pop();
		});
	}

	handleCompile(file) {
		return new Promise((resolve, reject) => {
			fs.pathExists(file, (err, exists) => {
				if (!exists) {
					return resolve();
				}
				this.compile(file)
					.then(this.saveData.bind(this))
					.catch(err => {
						handleError(err);
						resolve();
					})
					.then(resolve);
			});
		}); 
	}

	compile(file) {  
		const q = promise();
		let data = '';
		let filename = file.indexOf('JSLIBS') > -1 ? 'libs' : path.parse(file).name;
		console.log(`Bundling required files for ${chalk.bold.yellowBright(filename)}...`);
		console.time(`${filename}.js`);
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
			q.resolve();
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
		const _promise = promise();
		const name = result.filename;
		let data = result.data;
		console.log(`Minifying and saving ${chalk.bold.yellowBright(name)}...`);
		const data_min = UglifyJS.minify(_.toString(data), {
			fromString: true
		});

		const handleAfter = function (end, err) {
			if (err) {
				return _promise.reject(err);
			} else if (end) {
				console.log(`${name}.js` + chalk.green('✔'));
				console.timeEnd(`${name}.js`);
				return _promise.resolve();
			}
		};

		fs.writeFile(paths.project + '/dist/js/' + name + '.js', data, 'utf8', handleAfter.bind(this, true));
		fs.writeFile(paths.project + '/dist/js/' + name + '.min.js', data_min.code, 'utf8', handleAfter.bind(this, false));
		return _promise.q;
	}

	handleBrowserifyError(err, file) {
		let filename = path.parse(file).name;
		if (!_.isUndefined(this.bs)) {
			this.bs.notify(`<span style="color: red">Failed running browserify ${filename}</span>`);
		}
		beep(2);
		if (_.hasIn(err, 'loc')) {
			//show build error
			let err_type = 'unknown';
			if (_.hasIn(err, 'stack')) {
				err_type = err.stack.substr(0, err.stack.indexOf(': '));
			}
			console.error(err_type + ' in file ' + filename);
			console.log('line: ' + chalk.bold(err.loc.line + ''), 'pos: ' + chalk.bold(err.loc.column + ''));
			console.log(err.codeFrame);
			notifier.notify({
				title: err_type + ' in js build for ' + file + ': ',
				message: 'LINE: ' + err.loc.line
			});

		} else {
			console.error('Error: ' + _.hasIn(err, 'message') ? err.message : err);
			if (file.indexOf('lib')) {
				console.info('Did you remember to do the "npm i" command inside the /src folder?');
			}
			notifier.notify({
				message: 'Error: ' + _.hasIn(err, 'message') ? err.message : err,
				title: 'Failed running browserify'
			});
		}

	}

}

module.exports = JsBuilder;
