#TDSoft base dev env and runner
## v1.3.2 ##

## What purpose does it serve? ##
Aion is a task runner/ build tool that has wide range of application, JS es6 compilation, less with globs and postcss plugin, images/sprites minifcation, svg compilation, browsersync, server

## What does the name mean? ##
Aion is a Hellenistic deity associated with time, the orb or circle encompassing the universe. The "time" represented by Aion is unbounded, in contrast to Chronos as empirical time divided into past, present, and future. Highest god, creator of everything.



## How do I set up? ###

### Manual installation:###
* open console in build-runner folder and type in "npm start"
* in projects folder you will find src/config.json, edit that file
    * bs- @ bool enable browsersync
    * server - @ bool create node server
    * path - url in browser for proxy/server to run
    * name - project name/project directory
   
### Aether project manager usage ###
   Aion is meant to be setup with Aether project manager.

### Running a build ###
npm run build - to build all
npm run build:builder_type - in place of builder_type type in css, js etc.
to load different config, add --config "path/to/config.json" flag in command. JSON has to correspond to values in object inside bin/config/paths.js e.g. :
{
	"project": "../../some_project"
}