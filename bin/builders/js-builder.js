const watcher_opts = require(paths.configs + '/watcher');
const asynch = require('async');
const babel = require('babel-core');
const es2015 = require('babel-preset-es2015');
const browserify = require('browserify');
const UglifyJS = require('uglify-js');
const jsmin = require('prettydiff').jspretty;

class JsBuilder {

	constructor(project) {
		this.project = project;
		//		this.prettydiff = require('prettydiff');
	}

	watchAll() {
		if(this.project.bs){
			this.bs = require('browser-sync').get(this.project.name);
		}
		let watcher = chokidar.watch(paths.project + '/src/JS/**/*.js', watcher_opts);
		watcher.on('ready', e => {
			console.log('Watching JS files...'.bold);
        });
		watcher.on('all', (e, where) => {
			console.log(e.yellow.bold + ' in ' + path.basename(where).bold + ', starting build...');
			if (where.indexOf('wp-admin') >= 0) {
				this.target_name = 'wp-admin';
				glob(['../src/JS/wp-admin/wp-admin.js', '../src/JS/wp-admin/**/*.js'], this.compileAll.bind(this));
			} else {
				this.target_name = 'all';
				glob([paths.project + '/src/JS/main/main.js', paths.project + '/src/JS/main/*.js', '!' + paths.project + '/src/JS/wp-admin/**/*.js', paths.project + '/src/JS/**/*.js'], {nosort: true}, this.compileAll.bind(this));
			}
		});

		this.watchLibs();
	}
	
	buildAll(){
		this.target_name = 'all';
		glob([paths.project + '/src/JS/main/main.js', paths.project + '/src/JS/main/*.js', '!' + paths.project + '/src/JS/wp-admin/**/*.js', paths.project + '/src/JS/**/*.js'], (err, files) => {
			this.compileAll(err, files);
			this.q.then(()=>{
				this.target_name = 'wp-admin';
				glob(['../src/JS/wp-admin/wp-admin.js', '../src/JS/wp-admin/**/*.js'], this.compileAll.bind(this));
			});
		});
		this.buildLibs();
	}

	compileAll(err, files) {
		console.time('build time');
		let promise = {
			resolve: '',
			reject: ''
		};
		let files_l = files.length;

		this.q = new Promise((resolve, reject) => {
			promise.resolve = resolve;
			promise.reject = reject;
		});
		this.file_num = 0;
		this.err_count = 0;
		this.promises = promise;
		asynch.eachOfSeries(files, this.compile.bind(this, files_l)); //compile each file

		this.data = '';
		this.data_src = '';

		this.q.then(this.saveData.bind(this)).catch(e=>{
            console.log(e);   
        }); //when all files are transpalide
	}

	compile(files_l, file, i, finish) {

		let fileRead = function () {
			this.file_num++;
			//resolve promise on the last file
			if (this.file_num === files_l && this.err_count === 0) {
				this.promises.resolve();
			} else if (this.file_num == files_l) {
				this.promises.reject();
				//if the file is last one, resolve promise which then saves data to output location
			}
			console.log('File ' + _.toString(this.file_num).bold + ' ' + path.basename(file).bold + ' ✔'.green);
		};
		//read file then pass it through babel
		asynch.parallel([(end) => {
			fs.readFile(file, 'utf8', (err, data) => {
				this.data_src += data;
				end();
			});
		}, (end) => {
			babel.transformFile(file, {
				presets: [es2015],
				babelrc: false
			}, (err, result) => {
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
						console.log(err);
					}
				} else {
					this.data += result.code;
					end();
				}
				finish();
				//tell file iterating loop that the file has been processed
			});
		}], fileRead.bind(this));
		//end callback, which checks if the file was the last one
		return true;
	}

	saveData() {
		const data_min = UglifyJS.minify(_.toString(this.data), {
			fromString: true
		});

//		let data_src_min = jsmin.api({
//			source: this.data_src,
//			lang: 'javascript',
//			mode: 'minify'
//		});

		const showError = function (e) {
			console.log((e).red);
		};

		const handleAfter = function (end, e) {
			if (e !== null) {
				showError(e);
			} else if (end) {
				console.log('js build ✔'.green);
				console.timeEnd('build time');
			}
		}
		fs.writeFile(paths.project + '/dist/js/' + this.target_name + '.js', this.data, 'utf8', handleAfter.bind(null, true));
		fs.writeFile(paths.project + '/dist/js/' + this.target_name + '.min.js', data_min.code, 'utf8', handleAfter.bind(null, false));
		//		fs.writeFile('../dist/js/all_es6.min.js', data_src_min, 'utf8', handleAfter.bind(null, false));
	}

	watchLibs() {
		let libs_watcher = chokidar.watch(paths.project + '/src/JSLIBS/*.js', watcher_opts);
		libs_watcher.on('ready', e => {
            console.log('Watching JSLIBS files...'.bold);
        });
		libs_watcher.on('all', this.buildLibs.bind(this));
	}

	buildLibs(e, where) {
		console.time('js libs build time');
		console.log('Preparing files...'.bold);
		this.libs_data = '';
		let b = browserify('', {
			standalone: 'Bundle'
		});

		b.add(paths.project + '/src/JSLIBS/main.js');
		let g;
		try {
			g = b.bundle().on('error', (e) => {
				notifier.notify({
					message: 'Error: ' + e.message,
					title: 'Failed running browserify'
				});
				console.warn(e.message.bold.red);
				if(!_.isUndefined(this.bs)){
					this.bs.notify('<span style="color: red">Failed running browserify</span>');
				}
			});
		} catch (e) {
			console.log(e);
		}
		let i = 0;

		console.log('Making JS libraries bundle...'.bold);

		g.on('data', (chunk) => {
			this.libs_data += chunk.toString('utf8');
		});
		g.on('end', this.libsFinish.bind(this));
	}

	libsFinish() {
		fs.writeFile(paths.project + '/dist/js/libs.js', _.toString(this.libs_data), 'utf8', err => {
			if(handleError(err)) return 0;
			console.log('js libraries saved ✔'.green);
		});

		console.log('Minifying compiled libraries...'.bold);
		let data_min = UglifyJS.minify(_.toString(this.libs_data), {
			fromString: true
		});
		
		fs.writeFile(paths.project + '/dist/js/libs.min.js', data_min.code, 'utf8', err => {
			if(handleError(err)) return 0;
			console.log('js minified libraries saved ✔'.green);
			console.timeEnd('js libs build time');
		});
	}

}

module.exports = JsBuilder;