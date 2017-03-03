require("./base.js")();
fs.existsSync("../src/") || fs.mkdirSync("../src/");
fs.existsSync("../dist/") || fs.mkdirSync("../dist/");
fs.existsSync("../dist/js") || fs.mkdirSync("../dist/js");
fs.existsSync("../dist/svg") || fs.mkdirSync("../dist/svg");
fs.existsSync("../dist/svg/symbols") || fs.mkdirSync("../dist/svg/symbols");
fs.existsSync("../dist/css") || fs.mkdirSync("../dist/css");
fs.existsSync("../dist/images") || fs.mkdirSync("../dist/images");
fs.existsSync("../dist/images/sprites") || fs.mkdirSync("../dist/images/sprites");
