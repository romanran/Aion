class SvgBuilder {

	constructor() {

		this.svgstore = require('svgstore');
		const svgmin = require('svgo');

		this.opts = {
			inline: true,
		};
		this.symbol_watcher_opts = {
			ignoreInitial: true,
			awaitWriteFinish: {
				stabilityThreshold: 50, //(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
				pollInterval: 20 // (default: 100). File size polling interval.
			}
		};
		this.watcher_opts = {
			ignoreInitial: true,
			ignored: paths.project + '/src/SVG/symbols/**',
			awaitWriteFinish: {
				stabilityThreshold: 50, //(default: 2000). Amount of time in milliseconds for a file size to remain constant before emitting its event.
				pollInterval: 20 // (default: 100). File size polling interval.
			}
		};
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
		if(handleError(err)) return 0;
		try{
			this.svgo.optimize(data, result => {
				if(handleError(result.error)) return 0;
				fs.writeFile(paths.project + '/dist/svg/' + dest, result.data, (err) => {
					if(handleError(err)) return 0;
					console.log((dest + ' file minified ✔').bold.green);
				});
			});
		}catch(err){
			handleError(err)
		}
	}

	watchAll() {

		console.log('Watching SVG files...'.bold);

		this.watcher = chokidar.watch(paths.project + '/src/SVG/**/*.svg', this.watcher_opts);
		this.symbols_watcher = chokidar.watch(paths.project + '/src/SVG/symbols/*.svg', this.symbol_watcher_opts);

		this.symbols_watcher.on('all', this.buildSymbols.bind(this));

		this.watcher.on('all', this.move.bind(this));

	}

	buildSymbols(e, where) {
		if (where) {
			where = where.replace(/\\/g, '/');
			console.log((e.toUpperCase()).bold + ' in file ' + (where).bold);
		}
		console.log('  ---- SVG SYMBOLS build initialized ----   '.bgWhite.black);

		let sprites = this.svgstore(this.opts);
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
					if(handleError(err)) return 0;
					fs.readFile(file, 'utf8', this.minify.bind(this, dest.base));
				});
			})
		});
	}
}
module.exports = SvgBuilder;
