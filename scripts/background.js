"use strict";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message == "setLastSelectedTab") {
		if (request.nick == "tab-1")
			chrome.storage.sync.remove(["lastSelectedTab"]);
		else
			chrome.storage.sync.set({["lastSelectedTab"]: request.id});
	} else if (request.message == "getLastSelectedTab") {
		chrome.storage.sync.get("lastSelectedTab", function(data) {
			sendResponse({id: data["lastSelectedTab"]});
		});
		return true;
	}

	else if (request.message == "setSavedNick") {
		var key = "savedNick-" + request.index;
		if (request.nick == "")
			chrome.storage.sync.remove([key]);
		else
			chrome.storage.sync.set({[key]: request.nick});
	} else if (request.message == "getSavedNick") {
		chrome.storage.sync.get("savedNick-" + request.index, function(data) {
			sendResponse({nick: data["savedNick-" + request.index]});
		});
		return true;
	}

	else if (request.message == "setSavedOutfit") {
		var key = "savedOutfit-" + request.index;
		if (request.outfit == "0||#111111||#c99b86||#47a53b||#154479") {
			chrome.storage.sync.remove([key]);
		} else
			chrome.storage.sync.set({[key]: request.outfit});
	} else if (request.message == "getSavedOutfit") {
		chrome.storage.sync.get("savedOutfit-" + request.index, function(data) {
			sendResponse({outfit: data["savedOutfit-" + request.index]});
		});
		return true;
	}

	else if (request.message == "setAutoSetterState") {
		var key = "autoSetter-state";
		if (request.state == false) {
			chrome.storage.sync.remove([key]);
			sendMessageToContentScripts({message: "defineAutoSetterEnabled", state: false});
		} else {
			chrome.storage.sync.set({[key]: true});
			sendMessageToContentScripts({message: "defineAutoSetterEnabled", state: true});
		}
	} else if (request.message == "getAutoSetterState") {
		chrome.storage.sync.get("autoSetter-state", function(data) {
			sendResponse({state: data["autoSetter-state"] || false}); // default false
		});
		return true;
	} else if (request.message == "setAutoSetterHotkey") {
		var key = "autoSetter-hotkey";
		if (typeof request.code === "undefined") {
			chrome.storage.sync.remove([key]);
			sendMessageToContentScripts({message: "defineAutoSetterHotkey", code: undefined});
		} else {
			chrome.storage.sync.set({[key]: request.code});
			sendMessageToContentScripts({message: "defineAutoSetterHotkey", code: request.code});
		}
	} else if (request.message == "getAutoSetterHotkey") {
		chrome.storage.sync.get("autoSetter-hotkey", function(data) {
			sendResponse({code: data["autoSetter-hotkey"]});
		});
		return true;
	} else if (request.message == "setAutoSetterProperty") {
		var key = "autoSetter-property-" + request.property;
		if (typeof request.value === "undefined" || request.value === -1 || request.value == "" ||
		(typeof request.value === "boolean" && request.value == false))
			chrome.storage.sync.remove([key]);
		else
			chrome.storage.sync.set({[key]: request.value});
	} else if (request.message == "getAutoSetterProperty") {
		var key = "autoSetter-property-" + request.property;
		chrome.storage.sync.get(key, function(data) {
			var value = data[key];
			if (typeof value === "undefined") {
				// if (request.property == "cargoHatchMode")
				value = -1;
			}
			sendResponse({value: value});
		});
		return true;
	}
});

function sendMessageToContentScripts(message) {
	var matches = chrome.runtime.getManifest().content_scripts[0].matches;
	chrome.tabs.query({url: matches}, function(tabs) {
		tabs.forEach(function(tab) {
			chrome.tabs.sendMessage(tab.id, message);
		});
	});
}
