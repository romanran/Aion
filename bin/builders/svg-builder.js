const svgstore = require('svgstore');
const svgmin = require('svgo');
let symbol_watcher_opts = cleanRequire(paths.configs + '/watcher');
let watcher_opts = cleanRequire(paths.configs + '/watcher');

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

		let svgo_conf = {
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

		this.svgo = new svgmin(svgo_conf);

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
		this.done = promise();
		this.buildSymbols();
		this.move();
		return this.done.q;
	}

	buildSymbols(e, where) {
		console.log(chalk.bgHex(colors.svg).black('  ---- SVG SYMBOLS build initialized ----   '));
		if (where) {
			where = where.replace(/\\/g, '/');
			console.log(chalk.bold(e.toUpperCase()) + ' in file ' + chalk.bold(where));
		}

		let sprites = svgstore(this.opts);
		glob(paths.project + '/src/SVG/symbols/*.svg', (er, files) => {
			files.forEach(file => {
				sprites.add(path.basename(file, '.svg'), fs.readFileSync(file, 'utf8'));
			});
			//			fs.writeFile('../dist/svg/symbols.min.svg', sprites.toString());
			this.minify('symbols.min.svg', null, sprites.toString());
			if (!!this.bs) {
				this.bs.reload();
			}
		});

	}

	move(e, where) {
		glob(paths.project + '/src/SVG/**/*.svg', {
			ignore: [paths.project + '/src/SVG/symbols/**/*.svg']
		}, (er, files) => {
			this.files_i = 0;
			this.files_l = files.length;
			files.forEach(file => {
				let dest = path.parse(file);
				fs.ensureDir(_.replace(dest.dir, 'src/SVG', 'dist/svg') + '/', err => {
					if (handleError(err)) return 0;
					fs.readFile(file, 'utf8', this.minify.bind(this, dest.base));
				});
			});
		});
	}

	minify(dest, err, data) {
		this.files_i++;
		if (this.files_i === this.files_l) {
			if (!!this.done) {
				this.done.resolve();
			}
			if (!!this.bs) {
				this.bs.reload();
			}
		}
		if (handleError(err)) return 0;
		try {
			this.svgo.optimize(data, result => {
				if (handleError(result.error)) return 0;
				fs.writeFile(paths.project + '/dist/svg/' + dest, result.data, (err) => {
					if (handleError(err)) return 0;
					console.success(dest + ' file minified ✔');
				});
			});
		} catch (err) {
			handleError(err);
		}
	}
}

module.exports = SvgBuilder;
