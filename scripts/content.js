"use strict";

const regexHtmlEntities = /[&<>"'`=\/]/g;
const regexFileExtensions = "midi?|mp3|mpa|ogg|wav|wma|7z|deb|pkg|rar|gz|z|zip|bin|dmg|iso|csv|dat|dbf?|log|mdb|sav|sql|tar|xml|apk|bat|bin|exe|jar|msi|wsf|fnt|fon|otf|ttf|bmp|gif|ico|jpe?g|png|psd|svg|css|html?|js|php|py|c|class|java|cs|sh|swift|ico|sys|tmp|dll|icns|avi|flv|mkv|mov|mp4|mpe?g|swf|wmv|docx?|xlsx?|pptx?|pps|rtf|txt|pdf";
const regexUrl = new RegExp(String.raw`(?<!@[^\s]*|<[^>]*)(?:https?:)?(?:(?:\/|&#x2F;)(?:\/|&#x2F;))?([\w.-]+[\w.-]\w\.(?!(?:${regexFileExtensions}|no)(?!\w))[a-zA-Z-_][\w\-_~:/?#[\]@!\$&'\(\)\*\+%,;=.]+)(?<!\.)`, "gi");
const regexUserMsg = /^(?:.*] )?(.*): (.+)$/m;
const regexSystemMsg = /^\[SYSTEM\] (.+)$/mi;
const regexItemBrackets = /\s?\(.*\)/;

const sfxBeep = new Audio(chrome.runtime.getURL("sfx/beep.mp3"));
sfxBeep.loop = false;

var styleAllowInteractingChatAnchors = $("<style>#chat.closed a { pointer-events: auto !important; }</style>");
var styleCrewControlWarning = $(`<style>#team_players_inner::after {
    content: "Be careful who you trust! Other players may grief, scam, or steal from you. They may act friendly and betray you later. Moderation can't resolve most cases.";
    color: orange; font-size: .9em; padding: 1em 0.5em; position: absolute; text-align: center; }</style>`);

let accountInfo = null

/* Saved outfits */
function setInGameOutfit(data, isInGame) {
	let currentSettings = { player_appearance: {} };
	try { currentSettings.player_appearance = JSON.parse(window.localStorage.getItem("dredark_user_settings")).player_appearance; } catch {}
	let appearanceSetting = Object.assign(currentSettings.player_appearance, {
		"color_body": hexColorToInt(data[3]),
		"color_feet": hexColorToInt(data[5]),
		"color_legs": hexColorToInt(data[4]),
		"color_hair": hexColorToInt(data[1]),
		"color_skin": hexColorToInt(data[2]),
		"style_hair": parseInt(data[0])
	});
	if (isInGame) {
		let wsData = {type: 7, outfit: appearanceSetting};
		window.postMessage({message: "sdt-sendToWs", wsData: msgpack.encode(wsData)}, window.location.origin);
	} else {
		let settings;
		try { settings = JSON.parse(window.localStorage.getItem("dredark_user_settings")); }
		catch { settings = {} };
		settings["player_appearance"] = appearanceSetting;
		window.localStorage.setItem("dredark_user_settings", JSON.stringify(settings));
	}
}
/* Saved outfits end */

/* Auto setter start */
var autoSetterEnabled, autoSetterHotkey, autoSetterHotkeyDown,
	autoSetterProperties = {
		signText: -1,
		doorSpawnRestriction: -1
	};

// == main ==
chrome.runtime.sendMessage({message: "getAutoSetterState"}, function(response) {
	autoSetterEnabled = response.state;
});

chrome.runtime.sendMessage({message: "getAutoSetterHotkey"}, function(response) {
	autoSetterHotkey = response.code;
});

$(window).on("keydown keyup", function(event) {
	if (autoSetterEnabled && document.activeElement == document.body
		&& (event.code == autoSetterHotkey || event.key == autoSetterHotkey || event.keyCode == autoSetterHotkey)
	)
		autoSetterHotkeyDown = event.type == "keydown";
});

// == properties ==
(() => {
	const keys = Object.keys(autoSetterProperties);
	for (const key of keys) {
		chrome.runtime.sendMessage({message: "getAutoSetterProperty", property: key}, function(response) {
			autoSetterProperties[key] = response.value;
			if (key == keys[keys.length - 1])
				autoSetterPropertiesLoaded();
		});
	}
})();

function autoSetterPropertiesLoaded() {
	if (autoSetterProperties.doorSpawnRestriction != -1)
		startTipListObserver();
}

// gui listener
var pui = $("#pui");
var signPui;
var dsatoolsLinkAdded;
var puiObserver = new MutationObserver(async function() {
	if (!pui.is(":hidden")) {
		if (!dsatoolsLinkAdded && pui.text().includes("Blueprint Scanner")) {
			const div = pui.find("h2+div");
			var span = $(/*html*/`<span style="float:right;font-size:0.9em;margin-bottom:4px">
<img src="https://dsa.fr.to/assets/icons/144.svg" style="width:1.3em;vertical-align:middle;">
<a style="text-decoration:underline;cursor:pointer;color:#1cb2fd;">Load on Blueprint Editor</a>
<div class="tooltip dark" style="position:fixed;font-size:1em;width:220px;transform:translate(20px,-25%);">Click to load the blueprint text on DSA Tools - Blueprint Editor, an app by the author of the Simple Dredark Tools extension.</div>
</span>`);
			span.on("click", function() {
				let str = div.find("textarea").val().trim();				
				if (str) {
					if (str.substring(0, 4).toUpperCase() == "DSA:")
						str = str.substring(4)
					window.open("https://dsa.fr.to/bpeditor?sdt&load=" + str, "_blank").focus();
				}
			})
			div.prepend(span);			
			dsatoolsLinkAdded = true;
			return;
		}
		if (!autoSetterEnabled || !autoSetterHotkeyDown)
			return;
		var close;
		if (pui == signPui || pui.text().includes("Sign Text")) {
			signPui = pui;
			var set;
			if (autoSetterProperties.signText != -1) {
				pui.hide();
				var input = pui.find("div input").eq(0);
				input.val(autoSetterProperties.signText);
				input[0].dispatchEvent(new Event("input"));
				set = true;
			}
			if (autoSetterProperties.signShowTextMode != -1) {
				if (!set) pui.hide();
				var select = pui.find("div select").eq(0);
				select.val(autoSetterProperties.signShowTextMode);
				select[0].dispatchEvent(new Event("change"));
				set = true;
			}
			if (set) {
				await sleep(1);
				pui.find("div div button.btn-green").eq(0).click();
			}
		}
		if (close)
			pui.find("div.close button").click();
	}
});

async function setFilters(inputs, settings) {
	for (const [index, input] of $.makeArray(inputs).entries()) {
		if (settings[index].state != true) continue;
		let nameSetting = settings[index].name.toLowerCase().trim();
		if (nameSetting == "") nameSetting = "no item";
		if (nameSetting == "fuel") nameSetting = "thruster fuel";
		input.dispatchEvent(new Event("focus"));
		for (let i = 0; i < 500; i++) {
			let itemPicker = $(input).parent().find(".item-picker");
			if (itemPicker.length) {
				await pickItem(input, itemPicker, nameSetting);
				break;
			}
			await sleep(1);
		}
	}

	async function pickItem(input, itemPicker, filter) {
		const items = itemPicker.find("div span");
		const itemNames = items.map(function() {
			return $(this).text().toLowerCase();
		}).get();
		let selectedIndex = undefined;
		itemNames.some((name, i) => {
			if (name == filter) {
				selectedIndex = i; return true;
			}
		});
		if (!selectedIndex) {
			itemNames.some((name, i) => {
				name = name.replace(regexItemBrackets, "");
				if (name == filter) {
					selectedIndex = i; return true;
				}
			});
		}
		if (!selectedIndex) {
			itemNames.some((name, i) => {
				name = name.replace(regexItemBrackets, "");
				if (name.endsWith(filter) || name.startsWith(filter)) {
					selectedIndex = i; return true;
				}
			});
		}
		if (!selectedIndex) {
			itemNames.some((name, i) => {
				if (name.includes(filter)) {
					selectedIndex = i; return true;
				}
			});
		}
		if (selectedIndex != undefined) {
			select(input, items.eq(selectedIndex));
		}
	}

	async function select(input, item) {
		item.parent()[0].dispatchEvent(new Event("mousedown"));
		input.dispatchEvent(new Event("blur"));
		for (let i = 0; i < 500; i++) {
			if ($(input).val() == item.text())
				break;
			await sleep(1);
		}
	}
}

// tip list listener (context menu)
var tipListObserver = new MutationObserver(function() {
	if (!autoSetterEnabled || !autoSetterHotkeyDown)
		return;
	if ($(".tip-list").length) {
		var tipList = $(".tip-list");
		if (tipList.text().includes("Restrict to")) {
			if (autoSetterProperties.doorSpawnRestriction != -1)
				tipList.find("div").eq(autoSetterProperties.doorSpawnRestriction).click();
		}
	}
});

function startTipListObserver() {
	tipListObserver.observe(document, { subtree: true, childList: true });
}

if (pui.length) {
	puiObserver.observe(pui[0], {
		attributes: true,
		attributeFilter: ["style"]
	});
}
/* Auto setter end */

/* Chat/MOTD stuff start */
var options = {
	makeChatUrlsClickable: undefined, allowInteractingChatUrlsWithoutFocus: undefined,
	chatHighlighterState: undefined, chatHighlighterSoundState: undefined, chatHighlighterTexts: undefined,
	makeMotdUrlsClickable: undefined,
	turretModeHotkey: undefined,
	simplifyMessages: undefined
};
var regexChatHighligherAlts;
function setChatHighlighterRegex(texts) {
	texts = options.chatHighlighterTexts.split("\n").filter(String);
	texts.sort(function(val1, val2) { return val2.length - val1.length; });

	var alts = "";
	for (var i = 0; i < texts.length; i++) {
		var text = texts[i];
		if (text.startsWith("/") && text.endsWith("/"))
			text = text.slice(1, -1);
		else
			text = escapeRegex(text);
		alts += text + (i != texts.length - 1 ? "|" : "");
	}
	regexChatHighligherAlts = new RegExp(alts, "gi");
}

(() => {
	const keys = Object.keys(options);
	for (const key of keys) {
		chrome.runtime.sendMessage({message: "getValueOf", key: key}, function(response) {
			options[key] = response.value;
			if (key == "makeChatUrlsClickable" && options.makeChatUrlsClickable)
				startChatObserver();
			else if (key == "chatHighlighterState" && options.chatHighlighterState)
				startChatObserver();
			else if (key == "simplifyMessages" && options.simplifyMessages)
				startChatObserver();
			if (key == "chatHighlighterTexts" && options.chatHighlighterTexts)
				setChatHighlighterRegex();
			if (key == "makeMotdUrlsClickable" && options.makeMotdUrlsClickable)
				startMotdObserver();
			if (key == keys[keys.length - 1])
				optionsLoaded();
		});
	}
})();

function appendInteractChatUrlStyle() {
	$("html > head").append(styleAllowInteractingChatAnchors);
	styleAllowInteractingChatAnchors.inserted = true
}

function appendCrewControlWarningStyle() {
	$("html > head").append(styleCrewControlWarning);
	styleCrewControlWarning.inserted = true
}

function enableTurretModeHotkey() {
	window.postMessage({message: "sdt-enableTurretModeHotkey", hotkey: options.turretModeHotkey}, window.location.origin);
}

function optionsLoaded() {
	if (options.makeChatUrlsClickable && options.allowInteractingChatUrlsWithoutFocus)
		appendInteractChatUrlStyle();
	if (options.turretModeHotkey) 
		enableTurretModeHotkey();
	if (options.simplifyMessages)
		appendCrewControlWarningStyle();
}

// chat
var chat = $("#chat");
var chatContent = $("#chat-content");
function handleNewMessages() {
	chatContent.find("> p:not([data-sdt-handled])").each(function() {
		chatContentObserver.disconnect();
		var pText = this.textContent.trim();
		if (options.simplifyMessages) {
			if (pText.startsWith("You are a Captain of this ship."))
				this.innerHTML = `<i><b>You are a Captain of this ship.</b></i>`;
			else if (pText.startsWith("WARNING: Please be careful who you trust!"))
				this.remove();
		}
		if (!options.chatHighlighterState && !options.makeChatUrlsClickable) {
			if (!options.simplifyMessages)
				return;
			return startChatObserver();
		}
		var messageType = "unknown";
		var messageSender, messageContent;
		if (regexSystemMsg.test(pText)) {
			messageContent = pText.match(regexSystemMsg)[1];
			messageType = "system"
		} else if (regexUserMsg.test(pText)) {
			const matches = pText.match(regexUserMsg);
			messageSender = matches[1];
			messageContent = matches[2];
			messageType = "user";
		}
		if (messageType != "unknown") {
			// get elements
			var elements;
			if (messageType == "user")
				elements = $(this);
			else if (messageType == "system")
				elements = $(this).find("*").addBack(this);
			// replace text nodes
			if (options.makeChatUrlsClickable) {
				elements.contents().filter(function() {
					return this.nodeType == Node.TEXT_NODE;
				}).replaceWith(function() {
					return makeUrlsClickable(escapeHtml($(this).text()));
				});
			}
			var anyHighlight;
			elements.contents().filter(function() {
				return this.nodeType == Node.TEXT_NODE;
			}).replaceWith(function() {
				var content = $(this).text();
				if (messageType == "system") {
					if (content.toLowerCase() != "] " + messageContent.toLowerCase())
						return content;
				}
				content = escapeHtml(content);
				var highlightApplied;
				if (options.chatHighlighterState && (accountInfo && messageSender != accountInfo.name)) {
					content = content.replace(regexChatHighligherAlts, function(match) {
						highlightApplied = true;
						return `<span class="sdt-highlight">${match}</span>`;
					});
					if (highlightApplied) anyHighlight = true;
				}
				if (options.makeChatUrlsClickable || highlightApplied)
					return $.parseHTML(content);
				return content;
			});
			// at least one highlighting was applied - don't play sound if chat open + window focused
			if (options.chatHighlighterSoundState && anyHighlight && (chat.hasClass("closed") || !document.hasFocus()))
				sfxBeep.play();
		}
		this.dataset.sdtHandled = ""
		startChatObserver();
	});
}

var chatContentObserver = new MutationObserver(handleNewMessages);
function startChatObserver() {
	if (!chatContent.length) return;
	handleNewMessages();
	chatContentObserver.observe(chatContent[0], {childList: true});
}

// motd
var motdText = $("#motd-text");
function handleMotdUrls() {
	motdText.html(makeUrlsClickable(motdText.html()));
}
var motdTextObserver = new MutationObserver(function() {
	motdTextObserver.disconnect();
	handleMotdUrls();
	startMotdObserver();
});
function startMotdObserver() {
	if (!motdText.length) return;
	motdTextObserver.observe(motdText[0], { childList: true });
}
$("#motd-text, #chat").on("focus", "a", function() {
	$(this).blur();
});

function makeUrlsClickable(text) {
	return text.replace(regexUrl, function(match, p1) {
		return `<a href="//${p1}" target="_blank">${match}</a>`;
	});
}
/* Chat/MOTD stuff end */

chrome.storage.onChanged.addListener(function(changes, namespace) {
	for (var key in changes) {
		if (namespace == "sync") {
			var newValue = changes[key].newValue;
			if (key == "autoSetter-state") {
				autoSetterEnabled = newValue;
			} else if (key == "autoSetter-hotkey") {
				autoSetterHotkey = newValue;
			} else if (key.startsWith("autoSetter-property-")){
				var property = key.slice("autoSetter-property-".length);
				autoSetterProperties[property] = newValue || -1;
				if (property == "doorSpawnRestriction") {
					if (newValue == -1)
						tipListObserver.disconnect();
					else
						startTipListObserver();
				}
			} else if (key == "makeChatUrlsClickable") {
				options[key] = newValue;
				if (newValue) {
					startChatObserver();
					if (options.allowInteractingChatUrlsWithoutFocus && !styleAllowInteractingChatAnchors.inserted)
						appendInteractChatUrlStyle();
				}
			} else if (key == "makeMotdUrlsClickable") {
				options[key] = newValue;
				if (newValue) {
					handleMotdUrls();
					startMotdObserver();
				}
			} else if (key == "allowInteractingChatUrlsWithoutFocus") {
				options[key] = newValue;
				if (newValue)
					appendInteractChatUrlStyle();
				else
					styleAllowInteractingChatAnchors = styleAllowInteractingChatAnchors.detach();
			} else if (key == "chatHighlighterState" || key == "chatHighlighterSoundState" || key == "chatHighlighterTexts") {
				options[key] = newValue;
				if (key == "chatHighlighterTexts")
					setChatHighlighterRegex();
			} else if (key == "turretModeHotkey") {
				options[key] = newValue;
				enableTurretModeHotkey();
			} else if (key == "simplifyMessages") {
				options[key] = newValue;
				if (newValue) {
					startChatObserver()
					appendCrewControlWarningStyle();
				} else
					styleCrewControlWarning = styleCrewControlWarning.detach();
			}
		}
	}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message == "getAccountInfo") {
		if (request.useCache && accountInfo) {
			sendResponse(accountInfo);
			return true;
		}
		fetchAccountInfo(true).then(sendResponse);
		return true;
	} else if (request.message == "setInGameOutfit") {
		setInGameOutfit(request.outfit, isWsReady);
		sendResponse({isInGame: isWsReady});
		return true;
	} else if (request.message == "getOutfitFromStorage") {
		let data = undefined;
		let settings;
		try { settings = JSON.parse(window.localStorage.getItem("dredark_user_settings")); } catch {}
		if (settings) {
			const aS = settings.player_appearance;
			if (aS) {
				const hairStyle = parseInt(aS.style_hair),
					hairColor = intToHexColor(aS.color_hair),
					skinColor = intToHexColor(aS.color_skin),
					bodyColor = intToHexColor(aS.color_body),
					legsColor = intToHexColor(aS.color_legs),
					feetColor = intToHexColor(aS.color_feet);
				data = [hairStyle, hairColor, skinColor, bodyColor, legsColor, feetColor];
			}
		}
		sendResponse({outfit: data});
		return true;
	}
});

let isWsReady = false;
window.addEventListener("message", (event) => {
	if (event.origin !== window.location.origin)
		return;
	if (event.data.message == "sdt-wsStatus") {
		isWsReady = event.data.status;
	}
});

function intToHexColor(number){
	return "#" + (number >>> 0).toString(16).slice(-6);
}

function hexColorToInt(hex) {
	return typeof hex === "string" ? parseInt(hex.substring(1), 16) : null;
}

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

function escapeRegex(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const htmlEntityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;",
	"/": "&#x2F;",
	"`": "&#x60;",
	"=": "&#x3D;"
};
function escapeHtml(string) {
	return string.replace(regexHtmlEntities, function (s) {
		return htmlEntityMap[s];
	});
}

async function fetchAccountInfo(cache) {
	let info = null;
	await fetch(`${window.location.protocol}//${window.location.host}/account/status`)
		.then(res => res.json())
		.then(json => {
			if (json.account) {
				info = {};
				info.name = json.account.name;
				info.isRegistered = json.account.is_registered == true;
			} else if (json.account === null) {
				info = {};
				info.noAccount = true;
			}
		})
		.catch(() => {});
	if (cache)
		accountInfo = info;
	return info;
}
fetchAccountInfo(true);
