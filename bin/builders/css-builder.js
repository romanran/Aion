const postcss = require('postcss');
const postcss_size = require('postcss-size');
const mqpacker = require('css-mqpacker');
const css_plugs = cleanRequire(`${paths.project}/src/aion-plugins/css/plugins`);
const LessPluginCleanCSS = require('less-plugin-clean-css');
const LessPluginAutoPrefix = require('less-plugin-autoprefix');

let plugins_list = [
    new LessPluginCleanCSS({
        advanced: true
    }),
    new LessPluginAutoPrefix({browsers: ['last 2 versions', 'Safari >= 4']}),
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
        this.q = new Promise((res,rej) => {
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
            console.log('Watching LESS files...'.bold);
            this.watchers = [watcher];
            this.loaded();
        });
        watcher.on('all', this.build.bind(this));
    }
    
    build(e, where) {
        if (where) {
            where = path.parse(where.replace(/\\/g, '/')).name;
            console.log((e.toUpperCase()).bold + ' in file ' + (where).bold);
        }
        console.log('  ---- POSTCSS/LESS build initialized ----   '.bgYellow.black);
        glob(paths.project + '/src/LESS/*.less', (err, files) => {
            files.forEach(file => {
                const dest_file = path.parse(file).name;
                return fs.readFile(file, 'utf8', (err, data) => {
                    this.timers[dest_file] = Date.now();
                    this.dataReady.call(this, file, dest_file, err, data);
                });
            });
        });
    }

    //compilation function
    dataReady(file, dest_file, err, data) {
        if (handleError(err)) {
            return 0;
        }
        less_options.filename = path.resolve(file);
        this.compiler
            .render(data, less_options)
            .then(this.postProcess.bind(this, dest_file))
			.then(this.save.bind(this, dest_file))
            .catch(err => {
                return this.lessError(err, dest_file);
            });
    }

    postProcess(dest_file, output, err) {
    	return new Promise((resolve, reject)=>{
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
        //check files hash
        output.css += '/*# sourceMappingURL=' + dest_file + '.css.map */';
        
        if (output.map) {
            fs.writeFileSync(paths.project + '/dist/css/' + dest_file + '.css.map', output.map);
        }
        
        fs.writeFile(paths.project + '/dist/css/' + dest_file + '.min.css', output.css, err => {
            if (handleError(err)){ 
                return 0;
            }

            console.log(dest_file + ' ✔'.green);
            const end = Date.now() - this.timers[dest_file];
            console.info('Execution time for ' + dest_file.bold + ' : %dms', end);
            if (!_.isUndefined(this.bs)) {
                this.bs.stream({
                    match: '**/*.css'
                });
            }

            if (_.hasIn(output, 'messages[0].text')) {
                console.log((output.messages[0].text).italic.green);
            }

            console.log(' ');
        });
    }

    lessError(err, dest_file) {
        console.log(dest_file + ' x'.red);
        beep(2);
        if (!_.hasIn(err, 'file') && !_.hasIn(err, 'filename')) {
        	console.log(dest_file, err.message);
        	return 0;
		}
        let filename = _.hasIn(err, 'filename') ? err.filename.split('\\') : err.file.split('\\');
        filename = filename.splice((filename.length - 2), 2).join('/');
        let err_A = [];

        if (_.hasIn(err, 'line')) {
            err_A.push(('\nline:' + err.line + '').bold);
        }
        if (_.hasIn(err, 'extract')) {
            err_A.push('\nextract:' + err.extract);
        }
        if (_.hasIn(err, 'reason')) {
            err_A.push('\nreason:' + err.reason.yellow.bold);
        }
        if (_.hasIn(err, 'message')) {
            err_A.push('\nreason:' + err.message.yellow.bold);
        }
        let errstr = '';
        for (let i in err_A) {
            errstr += err_A[i];
        }
        console.log(filename.bold + errstr);
        notifier.notify({
            title: 'Error in LESS build for ' + filename + ': ',
            message: _.isUndefined(err.message) ? err.reason : err.message
        });
    }
}

module.exports = LessBuilder;
