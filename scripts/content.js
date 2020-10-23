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
    });
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

/* auto setter start */
var autoSetterEnabled, autoSetterHotkey, autoSetterHotkeyDown,
    autoSetterProperties = {
        cargoHatchMode: -1,
        cargoHatchFiltersState: -1,
        cargoHatchFiltersSettings: -1,
        loaderMode: -1,
        loaderInvRequirement: -1,
        loaderFiltersState: -1,
        loaderFiltersSettings: -1,
        pusherPrimaryMode: -1,
        pusherFilteredMode: -1,
        pusherFiltersState: -1,
        pusherFiltersSettings: -1,
        signText: -1,
        doorSpawnRestriction: -1
    };

// == main ==
chrome.runtime.sendMessage({message: "getAutoSetterState"}, function(response) {
	autoSetterEnabled = response.state;
});
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == "defineAutoSetterEnabled")
        autoSetterEnabled = request.state;
});

chrome.runtime.sendMessage({message: "getAutoSetterHotkey"}, function(response) {
	autoSetterHotkey = response.code;
});
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == "defineAutoSetterHotkey")
        autoSetterHotkey = request.code;
});

$(window).on("keydown keyup", function(event) {
    if (autoSetterEnabled && (event.code == autoSetterHotkey || event.key == autoSetterHotkey || event.keyCode == autoSetterHotkey))
        autoSetterHotkeyDown = event.type == "keydown";
});

// == properties ==
Object.keys(autoSetterProperties).forEach(function(key) {
    chrome.runtime.sendMessage({message: "getAutoSetterProperty", property: key}, function(response) {
        autoSetterProperties[key] = response.value;
    });
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (var key in changes) {
        if (namespace == "sync") {
            if (key.startsWith("autoSetter-property-")){
                var property = key.slice("autoSetter-property-".length);
                // var oldValue = changes[key].oldValue;
                var newValue = changes[key].newValue;
                autoSetterProperties[property] = newValue;
            }
            
        }
    }
});

// gui listener
var pui = $("#pui");
var puiObserver = new MutationObserver(function(mutations) {
    if (!autoSetterEnabled || !autoSetterHotkeyDown)
        return;
    if (!pui.is(":hidden")) {
        var close;
        if (pui.text().includes("Cargo Hatch")) {
            if (autoSetterProperties.cargoHatchMode != -1) {
                var select = pui.find("div select").eq(0);
                select.val(autoSetterProperties.cargoHatchMode);
                select[0].dispatchEvent(new Event("change"));
                close = true;
            }
            if (autoSetterProperties.cargoHatchFiltersState != -1 && autoSetterProperties.cargoHatchFiltersSettings != -1) {
                var settings = autoSetterProperties.cargoHatchFiltersSettings;
                var inputs = pui.find("div div > input");
                inputs.each(function (index) {
                    if (settings[index].state == true) {
                        var name = settings[index].name;
                        if (name == "") name = "No Item";
                        var input = $(this);
                        input[0].dispatchEvent(new Event("focus"));
                        setTimeout(() => {
                            var itemPicker = $(this).parent().find(".item-picker");
                            itemPicker.find("div span").each(function () {
                                if ($(this).text().toLowerCase().includes(name.toLowerCase())) {
                                    $(this).parent()[0].dispatchEvent(new Event("mousedown"));
                                    $(this).parent()[0].dispatchEvent(new Event("mouseup"));
                                    input[0].dispatchEvent(new Event("blur"));
                                    return false;
                                }
                            });
                        }, 1);
                    }
                });
                close = true;
            }
        } else if (pui.text().includes("Loader")) {
            if (autoSetterProperties.loaderMode != -1) {
                var select = pui.find("div select").eq(0);
                select.val(autoSetterProperties.loaderMode);
                select[0].dispatchEvent(new Event("change"));
                close = true;
            }
            if (autoSetterProperties.loaderInvRequirement != -1) {
                var checkbox = pui.find("div p label input[type='checkbox']").eq(0);
                checkbox.prop("checked", autoSetterProperties.loaderInvRequirement == 1)
                checkbox[0].dispatchEvent(new Event("change"));
                close = true;
            }
            if (autoSetterProperties.loaderFiltersState != -1 && autoSetterProperties.loaderFiltersSettings != -1) {
                var settings = autoSetterProperties.loaderFiltersSettings;
                var inputs = pui.find("div div > input");
                inputs.each(function (index) {
                    if (settings[index].state == true) {
                        var name = settings[index].name;
                        if (name == "") name = "No Item";
                        var input = $(this);
                        input[0].dispatchEvent(new Event("focus"));
                        setTimeout(() => {
                            var itemPicker = $(this).parent().find(".item-picker");
                            itemPicker.find("div span").each(function () {
                                if ($(this).text().toLowerCase().includes(name.toLowerCase())) {
                                    $(this).parent()[0].dispatchEvent(new Event("mousedown"));
                                    $(this).parent()[0].dispatchEvent(new Event("mouseup"));
                                    input[0].dispatchEvent(new Event("blur"));
                                    return false;
                                }
                            });
                        }, 1);
                    }
                });
                close = true;
            }
        } else if (pui.text().includes("Pusher")) {
            if (autoSetterProperties.pusherPrimaryMode != -1) {
                var select = pui.find("div select").eq(0);
                select.val(autoSetterProperties.pusherPrimaryMode);
                select[0].dispatchEvent(new Event("change"));
                close = true;
            }
            if (autoSetterProperties.pusherFilteredMode != -1) {
                var select = pui.find("div select").eq(1);
                select.val(autoSetterProperties.pusherFilteredMode);
                select[0].dispatchEvent(new Event("change"));
                close = true;
            }
            if (autoSetterProperties.pusherFiltersState != -1 && autoSetterProperties.pusherFiltersSettings != -1) {
                var settings = autoSetterProperties.pusherFiltersSettings;
                var inputs = pui.find("div div > input");
                inputs.each(function (index) {
                    if (settings[index].state == true) {
                        var name = settings[index].name;
                        if (name == "") name = "No Item";
                        var input = $(this);
                        input[0].dispatchEvent(new Event("focus"));
                        setTimeout(() => {
                            var itemPicker = $(this).parent().find(".item-picker");
                            itemPicker.find("div span").each(function () {
                                if ($(this).text().toLowerCase().includes(name.toLowerCase())) {
                                    $(this).parent()[0].dispatchEvent(new Event("mousedown"));
                                    $(this).parent()[0].dispatchEvent(new Event("mouseup"));
                                    input[0].dispatchEvent(new Event("blur"));
                                    return false;
                                }
                            });
                        }, 1);
                    }
                });
                close = true;
            }
        } else if (pui.text().includes("Sign")) {
            if (autoSetterProperties.signText != -1) {
                var input = pui.find("div input").eq(0);
                input.val(autoSetterProperties.signText);
                input[0].dispatchEvent(new Event("input"));
                pui.find("div div button.btn-green").eq(0).click();
            }
        }
        if (close)
            pui.find("div.close button").click();
    }
});

// tip list listener (context menu)
var tipListObserver = new MutationObserver(function(mutations) {
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

tipListObserver.observe(document, {
    subtree: true,
    childList: true
});
 
puiObserver.observe(pui[0], {
    attributes: true,
    attributeFilter: ["style"]
});
/* auto setter end */
