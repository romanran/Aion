const inquirer = require('inquirer');

module.exports = function () {
	const q = promise();
	const build_checkboxes = {
			type: 'checkbox',
			message: 'Build: ',
			name: 'builds',
			choices: [
				{
					name: 'all'
				}
			]
		};
	_.forEach(['css', 'js', 'img', 'svg', 'font'], type => {
		build_checkboxes.choices.push({
			name: type,
			disabled: () => { return _.findIndex(this.project.builders, type) < 0; }
		});
	});
	
	inquirer.prompt([
		{
			type: 'list',
			message: 'Aion manager: ',
			name: 'choice',
			choices: [
				{
					key: 'r',
					name: 'Resume the builder',
					value: 'resume'
				},
				{
					key: 'b',
					name: 'Build',
					value: 'build'
				},
				new inquirer.Separator(),
				{
					key: 'x',
					name: 'Quit',
					value: 'quit'
				}
			]
		}
	]).then(function (answers) {
		if(answers.choice === 'build'){
			console.log('!! After builds are done, type in "s"(stop) or "r"(resume) !!'.bold.yellow);
		   	inquirer.prompt(build_checkboxes).then(checks => {
				answers.builders = checks.builds;
				q.resolve(answers);
			});
			return 0;
	    }
		q.resolve(answers);
	});
	return q.q;
};
