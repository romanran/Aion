const updateRule = require('postcss-sprites/lib/core').updateRule;
//postcss options
module.exports = {
	stylesheetPath: paths.project + '/dist/css',
	spritePath: paths.project + '/dist/images/sprites',
	basePath: paths.project,
	relativeTo: 'file',
	filterBy: function (image) {
		if ((/^.*\/sprites\/.*\.+(jpg|png)$/i.test(image.url))) {
			return Promise.resolve();
		}
		return Promise.reject();
	},
	hooks: {
		onUpdateRule: function (rule, token, image) {
			let backgroundSizeX = (image.spriteWidth / image.coords.width) * 100;
			let backgroundSizeY = (image.spriteHeight / image.coords.height) * 100;
			let backgroundPositionX = (image.coords.x / (image.spriteWidth - image.coords.width)) * 100;
			let backgroundPositionY = (image.coords.y / (image.spriteHeight - image.coords.height)) * 100;

			backgroundSizeX = isNaN(backgroundSizeX) ? 0 : backgroundSizeX;
			backgroundSizeY = isNaN(backgroundSizeY) ? 0 : backgroundSizeY;
			backgroundPositionX = isNaN(backgroundPositionX) ? 0 : backgroundPositionX;
			backgroundPositionY = isNaN(backgroundPositionY) ? 0 : backgroundPositionY;

			let backgroundImage = this.postcss.decl({
				prop: 'background-image',
				value: 'url(' + image.spriteUrl + ')'
			});

			let backgroundSize = this.postcss.decl({
				prop: 'background-size',
				value: backgroundSizeX + '% ' + backgroundSizeY + '%'
			});

			let backgroundPosition = this.postcss.decl({
				prop: 'background-position',
				value: backgroundPositionX + '% ' + backgroundPositionY + '%'
			});

			rule.insertAfter(token, backgroundImage);
			rule.insertAfter(backgroundImage, backgroundPosition);
			rule.insertAfter(backgroundPosition, backgroundSize);

			['width', 'height'].forEach(prop => {
				rule.insertAfter(rule.last, this.postcss.decl({
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
