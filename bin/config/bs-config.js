module.exports = {
    'files': ['!node_modules', '../**/*.php','!../**/includes', '!**/*.*', '../**/*.html'],
    'server': false,
    'proxy': null,
    'notify': {
        'styles': [
            'position: fixed;',
            'right:0;',
            'bottom:0px;',
            'max-width: 230px',
            'color: #FFBBBB',
            'font-family: Calibri;',
            'font-size: 18px;',
            'padding: 30px 20px;',
            'letter-spacing: 1px;',
            'text-shadow: 0 0 0 black;',
            'background-color: rgba(50, 50, 60, 0.9);',
            'box-shadow: 0 5px 8px rgba(0, 0, 0, 0.5);',
            'z-index:999;',
            'border-radius: 2px',
            'pointer-events: none'
        ]
    }
};
