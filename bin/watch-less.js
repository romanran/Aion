function watchLess(){
	require("./base.js")();
	var chokidar = require('chokidar');
	var postcss = require('postcss');
	var sprites = require('postcss-sprites');
	var postcss_size = require('postcss-size');
	var updateRule = require('postcss-sprites/lib/core').updateRule;
	const plugins_list = ["less-plugin-clean-css", "less-plugin-autoprefix", 'less-plugin-glob', 'less-plugin-functions'];
	const timers = [];
	var less_options = "";
	var opts = {
		stylesheetPath: '../dist/css',
		spritePath: '../dist/images/sprites',
		basePath: '../',
		relativeTo: 'file',
		filterBy: function (image) {
			if ((/^.*\/sprites\/.*\.+(jpg|png)$/i.test(image.url))) {
				return Promise.resolve();
			}
			return Promise.reject();
		},
		hooks: {
			onUpdateRule: function (rule, token, image) {
				var backgroundSizeX = (image.spriteWidth / image.coords.width) * 100;
				var backgroundSizeY = (image.spriteHeight / image.coords.height) * 100;
				var backgroundPositionX = (image.coords.x / (image.spriteWidth - image.coords.width)) * 100;
				var backgroundPositionY = (image.coords.y / (image.spriteHeight - image.coords.height)) * 100;

				backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX;
				backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY;
				backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX;
				backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY;

				var backgroundImage = postcss.decl({
					prop: 'background-image',
					value: 'url(' + image.spriteUrl + ')'
				});

				var backgroundSize = postcss.decl({
					prop: 'background-size',
					value: backgroundSizeX + '% ' + backgroundSizeY + '%'
				});

				var backgroundPosition = postcss.decl({
					prop: 'background-position',
					value: backgroundPositionX + '% ' + backgroundPositionY + '%'
				});

				rule.insertAfter(token, backgroundImage);
				rule.insertAfter(backgroundImage, backgroundPosition);
				rule.insertAfter(backgroundPosition, backgroundSize);

				['width', 'height'].forEach(function (prop) {
					rule.insertAfter(rule.last, postcss.decl({
						prop: prop,
						value: image.coords[prop] + 'px'
					}));
				});
				updateRule(rule, token, image);
			}
		},
		spritesmith: {
			padding: 5
		}
	};
	const watcher_opts = {
		ignoreInitial: true,
		awaitWriteFinish:{
			stabilityThreshold: 50,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
			pollInterval:20 // (default: 100). File size polling interval.
		}
	};
	const compile_files = [];
	const compilers = [];
	const plugins = [];

	var dataReady = function(file, dest_file, err, data){
		if(err!==null){
			console.warn(err);
			return 0;
		}
		let less_options = {
			filename: path.resolve(file),
			depends: false,
			compress: true,
			max_line_len: -1,
			lint: false,
			paths: [],
			color: true,
			strictImports: false,
			insecure: false,
			rootpath: '',
			relativeUrls: false,
			ieCompat: true,
			strictMath: true,
			strictUnits: false,
			globalVars: null,
			modifyVars: null,
			urlArgs: '',
			plugins: plugins,
			sourceMap: {}
		};
		compilers[file].render(data, less_options)
			.then(function(output) {
			postcss([sprites(opts), postcss_size]).process(output.css, { from: 'LESS/'+dest_file+'.less', to: '../dist/css/'+dest_file+'.css',  map: { inline: false, prev: output.map } })
				.then(function (output) {
				if ( output.map ) fs.writeFileSync("../dist/css/"+dest_file+".min.css.map", output.map);
				fs.writeFile("../dist/css/"+dest_file+".min.css", output.css, function(err) {
					if(err) {
						return console.log(err);
					}
					console.log(dest_file+" ✔".green);
					stopTimer(dest_file);
					if(parseInt(output.messages[0].text) > 0){
						console.log((output.messages[0].text).italic.green);
					}
					console.log(" ");
				});
			});
		},
		  function(err) {
			console.log(dest_file+" x".red);
			beep(2);
			try{
				var filename = typeof err.filename!=='undefined' ? err.filename.split("\\") : err.file.split("\\");
				filename = filename.splice((filename.length - 2), 2).join("/");
				var err_A = [];
				if(typeof err.line !=='undefined')err_A.push("\nline:"+err.line);
				if(typeof err.extract !=='undefined')err_A.push("\nextract:"+err.extract);
				if(typeof err.reason !=='undefined')err_A.push("\nreason:"+err.reason);
				if(typeof err.message !=='undefined')err_A.push("\nreason:"+err.message);
				var errstr="";
				for(i in err_A){
					errstr+=err_A[i];
				}
				console.log(((filename).bold+errstr).red);
			}catch(e){console.log("Error in build. Report this to Roman:".red,e);}
			notifier.notify({
				title:"Error in LESS build for "+filename+": ",
				message: err.message
			});
		});
	};

	glob("../src/LESS/*.less", function (er, files) {
		var cached_files = [];
		var q = new Promise(function(resolve, reject){
			let total_files_num = files.length, i = 0;
			files.forEach(file => {
				compilers[file] = require('less');
				compile_files.push(file);
				fs.readFile(file, 'utf8', function(err, data){
					i++;
					cached_files[file] = data;
					if(i === total_files_num)resolve();
				});
			});
		});
		q.then(function(){
			var plugin_loader = new compilers[compile_files[0]].PluginLoader(compilers[compile_files[0]]);
			for(let i in plugins_list){
				plugin = plugin_loader.tryLoadPlugin(plugins_list[i], "");
				if (plugin) {
					plugins.push(plugin);
				} else {
					console.error("Unable to load plugin " + plugin.name +
								  " please make sure that it is installed under or at the same level as less");
					continue;
				}
			}

			console.log("Watching LESS files...".bold);
			var watcher = chokidar.watch('../src/LESS/**/*.*', watcher_opts);
			watcher.on('all', (e, where) => {
				where = where.replace(/\\/g, "/");
				console.log((e.toUpperCase()).bold+" in file "+(where).bold);
				console.log("  ---- POSTCSS/LESS build initialized ----   ".bgYellow.black);

				compile_files.forEach(file => {
					var dest_file= file.substring( file.lastIndexOf("/")+1, file.lastIndexOf("."));
					if(!file.localeCompare(where)){
						fs.readFile(file, 'utf8', function(err, data){
							cached_files[file] = data;
							timers.push("exec time for "+dest_file);
							console.time("exec time for "+dest_file);
							dataReady.call(this, file, dest_file, null, cached_files[file]);
						});
					}else{
						timers.push("exec time for "+dest_file);
						console.time("exec time for "+dest_file);
						dataReady.call(this, file, dest_file, null, cached_files[file]);
					}
		//			fs.readFile(file, 'utf8', dataReady.bind(this, file, dest_file));
				});
			});

		});
	});
}
module.exports=function(){
	this.watchLess = watchLess;
};
