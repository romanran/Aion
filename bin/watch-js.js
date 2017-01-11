function watchJs(){
	const babel = require("babel-core")
	, es2015 = require("babel-preset-es2015");
	const watcher_opts = {
		ignoreInitial: true,
		ignored: '',
		awaitWriteFinish:{
			stabilityThreshold: 50,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
			pollInterval:20 // (default: 100). File size polling interval.
		}
	};
	const browserify = require('browserify');
	const UglifyJS = require("uglify-js");

	function copyFile(source, target) {
		return new Promise(function(resolve, reject) {
			var rd = fs.createReadStream(source);
			rd.on('error', rejectCleanup);
			var wr = fs.createWriteStream(target);
			wr.on('error', rejectCleanup);
			function rejectCleanup(err) {
				rd.destroy();
				wr.end();
				reject(err);
			}
			wr.on('finish', resolve);
			rd.pipe(wr);
		});
	}

	let watcher = chokidar.watch('../src/JS/**/*.js', watcher_opts);
	console.log("Watching JS files...".bold);
	watcher.on('all', (e, where) => {
		console.log(where+" changed, starting build...");
		console.time("build time");

		glob("../src/JS/**/*.js", function (er, files) {
			let data = "";
			let err_count = 0;
			let q = new Promise(function(resolve, reject){
				let files_l = files.length;
				let i = 0;
				let main_i = files.indexOf('../src/JS/main/main.js');
				let main = files.splice(main_i, 1);
				files.unshift('../src/JS/main/main.js');
				files.forEach(file => {
					babel.transformFile(file, {
						presets: [es2015],
						babelrc: false
					}, (err, result) =>{
						if(err){
							beep(2);
							err_count ++;
							if(err.loc){
								let err_type = err.stack.substr(0, err.stack.indexOf(': '));
								console.log((err_type).red+" in file "+(file).bold);
	//							console.log(err.stack.substr(0, err.stack.indexOf('at')));
								console.log("line: "+(err.loc.line+"").bold, "pos: "+(err.loc.column+"").bold);
								console.log(err.codeFrame);
								notifier.notify({
									title: err_type+" in js build for "+file+": ",
									message: "LINE: "+err.loc.line
								});
							}else{
								console.log(err);
							}
						}else{
							data += result.code;
						}
						i++;
						if(i == files_l && err_count===0){
							resolve(data);
						}else if(i == files_l){
							reject();
						}
					});
				});//foreach
			});
			q.then( saveData ).catch(function(e){
//				console.warn();
			});
		});//glob
	}); //watcher

	function saveData(data){
		let data_min = UglifyJS.minify(_.toString(data), {fromString: true});
		let handleAfter = function(end, e){
			console.log(end);
			if( e !== null){
				console.log((e).red);
				if(e.syscall === 'open'){
					console.log("creating directory".yellow);
					fs.existsSync("../dist/js") || fs.mkdirSync("../dist/js");
					fs.writeFile('../dist/js/all.js', data, 'utf8', function(e){
						if( e === null){
							console.log("js build ✔".green);
							console.timeEnd( "build time" );
						}
					});
				}
			}else if(end){
				console.log("js build ✔".green);
				console.timeEnd( "build time" );
			}
		}
		fs.writeFile('../dist/js/all.js', data, 'utf8', handleAfter.bind(null, true));
		fs.writeFile('../dist/js/all.min.js', data_min.code, 'utf8', handleAfter.bind(null, false));
	}

	let libs_watcher = chokidar.watch("../src/JSLIBS/main.js", watcher_opts);
	libs_watcher.on('all', (e, where) => {
		let b = browserify();
		copyFile("../src/JSLIBS/main.js", "../temp/temp_libs.js");
		return 0;
//		fs.createReadStream("../src/JSLIBS/main.js").pipe(fs.createWriteStream("../temp/temp_libs.js"));
		b.add('../temp/temp_libs.js');

		let cleanUp = function(){
			console.log("cleanup");
			let filename = "../temp/temp_libs.js";
			let tempFile = fs.openSync(filename, 'r');
			fs.closeSync(tempFile);
			fs.unlinkSync(filename);
		}
		b.bundle().pipe(cleanUp);
	});
}
module.exports = function(){
	this.watchJs = watchJs
};
