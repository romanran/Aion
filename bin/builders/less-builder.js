class LessBuilder {

    constructor(project) {
        this.project = project;
        this.postcss = require('postcss');
        this.hasha = require('hasha');
        this.sprites = require('postcss-sprites');
        this.postcss_size = require('postcss-size');
        this.mqpacker = require('css-mqpacker');
        const LessPluginCleanCSS = require('less-plugin-clean-css');
        this.updateRule = require('postcss-sprites/lib/core').updateRule;
        this.plugins_list = [
            new LessPluginCleanCSS({advanced: true}),
            'less-plugin-autoprefix',
            'less-plugin-glob', 
            'less-plugin-functions'
        ];

        //set variables and options
        this.timers = {}; //compilation times profilers

        this.files_hashes = [];
        //postcss options
        this.opts = {
            stylesheetPath: paths.project + '/dist/css',
            spritePath: paths.project + '/dist/images/sprites',
            basePath: paths.project,
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

                    let backgroundImage = this.postcss.decl({
                        prop: 'background-image',
                        value: 'url(' + image.spriteUrl + ')'
                    });

                    let backgroundSize = this.postcss.decl({
                        prop: 'background-size',
                        value: backgroundSizeX + '% ' + backgroundSizeY + '%'
                    });

                    let backgroundPosition = this.postcss.decl({
                        prop: 'background-position',
                        value: backgroundPositionX + '% ' + backgroundPositionY + '%'
                    });

                    rule.insertAfter(token, backgroundImage);
                    rule.insertAfter(backgroundImage, backgroundPosition);
                    rule.insertAfter(backgroundPosition, backgroundSize);

                    ['width', 'height'].forEach(prop => {
                        rule.insertAfter(rule.last, this.postcss.decl({
                            prop: prop,
                            value: image.coords[prop] + 'px'
                        }));
                    });
                    this.updateRule(rule, token, image);
                }
            },
            spritesmith: {
                padding: 5
            }
        };
        //chokidar options
        this.watcher_opts = {
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 30, //(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
                pollInterval: 10 // (default: 100). File size polling interval.
            }
        };

        this.less_options = {
            filename: null,
            depends: false,
            compress: true,
            max_line_len: -1,
            lint: false,
            paths: [],
            color: true,
            strictImports: false,
            relativeUrls: false,
            ieCompat: true,
            strictMath: true,
            strictUnits: false,
            urlArgs: '',
            sourceMap: {
                sourceMapFileInline: false
            }
        };

        this.compile_files = [];
        this.compilers = [];
        this.plugins = [];
    }

    //compilation function
    dataReady(file, dest_file, err, data) {
        if (err !== null) {
            console.warn(err);
            return 0;
        }

        this.less_options.filename = path.resolve(file);

        this.compilers[file].render(data, this.less_options)
            .then(output => {
                    this.postcss([this.sprites(this.opts), this.postcss_size, this.mqpacker]).process(output.css, {
                            from: 'LESS/' + dest_file + '.less',
                            to: paths.project + '/dist/css/' + dest_file + '.css',
                            map: {
                                inline: false,
                                prev: output.map
                            }
                        })
                        .then(output => {
                            //check files hash
                            output.css += '/*# sourceMappingURL=' + dest_file + '.css.map */';
                            let current_hash = this.hasha(output.css);
                            if (!_.isUndefined(this.files_hashes[dest_file])) {
                                if (current_hash.localeCompare(this.files_hashes[dest_file]) === 0) {
                                    //if the hash is the same as before, dont save the file
                                    console.log('No change in file ' + dest_file);
                                    return 0;
                                } else {
                                    this.files_hashes[dest_file] = current_hash;
                                }
                            } else {
                                this.files_hashes[dest_file] = current_hash;
                            }
                            if (output.map) fs.writeFileSync(paths.project + '/dist/css/' + dest_file + '.css.map', output.map);

                            fs.writeFile(paths.project + '/dist/css/' + dest_file + '.min.css', output.css, err => {
                                if(handleError(err)) return 0;
                                
                                console.log(dest_file + ' ✔'.green);
                                let end = Date.now() - this.timers[dest_file];
                                console.info('Execution time for ' + dest_file.bold + ' : %dms', end);
                                if (!_.isUndefined(this.bs)) {
                                    this.bs.stream({
                                        match: '**/*.css'
                                    });
                                }
                                try {
                                    if (parseInt(output.messages[0]) > 0) {
                                        console.log((output.messages[0].text).italic.green);
                                    }
                                } catch (e) {}
                                console.log(' ');
                            });
                        });
                },
                err => {
                    console.log(dest_file + ' x'.red);
                    beep(2);
                    try {
                        let filename = typeof (err.filename) !== undefined ? err.filename.split('\\') : err.file.split('\\');
                        filename = filename.splice((filename.length - 2), 2).join('/');
                        let err_A = [];
                        if (!_.isUndefined(err.line)) err_A.push(('\nline:' + err.line + '').bold);
                        if (!_.isUndefined(err.extract)) err_A.push('\nextract:' + err.extract);
                        if (!_.isUndefined(err.reason)) err_A.push('\nreason:' + err.reason.yellow.bold);
                        if (!_.isUndefined(err.message)) err_A.push('\nreason:' + err.message.yellow.bold);
                        let errstr = '';
                        for (let i in err_A) {
                            errstr += err_A[i];
                        }
                        console.log(((filename).bold + errstr));
                        notifier.notify({
                            title: 'Error in LESS build for ' + filename + ': ',
                            message: _.isUndefined(err.message) ? err.reason : err.message
                        });
                    } catch (e) {}
                });
    };

    watchAll() {
        if(this.project.bs){
            this.bs = require('browser-sync').get(this.project.name);
        }
        this.startLess().then(this.watchMain.bind(this));
    }
    watchMain() {
        console.log('Watching LESS files...'.bold);
        let watcher = chokidar.watch(paths.project + '/src/LESS/**/*.*', this.watcher_opts);
        watcher.on('all', this.build.bind(this));
    }

    build(e, where) {
        if (where) {
            where = where.replace(/\\/g, '/');
            console.log((e.toUpperCase()).bold + ' in file ' + (where).bold);
        }
        console.log('  ---- POSTCSS/LESS build initialized ----   '.bgYellow.black);

        asynch.series([(end) => {
            let f_l = this.compile_files.length;
            let fi = 0;
            this.compile_files.forEach(file => {
                fs.exists(file, e => {
                    fi++;
                    if (!e) {
                        this.compile_files.splice(this.compile_files.indexOf(file));
                    }
                    if (fi == f_l) {
                        end();
                    }
                });
            });
        },
            (end) => {
                this.compile_files.forEach(file => {
                    let dest_file = file.substring(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));
                    if (!file.localeCompare(where)) {
                        //if its a new file, not in the main glob, read the new file
                        fs.readFile(file, 'utf8', (err, data) => {
                            this.cached_files[file] = data;
                            this.timers[dest_file] = Date.now();
                            this.dataReady.call(this, file, dest_file, null, this.cached_files[file]);
                        });
                    } else {
                        this.timers[dest_file] = Date.now();
                        this.dataReady.call(this, file, dest_file, null, this.cached_files[file]);
                    }
                });
       }

      ]);
    }

    startLess() {
        let spinner = new Spinner('Loading LESS compiler and caching files %s'.cyan.bold);
        spinner.setSpinnerString(18);
        spinner.start();
        let q = new Promise((resolve, reject) => {
            //--cache files and initilize LESS with plugins
            this.cached_files = [];
            asynch.series({
                cacheFiles: done => {
                    glob(paths.project + '/src/LESS/*.less', (er, files) => {
                        let total_files_num = files.length,
                            i = 0;
                        files.forEach(file => {
                            this.compilers[file] = require('less');
                            this.compile_files.push(file);
                            fs.readFile(file, 'utf8', (err, data) => {
                                i++;
                                this.cached_files[file] = data;
                                if (i === total_files_num) done();
                            });
                        });
                    });
                },
                loadPlugins: done => {
                    let pl = this.compilers[this.compile_files[0]];
                    let plugin_loader = new pl.PluginLoader(pl);
                    for (let i in this.plugins_list) {
                        if (_.isObject(this.plugins_list[i])) {
                            //if its already instantiated plugin object, not a string for loading
                            this.plugins.push(this.plugins_list[i]);
                        } else {
                            //load plugin by name
                            let plugin = plugin_loader.tryLoadPlugin(this.plugins_list[i], '');
                            if (plugin) {
                                this.plugins.push(plugin);
                            } else {
                                console.error('Unable to load plugin ' + plugin + ' please make sure that it is installed under or at the same level as less');
                                continue;
                            }
                        }
                    }
                    done();
                }

            }, (err, res) => {
                this.less_options.plugins = this.plugins;
                spinner.stop(true);
                resolve();
            });

        });

        return q;
    }
}

module.exports = LessBuilder;
