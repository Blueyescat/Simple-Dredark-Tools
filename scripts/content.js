"use strict";

const regexHtmlEntities = /[&<>"'`=\/]/g;
const regexUrl = /(?<!@[^\s]*|<[^>]*)(?:https?:)?(?:(?:\/|&#x2F;)(?:\/|&#x2F;))?([\w.-]+[\w.-]\w\.(?!exe|rn)[a-zA-Z-_][\w\-_~:/?#[\]@!\$&'\(\)\*\+%,;=.]+)(?<!\.)/gi;
const regexUserMsg = /^(?:.*] )?(.*): (.+)$/m;
const regexSystemMsg = /^\[SYSTEM\] (.+)$/mi;
const regexItemBrackets = /\s?\(.*\)/;

const sfxBeep = new Audio(chrome.runtime.getURL("sfx/beep.mp3"));
sfxBeep.loop = false;

var styleAllowInteractingChatAnchors = $("<style>#chat.closed a { pointer-events: auto !important; }</style>");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    if ($("#savedNicks").length)
        return;
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
    if ($("#savedOutfits").length)
        return;
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

(async function() {
    for (let i = 0; i < 32; i++) {
        addSavedOutfitElements();
        if ($("#savedOutfits").length)
            return;
        await sleep(100);
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
async function inputColor(btn, color) {
    var span = $(btn).parent();
    btn.click();
    for (let i = 0; i < 200; i++) {
        var colorPicker = $(span).find("div.dark.window").eq(0);
        if (!colorPicker.length) {
            await sleep(1);
            continue;
        }
        // - color picker found -
        var clickOutThing = $(span).find("div").filter(function() {
            return $(this).css("z-index") == "9999"
        })
        btn = colorPicker.find("div > label > input[type='color']").eq(0);
        btn.val(color);
        btn.get(0).dispatchEvent(new Event("input"));
        clickOutThing[0].dispatchEvent(new Event("mousedown"))
        break;
    }
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

chrome.runtime.sendMessage({message: "getAutoSetterHotkey"}, function(response) {
	autoSetterHotkey = response.code;
});

$(window).on("keydown keyup", function(event) {
    if (autoSetterEnabled && (event.code == autoSetterHotkey || event.key == autoSetterHotkey || event.keyCode == autoSetterHotkey))
        autoSetterHotkeyDown = event.type == "keydown";
});

// == properties ==
(function() {
    const keys = Object.keys(autoSetterProperties);
    keys.forEach(function(key) {
        chrome.runtime.sendMessage({message: "getAutoSetterProperty", property: key}, function(response) {
            autoSetterProperties[key] = response.value;
            if (key == keys[keys.length - 1])
                autoSetterPropertiesLoaded();
        });
    });
})();

function autoSetterPropertiesLoaded() {
    if (autoSetterProperties.doorSpawnRestriction != -1)
        startTipListObserver();
}

// gui listener
var pui = $("#pui");
var puiObserver = new MutationObserver(async function() {
    if (!autoSetterEnabled || !autoSetterHotkeyDown)
        return;
    if (!pui.is(":hidden")) {
        var close;
        if (pui.text().includes("Cargo Hatch")) {
            if (autoSetterProperties.cargoHatchMode != -1) {
                pui.hide();
                var select = pui.find("div select").eq(0);
                select.val(autoSetterProperties.cargoHatchMode);
                select[0].dispatchEvent(new Event("change"));
                close = true;
            }
            if (autoSetterProperties.cargoHatchFiltersState != -1 && autoSetterProperties.cargoHatchFiltersSettings != -1) {
                if (!close) pui.hide();
                var settings = autoSetterProperties.cargoHatchFiltersSettings;
                var inputs = pui.find("div div > input");
                await setFilters(inputs, settings);
                close = true;
            }
        } else if (pui.text().includes("Loader")) {
            if (autoSetterProperties.loaderMode != -1) {
                pui.hide();
                var select = pui.find("div select").eq(0);
                select.val(autoSetterProperties.loaderMode);
                select[0].dispatchEvent(new Event("change"));
                close = true;
            }
            if (autoSetterProperties.loaderInvRequirement != -1) {
                if (!close) pui.hide();
                var checkbox = pui.find("div p label input[type='checkbox']").eq(0);
                checkbox.prop("checked", autoSetterProperties.loaderInvRequirement == 1)
                checkbox[0].dispatchEvent(new Event("change"));
                close = true;
            }
            if (autoSetterProperties.loaderFiltersState != -1 && autoSetterProperties.loaderFiltersSettings != -1) {
                if (!close) pui.hide();
                var settings = autoSetterProperties.loaderFiltersSettings;
                var inputs = pui.find("div div > input");
                await setFilters(inputs, settings);
                close = true;
            }
        } else if (pui.text().includes("Pusher")) {
            if (autoSetterProperties.pusherPrimaryMode != -1) {
                pui.hide();
                var select = pui.find("div select").eq(0);
                select.val(autoSetterProperties.pusherPrimaryMode);
                select[0].dispatchEvent(new Event("change"));
                close = true;
            }
            if (autoSetterProperties.pusherFilteredMode != -1) {
                if (!close) pui.hide();
                var select = pui.find("div select").eq(1);
                select.val(autoSetterProperties.pusherFilteredMode);
                select[0].dispatchEvent(new Event("change"));
                close = true;
            }
            if (autoSetterProperties.pusherFiltersState != -1 && autoSetterProperties.pusherFiltersSettings != -1) {
                if (!close) pui.hide();
                var settings = autoSetterProperties.pusherFiltersSettings;
                var inputs = pui.find("div div > input");
                await setFilters(inputs, settings);
                close = true;
            }
        } else if (pui.text().includes("Sign")) {
            if (autoSetterProperties.signText != -1) {
                pui.hide();
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


async function setFilters(inputs, settings) {
    for (var [index, input] of $.makeArray(inputs).entries()) {
        if (settings[index].state == true) {
            var nameSetting = settings[index].name.toLowerCase().trim();
            if (nameSetting == "") nameSetting = "no item";
            input.dispatchEvent(new Event("focus"));
            for (let i = 0; i < 500; i++) {
                var itemPicker = $(input).parent().find(".item-picker");
                if (!itemPicker.length) {
                    await sleep(1);
                    continue;
                }
                // - item picker found -
                var items = itemPicker.find("div span");
                var selected = undefined;
                if (!nameSetting.includes("(") && !nameSetting.includes(")")) {
                    for (let item of items) {
                        var itemName = $(item).text().toLowerCase().replace(regexItemBrackets, "");
                        if (itemName == nameSetting) {
                            $(item).parent()[0].dispatchEvent(new Event("mousedown"));
                            input.dispatchEvent(new Event("blur"));
                            for (let i = 0; i < 500; i++) {
                                if ($(input).val() == $(item).text())
                                    break;
                                await sleep(1);
                            }
                            selected = true;
                            break;
                        }
                    };
                    if (!selected) {
                        for (let item of items) {
                            var itemName = $(item).text().toLowerCase().replace(regexItemBrackets, "");
                            if (itemName.endsWith(nameSetting) || itemName.startsWith(nameSetting)) {
                                $(item).parent()[0].dispatchEvent(new Event("mousedown"));
                                input.dispatchEvent(new Event("blur"));
                                for (let i = 0; i < 500; i++) {
                                    if ($(input).val() == $(item).text())
                                        break;
                                    await sleep(1);
                                }
                                selected = true;
                                break;
                            }
                        };
                    }
                }
                if (!selected) {
                    for (let item of items) {
                        var itemName = $(item).text().toLowerCase();
                        if (itemName == nameSetting || itemName.includes(nameSetting)) {
                            $(item).parent()[0].dispatchEvent(new Event("mousedown"));
                            input.dispatchEvent(new Event("blur"));
                            for (let i = 0; i < 500; i++) {
                                if ($(input).val() == $(item).text())
                                    break;
                                await sleep(1);
                            }
                            selected = true;
                            break;
                        }
                    };
                }
                break;
            }
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

puiObserver.observe(pui[0], {
    attributes: true,
    attributeFilter: ["style"]
});
/* auto setter end */

/* Chat/MOTD stuff start */
var options = {
    makeChatUrlsClickable: undefined, allowInteractingChatUrlsWithoutFocus: undefined,
    chatHighlighterState: undefined, chatHighlighterSoundState: undefined, chatHighlighterTexts: undefined,
    makeMotdUrlsClickable: undefined
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

(function() {
    const keys = Object.keys(options);
    for (const key of keys) {
        chrome.runtime.sendMessage({message: "getValueOf", key: key}, function(response) {
            options[key] = response.value;
            if (key == "makeChatUrlsClickable" && options.makeChatUrlsClickable)
                startChatObserver();
            if (key == "chatHighlighterState" && options.chatHighlighterState)
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
}

function optionsLoaded() {
    if (options.makeChatUrlsClickable && options.allowInteractingChatUrlsWithoutFocus)
        appendInteractChatUrlStyle();
}

// chat
var chatContent = $("#chat-content");
function handleNewMessages() {
    if (!options.chatHighlighterState && !options.makeChatUrlsClickable)
        return;
    chatContent.find("> p:not([data-sdt-handled])").each(function() {
        chatContentObserver.disconnect();
        var pText = $(this).text();
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
                    return this.nodeType == 3;
                }).replaceWith(function() {
                    return makeUrlsClickable(escapeHtml($(this).text()));
                });
            }
            var anyHighlight;
            elements.contents().filter(function() {
                return this.nodeType == 3;
            }).replaceWith(function() {
                var content = $(this).text();
                if (messageType == "system") {
                    if (content.toLowerCase() != "] " + messageContent.toLowerCase())
                        return content;
                }
                content = escapeHtml(content);
                var highlightApplied;
                if (options.chatHighlighterState && messageSender != JSON.parse(localStorage.dredark_join_info || "{}").nickname) {
                    content = content.replace(regexChatHighligherAlts, function(match) {
                        highlightApplied = true;
                        return "<span class='sdt-highlight'>" + match + "</span>";
                    });
                    if (highlightApplied) anyHighlight = true;
                }
                if (options.makeChatUrlsClickable || highlightApplied)
                    return $.parseHTML(content);
                return content;
            });
            // at least one highlighting was applied
            if (options.chatHighlighterSoundState && anyHighlight && ($("#chat").hasClass("closed") || !document.hasFocus()))
                sfxBeep.play();
        }
        $(this).attr("data-sdt-handled", true);
        startChatObserver();
    });
}

var chatContentObserver = new MutationObserver(function() {
    handleNewMessages();
});
function startChatObserver() {
    handleNewMessages();
    chatContentObserver.observe(chatContent[0], { childList: true });
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
    motdTextObserver.observe(motdText[0], { childList: true });
}
$("#motd-text, #chat").on("focus", "a", function(e) {
    $(this).blur();
});

function makeUrlsClickable(text) {
    return text.replace(regexUrl, function(match, p1) {
        return `<a href='//${p1}' target='_blank'>${match}</a>`;
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
                if (options[key])
                    startChatObserver();
                else
                    chatContentObserver.disconnect();
            } else if (key == "makeMotdUrlsClickable") {
                options[key] = newValue;
                if (options[key]) {
                    handleMotdUrls();
                    startMotdObserver();
                } else {
                    motdTextObserver.disconnect();
                }
            } else if (key == "allowInteractingChatUrlsWithoutFocus") {
                options[key] = newValue;
                if (options[key])
                    appendInteractChatUrlStyle()
                else
                    styleAllowInteractingChatAnchors = styleAllowInteractingChatAnchors.detach();
            } else if (key == "chatHighlighterState" || key == "chatHighlighterSoundState" || key == "chatHighlighterTexts") {
                options[key] = newValue;
                if (key == "chatHighlighterTexts")
                    setChatHighlighterRegex();
            }
        }
    }
});
