require("./base.js")();
let dist_dirs = ['js', 'svg/symbols', 'css', 'images', 'fonts'];
let src_dirs = ['JS', 'SVG/SYMBOLS', 'LESS', 'IMG', 'FONTS', 'JSLIBS'];
let dist_dir = 'dist/';
let src_dir = 'src/';

_.forEach( dist_dirs, dir => fs.ensureDir('../'+dist_dir+dir));
_.forEach( src_dirs, dir => fs.ensureDir('../'+src_dir+dir));