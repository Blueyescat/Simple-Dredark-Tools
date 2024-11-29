"use strict";

let theWs, currTurretMode, chatContent = document.getElementById("chat-content");
const CHAT_PREFIX = `<b>[<b style="color:#00b1aa" title="Simple Dredark Tools extension">SDT</b>]</b> `

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
window.addEventListener("message", event => {
	if (event.origin !== window.location.origin)
		return;
	if (event.data.message == "sdt-sendToWs") {
		if (!theWs) return;
		theWs.send(event.data.wsData);
	} else if (event.data.message == "sdt-enableTurretModeHotkey") {
		enableTurretModeHotkey(event.data.hotkey);
	}
});

function writeChat(html, time) {
	const p = document.createElement("p")
	p.className = "recent"
	p.innerHTML = html
	chatContent.append(p)
	setTimeout(() => {
		p.classList.remove("recent")
	}, time);
	return p
}

let turretModeHotkeyEnabled, turretModeHotkey;
async function enableTurretModeHotkey(hotkey) {	
	turretModeHotkey = hotkey
	if (turretModeHotkeyEnabled) return;
	turretModeHotkeyEnabled = true;

	const uiLeft = document.getElementById("new-ui-left"),
		settingsStorageKey = "dredark_user_settings";
	uiLeft.style.opacity = 0;
	toggleUI("settings");

	let select;
	for (let i = 0; i < 1000; i++) { // just in case
		select = Array.from(uiLeft.querySelectorAll(".window select")).find(select => 
			Array.from(select.options).some(option => option.textContent.includes("Continuous Fire"))
		);
		if (select) break;
		await new Promise(r => setTimeout(r));
	}
	toggleUI("settings");
	uiLeft.style.removeProperty("opacity");

	const updateCurMode = () => currTurretMode = JSON.parse(localStorage.getItem(settingsStorageKey)).turret_mode;
	const origSetItem = localStorage.setItem;
	localStorage.setItem = (k, v) => {
		origSetItem.call(localStorage, k, v);
		if (k == settingsStorageKey)
			updateCurMode();
	}
	updateCurMode();
	const f = select.l.inputfalse;

	let lastChatInfo;
	window.addEventListener("keyup", e => {
		if (turretModeHotkey && document.activeElement == document.body && (e.code == turretModeHotkey || e.key == turretModeHotkey || e.keyCode == turretModeHotkey)) {
			f({ target: { value: currTurretMode ^= 1 } });
			lastChatInfo?.classList.remove("recent");
			lastChatInfo = writeChat(`${CHAT_PREFIX}Cannon firing mode: ${currTurretMode == 0 ? "Continuous" : "Volley"}`, 3000);
		}
	});
}
