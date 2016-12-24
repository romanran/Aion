require("./base.js")();
const tslint = require("tslint");
const Linter = require("tslint/lib/linter");
const config_O = require("tslint/lib/configuration");

let args = process.argv.slice(2);
let prod_i = args.indexOf("prod");
let prod_temp = (args[prod_i+1] === "true");
const prod = typeof(prod_temp) === "undefined" ? false : prod_temp;

const fileName = "TS/**/*.*";
const configuration = {
	rules: {
		"no-var-requires": false,
		"variable-name": true,
		"no-console": [false],
		"quotemark": [true, "double"]
	},
	"rulesDirectory": ["node_modules/tslint/lib/rules"]
};
const options = {
	fix: false,
	formatter: "json",
	rulesDirectory: "/node_modules/tslint/lib/rules/",
	formattersDirectory: "/node_modules/tslint/lib/formatters/"
};

const program = Linter.createProgram("ts_program.json", "");
const dfiles = Linter.getFileNames(program);
const linter = new Linter(options, program);
const lint_A = program.getSemanticDiagnostics();

glob(fileName, function (er, files) {
	let configLoad = "";
	let file_contents = "";
	if( prod ){
		console.log("loading prod cofiguration...");
	}

	files.forEach(file => {
		file_contents = fs.readFileSync(file, "utf8");
		if( prod ){
			configLoad = config_O.findConfiguration("./bin/tsconfig_prod.json", file);
		}else{
			configLoad = config_O.findConfiguration("./bin/tsconfig_dev.json", file);
		}
		linter.lint(file, file_contents, configLoad.results);
	});
	const lintResult = linter.getResult();
	//check auto fixes
	if( lintResult.fixes.length > 0){
		console.log( ("Fixed "+lintResult.fixes.length+" problems:").green );
		for( let i in lintResult.fixes){
			console.log( lintResult.fixes[i].failure+" in "+lintResult.fixes[i].fileName );
		}
		fs.writeFileSync("jslint.log", util.inspect( lintResult.failures ), { encoding: "utf-8" });
	}
	//check fails
	if( lintResult.failureCount.length > 0){
		beep(2);
		console.log( ("Errors count: "+lintResult.failureCount+" x").red );
		for( let i in lintResult.failures){
			let res =  lintResult.failures[i];
			console.log( ("Filename: "+res.fileName+"\n"+res.failure).yellow );
			console.log( "starting "+("line:"+res.startPosition.lineAndCharacter.line+" pos:"+ res.startPosition.lineAndCharacter.character).bold.cyan );
			console.log( "ending "+("line:"+res.endPosition.lineAndCharacter.line+" pos:"+ res.endPosition.lineAndCharacter.character+"\n").bold.cyan );
		}
		return 0;
		rocess.exit(0);
	}else{
		console.log( ("Semantic check! ✔").green );
	}
});

