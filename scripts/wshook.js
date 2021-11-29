"use strict";

let theWs;

const nativeWebSocket = window.WebSocket;
window.WebSocket = function(...args) {
    let ws = new nativeWebSocket(...args);
    if (!ws.url.includes(":4000")) {
        ws.addEventListener("open", () => {
            window.postMessage({message: "sdt-wsStatus", status: true}, window.location.origin);
            theWs = ws;
            theWs.addEventListener("close", () => {
                window.postMessage({message: "sdt-wsStatus", status: false}, window.location.origin);
            });
        });
        window.WebSocket = nativeWebSocket;
    }
    return ws;
};
// ⚠️ If you're going to make things such as rainbow skin using WebSockets,
// I recommend you to don't actually use it and don't share,
// because that will eventually annoy the game developer.
window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin)
        return;
    if (event.data.message == "sdt-sendToWs") {
        if (!theWs) return;
        theWs.send(event.data.wsData);
    }
});
