class Interface {
    constructor() {
        const readline = require('readline');
        this.util = require('util');
        const events = require('events');

        this.completions = ['s', 'stop', 'build'];

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: this.completer.bind(this)
        });
        this.emitter = new events.EventEmitter();
    }

    start() {

        this.rl.setPrompt("> ", 2);
        this.rl.on("line", this.command.bind(this));
        this.rl.on('close', function () {
            return process.exit(1);
        });

        this.rl.on("SIGINT", () => {
            this.rl.cleathis.rline();
            this.rl.question("Confirm exit : ", answer => {
                return (answer.match(/^o(ui)?$/i) || answer.match(/^y(es)?$/i)) ? process.exit(1) : this.rl.output.write("> ");
            });
        });
        this.rl.prompt();
        this.hookIntoConsole();
    }

    command(line) {
        if (_.findIndex(this.completions, line) >= 0) {
            console.warn(('command "' + line + '" doesn\'t exist').yellow);
        } else {
            this.emitter.emit('input', line);
        }
        this.rl.prompt();
    }

    log(type, args) {
        var t = Math.ceil((this.rl.line.length + 3) / process.stdout.columns);
        var text = this.util.format.apply(console, args);
        this.rl.output.write("\n\x1B[" + t + "A\x1B[0J");
        this.rl.output.write(text + "\n");
        this.rl.output.write(Array(t).join("\n\x1B[E"));
        this.rl._refreshLine();
    }

    hookIntoConsole() {
        console.log = function () {
            this.log("log", arguments);
        }.bind(this);
        console.warn = function () {
            this.log("warn", arguments);
        }.bind(this);
        console.info = function () {
            this.log("info", arguments);
        }.bind(this);
        console.error = function () {
            this.log("error", arguments);
        }.bind(this);
    }

    completer(line) {
        let hits = this.completions.filter(c => {
            return c.indexOf(line) == 0;
        });

        if (hits.length == 1) {
            return [hits, line];
        } else {
            console.log("Suggest :");
            let list = "",
                l = 0,
                c = "",
                t = hits.length ? hits : this.completions;
            for (let i = 0; i < t.length; i++) {
                c = t[i].replace(/(\s*)$/g, "")
                if (list != "") {
                    list += ", ";
                }
                if (((list + c).length + 4 - l) > process.stdout.columns) {
                    list += "\n";
                    l = list.length;
                }
                list += c;
            }
            console.log(list + "\n");
            return [hits, line];
        }
    }
}

module.exports = Interface;
