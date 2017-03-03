function watchLess(project){
	//required plugins
	require("./base.js")();
	const bs = require("browser-sync").get(project.name);
	const chokidar = require('chokidar');
	const postcss = require('postcss');
	const hasha = require('hasha');
	const sprites = require('postcss-sprites');
	const postcss_size = require('postcss-size');
	this.async = require("async");
	const updateRule = require('postcss-sprites/lib/core').updateRule;
	const plugins_list = ["less-plugin-clean-css", "less-plugin-autoprefix", 'less-plugin-glob', 'less-plugin-functions'];

	//set variables and options
	const timers = {}; //compilation times profilers
	const less_options = "";
	const files_hashes = [];
	//postcss options
	const opts = {
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
				let backgroundSizeX = (image.spriteWidth / image.coords.width) * 100;
				let backgroundSizeY = (image.spriteHeight / image.coords.height) * 100;
				let backgroundPositionX = (image.coords.x / (image.spriteWidth - image.coords.width)) * 100;
				let backgroundPositionY = (image.coords.y / (image.spriteHeight - image.coords.height)) * 100;

				backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX;
				backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY;
				backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX;
				backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY;

				let backgroundImage = postcss.decl({
					prop: 'background-image',
					value: 'url(' + image.spriteUrl + ')'
				});

				let backgroundSize = postcss.decl({
					prop: 'background-size',
					value: backgroundSizeX + '% ' + backgroundSizeY + '%'
				});

				let backgroundPosition = postcss.decl({
					prop: 'background-position',
					value: backgroundPositionX + '% ' + backgroundPositionY + '%'
				});

				rule.insertAfter(token, backgroundImage);
				rule.insertAfter(backgroundImage, backgroundPosition);
				rule.insertAfter(backgroundPosition, backgroundSize);

				['width', 'height'].forEach( prop => {
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
	//browsersync options
	const watcher_opts = {
		ignoreInitial: true,
		awaitWriteFinish:{
			stabilityThreshold: 30,//(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
			pollInterval:10 // (default: 100). File size polling interval.
		}
	};

	const compile_files = [];
	const compilers = [];
	const plugins = [];

	//compilation function
	let dataReady = function(file, dest_file, err, data){
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
			.then( output => {
			postcss([sprites(opts), postcss_size]).process(output.css, { from: 'LESS/'+dest_file+'.less', to: '../dist/css/'+dest_file+'.css',  map: { inline: false, prev: output.map } })
				.then( output => {
				//check files hash
				let current_hash = hasha(output.css);
				if( !_.isUndefined(files_hashes[dest_file]) ){
					if( current_hash.localeCompare(files_hashes[dest_file]) === 0 ){
						//if the hash is the same as before, dont save the file
						console.log("No change in file "+dest_file);
						return 0;
					}else{
						files_hashes[dest_file] = current_hash;
					}
				}else{
					files_hashes[dest_file] = current_hash;
				}
				if ( output.map ) fs.writeFileSync("../dist/css/"+dest_file+".min.css.map", output.map);

				fs.writeFile("../dist/css/"+dest_file+".min.css", output.css, err=> {
					if(err) {
						return console.log(err);
					}
					console.log(dest_file+" ✔".green);
					let end = Date.now() - timers[dest_file];
					console.info("Execution time for "+dest_file.bold+" : %dms", end);
					bs.stream({match: "**/*.css"});
					try{
						if(parseInt(output.messages[0]) > 0){
							console.log((output.messages[0].text).italic.green);
						}
					}catch(e){}
					console.log(" ");
				});
			});
		},
		  err => {
			console.log(dest_file+" x".red);
			beep(2);
			try{
				let filename = typeof(err.filename)!==undefined ? err.filename.split("\\") : err.file.split("\\");
				filename = filename.splice((filename.length - 2), 2).join("/");
				let err_A = [];
				if(typeof err.line !=='undefined')err_A.push("\nline:"+err.line);
				if(typeof err.extract !=='undefined')err_A.push("\nextract:"+err.extract);
				if(typeof err.reason !=='undefined')err_A.push("\nreason:"+err.reason);
				if(typeof err.message !=='undefined')err_A.push("\nreason:"+err.message);
				let errstr="";
				for(i in err_A){
					errstr+=err_A[i];
				}
				console.log(((filename).bold+errstr).red);
				notifier.notify({
					title:"Error in LESS build for "+filename+": ",
					message: err.message
				});
			}catch(e){}
		});
	};


	//--Get files and start watching
	glob("../src/LESS/*.less", (er, files) => {
		let cached_files = [];
		let q = new Promise( (resolve, reject)=>{
			let total_files_num = files.length, i = 0;
			files.forEach(file => {
				compilers[file] = require('less');
				compile_files.push(file);
				fs.readFile(file, 'utf8', (err, data) => {
					i++;
					cached_files[file] = data;
					if(i === total_files_num)resolve();
				});
			});
		});
		q.then( ()=>{
			let plugin_loader = new compilers[compile_files[0]].PluginLoader(compilers[compile_files[0]]);
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
				this.async.series([(end)=>{
					let f_l = compile_files.length;
					let fi = 0;
					compile_files.forEach(file => {
						fs.exists(file, e =>{
							fi++;
							if(!e){
								compile_files.splice( compile_files.indexOf(file));
							}
							if(fi == f_l){
								end();
							}
						});
					});
					},
				 (end)=>{
					compile_files.forEach(file => {
						let dest_file= file.substring( file.lastIndexOf("/")+1, file.lastIndexOf("."));
						//if its a new file, not in the main glob, read the new file
						if(!file.localeCompare(where)){
							fs.readFile(file, 'utf8', (err, data)=>{
								cached_files[file] = data;
								timers[dest_file] = Date.now();
	//							console.time("exec time for "+dest_file);
								dataReady.call(this, file, dest_file, null, cached_files[file]);
							});
						}else{
							timers[dest_file] = Date.now();
	//						console.time("exec time for "+dest_file);
							dataReady.call(this, file, dest_file, null, cached_files[file]);
						}
					});
				 }
				]);
			});

		});
	});
}
module.exports=function(){
	this.watchLess = watchLess;
};
