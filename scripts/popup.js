"use strict";

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
	$(".saved-nickname-slot[data-slot='" + $(this).data("slot") + "']").val("").trigger("input");
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
	$("#autoSetter .state").prop("checked", response.state);
});
chrome.runtime.sendMessage({message: "getAutoSetterHotkey"}, function(response) {
	if (typeof response.code !== "undefined") {
		$("#autoSetter .hotkey").val(unPascalCase(response.code));
	}
});

$("#autoSetter .state").change(function() {
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
$("#autoSetter .hotkey").on("focus", function () {
	lastKey = $(this).val();
	$(this).val("< press a key >");
});
$("#autoSetter .hotkey").on("blur", function () {
	if ($(this).val() == "< press a key >")
		$(this).val(lastKey);
});
$("#autoSetter .hotkey").on("keyup", function (event) {
	var code = getKeyCode(event);
	$(this).val(unPascalCase(code)).blur();
	chrome.runtime.sendMessage({message: "setAutoSetterHotkey", code: code});
});

// == properties ==
const properties = ["cargoHatchMode", "loaderMode", "loaderInvRequirement", "pusherPrimaryMode", "pusherFilteredMode", "doorSpawnRestriction"];
for (const prop of properties){
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
