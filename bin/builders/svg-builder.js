const svgstore = require('svgstore');
const svgmin = require('svgo');
let symbol_watcher_opts = cleanRequire(paths.configs + '/watcher');
let watcher_opts = cleanRequire(paths.configs + '/watcher');

watcher_opts.ignored = paths.project + '/src/SVG/SYMBOLS/*.*';

class SvgBuilder {

	constructor() {
		this.opts = {
			inline: true,
		};
		this.watchers = [];

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

	minify(dest, err, data) {
		if (handleError(err)) return 0;
		try {
			this.svgo.optimize(data, result => {
				if (handleError(result.error)) return 0;
				fs.writeFile(paths.project + '/dist/svg/' + dest, result.data, (err) => {
					if (handleError(err)) return 0;
					console.log((dest + ' file minified ✔').bold.green);
				});
			});
		} catch (err) {
			handleError(err);
		}
	}

	watchAll() {
		const watcher = chokidar.watch(paths.project + '/src/SVG/**/*.svg', watcher_opts);
		const symbols_watcher = chokidar.watch(paths.project + '/src/SVG/SYMBOLS/*.svg', symbol_watcher_opts);
		watcher.on('ready', e => {
			console.log('Watching SVG files...'.bold);
			this.watchers.push(watcher);
		});
		symbols_watcher.on('ready', e => {
			this.watchers.push(symbols_watcher);
		});
		symbols_watcher.on('all', this.buildSymbols.bind(this));
		watcher.on('all', this.move.bind(this));
	}

	buildSymbols(e, where) {
		if (where) {
			where = where.replace(/\\/g, '/');
			console.log((e.toUpperCase()).bold + ' in file ' + (where).bold);
		}
		console.log('  ---- SVG SYMBOLS build initialized ----   '.bgWhite.black);

		let sprites = svgstore(this.opts);
		glob(paths.project + '/src/SVG/symbols/*.svg', (er, files) => {
			files.forEach(file => {
				sprites.add(path.basename(file, '.svg'), fs.readFileSync(file, 'utf8'));
			});
			//			fs.writeFile('../dist/svg/symbols.min.svg', sprites.toString());
			this.minify('symbols.min.svg', null, sprites.toString());
		});

	}

	buildAll() {
		this.buildSymbols();
		this.move();
	}

	move(e, where) {
		console.log('  ---- SVG moving initialized ----   '.bgWhite.black);

		glob(paths.project + '/src/SVG/**/*.svg', {
			ignore: [paths.project + '/src/SVG/symbols/**/*.svg']
		}, (er, files) => {
			files.forEach(file => {
				let dest = path.parse(file);
				fs.ensureDir(_.replace(dest.dir, 'src/SVG', 'dist/svg') + '/', err => {
					if (handleError(err)) return 0;
					fs.readFile(file, 'utf8', this.minify.bind(this, dest.base));
				});
			});
		});
	}
}

module.exports = SvgBuilder;
