require("./base.js")();
var tslint = require("tslint");
var Linter = require("tslint/lib/linter");
 
const fileName = "TS/**/*.*";
const configuration = {
    rules: {
        "variable-name": true,
        "quotemark": [true, "double"]
    }
};
const options = {
    formatter: "json"
};
const program = Linter.createProgram("tsconfig.json", "../");
const dfiles = Linter.getFileNames(program);
var files_A = [];
glob(fileName, function (er, files) {
	files.forEach(file => {
		var dest_file= file.substring( file.lastIndexOf("/")+1, file.lastIndexOf("."));
		files_A.push(file);
//		var fileContents = fs.readFileSync(file, "utf8");
//		var result = linter.lint("utils.ts", "TS/tools/", configuration);
//		console.log(result);
//		return result.lint();
//		const results = files.map(file => {
//			const fileContents = program.getSourceFile(file).getFullText();
//			const linter = new Linter(options, program);
//			return result.lint();
//		});
	});
});
var linter = new Linter(options, program);
var result = linter.lint("TS/**/*.ts", files_A, configuration);
//		console.log(result);
//		return result.lint();