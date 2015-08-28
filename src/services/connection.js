class Connection {
    constructor($log, $rootScope, $websocket, $mdToast) {
        this.dataStream = null;
        this.isConnected = false;
        this.loginFailed = false;
        this.$log = $log;
        this.$rootScope = $rootScope;
        this.$websocket = $websocket;
        this.$mdToast = $mdToast;
    }

    connect(host, port, password) {
        var ctrl = this,
            $rootScope = this.$rootScope;
        ctrl.dataStream = this.$websocket("ws://" + host + ":" + port);


        let fullResponse = {
            isStarted: false,
            value: ""

        };
        ctrl.dataStream.onMessage(function (message) {
            var response = message.data;

            // Parse various kinds of responses
            if (response === `Login by sending 'login!<PASSWORD>'`) {
                // This is the response on the first connection, do
                // nothing
                ctrl.isConnected = false;
            } else if (response === "Not authorized, login first by" +
                ` sending 'login!<PASSWORD>'`) {
                ctrl.isConnected = false;
                ctrl.loginFailed = true;
            } else if (response == "$") {
                // Here's the fun stuff, handle a series of characters in
                // the response, starting and finishing with $, and
                // treat those in between as a JSON stream. Gotta fix
                // the server plugin.
                if (fullResponse.isStarted) {
                    // We received our second $, let's emit a message
                    $rootScope.$broadcast("JsonResponse", JSON.parse(fullResponse.value));
                    fullResponse.isStarted = false;
                    fullResponse.value = "";
                } else {
                    fullResponse.isStarted = true;
                }
            } else if (fullResponse.isStarted && response != "$") {
                fullResponse.value += response;
            } else {
                ctrl.isConnected = true;
                ctrl.loginFailed = false;
                $rootScope.$broadcast("EvalResponse", response);
            }
        });
        ctrl.dataStream.onOpen(function () {
            ctrl.dataStream.send("login!" + password);
        });
        ctrl.dataStream.onClose((event) => this.onClose(event));
    }

    onClose(event) {
        this.isConnected = false;
        let reason;
        if (event.code == 1000)
            reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
        else if (event.code == 1001)
            reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
        else if (event.code == 1002)
            reason = "An endpoint is terminating the connection due to a protocol error";
        else if (event.code == 1003)
            reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
        else if (event.code == 1004)
            reason = "Reserved. The specific meaning might be defined in the future.";
        else if (event.code == 1005)
            reason = "No status code was actually present.";
        else if (event.code == 1006)
            reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
        else if (event.code == 1007)
            reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
        else if (event.code == 1008)
            reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
        else if (event.code == 1009)
            reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
        else if (event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
            reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
        else if (event.code == 1011)
            reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
        else if (event.code == 1015)
            reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
        else
            reason = "Unknown reason";
        this.toast("Connection closed: " + reason);

    }

    send(codeSnippet) {
        var ctrl = this,
            $mdToast = this.$mdToast;
        if (this.dataStream == null) {
            this.toast("Not connected");
        } else {
            ctrl.dataStream.send(codeSnippet);
        }
    }

    toast(message) {
        this.$mdToast.show(this.$mdToast.simple().content(message));
    }

}

Connection.$inject = ["$log", "$rootScope", "$websocket", "$mdToast"];

export default Connection;