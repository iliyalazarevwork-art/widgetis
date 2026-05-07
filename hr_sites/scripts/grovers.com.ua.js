// source: https://grovers.com.ua/
// extracted: 2026-05-07T21:19:45.439Z
// scripts: 6

// === script #1 (length=2663) ===
if (typeof window.top.__vbox_invoke_ids === "undefined") {
    window.top.__vbox_invoke_ids = 100;
    window.top.__vbox_callback_ids={};
}

function __vbox_callback__(invoke_id, json) {
    if (typeof window.top.__vbox_callback_ids[invoke_id] === "function") {
        json = vbox.decode(json);
        window.top.__vbox_callback_ids[invoke_id](json);
    }

    if (typeof window.top.__vbox_callback_ids[invoke_id] !== "undefined") {
        delete window.top.__vbox_callback_ids[invoke_id];
    }
}

(function() {
    if (window.VBox) {
        return;
    }
    function __getInvokeId() {
        var invoke_id = new Date().getTime();
        invoke_id += window.top.__vbox_invoke_ids++;
        return invoke_id;
    }

    var VBox = window.VBox = {
        Request:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"paySign",JSON.stringify(req));
        },
        VerifyString:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"verify",JSON.stringify(req));
        },
        ShowWindow:function(show) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"show",JSON.stringify({show:show}));
        },
        connect:function(req) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"connect",JSON.stringify({req:req}));
        }
    };

    var readyEvent = document.createEvent('Events');
    readyEvent.initEvent('VBoxReady');
    readyEvent.VBox = VBox;
    document.dispatchEvent(readyEvent);
})();

(function() {
    setTimeout(function(){
        if (typeof vbox != "undefined") {
            var responseHtml = vbox.getRuntimeJs();;
            var iframes = window.document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; ++i) {
                var frame = iframes[i];
                frame.onload = function () {
                    var scriptele = frame.contentDocument.createElement("script");
                    scriptele.innerHTML = responseHtml;
                    frame.contentDocument.body.appendChild(scriptele);
                };
                frame.onload();
            }
        }
    }, 500);
})();

// === script #2 (length=2663) ===
if (typeof window.top.__vbox_invoke_ids === "undefined") {
    window.top.__vbox_invoke_ids = 100;
    window.top.__vbox_callback_ids={};
}

function __vbox_callback__(invoke_id, json) {
    if (typeof window.top.__vbox_callback_ids[invoke_id] === "function") {
        json = vbox.decode(json);
        window.top.__vbox_callback_ids[invoke_id](json);
    }

    if (typeof window.top.__vbox_callback_ids[invoke_id] !== "undefined") {
        delete window.top.__vbox_callback_ids[invoke_id];
    }
}

(function() {
    if (window.VBox) {
        return;
    }
    function __getInvokeId() {
        var invoke_id = new Date().getTime();
        invoke_id += window.top.__vbox_invoke_ids++;
        return invoke_id;
    }

    var VBox = window.VBox = {
        Request:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"paySign",JSON.stringify(req));
        },
        VerifyString:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"verify",JSON.stringify(req));
        },
        ShowWindow:function(show) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"show",JSON.stringify({show:show}));
        },
        connect:function(req) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"connect",JSON.stringify({req:req}));
        }
    };

    var readyEvent = document.createEvent('Events');
    readyEvent.initEvent('VBoxReady');
    readyEvent.VBox = VBox;
    document.dispatchEvent(readyEvent);
})();

(function() {
    setTimeout(function(){
        if (typeof vbox != "undefined") {
            var responseHtml = vbox.getRuntimeJs();;
            var iframes = window.document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; ++i) {
                var frame = iframes[i];
                frame.onload = function () {
                    var scriptele = frame.contentDocument.createElement("script");
                    scriptele.innerHTML = responseHtml;
                    frame.contentDocument.body.appendChild(scriptele);
                };
                frame.onload();
            }
        }
    }, 500);
})();

// === script #3 (length=2663) ===
if (typeof window.top.__vbox_invoke_ids === "undefined") {
    window.top.__vbox_invoke_ids = 100;
    window.top.__vbox_callback_ids={};
}

function __vbox_callback__(invoke_id, json) {
    if (typeof window.top.__vbox_callback_ids[invoke_id] === "function") {
        json = vbox.decode(json);
        window.top.__vbox_callback_ids[invoke_id](json);
    }

    if (typeof window.top.__vbox_callback_ids[invoke_id] !== "undefined") {
        delete window.top.__vbox_callback_ids[invoke_id];
    }
}

(function() {
    if (window.VBox) {
        return;
    }
    function __getInvokeId() {
        var invoke_id = new Date().getTime();
        invoke_id += window.top.__vbox_invoke_ids++;
        return invoke_id;
    }

    var VBox = window.VBox = {
        Request:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"paySign",JSON.stringify(req));
        },
        VerifyString:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"verify",JSON.stringify(req));
        },
        ShowWindow:function(show) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"show",JSON.stringify({show:show}));
        },
        connect:function(req) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"connect",JSON.stringify({req:req}));
        }
    };

    var readyEvent = document.createEvent('Events');
    readyEvent.initEvent('VBoxReady');
    readyEvent.VBox = VBox;
    document.dispatchEvent(readyEvent);
})();

(function() {
    setTimeout(function(){
        if (typeof vbox != "undefined") {
            var responseHtml = vbox.getRuntimeJs();;
            var iframes = window.document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; ++i) {
                var frame = iframes[i];
                frame.onload = function () {
                    var scriptele = frame.contentDocument.createElement("script");
                    scriptele.innerHTML = responseHtml;
                    frame.contentDocument.body.appendChild(scriptele);
                };
                frame.onload();
            }
        }
    }, 500);
})();

// === script #4 (length=2663) ===
if (typeof window.top.__vbox_invoke_ids === "undefined") {
    window.top.__vbox_invoke_ids = 100;
    window.top.__vbox_callback_ids={};
}

function __vbox_callback__(invoke_id, json) {
    if (typeof window.top.__vbox_callback_ids[invoke_id] === "function") {
        json = vbox.decode(json);
        window.top.__vbox_callback_ids[invoke_id](json);
    }

    if (typeof window.top.__vbox_callback_ids[invoke_id] !== "undefined") {
        delete window.top.__vbox_callback_ids[invoke_id];
    }
}

(function() {
    if (window.VBox) {
        return;
    }
    function __getInvokeId() {
        var invoke_id = new Date().getTime();
        invoke_id += window.top.__vbox_invoke_ids++;
        return invoke_id;
    }

    var VBox = window.VBox = {
        Request:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"paySign",JSON.stringify(req));
        },
        VerifyString:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"verify",JSON.stringify(req));
        },
        ShowWindow:function(show) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"show",JSON.stringify({show:show}));
        },
        connect:function(req) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"connect",JSON.stringify({req:req}));
        }
    };

    var readyEvent = document.createEvent('Events');
    readyEvent.initEvent('VBoxReady');
    readyEvent.VBox = VBox;
    document.dispatchEvent(readyEvent);
})();

(function() {
    setTimeout(function(){
        if (typeof vbox != "undefined") {
            var responseHtml = vbox.getRuntimeJs();;
            var iframes = window.document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; ++i) {
                var frame = iframes[i];
                frame.onload = function () {
                    var scriptele = frame.contentDocument.createElement("script");
                    scriptele.innerHTML = responseHtml;
                    frame.contentDocument.body.appendChild(scriptele);
                };
                frame.onload();
            }
        }
    }, 500);
})();

// === script #5 (length=2663) ===
if (typeof window.top.__vbox_invoke_ids === "undefined") {
    window.top.__vbox_invoke_ids = 100;
    window.top.__vbox_callback_ids={};
}

function __vbox_callback__(invoke_id, json) {
    if (typeof window.top.__vbox_callback_ids[invoke_id] === "function") {
        json = vbox.decode(json);
        window.top.__vbox_callback_ids[invoke_id](json);
    }

    if (typeof window.top.__vbox_callback_ids[invoke_id] !== "undefined") {
        delete window.top.__vbox_callback_ids[invoke_id];
    }
}

(function() {
    if (window.VBox) {
        return;
    }
    function __getInvokeId() {
        var invoke_id = new Date().getTime();
        invoke_id += window.top.__vbox_invoke_ids++;
        return invoke_id;
    }

    var VBox = window.VBox = {
        Request:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"paySign",JSON.stringify(req));
        },
        VerifyString:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"verify",JSON.stringify(req));
        },
        ShowWindow:function(show) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"show",JSON.stringify({show:show}));
        },
        connect:function(req) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"connect",JSON.stringify({req:req}));
        }
    };

    var readyEvent = document.createEvent('Events');
    readyEvent.initEvent('VBoxReady');
    readyEvent.VBox = VBox;
    document.dispatchEvent(readyEvent);
})();

(function() {
    setTimeout(function(){
        if (typeof vbox != "undefined") {
            var responseHtml = vbox.getRuntimeJs();;
            var iframes = window.document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; ++i) {
                var frame = iframes[i];
                frame.onload = function () {
                    var scriptele = frame.contentDocument.createElement("script");
                    scriptele.innerHTML = responseHtml;
                    frame.contentDocument.body.appendChild(scriptele);
                };
                frame.onload();
            }
        }
    }, 500);
})();

// === script #6 (length=2663) ===
if (typeof window.top.__vbox_invoke_ids === "undefined") {
    window.top.__vbox_invoke_ids = 100;
    window.top.__vbox_callback_ids={};
}

function __vbox_callback__(invoke_id, json) {
    if (typeof window.top.__vbox_callback_ids[invoke_id] === "function") {
        json = vbox.decode(json);
        window.top.__vbox_callback_ids[invoke_id](json);
    }

    if (typeof window.top.__vbox_callback_ids[invoke_id] !== "undefined") {
        delete window.top.__vbox_callback_ids[invoke_id];
    }
}

(function() {
    if (window.VBox) {
        return;
    }
    function __getInvokeId() {
        var invoke_id = new Date().getTime();
        invoke_id += window.top.__vbox_invoke_ids++;
        return invoke_id;
    }

    var VBox = window.VBox = {
        Request:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"paySign",JSON.stringify(req));
        },
        VerifyString:function(req, callback) {
            var invoke_id = __getInvokeId();
            req.url = window.location.href;
            window.top.__vbox_callback_ids[invoke_id] = callback;
            vbox.send(invoke_id,"verify",JSON.stringify(req));
        },
        ShowWindow:function(show) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"show",JSON.stringify({show:show}));
        },
        connect:function(req) {
            var invoke_id = __getInvokeId();
            window.top.__vbox_callback_ids[invoke_id] = function(){};
            vbox.send(invoke_id,"connect",JSON.stringify({req:req}));
        }
    };

    var readyEvent = document.createEvent('Events');
    readyEvent.initEvent('VBoxReady');
    readyEvent.VBox = VBox;
    document.dispatchEvent(readyEvent);
})();

(function() {
    setTimeout(function(){
        if (typeof vbox != "undefined") {
            var responseHtml = vbox.getRuntimeJs();;
            var iframes = window.document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; ++i) {
                var frame = iframes[i];
                frame.onload = function () {
                    var scriptele = frame.contentDocument.createElement("script");
                    scriptele.innerHTML = responseHtml;
                    frame.contentDocument.body.appendChild(scriptele);
                };
                frame.onload();
            }
        }
    }, 500);
})();
