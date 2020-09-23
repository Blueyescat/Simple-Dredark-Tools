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
});
