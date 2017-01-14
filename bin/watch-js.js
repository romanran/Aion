class watchJs {

	constructor() {
		this.babel = require("babel-core");
		this.es2015 = require("babel-preset-es2015");
		this.browserify = require('browserify');
		this.UglifyJS = require("uglify-js");
		this.async = require("async");
//		this.prettydiff = require("prettydiff");
		this.jsmin = require("../node_modules/prettydiff/lib/jspretty.js");

		this.watcher_opts = {
			ignoreInitial: true,
			ignored: '',
			awaitWriteFinish: {
				stabilityThreshold: 30, //(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
				pollInterval: 10 // (default: 100). File size polling interval.
			}
		};

		let watcher = chokidar.watch('../src/JS/**/*.js', this.watcher_opts);
		console.log("Watching JS files...".bold);
		watcher.on('all', (e, where) => {
			console.log(e.yellow.bold + " in " + path.basename(where).bold + ", starting build...");
			console.time("build time");
			this.compileAll();
		});
		this.watchLibs();
	}

	compileAll() {
		glob("../src/JS/**/*.js", (er, files) => {
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
			files.splice(files.indexOf('../src/JS/main/main.js'), 1 );
			files.splice(0, 0, '../src/JS/main/main.js');
			files.forEach(this.compile.bind(this, files_l ));//compile each file

			this.data = '';
			this.data_src = '';

			this.q.then(this.saveData.bind(this));//when all files are transpalide
		});
	}

	compile(files_l, file) {
		let end = function(){
			this.file_num++;
			//resolve promise on the last file
			if (this.file_num === files_l && this.err_count === 0) {
				this.promises.resolve();
			} else if (this.file_num == files_l) {
				this.promises.reject();
			}
		}

		this.async.parallel([ (end)=>{
			fs.readFile(file, 'utf8',  (err, data)=>{
				this.data_src += data;
				end();
			});
		}, (end)=>{
			this.babel.transformFile(file, {
				presets: [this.es2015],
				babelrc: false
			}, (err, result) => {
				if (err) {
					beep(2);
					this.err_count++;
					if (err.loc) {
						//show build error
						let err_type = err.stack.substr(0, err.stack.indexOf(': '));

						console.log((err_type).red + " in file " + (file).bold);
						console.log("line: " + (err.loc.line + "").bold, "pos: " + (err.loc.column + "").bold);
						console.log(err.codeFrame);

						notifier.notify({
							title: err_type + " in js build for " + file + ": ",
							message: "LINE: " + err.loc.line
						});

					} else {
						console.log(err);
					}
				} else {
					this.data += result.code;
					end();
				}

			});
		} ], end.bind(this) );

	}

	saveData() {
		let data_min = this.UglifyJS.minify(_.toString(this.data), {
			fromString: true
		});

		let data_src_min = this.jsmin.api({
			source: this.data_src,
			lang  : "javascript",
			mode: "minify"
		});

		let showError = function(e){
			console.log((e).red);
		}

		let handleAfter = function (end, e) {
			if (e !== null && e.syscall === 'open') {
				console.log("creating directory".yellow);
				fs.existsSync("../dist/js") || fs.mkdirSync("../dist/js");
				fs.writeFile('../dist/js/all.js', data, 'utf8', (e) => {
					if (e === null) {
						console.log("js build ✔".green);
						console.timeEnd("build time");
					}else{
						showError(e);
					}
				});
			}
			if (e !== null) {
				showError(e);
			} else if (end) {
				console.log("js build ✔".green);
				console.timeEnd("build time");
			}
		}
		fs.writeFile('../dist/js/all.js', this.data, 'utf8', handleAfter.bind(null, true));
		fs.writeFile('../dist/js/all.min.js', data_min.code, 'utf8', handleAfter.bind(null, false));
		fs.writeFile('../dist/js/all_es6.min.js', data_src_min, 'utf8', handleAfter.bind(null, false));
	}

	watchLibs() {
		let libs_watcher = chokidar.watch("../src/JSLIBS/main.js", this.watcher_opts);
		libs_watcher.on('all', (e, where) => {
			console.time("js libs build time");
			console.log("Preparing files...".bold);
			let b = this.browserify("", {
				standalone: "Bundle"
			});
			fs.copy("../src/JSLIBS/main.js", "temp/temp_libs.js", (err) => {
				if (err){
					return console.error(err);
				}

				let g = b.bundle();
				let data = '';
				let i = 0;

				console.log("Making JS libraries bundle...".bold);
				b.add("temp/temp_libs.js");

				g.on("data", (chunk) => {
					data += chunk.toString('utf8');
				});

				g.on("end", this.libsFinish);
			});
		});
	}

	libsFinish(){
		this.cleanUp();
		console.log("Minifying compiled libraries...".bold);
		let data_min = this.UglifyJS.minify(_.toString(data), {
			fromString: true
		});
		fs.writeFile('../dist/js/libs.min.js', data_min.code, 'utf8', (e) => {
			if (e !== null) {
				console.log((e).red);
			} else {
				console.log(("js libraries saved ✔").green);
				console.timeEnd("js libs build time");
			}
		});
	}

	cleanUp(){
		console.log("Cleaning up...".bold);
		let filename = "temp/temp_libs.js";
		let tempFile = fs.openSync(filename, 'r');
		fs.closeSync(tempFile);
		fs.unlinkSync(filename);
	}

}

module.exports = function () {
	this.watchJs = watchJs;
};
