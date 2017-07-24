const postcss = require('postcss');
const postcss_size = require('postcss-size');
const mqpacker = require('css-mqpacker');
let css_plugs;
try {
	css_plugs = cleanRequire(`${paths.project}/src/aion-plugins/css/plugins`);
} catch (e) {
	console.error('Packages not found, installing...');
	const {
		exec
	} = require('child_process');
	exec(`cd ${paths.project}/src/ && npm i`, (err, stdout, stderr) => {
		console.log(stdout);
		console.log('Please restart the Aion');
	});
}

const LessPluginCleanCSS = require('less-plugin-clean-css');
const LessPluginAutoPrefix = require('less-plugin-autoprefix');

let plugins_list = [
	new LessPluginCleanCSS({
		advanced: true
	}),
	new LessPluginAutoPrefix({
		browsers: ['last 2 versions', 'Safari >= 4']
	}),
	'less-plugin-glob',
	'less-plugin-functions'
];
const watcher_opts = require(paths.configs + '/watcher');
let less_options = require(paths.configs + '/less');

let postcss_plugins = [postcss_size, mqpacker];
if (_.hasIn(css_plugs, 'postcss')) {
	postcss_plugins = _.union(postcss_plugins, css_plugs.postcss);
}
if (_.hasIn(css_plugs, 'less')) {
	plugins_list = _.union(plugins_list, css_plugs.less);
}

class LessBuilder {

	constructor(project) {
		this.project = project;
		//set variables and options
		this.timers = {}; //compilation times profilers
		this.compile_files = [];
		this.plugins = [];
		this.q = new Promise((res, rej) => {
			this.loaded = res;
		});
	}

	watchAll() {
		if (this.project.bs) {
			this.bs = require('browser-sync').get(this.project.name);
		}
		this.startLess();
		this.watchMain();
	}

	startLess() {
		// load the plugins
		this.compiler = require('less');
		let plugin_loader = new this.compiler.PluginLoader(this.compiler);
		for (let i in plugins_list) {
			if (_.isObject(plugins_list[i])) {
				//if its already instantiated plugin object, not a string for loading
				this.plugins.push(plugins_list[i]);
				continue;
			}
			//load plugin by name
			let plugin = plugin_loader.tryLoadPlugin(plugins_list[i], '');
			if (plugin) {
				this.plugins.push(plugin);
				continue;
			}
			console.error('Unable to load plugin ' + plugin + ' please make sure that it is installed under or at the same level as less');
		}
		less_options.plugins = this.plugins;
	}

	watchMain() {
		let watcher = chokidar.watch(paths.project + '/src/LESS/**/*.{less,css}', watcher_opts);
		watcher.on('ready', e => {
			console.log(chalk.bold('Watching LESS files...'));
			this.watchers = [watcher];
			this.loaded();
		});
		watcher.on('all', (e, file) => {
			watcher.close();
			this.watchers.pop();
			this.build(e, file).then(e => {
				this.watchMain();
			});
		});
	}

	build(e, where) {
		console.log(chalk.bgHex(colors.css).black('  ---- CSS build initialized ----   '));
		this.done = promise();
		if (where) {
			where = path.parse(where.replace(/\\/g, '/')).name;
			console.info(chalk.bold.white(e.toUpperCase()) + ' in file ' + chalk.bold.white(where));
		}
		glob(paths.project + '/src/LESS/*.less', (err, files) => {
			this.files_i = 0;
			this.files_l = files.length;
			files.forEach(file => {
				const dest_file = path.parse(file).name;
				return fs.readFile(file, 'utf8', (err, data) => {
					this.timers[dest_file] = Date.now();
					this.dataReady.call(this, file, dest_file, err, data);
				});
			});
		});
		return this.done.q;
	}

	//compilation function
	dataReady(file, dest_file, err, data) {
		if (handleError(err)) {
			return 0;
		}
		const fileFinished = function() {
			this.files_i++;

			if (this.files_i === this.files_l) {
				if (!!this.done) {
					this.done.resolve();
				}
				if (!!this.bs) {
					this.bs.reload(paths.project + '/dist/css/*.css');
				}
			}
		};
		less_options.filename = path.resolve(file);
		this.compiler
			.render(data, less_options)
			.then(this.postProcess.bind(this, dest_file))
			.then(this.save.bind(this, dest_file))
			.then(fileFinished.bind(this))
			.catch(err => {
				fileFinished.call(this);
				return this.lessError(err, dest_file);
			});
	}

	postProcess(dest_file, output, err) {
		return new Promise((resolve, reject) => {
			if (err) {
				return reject(err, dest_file);
			}
			const postcss_opts = {
				map: {
					inline: false,
					prev: output.map
				}
			};
			postcss(postcss_plugins).process(output.css, postcss_opts)
				.then(resolve).catch(reject);
		});
	}

	save(dest_file, output) {
		const q = promise();
		output.css += '/*# sourceMappingURL=' + dest_file + '.css.map */';

		if (output.map) {
			fs.writeFileSync(paths.project + '/dist/css/' + dest_file + '.css.map', output.map);
		}

		fs.writeFile(paths.project + '/dist/css/' + dest_file + '.min.css', output.css, err => {
			if (handleError(err)) {
				q.resolve(err);
				return 0;
			}

			console.log(dest_file + chalk.green(' ✔'));
			const end = Date.now() - this.timers[dest_file];
			console.info(`Execution time for ${chalk.white.bold(dest_file)}: ${chalk.white(end)}ms`);

			if (_.hasIn(output, 'messages[0].text')) {
				console.success(chalk.italic(output.messages[0].text));
			}

			console.log(' ');
			q.resolve();
		});
		return q;
	}

	lessError(err, dest_file) {
		console.error(dest_file + ' x');
		beep(2);
		if (!_.hasIn(err, 'file') && !_.hasIn(err, 'filename')) {
			console.log(dest_file, err.message);
			return 0;
		}
		let filename = _.hasIn(err, 'filename') ? err.filename.split('\\') : err.file.split('\\');
		filename = filename.splice((filename.length - 2), 2).join('/');
		let err_A = [];

		if (_.hasIn(err, 'line')) {
			err_A.push(('\nline:' + err.line + ''));
		}
		if (_.hasIn(err, 'extract')) {
			err_A.push('\nextract:' + err.extract);
		}
		if (_.hasIn(err, 'reason')) {
			err_A.push('\nreason:' + chalk.bold.yellow(err.reason));
		}
		if (_.hasIn(err, 'message')) {
			err_A.push('\nreason:' + chalk.bold.yellow(err.message));
		}
		let errstr = '';
		for (let i in err_A) {
			errstr += err_A[i];
		}
		console.log(chalk.bold(filename) + errstr);
		notifier.notify({
			title: 'Error in LESS build for ' + filename + ': ',
			message: _.isUndefined(err.message) ? err.reason : err.message
		});

	}

}

module.exports = LessBuilder;
