const inquirer = require('inquirer');

module.exports = function () {
	require('./base')();
	const q = promise();
	inquirer.prompt([
		{
			type: 'expand',
			message: 'Aion manager: ',
			name: 'menu',
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
					value: 'abort'
				}
			]
		}
	]).then(function (answers) {
		console.log(JSON.stringify(answers, null, '  '));
		q.resolve(answers);
	});
	return q.q;
};
