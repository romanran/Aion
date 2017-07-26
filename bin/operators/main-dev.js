require('../main/base.js')();

const Aion = cleanRequire(paths.main + '/Aion');
const aion = new Aion();
aion.start();
