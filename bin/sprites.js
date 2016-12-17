//console.log("--SPRITE START--");
var m = require("../bin/main.js");
var postcss = require('postcss');
var sprites = require('postcss-sprites');
var main = require("../bin/main.js");
var updateRule = require('postcss-sprites/lib/core').updateRule;

const util = require('util');

var opts = {
	stylesheetPath: '../dist/css',
	spritePath: '../dist/images/sprites',
	basePath: '../',
	relativeTo: 'file',
	filterBy: function (image) {
		if ((/^.*\/sprites\/.*\.+(jpg|png)$/i.test(image.url))) {
			return Promise.resolve();
		}
		return Promise.reject();
	},
	hooks: {
		onUpdateRule: function (rule, token, image) {
			var backgroundSizeX = (image.spriteWidth / image.coords.width) * 100;
			var backgroundSizeY = (image.spriteHeight / image.coords.height) * 100;
			var backgroundPositionX = (image.coords.x / (image.spriteWidth - image.coords.width)) * 100;
			var backgroundPositionY = (image.coords.y / (image.spriteHeight - image.coords.height)) * 100;

			backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX;
			backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY;
			backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX;
			backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY;

			var backgroundImage = postcss.decl({
				prop: 'background-image',
				value: 'url(' + image.spriteUrl + ')'
			});

			var backgroundSize = postcss.decl({
				prop: 'background-size',
				value: backgroundSizeX + '% ' + backgroundSizeY + '%'
			});

			var backgroundPosition = postcss.decl({
				prop: 'background-position',
				value: backgroundPositionX + '% ' + backgroundPositionY + '%'
			});

			rule.insertAfter(token, backgroundImage);
			rule.insertAfter(backgroundImage, backgroundPosition);
			rule.insertAfter(backgroundPosition, backgroundSize);

			['width', 'height'].forEach(function (prop) {
				rule.insertAfter(rule.last, postcss.decl({
					prop: prop,
					value: image.coords[prop] + 'px'
				}));
			});
			updateRule(rule, token, image);
		}
	},
	spritesmith: {
		padding: 5
	}
};

process.stdin.setEncoding('utf-8');
var stdin = process.openStdin();
var data = "";

stdin.on('data', function(chunk) {
  data += chunk;
});
stdin.on('end', function() {
	process.stdout.write("");
	var pp = postcss([sprites(opts)]);
	pp.process(data,{
		from: 'LESS/custom.less',
		to: '../dist/css/custom.min.css'
	})
	.then(function(result) {
		process.env.zTDS={messages:result.messages};
		process.env.zspriter_message=result.messages;
		process.stdout.write(result.css);
//		m.runCmd("echo kupe");
//		process.on('exit', function(code) {
//		   console.log(result.error);
//		});
	});
});
