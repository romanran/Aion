const inq = require('inquirer');
const fs = require('fs-extra');
const validPath = require('is-valid-path');
const validUrl = require('valid-url').isUri;

module.exports = function () {
	return new Promise((resolve, reject) => {
		const questions = [
			{
				type: 'input',
				name: 'name',
				message: 'Project name',
				filter: answer => {
					return new Promise((res, rej) => {
						answer = _.kebabCase(answer);
						if (_.isEmpty(answer)) {
							return rej('Cannot be empty!');
						}
						res(answer);
					});
				}
		}, {
				type: 'checkbox',
				message: 'Select the modules',
				name: 'modules',
				choices: [
					{
						name: 'BrowserSync',
						value: 'bs',
						checked: true,
						short: 'BrowserSync'
				},
					{
						name: 'Server',
						value: 'server',
						short: 'Server'
				}
			]
		},
			{
				name: 'path',
				type: 'input',
				message: 'Working directory',
				when: answers => {
					return answers.modules.indexOf('server') >= 0;
				}
		},
			{
				name: 'script',
				type: 'input',
				message: 'Server script path',
				when: answers => {
					return answers.modules.indexOf('server') >= 0;
				},
				validate: answer => {
					return new Promise((res, rej) => {
						if (!validPath(answer)) {
							return rej('Invalid path');
						}
						if (path.isAbsolute(answer)) {
							return rej('Please provide a relative path starting from the Aion directory.');
						}
						if (path.resolve(answer).indexOf(paths.base) >= 0) {
							return rej('Can\'t be inside the Aion directory.');
						}
						res(true);
					});
				}
		},
			{
				name: 'proxy',
				type: 'input',
				message: 'BrowserSync proxy url e.g. localhost:8000, localhost/project_name',
				when: answers => {
					return answers.modules.indexOf('bs') >= 0;
				},
				validate: answer => {
					return new Promise((res, rej) => {
						if (answer.indexOf('http://') < 0 && answer.length > 0) {
							answer = 'http://' + answer;
						}
						if (!validUrl(answer) || _.isEmpty(answer)) {
							return rej('Invalid url');
						}
						res(true);
					});
				}
		},
			{
				type: 'checkbox',
				message: 'Select the builders',
				name: 'builders',
				choices: [
					{
						name: 'css',
						checked: true
					},
					{
						name: 'js',
						checked: true
					},
					{
						name: 'font',
						checked: true
					},
					{
						name: 'svg',
						checked: true
					},
					{
						name: 'img',
						checked: true
					},
				],
				filter: choices => {
					return new Promise((res, rej) => {
						function ob(n) {
						  return {[n]: true};
						}

						choices = _.flatMap(choices, ob);
						res(choices);
					});
				}
		},
		];

		inq.prompt(questions).then((answers) => {
			let data = answers;
			data.bs = _.has(answers.modules, 'bs');
			data.server = _.has(answers.modules, 'server');
			_.unset(data, 'modules');		
			fs.outputJson(paths.project + '/src/config.json', answers, err => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	});
};
