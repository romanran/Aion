# Aion v1.5.1 build tool / task runner 

## What purpose does it serve? 
Aion is a task runner/ build tool that has wide range of application, JS es6 compilation, less with globs and postcss plugins, images/sprites minifcation, svg compilation, browsersync

## What does the name mean? 
Aion is a Hellenistic deity associated with time, the orb or circle encompassing the universe. The "time" represented by Aion is unbounded, in contrast to Chronos as empirical time divided into past, present, and future. Highest god, creator of everything.



## How do I set up? 

### Manual installation: 
* open console in build-runner folder and type in "npm start"
* in projects folder you will find src/config.json, edit that file
    * bs- @bool enable browsersync
    * server - @bool create node server
    * path - @string url in browser for proxy/server to run
    * name - @string project name/project directory
   
### Aether project manager usage 
   Aion is meant to be setup with Aether project manager.

### Running a build 
```npm run build - to build all```
node bin/operators/build:builder_type - in place of builder_type type in css, js etc.
to load different config, add ```--config "path/to/config.json"``` flag in command. JSON has to correspond to values in object inside bin/config/paths.js e.g. :

    {
    	"project": "../../some_project"
    }

or

    node bin/operators/build --project "path/to/project"

### Adding separate LESS/POSTCSS plugins per project 
Inside ```/src/aion-plugins/css/plugins.js``` you can add any plugin accordingly to its documentation. Array will be merged with the base plugins.