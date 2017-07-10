require('./base.js')();
let dist_dirs = ['js', 'svg/symbols', 'css', 'images', 'fonts'];
let src_dirs = ['JS', 'SVG/SYMBOLS', 'LESS', 'IMG', 'FONTS', 'JSLIBS'];
let dist_dir = 'dist/';
let src_dir = 'src/';

_.forEach( dist_dirs, dir => fs.ensureDir('../'+dist_dir+dir));
_.forEach( src_dirs, dir => fs.ensureDir('../'+src_dir+dir));
//aion-plugins/css/plugins.js
fs.pathExists('../src/aion-plugins/css/plugins.js', (err, exists) => {
	console.log('exists', exists);
	if (!exists) {
		fs.outputFile('../src/aion-plugins/css/plugins.js',
`module.exports = {
	less: [],
	postcss: []
};`,
	err => console.log);
	}
});