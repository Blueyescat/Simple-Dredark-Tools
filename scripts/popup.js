"use strict";

// options button
$("#optionsButton").click(function() {
	chrome.tabs.create({"url": "options.html"});
});

// tabs
$(document).ready(function() {
	chrome.runtime.sendMessage({message: "getLastSelectedTab"}, function(response) {
		if (typeof response.id !== "undefined") {
			$("ul.tabs li").removeClass("current");
			$(".tab-content").removeClass("current");

			$("ul.tabs li[data-tab='" + response.id + "']").addClass("current");
			$("#" + response.id).addClass("current");
		}
	});

	$("ul.tabs li").click(function() {
		var tabID = $(this).attr("data-tab");

		$("ul.tabs li").removeClass("current");
		$(".tab-content").removeClass("current");

		$(this).addClass("current");
		$("#" + tabID).addClass("current");
		chrome.runtime.sendMessage({message: "setLastSelectedTab", id: tabID});
	});
});

/* color picker */
var selectedInput;

var picker = tui.colorPicker.create({
	container: document.getElementById("colorPicker"),
	preset: ["#111111", "#c99b86", "#47a53b", "#154479", "#ffffff", "#000000"],
	usageStatistics: false
});

$("#colorPicker .tui-colorpicker-palette-toggle-slider").click();
$("#colorPicker").hide();

$(".color-input").on("mousedown", function(event) {
	event.preventDefault();
});

$(".color-input").on("click", function(event) {
    event.preventDefault();
	selectedInput = $(this);
	picker.setColor($(this).val());
	$("#colorPicker").show();
	return false;
});

$(document).mousedown(function(e) {
    var container = $("#colorPicker");
    if (container.is(":visible") && !container.is(e.target) && container.has(e.target).length === 0) {
		/* selectedInput.attr("value", picker.getColor());
		selectedInput.css("background-color", selectedInput.attr("value"));
		selectedInput.change(); */
		container.hide();
		selectedInput = undefined;
    }
});

$("#colorPicker .done-button").on("click", function(event) {
	selectedInput.attr("value", picker.getColor());
    selectedInput.css("background-color", selectedInput.attr("value"));
	selectedInput.change();
	$("#colorPicker").hide();
	selectedInput = undefined;
});

$("#colorPicker .cancel-button").on("click", function(event) {
	$("#colorPicker").hide();
	selectedInput = undefined;
});
/* color picker end */

for (let i = 0; i < 5; i++) {
	chrome.runtime.sendMessage({message: "getSavedNick", index: i}, function(response) {
		if (typeof response.nick !== "undefined")
			$(".saved-nickname-slot[data-slot='" + i + "']").val(response.nick);
	});
	
	chrome.runtime.sendMessage({message: "getSavedOutfit", index: i}, function(response) {
		if (typeof response.outfit !== "undefined") {
			var data = response.outfit.split("||");
			$(".saved-outfit-slot[data-slot='" + i + "'] .hair-type").val(data[0]);
			$(".saved-outfit-slot[data-slot='" + i + "'] .hair-color").attr("value", data[1]);
			$(".saved-outfit-slot[data-slot='" + i + "'] .skin-color").attr("value", data[2]);
			$(".saved-outfit-slot[data-slot='" + i + "'] .body-color").attr("value", data[3]);
			$(".saved-outfit-slot[data-slot='" + i + "'] .legs-color").attr("value", data[4]);
		}
		if (i == 4)
			colorLabels();
	});
}

$(".saved-nickname-slot").on("input", function() {
	chrome.runtime.sendMessage({message: "setSavedNick", index: $(this).data("slot"), nick: $(this).val()});
});

$("#savedNicknames span.sdt-clear").on("click", function() {
	$(this).prev(".sdt-clearable").val("").trigger("input");
});

$("#savedOutfits span.sdt-clear").on("click", function() {
	var li = $(this).parent();
	li.find(".hair-type").val(0);
	li.find(".hair-color").attr("value", "#111111");
	li.find(".skin-color").attr("value", "#c99b86");
	li.find(".body-color").attr("value", "#47a53b");
	li.find(".legs-color").attr("value", "#154479").change();
	colorLabels();
});

function outfitChanged(slot) {
	var hairType = $(".saved-outfit-slot[data-slot='" + slot + "'] .hair-type").eq(0).val();
	var hairColor = $(".saved-outfit-slot[data-slot='" + slot + "'] .hair-color").eq(0).attr("value");
	var skinColor = $(".saved-outfit-slot[data-slot='" + slot + "'] .skin-color").eq(0).attr("value");
	var bodyColor = $(".saved-outfit-slot[data-slot='" + slot + "'] .body-color").eq(0).attr("value");
	var legsColor = $(".saved-outfit-slot[data-slot='" + slot + "'] .legs-color").eq(0).attr("value");
	var data = hairType + "||" + hairColor + "||" + skinColor + "||" + bodyColor + "||" + legsColor;
	chrome.runtime.sendMessage({message: "setSavedOutfit", index: slot, outfit: data});
}

$(".saved-outfit-slot select").on("change", function() {
	outfitChanged($(this).parent().data("slot"));
});
$(".saved-outfit-slot input").on("change", function() {
	outfitChanged($(this).parent().data("slot"));
});


for (let i = 0; i < 4; i++) {
	$(".saved-outfit-slot[data-slot='0']").eq(0).clone(true).attr("data-slot", i+1).appendTo("#savedOutfits ol");
}

$("input[type='color']").on("input change", function() {
	$(this).parent().css("background-color", $(this).val());
});

function colorLabels() {
	$(".color-input").each(function() {
		$(this).css("background-color", $(this).val());
	});
}

/* auto setter start */
// == main ==
chrome.runtime.sendMessage({message: "getAutoSetterState"}, function(response) {
	$("#autoSetter #autoSetterState").prop("checked", response.state);
});
chrome.runtime.sendMessage({message: "getAutoSetterHotkey"}, function(response) {
	if (typeof response.code !== "undefined") {
		$("#autoSetter .hotkey").val(unPascalCase(response.code));
	}
});

$("#autoSetter #autoSetterState").change(function() {
    if (this.checked) {
		chrome.runtime.sendMessage({message: "setAutoSetterState", state: true});
		chrome.runtime.sendMessage({message: "getAutoSetterHotkey"}, function(response) {
			if (typeof response.code === "undefined") {
				var e = jQuery.Event("keyup");
				e.code = "ShiftLeft";
				e.key = "Shift";
				e.keyCode = 16;
				$("#autoSetter .hotkey").trigger(e);
			}
		});
    } else {
		chrome.runtime.sendMessage({message: "setAutoSetterState", state: false});
    }
});
var lastKey;
$("#autoSetter .hotkey").on("focus", function() {
	lastKey = $(this).val();
	$(this).val("< press a key >");
});
$("#autoSetter .hotkey").on("blur", function() {
	if ($(this).val() == "< press a key >")
		$(this).val(lastKey);
});
$("#autoSetter .hotkey").on("keyup", function (event) {
	var code = getKeyCode(event);
	$(this).val(unPascalCase(code)).blur();
	chrome.runtime.sendMessage({message: "setAutoSetterHotkey", code: code});
});

// == properties ==
var properties = ["cargoHatchMode", "loaderMode", "loaderInvRequirement", "pusherPrimaryMode", "pusherFilteredMode", "doorSpawnRestriction"];
for (const prop of properties) {
    chrome.runtime.sendMessage({message: "getAutoSetterProperty", property: prop}, function(response) {
		$("#autoSetter ." + prop).val(response.value).change();
	});
	$("#autoSetter ." + prop).change(function() {
		var selectedOption = $(this).find("option:selected");
		chrome.runtime.sendMessage({message: "setAutoSetterProperty", property: prop, value: selectedOption.val()});
		$(this).attr("style", selectedOption.attr("style"));
	});
}
// sign
chrome.runtime.sendMessage({message: "getAutoSetterProperty", property: "signText"}, function(response) {
	if (response.value !== -1)
		$("#autoSetter .signText").val(response.value);
});
$("#autoSetter .signText").on("input", function() {
	chrome.runtime.sendMessage({message: "setAutoSetterProperty", property: "signText", value: $(this).val()});
});

// = filters =
// manual hardcoded item list
var itemNamesList = ["Auto Turret (Packaged)", "Backpack", "Basketball", "Beach Ball", "Block", "Booster Boots", "Booster Fuel (High Grade)", "Booster Fuel (Low Grade)", "Burst Turret (Packaged)", "Cargo Ejector (Packaged)", "Cargo Hatch (Packaged)", "Colored Panel", "Comms Station (Packaged)", "Construction Gauntlets", "Door (Packaged)", "Expando Box (Basic, Packaged)", "Explosives", "Fabricator (Engineering, Packaged)", "Fabricator (Equipment, Packaged)", "Fabricator (Legacy, Packaged)", "Fabricator (Machine, Packaged)", "Fabricator (Munitions, Packaged)", "Flak Ammo", "Flux Crystals", "Football", "Freeport Anchor", "Golden Basketball", "Golden Item Shredder", "Golden Volleyball", "Handheld Pusher", "Helm (Packaged)", "Hover Pack", "Hyper Rubber Block", "Hyper Rubber", "Ice-Glass Block", "Item Launcher (Packaged)", "Item Net", "Item Shredder", "Ladder", "Launcher Gauntlets", "Loader (Packaged)", "Metal", "Punch Ammo", "Pusher (Packaged)", "RC Turret (Packaged)", "Ramp Block", "Recycler (Packaged)", "Repair Tool", "Rocket Pack", "ScatterShot Ammo", "Scrap Metal", "Ship Embiggener", "Ship Shield Booster", "Ship Shrinkinator", "Sign (Packaged)", "Silica Crystals", "Slug Ammo", "Sniper Ammo", "Spawn Point (Packaged)", "Speed Skates", "Standard Ammo", "Thruster (Packaged)", "Thruster Fuel", "Trash Ammo", "Turret (Packaged)", "Turret Controller (Basic, Packaged)", "Volleyball", "Walkway", "Wrench", "Yank Ammo", "No Item"];
itemNamesList.forEach(function(name) {
	$("#itemNamesList").append($("<option>", {
		text: name
	}));
});

function settingsChanged(prop) {
	var list = [];
	$("#" + prop + " li").each(function (index) {
		list[index] = {
			state: $(this).find(".filter-state").prop("checked"),
			name: $(this).find(".name").val()
		};
	});
	chrome.runtime.sendMessage({message: "setAutoSetterProperty", property: prop, value: list});
}
// dropdown
$("#autoSetter .filters .edit-button").on("click", function() {
	var button = $(this);
	var settings = button.next(".settings");
	settings.slideToggle(90, function() {
		var arrow = button.find("i").eq(0);
		if (settings.is(":hidden"))
			arrow.removeClass("up").addClass("down");
		else
			arrow.removeClass("down").addClass("up");
	});
});
$("#autoSetter .filters span.sdt-clear").on("click", function() {
	$(this).prev(".sdt-clearable").val("").trigger("input");
});

var properties = ["cargoHatchFiltersState", "loaderFiltersState", "pusherFiltersState"];
var propertiesSettings = ["cargoHatchFiltersSettings", "loaderFiltersSettings", "pusherFiltersSettings"];
// show
for (const [index, prop] of properties.entries()) {
	chrome.runtime.sendMessage({message: "getAutoSetterProperty", property: prop}, function(response) {
		$("#autoSetter .filters #" + prop).prop("checked", response.value == true);
	});
	$("#autoSetter .filters #" + prop).change(function() {
		chrome.runtime.sendMessage({message: "setAutoSetterProperty", property: prop, value: this.checked});
		if (this.checked) {
			chrome.runtime.sendMessage({message: "getAutoSetterProperty", property: propertiesSettings[index]}, function(response) {
				if (response.value == -1) {
					var list = [{state: true, name: ""}, {state: true, name: ""}, {state: true, name: ""}];
					chrome.runtime.sendMessage({message: "setAutoSetterProperty", property: propertiesSettings[index], value: list});
				}
			});
		}
	});
}
// save
for (const prop of propertiesSettings) {
	chrome.runtime.sendMessage({message: "getAutoSetterProperty", property: prop}, function(response) {
		var list = response.value;
		for (var index in list) {
			var slot = $("#" + prop + " li[data-slot='" + index + "']");
			slot.find(".filter-state").prop("checked", list[index].state);
			slot.find(".name").val(list[index].name);
		}
	});
	
	$("#" + prop + " li .filter-state").change(function() {
		settingsChanged(prop);
	});
	$("#" + prop + " li .name").on("input", function() {
		settingsChanged(prop);
	});
}

// utils
function getKeyCode(event) {
	var code;
	if (event.code !== undefined && event.code != "")
		code = event.code;
	else if (event.key !== undefined)
		code = event.key;
	else if (event.keyCode !== undefined)
		code = event.keyCode;
	return code;
}

function unPascalCase(text) {
	return text.replace(/([^[A-Z0-9]{2,})([A-Z0-9])/g, "$1 $2");
}
/* auto setter end */
