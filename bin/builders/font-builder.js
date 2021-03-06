const watcher_opts = require(paths.configs + '/watcher');

class FontBuilder {

	constructor(project) {
		this.project = project;
		this.q = new Promise((res, rej) => {
			this.loaded = res;
		});
	}

	convert() {

	}

	watchAll() {
		if (this.project.bs) {
			this.bs = require('browser-sync').get(this.project.name);
		}
		const watcher = chokidar.watch(paths.project + '/src/FONTS/**/*.*', watcher_opts);
		watcher.on('ready', () => {
			console.log(chalk.bold('Watching FONT files...'));
			this.watchers = [watcher];
			this.loaded();
		});
		watcher.on('all', this.move.bind(this));

	}

	build() {
		this.done = promise();
		fs.remove(paths.project + '/dist/fonts', () => {
			glob(paths.project + '/src/FONTS/**/*.*', (err, files) => {
				this.files_i = 0;
				this.files_l = files.length;
				files.map(file => {
					this.move('add', file);
				});
			});
		});
		return this.done.q;
	}

	move(e, where) {
		where = where.replace(/\\/g, '/');
		let dest = path.parse(where);
		if (e.indexOf('add') >= 0 || e.indexOf('change') >= 0) {
			fs.copy(where, _.replace(dest.dir, 'src/FONTS', 'dist/fonts') + '/' + dest.base, {
				overwrite: true
			}, err => {
				this.files_i++;
				if (this.files_i === this.files_l) {
					if (!!this.done) {
						this.done.resolve();
					}
				}
				if (handleError(err)) {
					return 0;
				}
				return console.success(dest.base + ' moved');
			});
		}
	}
}

module.exports = FontBuilder;
