console.log("---- POSTCSS/LESS build initialized ----");
//var updateRule = require('../node_modules/postcss-sprites').updateRule;
//var cli = require('cli'), options = cli.parse();
var main = require("../bin/main.js");
var timers = [];
var path = require('path');
var fs 	= require('fs');
var stopTimer = function(file) {
	console.timeEnd( "exec time for "+file );
};
var less = require('less');
var postcss = require('postcss');
var sprites = require('postcss-sprites');
var updateRule = require('postcss-sprites/lib/core').updateRule;
var pluginLoader = new less.PluginLoader(less),
	plugin,
	plugins = [];
var plugins_list = ["less-plugin-clean-css", "less-plugin-autoprefix", 'less-plugin-glob', 'less-plugin-functions'];

for(i in plugins_list){
	plugin = pluginLoader.tryLoadPlugin(plugins_list[i], "");
	if (plugin) {
		plugins.push(plugin);
	} else {
		console.error("Unable to load plugin " + name +
			" please make sure that it is installed under or at the same level as less");
		process.exitCode = 1;
	}
}

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
}

main.glob("LESS/*.less", function (er, files) {
	files.forEach(file => {
		var dest_file= file.substring( file.lastIndexOf("/")+1, file.lastIndexOf("."));
		timers.push("exec time for "+dest_file);
		console.time("exec time for "+dest_file);

		var less_options = {
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
			less.render(fs.readFileSync(file).toString(), less_options)
				.then(function(output) {
					postcss([sprites(opts)]).process(output.css, { from: 'LESS/'+dest_file+'.less', to: '../dist/css/'+dest_file+'.css',  map: { inline: false, prev: output.map } })
					.then(function (output) {
						if ( output.map ) fs.writeFileSync("../dist/css/"+dest_file+".min.css.map", output.map);
						fs.writeFile("../dist/css/"+dest_file+".min.css", output.css, function(err) {
							if(err) {
								return console.log(err);
							}
							stopTimer(dest_file);
						});
					});
				},
				function(error) {
					console.log(error);
				});
	});
});
