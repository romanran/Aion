require("./base.js")();
fs.existsSync("../dist/") || fs.mkdirSync("../dist/");
fs.existsSync("../dist/js") || fs.mkdirSync("../dist/js");
fs.existsSync("../dist/css") || fs.mkdirSync("../dist/css");
fs.existsSync("../dist/images") || fs.mkdirSync("../dist/images");
