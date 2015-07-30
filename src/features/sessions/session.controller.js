import $ from "jquery";
require("../../vendor/jqconsole");

export default class Controller {
    constructor($log, $rootScope, connection) {
        var ctrl = this;
        this.$log = $log;
        this.$rootScope = $rootScope;
        this.connection = connection;
        this.codeSnippet = "from mcapi import *\nyell('HOWDY')";
        this.jqconsole = $("#console").jqconsole("Hi\n", "\n>>>");


        function aceLoaded(_editor) {
            _editor.commands.addCommand({
                name: "Execute",
                bindKey: {
                    mac: "Command-Shift-Up",
                    win: "Alt-Shift-Up"
                },
                exec: function () {
                    ctrl.run(ctrl.snippet);
                }
            });
        }

        function aceChanged() {
            //console.debug("ace was changed");
        }

        this.aceConfig = {
            useWrapMode: true,
            mode: "python",
            onLoad: aceLoaded,
            onChange: aceChanged
        };

        // Handle non-login websocket responses, meaning, EvalResponse
        $rootScope.$on(
            "EvalResponse",
            function (event, response) {
                ctrl.jqconsole['Write'](
                    response.replace("\r", ""), "jqconsole-output");
            });

        var startPrompt = function () {
            // Start the prompt with history enabled.
            ctrl.jqconsole["Prompt"](true, function (input) {
                // Output input with the class jqconsole-output.
                ctrl.jqconsole["Write"](input + "\n", "jqconsole-output");
                // Restart the prompt.
                startPrompt();
            });
        };
        startPrompt();
    }

    run() {
        this.connection.send(this.codeSnippet);
    }
}
