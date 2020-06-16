'use strict';

for (let i = 0; i < 5; i++) {
	chrome.runtime.sendMessage({message: "getSavedNick", index: i}, function(response) {
		if (typeof response.nick !== "undefined")
			$(".saved-nickname-slot[data-slot='" + i + "']").val(response.nick);
	});
}

$(".saved-nickname-slot").on('input', function() {
	var key = "savedNick-" + $(this).data("slot");
	chrome.runtime.sendMessage({message: "setSavedNick", index: $(this).data("slot"), nick: $(this).val()});
});
