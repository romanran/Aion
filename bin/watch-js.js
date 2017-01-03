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
	var watcher = chokidar.watch('../src/JS/**/*.js', watcher_opts);
	console.log("Watching JS files...".bold);
	watcher.on('all', (e, where) => {
		console.time("build time");
		glob("../src/JS/**/*.js", function (er, files) {
			let data = "";
			let err_count = 0;
			let q = new Promise(function(resolve, reject){
				let files_l = files.length;
				let i = 0;
				files.forEach(file => {
					babel.transformFile(file, {
						presets: [es2015],
						babelrc: false
					}, (err, result) =>{
						if(err){
							beep(2);
							err_count ++;
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
		fs.writeFile('../dist/js/all.min.js', data, function(e){
			if( e !== null){
				console.log((e).red);
				if(e.syscall === 'open'){
					console.log("creating directory".yellow);
					fs.existsSync("../dist/js") || fs.mkdirSync("../dist/js");
					fs.writeFile('../dist/js/all.min.js', data, function(e){
						if( e === null){
							console.log("js build ✔".green);
							console.timeEnd( "build time" );
						}
					});
				}
			}else{
				console.log("js build ✔".green);
				console.timeEnd( "build time" );
			}
		});
	}
}
module.exports = function(){
	this.watchJs = watchJs
};
