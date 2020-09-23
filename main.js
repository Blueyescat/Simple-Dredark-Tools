"use strict";

var startMenuInner, centerContainer, nameInput,
    characterCustomization, customizationTable, hairButton, hairSelect, skinButton, bodyButton, legsButton;

function cacheMenuElements() {
    startMenuInner = $("#start-menu-inner");
    centerContainer = startMenuInner.find(".center-container-h").eq(0);
    nameInput = centerContainer.find("input[placeholder='Nickname']").eq(0);

    characterCustomization = centerContainer.next("div");
    customizationTable = characterCustomization.find("table").eq(0);

    customizationTable.find("tr").each(function(index, tr) { 
        if ($(tr).text().includes("Hair")) {
            hairButton = $(tr).find("button").eq(0);
            hairSelect = $(tr).find("select").eq(0);
        } else if ($(tr).text().includes("Skin")) {
            skinButton = $(tr).find("button").eq(0);
        } else if ($(tr).text().includes("Body")) {
            bodyButton = $(tr).find("button").eq(0);
        } else if ($(tr).text().includes("Legs")) {
            legsButton = $(tr).find("button").eq(0);
        }
    });
}
cacheMenuElements();

/* Saved nick buttons */
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
                var tooltip = $("#savedNicks .sdt-tooltip[data-slot='" + button.data("slot") + "']");
                if (typeof response.nick !== "undefined")
                    tooltip.text(response.nick);
                else
                    tooltip.text("");
            });
        });
        var tooltip = $("<div/>",
        {
            class: "tooltip",
            text: ""
        });
        tooltip.attr("data-slot", i);
        tooltip.addClass("sdt-tooltip");
        btn.append(tooltip);
        container.append(btn);
    }
    centerContainer.append(container);
}
/* Saved nick buttons end */

/* Saved outfit buttons */
function addSavedOutfitElements() {
    cacheMenuElements();
    characterCustomization.css("flex-wrap", "wrap");
    var flexBreak = $("<div/>",
    {
        class: "flex-break"
    });
    characterCustomization.append(flexBreak);
    var container = $("<div/>",
    {
        id: "savedOutfits"
    }).css({"width": "fit-content", "margin": "0 auto"});
    for (let i = 0; i < 5; i++) {
        var btn = $("<button/>",
        {
            text: parseInt(i) + 1,
            click: function() { loadSavedOutfit(i); }
        });
        btn.attr("data-slot", i);
        btn.mouseenter(function() {
            var button = $(this);
            chrome.runtime.sendMessage({message: "getSavedOutfit", index: button.data("slot")}, function(response) {
                var tooltip = $("#savedOutfits .sdt-tooltip[data-slot='" + button.data("slot") + "']");
                var data;
                if (typeof response.outfit !== "undefined")
                    data = response.outfit;
                else
                    data = "0||#111111||#c99b86||#47a53b||#154479";
                data = data.split("||");
                var text = (data[0] == 0 ? "Bald" : "Not Bald") + " - ";
                text += "<span style='color:" + data[1] + "'>███</span> - ";
                text += "<span style='color:" + data[2] + "'>███</span> - ";
                text += "<span style='color:" + data[3] + "'>███</span> - ";
                text += "<span style='color:" + data[4] + "'>███</span>";
                tooltip.html(text);
            });
        });
        var tooltip = $("<div/>",
        {
            class: "tooltip",
            text: ""
        });
        tooltip.attr("data-slot", i);
        tooltip.addClass("sdt-tooltip");
        btn.append(tooltip);
        container.append(btn);
    }
    characterCustomization.append(container);
}
/* Saved outfit buttons end */

addSavedNickElements();
addSavedOutfitElements();

(function () {
    for (let i = 0; i < 8; i++) {
        setTimeout(function() {
            if ($("#savedOutfits").length)
                return;
            addSavedOutfitElements();
        }, 400);
    }
})();

// Sometimes Dredark resets the start menu, for example after killed the game
$(document).mousemove(function() {
    if (!$("#savedNicks").length)
        addSavedNickElements();
    if (!$("#savedOutfits").length)
        addSavedOutfitElements();
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

/* Saved outfit buttons */
function inputColor(btn, color) {
    var span = $(btn).parent();
    btn.click();
    setTimeout(function(){
        var clickOutThing = $(span).find("div").filter(function() {
            return $(this).css("z-index") == "9999"
        })
        var colorPicker = $(span).find("div.dark.window").eq(0);
        btn = colorPicker.find("div > label > input[type='color']").eq(0);
        btn.val(color);
        btn.get(0).dispatchEvent(new Event("input"));
        clickOutThing[0].dispatchEvent(new Event("mousedown"))
    }, 1);
}

function inputOutfit(outfit) {
    console.log(outfit);
    var data = outfit.split("||");
    hairSelect.find("option").filter(function() {
        return $(this).text() == (data[0] == 0 ? "Bald" : "Not Bald");
    }).prop("selected", true);
    hairSelect.get(0).dispatchEvent(new Event("change"));

    inputColor(hairButton, data[1]);
    inputColor(skinButton, data[2]);
    inputColor(bodyButton, data[3]);
    inputColor(legsButton, data[4]);
    window.dispatchEvent(new Event("click"))
}

function loadSavedOutfit(i) {
    chrome.runtime.sendMessage({message: "getSavedOutfit", index: i}, function(response) {
		if (typeof response.outfit !== "undefined")
            inputOutfit(response.outfit);
        else
            inputOutfit("0||#111111||#c99b86||#47a53b||#154479");
	});
}
/* Saved outfit buttons end */
