const postcss = require('postcss');
const hasha = require('hasha');
const sprites = require('postcss-sprites');
const postcss_size = require('postcss-size');
const mqpacker = require('css-mqpacker');
const LessPluginCleanCSS = require('less-plugin-clean-css');

const plugins_list = [
    new LessPluginCleanCSS({
        advanced: true
    }),
    'less-plugin-autoprefix',
    'less-plugin-glob',
    'less-plugin-functions'
];

const watcher_opts = require(paths.configs + '/watcher');
let less_options = require(paths.configs + '/less');
const postcss_sprites = require(paths.configs + '/postcss-sprites');

class LessBuilder {

    constructor(project) {
        this.project = project;
        //set variables and options
        this.timers = {}; //compilation times profilers
        this.files_hashes = [];
        this.compile_files = [];
        this.compilers = [];
        this.plugins = [];
    }

    watchAll() {
        if (this.project.bs) {
            this.bs = require('browser-sync').get(this.project.name);
        }
        this.startLess().then(this.watchMain.bind(this)).catch(err => {
            return handleError(err);
        });
    }

    startLess() {
        let spinner = new Spinner('Loading LESS compiler and caching files %s'.cyan.bold);
        spinner.setSpinnerString(18);
        spinner.start();
        let resolve, reject;
        let q = new Promise((res, rej) => {
            resolve = res;
            rej = rej;
        });
        // --cache files and initilize LESS with plugins
        this.cached_files = [];
        asynch.waterfall([
            done => {
                // load the files
                glob(paths.project + '/src/LESS/*.less', done.bind(this));
            },
            (files, done) => {
                // cache the files
                const total_files_num = files.length;
                files.forEach((file, i) => {
                    this.compilers[file] = require('less');
                    this.compile_files.push(file);
                    fs.readFile(file, 'utf8', (err, data) => {
                        i++;
                        this.cached_files[file] = data;
                        if (i === total_files_num) {
                            return done(null);
                        }
                    });
                });
            },
            done => {
                // load the plugins
                let pl = this.compilers[this.compile_files[0]];
                let plugin_loader = new pl.PluginLoader(pl);
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
                return done(null);
            }
        ], (err, res) => {
            if (handleError(err)) {
                return reject(err);
            }
            less_options.plugins = this.plugins;
            spinner.stop(true);
            return resolve();
        });

        return q;
    }

    watchMain() {
        let watcher = chokidar.watch(paths.project + '/src/LESS/**/*.*', watcher_opts);
        watcher.on('ready', e => {
            console.log('Watching LESS files...'.bold);
        });
        watcher.on('all', this.build.bind(this));
    }

    build(e, where) {
        if (where) {
            where = path.parse(where.replace(/\\/g, '/')).name;
            console.log((e.toUpperCase()).bold + ' in file ' + (where).bold);
        }
        console.log('  ---- POSTCSS/LESS build initialized ----   '.bgYellow.black);

        asynch.series([
            (end) => {
                //check if all of the cached files exist, if not, remove them from the cached array
                let f_l = this.compile_files.length;
                let fi = 0;
                this.compile_files.forEach(file => {
                    fs.exists(file, e => {
                        fi++;
                        if (!e) {
                            //remove file from the list
                            this.compile_files.splice(this.compile_files.indexOf(file));
                        }
                        if (fi == f_l) {
                            end(null);
                        }
                    });
                });
            },
            (end) => {
                this.compile_files.forEach(file => {
                    const dest_file = path.parse(file).name;
                    if (!file.localeCompare(where)) {
                        // if its a new file, not in the main glob, read the new file
                        return fs.readFile(file, 'utf8', (err, data) => {
                            this.cached_files[file] = data;
                            this.timers[dest_file] = Date.now();
                            this.dataReady.call(this, file, dest_file, null, this.cached_files[file]);
                        });
                    }
                    // else get the cached file
                    this.timers[dest_file] = Date.now();
                    this.dataReady.call(this, file, dest_file, null, this.cached_files[file]);
                });
                end(null);
            }
        ]);
    }

    //compilation function
    dataReady(file, dest_file, err, data) {
        if (handleError(err)) {
            return 0;
        }
        less_options.filename = path.resolve(file);
        this.compilers[file]
            .render(data, less_options)
            .then(this.postProcess.bind(this, dest_file))
            .catch(err => {
                return this.lessError(err, dest_file);
            });
    }

    postProcess(dest_file, output, err) {
        if (err) {
            return this.lessError(err, dest_file);
        }
        const postcss_opts = {
//            from: 'LESS/' + dest_file + '.less',
//            to: paths.project + '/dist/css/' + dest_file + '.css',
            map: {
                inline: false,
                prev: output.map
            }
        };
        postcss([sprites(postcss_sprites), postcss_size, mqpacker]).process(output.css, postcss_opts)
            .then(this.save.bind(this, dest_file));
    }

    save(dest_file, output) {
        //check files hash
        output.css += '/*# sourceMappingURL=' + dest_file + '.css.map */';
        const current_hash = hasha(output.css);

        if (!_.isUndefined(this.files_hashes[dest_file]) || current_hash.localeCompare(this.files_hashes[dest_file]) === 0) {
            //if the hash is the same as before, for example when beautifying the file, dont save the file, so the bs doesnt reload
            console.log('No change in file ' + dest_file);
            return 0;
        }

        this.files_hashes[dest_file] = current_hash;
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
