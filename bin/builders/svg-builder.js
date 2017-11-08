const svgstore = require('svgstore');
const svgmin = require('svgo');
const pump = require('pump');
let symbol_watcher_opts = cleanRequire(paths.configs + '/watcher');
let watcher_opts = cleanRequire(paths.configs + '/watcher');

const svgo_conf = {
    plugins: [
        {
            removeViewBox: false
        },
        {
            removeUselessDefs: false
        },
        {
            cleanupIDs: false
        },
        {
            removeRasterImages: false
        }
    ]
};
const svgo = new svgmin(svgo_conf);

watcher_opts.ignored = paths.project + '/src/SVG/SYMBOLS/*.*';

class SvgBuilder {

	constructor(project) {
		this.project = project;
		this.opts = {
			inline: true,
		};
		this.watchers = [];
		this.q = new Promise((res, rej) => {
			this.loaded = res;
		});

	}

	watchAll() {
		if (this.project.bs) {
			this.bs = require('browser-sync').get(this.project.name);
		}
		const watcher = chokidar.watch(paths.project + '/src/SVG/**/*.svg', watcher_opts);
		const symbols_watcher = chokidar.watch(paths.project + '/src/SVG/SYMBOLS/*.svg', symbol_watcher_opts);
		watcher.on('ready', e => {
			console.log(chalk.bold('Watching SVG files...'));
			this.watchers.push(watcher);
			this.loaded();
		});
		symbols_watcher.on('ready', e => {
			this.watchers.push(symbols_watcher);
		});
		symbols_watcher.on('all', this.buildSymbols.bind(this));
		watcher.on('all', this.move.bind(this));
	}

	buildAll() {
		const done = promise();
		fs.remove(paths.project + '/dist/svg/**').then(() => {
			let promises = [];
			promises.push(this.move());
			promises.push(this.buildSymbols());
			Promise.all(promises).then(() => {
				done.resolve();
				if (!!this.bs) {
					this.bs.reload();
				}
			}).catch(err => {
				done.resolve();
				return handleError(err);
			});
		})
		.catch(err =>{
			done.resolve();
			return handleError(err);
		});
		return done.q;
	}

	buildSymbols(e, where) {
		console.log('  ---- SVG SYMBOLS build initialized ----   ');
		const q = promise();
		if (where) {
			where = where.replace(/\\/g, '/');
			console.log(chalk.bold(e.toUpperCase()) + ' in file ' + chalk.bold(where));
		}

		let sprites = svgstore(this.opts);
		glob(paths.project + '/src/SVG/symbols/*.svg', (er, files) => {
			files.forEach(file => {
				sprites.add(path.basename(file, '.svg'), fs.readFileSync(file, 'utf8'));
			});
            svgo.optimize(sprites.toString())
				.then(this.save.bind(this, 'symbols.min.svg'))
				.then(dest => {
					console.success(dest + ' file minified ✔');
					q.resolve();
				}).catch(err => {
					handleError(err);
					q.resolve(err);
				});
		});
		return q.q;
	}

	move(e, where) {
		const q = promise();
		asynch.waterfall(
		    [
                done => {
                    glob(paths.project + '/src/SVG/**/*.svg', {
                        ignore: [paths.project + '/src/SVG/symbols/**/*.svg']
                    }, (err, files) => {
                        done(err, files);
                    });
                },
                (files, done) => {
                    let promises = [];
                    files.forEach(file => {
                        const file_q = promise();
                        promises.push(file_q.q);

                        this.handleFile(file)
                            .then(file_q.resolve)
                            .catch(err => {
                                console.error(file);
                                handleError(err);
                                file_q.resolve(err);
                            });
                    });
                    done(null, promises);
                },
                (promises, done) => {
                    Promise.all(promises)
                        .then(() => done(null))
                        .catch(err => done(err));
                }
            ], err => {
                return handleError(err) ? q.resolve(err) : q.resolve();
            }
		);
		return q.q;
	}

	handleFile(file) {
		const dest = path.parse(file);
		const q = promise();
		asynch.waterfall([
			done => {
				fs.ensureDir(_.replace(dest.dir, 'src/SVG', 'dist/svg') + '/', err => {
					done(err);
				});
			},
			done => {
                fs.readFile(file, 'utf8', (err, data) => {
                  return done(null, data);
				});
			},
			(data, done) => {
                svgo.optimize(data)
                    .then(result => this.save(dest.base, result))
                    .then(() => done(null))
                    .catch(done);
			}
		], err =>{
			if (err) {
				q.reject(err);
			} else {
				console.success(dest.base + ' file minified ✔');
				q.resolve(dest.base);
			}
		});
		return q.q;
	}

	save(dest, result) {
        const q = promise();
        if (result.error) {
            return q.reject(result.error);
        }

		fs.writeFile(paths.project + '/dist/svg/' + dest, result.data, err => err ? q.reject(err) : q.resolve(dest));
		return q.q;
	}
}

module.exports = SvgBuilder;
