'use strict';

var startMenuInner, centerContainer, nameInput;
function cacheMenuElements() {
    startMenuInner = $("#start-menu-inner");
    centerContainer = startMenuInner.find(".center-container-h").eq(0);
    nameInput = centerContainer.find("input[placeholder='Nickname']").eq(0);
}
cacheMenuElements();

// Saved nick buttons
function addSavedNickElements() {
    cacheMenuElements();
    centerContainer.css("flex-wrap", "wrap");
    var flexBreak = $("<div/>",
    {
        class: "flex-break"
    });
    centerContainer.append(flexBreak);
    var container = $("<div/>",
    {
        id: "savedNicks"
    });
    for (let i = 0; i < 5; i++) {
        var btn = $("<button/>",
        {
            text: parseInt(i) + 1,
            click: function() { loadSavedNick(i); }
        });
        btn.attr("data-slot", i);
        btn.mouseenter(function() {
            var button = $(this);
            chrome.runtime.sendMessage({message: "getSavedNick", index: button.data("slot")}, function(response) {
                if (typeof response.nick !== "undefined")
                    $(".saved-nicks-tooltip[data-slot='" + button.data("slot") + "']").text(response.nick);
            });
        });
        var tooltip = $("<div/>",
        {
            class: "tooltip",
            text: ""
        });
        tooltip.attr("data-slot", i);
        tooltip.addClass("saved-nicks-tooltip");
        btn.append(tooltip);
        container.append(btn);
    }
    centerContainer.append(container);
}

function addElements() {
    addSavedNickElements();
}
addElements();

// Sometimes Dredark resets the start menu, for example after killed the game
$(document).mousemove(function() {
    if (!$("#savedNicks").length)
        addSavedNickElements();
});

/* Saved nick buttons */
function inputNick(nick) {
    nameInput.val(nick);
    nameInput.get(0).dispatchEvent(new Event("input"));
}

function loadSavedNick(i) {
    chrome.runtime.sendMessage({message: "getSavedNick", index: i}, function(response) {
		if (typeof response.nick !== "undefined")
			inputNick(response.nick);
	});
}
/* Saved nick buttons end */
