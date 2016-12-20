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
	formatter: "json",
	rulesDirectory: ["/node_modules/tslint/lib/rules/"],
	formattersDirectory: ["/node_modules/tslint/lib/formatters/"]
};
const program = Linter.createProgram("../tsconfig.json", "");
const dfiles = Linter.getFileNames(program);
var linter = new Linter(options, program);
var lint_A = program.getSemanticDiagnostics();

if(lint_A.length > 0){
	beep(2);
}
console.log(linter.lint("/TS/**/*.ts", "", options, configuration));
return 0;
for(i in lint_A){
	var filename = lint_A[i].file.fileName.split("\\");
	filename = filename.splice((filename.length - 2), 2).join("/");
	var text = "Message: "+lint_A[i].messageText.yellow+" \n > "+lint_A[i].file.text+"\n filename: "+filename.green+"\n";
	console.log(text);
}
