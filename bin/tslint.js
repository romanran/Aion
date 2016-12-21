require("./base.js")();
var tslint = require("tslint");
var Linter = require("tslint/lib/linter");
var configuration_1 = require("tslint/lib/configuration");

const fileName = "TS/**/*.*";
const configuration = {
	rules: {
		"no-var-requires": false,
		"variable-name": true,
		"quotemark": [true, "double"]
	},
	"rulesDirectory": ["node_modules/tslint/lib/rules"]
};
const options = {
	formatter: "json",
	rulesDirectory: "/node_modules/tslint/lib/rules/",
	formattersDirectory: "/node_modules/tslint/lib/formatters/"
};
const program = Linter.createProgram("../tsconfig.json", "");
const dfiles = Linter.getFileNames(program);
var linter = new Linter(options, program);
var lint_A = program.getSemanticDiagnostics();

if (lint_A.length > 0) {
	beep(2);
}


glob(fileName, function (er, files) {
	files.forEach(file => {
		var dest_file = file.substring(file.lastIndexOf("/") + 1, file.lastIndexOf("."));
		var file_contents = fs.readFileSync(file, "utf8");
		var result = linter.lint("utils.ts", "TS/tools/", configuration);
		var configLoad = configuration_1.findConfiguration(null, file);
		linter.lint(file, file_contents, configLoad.results);
	});
	var lintResult = linter.getResult();
	console.log(lintResult);
	var res =  util.inspect(lintResult);
	fs.writeFileSync("jslint.log", res, { encoding: "utf-8" });
});

//linter.lint(file, contents, configLoad.results);

return 0;
for (i in lint_A) {
	var filename = lint_A[i].file.fileName.split("\\");
	filename = filename.splice((filename.length - 2), 2).join("/");
	var text = "Message: " + lint_A[i].messageText.yellow + " \n > " + lint_A[i].file.text + "\n filename: " + filename.green + "\n";
	console.log(text);
}
