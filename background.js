'use strict';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message == 'setSavedNick') {
		var key = "savedNick-" + request.index;
		if (request.nick == "")
			chrome.storage.sync.remove([key]);
		else
			chrome.storage.sync.set({[key]: request.nick});
	} else if (request.message == 'getSavedNick') {
		chrome.storage.sync.get("savedNick-" + request.index, function(data) {
			sendResponse({nick: data["savedNick-" + request.index]});
		});
		return true;
	}
});
