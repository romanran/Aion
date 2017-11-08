const watcher_opts = require(paths.configs + '/watcher');
const babel = require('babel-core');
const es2015 = require('babel-preset-es2015');
const browserify = require('browserify');
const babelify = require('babelify');
const minifyStream = require('minify-stream');
const pump = require('pump');

class JsBuilder {

	constructor(project) {
		this.project = project;
		this.files = [];
		this.watchers = [];
		this.watch_i = 0;

		if (!_.hasIn(this.project, 'jsFiles')) {
			this.project.jsFiles = ['main/main', 'wp-admin/wp-admin'];
		}
		for (let file of this.project.jsFiles) {
			file = path.parse(file);
			file = file.dir + '/' + file.name;
			file = `${paths.project}/src/JS/${file}.js`;
			this.files.push(file);
		}

		this.q = promise();
		this.loaded = this.q.resolve;
	}

	buildAll() {
		console.log('  ---- JS build initialized ----  ');
		this.done = promise();
		let promises = [];
		for (let file of this.files) {
			promises.push(this.handleCompile(file));
		}
		Promise.all(promises).then(this.done.resolve);
		return this.done.q;
	}

	watchAll() {
		let promises = [];
		const fileCheck = function (file, err, exists) {
			if (!exists) {
				_.pull(this.files, file);
				return 1;
			}
		};

		for (let file of this.files) {
			fs.pathExists(file, fileCheck.bind(this, file));
		}
		Promise.all(promises).then(this.watch.bind(this));
	}

	watch() {
		if (this.project.bs) {
			this.bs = require('browser-sync').get(this.project.name);
		}
		let watcher = chokidar.watch([paths.project + '/src/JS/**/*.js'], watcher_opts);
		watcher.on('ready', e => {
			this.watchers.push(watcher);
			console.log(chalk.bold('Watching JS files...'));
			if (!this.watch_i) {
				this.loaded();
			}
			this.watch_i++;
		});


		watcher.on('change', where => this.initBuild(where, watcher));
		watcher.on('unlink', where => this.initBuild(where, watcher));
		watcher.on('error', error => console.log(`Watcher error: ${error}`));
	}

	initBuild(where, watcher) {
		let promises = [];
        console.log('  ---- JS build initialized ----  ');
        console.log(`${chalk.yellow('change')} change in ${chalk.bold(path.basename(where))}, starting build...`);
        for (let file of this.files) {
            promises.push(this.handleCompile(file));
        }
        Promise.all(promises).then(e => {
            if (!!this.bs) {
                this.bs.resume();
                this.bs.reload();
            }
            this.watch();
        });
        watcher.close();
        this.watchers.pop();
    }

	handleCompile(file) {
		return new Promise((resolve, reject) => {
			fs.pathExists(file, (err, exists) => {
				if (!exists) {
					return resolve();
				}
				this.compile(file)
					.then(resolve)
					.catch(err => {
						handleError(err);
						resolve();
					});
			});
		});
	}

	compile(file) {
        const q = promise();
        let filename = path.parse(file).name;
        console.log(`Bundling required files for ${chalk.bold.yellowBright(filename)}...`);
        console.time(`${filename}.js` + chalk.green('✔'));
        const dest = `${paths.project}/dist/js/${filename}.js`;

		let bify = browserify('', {
			standalone: false,
			detectGlobals: false,
			noParse: false,
            entry: true,
            debug: true
        });

		bify.add(file);

        bify.transform(babelify, {
			presets: [es2015]
		});
        const handleAfter = (err) => {
            if (err) {
                this.handleBrowserifyError(err, filename);
                return q.reject(err);
            } else {
                console.timeEnd(`${filename}.js` + chalk.green('✔'));
                setTimeout(()=> {
                    this.minify(dest, filename);
                }, 1000);
                return q.resolve();
            }
        };

        pump(
            bify.bundle(),
            fs.createWriteStream(dest),
            handleAfter
        );
        return q.q;
    }


    minify(src, filename) {
        const dest = `${paths.project}/dist/js/${filename}.min.js`;
        console.log(`Minifying and saving ${chalk.bold.yellowBright(filename)}...`);
        pump(fs.createReadStream(src),
            minifyStream({ sourceMap: false }),
            fs.createWriteStream(dest),
            done => {
                console.log(chalk.bold.yellowBright(filename) + chalk.green('✔'));
            }
        );

    }

    handleBrowserifyError(err, file) {
		if (!file) {
			file = '?';
		}
		let filename = path.parse(file).name;
		if (!_.isUndefined(this.bs)) {
			this.bs.notify(`<span style="color: red">Failed running browserify ${filename}</span>`);
		}
		beep(2);
		if (_.hasIn(err, 'loc')) {
			//show build error
			let err_type = 'unknown';
			if (_.hasIn(err, 'stack')) {
				err_type = err.stack.substr(0, err.stack.indexOf(': '));
			}
			console.error(err_type + ' in file ' + filename);
			console.log('line: ' + chalk.bold(err.loc.line + ''), 'pos: ' + chalk.bold(err.loc.column + ''));
			console.log(err.codeFrame);
			notifier.notify({
				title: err_type + ' in js build for ' + file + ': ',
				message: 'LINE: ' + err.loc.line
			});

		} else {
			console.error('Error: ' + _.hasIn(err, 'message') ? err.message : err);
			if (file.indexOf('lib')) {
				console.info('Did you remember to do the "npm i" command inside the /src folder?');
			}
			notifier.notify({
				message: 'Error: ' + _.hasIn(err, 'message') ? err.message : err,
				title: 'Failed running browserify'
			});
		}
	}

}

module.exports = JsBuilder;
