const watcher_opts = require(paths.configs + '/watcher');

class FontBuilder {

	constructor() {

	}

	convert() {

	}

	watchAll() {
		const watcher = chokidar.watch(paths.project + '/src/FONTS/**/*.*', watcher_opts);
		watcher.on('ready', () => {
			console.log('Watching FONT files...'.bold);
		});
		watcher.on('all', this.move.bind(this));

	}

	build() {
		glob(paths.project + '/src/FONTS/**/*.*', (err, files) => {
			_.forEach(files, file=>{
				this.move('add', file);
			});
		});
	}

	move(e, where) {
		where = where.replace(/\\/g, "/");
		let dest = path.parse(where);
		if (e.indexOf('add') >= 0 || e.indexOf('change') >= 0) {
			fs.copy(where, _.replace(dest.dir, 'src/FONTS', 'dist/fonts') + '/' + dest.base, {
				overwrite: true
			}, err => {
				if (handleError(err)) return 0;
				console.log(dest.base + ' moved'.green);
			});
		}
	}
}
module.exports = FontBuilder;
