"use strict";

// options button
$("#optionsButton").click(function() {
	chrome.runtime.openOptionsPage();
});

// tabs
$(document).ready(function() {
	chrome.runtime.sendMessage({message: "getLastSelectedTab"}, function(response) {
		if (typeof response.id !== "undefined") {
			var li = $("ul.tabs li");
			if (li.filter("[data-tab='" + response.id + "']").length == 0)
				response.id = "tab-" + li.length;
			li.removeClass("current");
			$(".tab-content").removeClass("current");

			li.filter("[data-tab='" + response.id + "']").addClass("current");
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

void function () { // color picker
	let selectedInput;
	const picker = tui.colorPicker.create({
		container: document.getElementById("colorPicker"),
		preset: ["#111111", "#c99b86", "#47a53b", "#154479", "#5f3f11", "#ffffff", "#000000"],
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
		selectedInput.addClass("focused");
		picker.setColor(selectedInput.val());
		$("#colorPicker").show();
		return false;
	});

	$(document).mousedown(function(event) {
		let container = $("#colorPicker");
		if (container.is(":visible") && !container.is(event.target) && container.has(event.target).length === 0) {
			/* selectedInput.attr("value", picker.getColor());
			selectedInput.css("background-color", selectedInput.attr("value"));
			selectedInput.change(); */
			container.hide();
			selectedInput.removeClass("focused");
			selectedInput = undefined;
		}
	});

	$("#colorPicker .done-button").on("click", function(event) {
		selectedInput.attr("value", picker.getColor());
		selectedInput.css("background-color", selectedInput.attr("value"));
		selectedInput.change();
		$("#colorPicker").hide();
		selectedInput.removeClass("focused");
		selectedInput = undefined;
	});

	$("#colorPicker .cancel-button").on("click", function(event) {
		$("#colorPicker").hide();
		selectedInput.removeClass("focused");
		selectedInput = undefined;
	});
}();

void function () { // saved outfits
	const slotAmount = 12;
	const characterImageFiles = {
		body: "player.png",
		arm: "player_arm.png",
		face: "player_face.png",
		foot: "player_foot.png",
		hair: "player_hair.png",
		hand: "player_hand.png",
		head: "player_head.png",
		leg: "player_leg.png"
	};
	const characterPreviewParts = [
		{file: "hand", colorSource: "skin", x: 15, y: -8},
		{file: "leg", colorSource: "legs", x: 17.5, y: 5.8},
		{file: "leg", colorSource: "legs", x: 21.5, y: 5.8},
		{file: "body", colorSource: "body", x: 18, y: 6},
		{file: "head", colorSource: "skin", x: 0, y: -2},
		{file: "hair", colorSource: "hair", x: 12.5, y: -2.5},
		{file: "face", colorSource: "", x: 0, y: -2},
		{file: "arm", colorSource: "body", x: 21.5, y: -8},
		{file: "hand", colorSource: "skin", x: 21.5, y: -8},
		{file: "foot", colorSource: "feet", x: 17.5, y: 5.5},
		{file: "foot", colorSource: "feet", x: 21.5, y: 5.5}
	];

	let characterImages = {};
	async function loadCharacterImages() {
		for (const name of Object.keys(characterImageFiles)) {
			characterImages[name] = await loadImage("../images/" + characterImageFiles[name])
		}
	}

	function loadImage(url) {
		return new Promise(resolve => {
			const img = new Image();
			img.onload = () => { resolve(img); };
			img.src = url;
		});
	}

	function drawCharacterPreview(canvas, options) {
		canvas.width = 50;
		canvas.height = 75;
		characterPreviewParts.forEach(async part => {
			if (options.hairStyle == 0 && part.colorSource == "hair") {
				return;
			}
			const color = options.colors[part.colorSource];
			const ctx = canvas.getContext("2d");
			const img = characterImages[part.file];
			if (part.colorSource != "") {
				const c = document.createElement("canvas");
				c.width = img.naturalWidth;
				c.height = img.naturalHeight;
				const cCtx = c.getContext("2d");
				cCtx.drawImage(img, 0, 0);
	
				cCtx.fillStyle = color;
				cCtx.globalCompositeOperation = "multiply";
				cCtx.fillRect(0, 0, c.width, c.height);
	
				cCtx.globalCompositeOperation = "destination-in";
				cCtx.drawImage(img, 0, 0);
				cCtx.globalCompositeOperation = "source-over";
				ctx.drawImage(c, part.x, part.y);
			} else {
				ctx.drawImage(img, part.x, part.y);
			}
		});
	}

	function showInfo(content, type, ms) {
		let currentDivs = $("#savedOutfits .info div");
		if (currentDivs.length == 5) {
			currentDivs.first().remove();
		}
		let div = $("<div>", {style: "border-radius:5px;font-size:14px;padding:5px;display:none"});
		if (type == "error") {
			div.css("background-color", "rgba(220, 53, 69, 1)");
		} else if (type == "warning") {
			div.css({"background-color": "rgba(255, 193, 7, 1)", "color": "black"});
		} else if (type == "success") {
			div.css("background-color", "rgba(40, 167, 69, 1)");
		}
		div.text(content);
		$("#savedOutfits .info").prepend(div);
		div.slideDown(300);
		setTimeout(() => div.slideUp(300, () => div.remove()), ms);
	}
	
	(async () => {
		await loadCharacterImages();
		for (let i = 0; i < slotAmount; i++) {
			if (i != slotAmount - 1) {
				$(".outfit-slot[data-slot='0']").eq(0).clone(true).attr("data-slot", i + 1).appendTo("#outfits .slots");
			}
			chrome.runtime.sendMessage({message: "getSavedOutfit", index: i}, function(response) {
				if (typeof response.outfit !== "undefined") {
					let data = response.outfit.split("||");
					updatePreview($(`.outfit-slot[data-slot='${i}'] .preview canvas`), data[0], data[1], data[2], data[3], data[4], data[5]);
				} else {
					toggleAddButton($(`.outfit-slot[data-slot='${i}']`), true);
				}
			});
		}
	})();

	function updatePreview(selector, hairStyle, hairColor, skinColor, bodyColor, legsColor, feetColor) {
		let options = {
			hairStyle: hairStyle,
			colors: {
				hair: hairColor,
				skin: skinColor,
				body: bodyColor,
				legs: legsColor,
				feet: feetColor ?? "#5f3f11"
			}
		};
		selector.each(function() {
			drawCharacterPreview(this, options);
		});
	}
	function toggleAddButton(el, on) {
		el.find(".edit-button").toggle(!on);
		el.find(".add-button").toggle(on);
	}

	let editingOutfit;
	$(".outfit-slot .edit-button, .outfit-slot .add-button").on("click", function() {
		const isAdd = $(this).hasClass("add-button")
		editingOutfit = parseInt($(this).parent().attr("data-slot"));
		$("#editOutfit .title-slot").text(parseInt(editingOutfit) + 1);
		$("#outfits").hide();
		chrome.runtime.sendMessage({message: "getSavedOutfit", index: editingOutfit}, function(response) {
			let data;
			if (typeof response.outfit !== "undefined")
				data = response.outfit;
			else
				data = "0||#111111||#c99b86||#47a53b||#154479||#5f3f11";
			data = data.split("||");
			loadOutfitToInputs(data);
			$("#editOutfit").show();
			if (isAdd) outfitChanged();
		});
	});
	
	function loadOutfitToInputs(data) {
		let inputs = $("#editOutfit .inputs");
		inputs.find(".hair-type").val(data[0]);
		inputs.find(".hair-color").attr("value", data[1]);
		inputs.find(".skin-color").attr("value", data[2]);
		inputs.find(".body-color").attr("value", data[3]);
		inputs.find(".legs-color").attr("value", data[4]);
		inputs.find(".feet-color").attr("value", data[5]);
		updatePreview($(`#editOutfit .preview canvas`), data[0], data[1], data[2], data[3], data[4], data[5]);
		colorLabels();
	}

	let outfitCooldown;
	$(".outfit-slot").on("click", function(event) {
		if ($(event.target).is(".edit-button, .add-button")) return;
		if (outfitCooldown) {
			showInfo("You can't change outfit that fast", "error", 2800);
			return;
		}
		const slot = parseInt($(this).attr("data-slot"));
		chrome.runtime.sendMessage({message: "getSavedOutfit", index: slot}, async function(response) {
			if (typeof response.outfit === "undefined") return;
			let data = response.outfit.split("||");
			await chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {message: "getAccountInfo", useCache: true}, function(accountInfo) {
					if (chrome.runtime.lastError) {
						showInfo("No Dredark game in the current browser tab", "error", 3000);
						return;
					} else if (accountInfo && accountInfo.noAccount) {
						showInfo("You are not logged into a Dredark account", "error", 3000);
						return;
					} else if (accountInfo && !accountInfo.isRegistered) {
						showInfo("Anonymous Dredark accounts cannot change character appearance", "error", 3500);
						return;
					} // ignore if no account info
					chrome.tabs.sendMessage(tabs[0].id, {message: "setInGameOutfit", outfit: data}, function(response) {
						if (!response.isInGame) {
							showInfo("Outfit changed, but because you aren't in a ship, you need to refresh the page to apply it", "warning", 5000);
							return;
						}
						showInfo("Outfit successfully changed", "success", 2000);
						outfitCooldown = true;
						setTimeout(() => outfitCooldown = undefined, 900);
					});
				});
			});
		});
	});

	$("#editOutfit .back-button").on("click", function() {
		editingOutfit = undefined;
		$("#editOutfit").hide();
		$("#outfits").show();
	});

	$("#editOutfit .delete-button").on("click", function() {
		chrome.runtime.sendMessage({message: "setSavedOutfit", index: editingOutfit, outfit: undefined});
		const outfitSlot = $(`.outfit-slot[data-slot='${editingOutfit}']`);
		toggleAddButton(outfitSlot, true);
		const canvas = outfitSlot.find(".preview canvas")[0];
		canvas.width = canvas.height = 0;
		showInfo(`Successfully deleted outfit #${editingOutfit + 1}`, "success", 2500);
		editingOutfit = undefined;
		$("#editOutfit").hide();
		$("#outfits").show();
	});

	$("#editOutfit .load-button").on("click", function() {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {message: "getOutfitFromStorage"}, function(response) {
				if (chrome.runtime.lastError) {
					showInfo("No Dredark game in the current browser tab", "error", 4000);
					return;
				}
				if (typeof response.outfit !== "undefined") {
					loadOutfitToInputs(response.outfit);
					showInfo("Successfully loaded outfit from the game", "success", 3000);
					outfitChanged();
				} else {
					showInfo("Could not get outfit from the game", "error", 3000);
				}
			});
		});
	});
	
	function outfitChanged() {
		const hairStyle = $("#editOutfit .inputs .hair-type").eq(0).val(),
			hairColor = $("#editOutfit .inputs .hair-color").eq(0).attr("value"),
			skinColor = $("#editOutfit .inputs .skin-color").eq(0).attr("value"),
			bodyColor = $("#editOutfit .inputs .body-color").eq(0).attr("value"),
			legsColor = $("#editOutfit .inputs .legs-color").eq(0).attr("value"),
			feetColor = $("#editOutfit .inputs .feet-color").eq(0).attr("value");
		toggleAddButton($(`.outfit-slot[data-slot='${editingOutfit}']`), false);
		updatePreview($(`.outfit-slot[data-slot='${editingOutfit}'] .preview canvas, #editOutfit .preview canvas`), hairStyle, hairColor, skinColor, bodyColor, legsColor, feetColor);
		chrome.runtime.sendMessage({message: "setSavedOutfit", index: editingOutfit, outfit: [hairStyle, hairColor, skinColor, bodyColor, legsColor, feetColor].join("||")});
	}
	
	$("#editOutfit .inputs select, #editOutfit .inputs input").on("change", function() {
		outfitChanged();
	});
	
	$("input[type='color']").on("input change", function() {
		$(this).parent().css("background-color", $(this).val());
	});
	
	function colorLabels() {
		$(".color-input").each(function() {
			$(this).css("background-color", $(this).val());
		});
	}
}();

/* auto setter start */
// == main ==
chrome.runtime.sendMessage({message: "getAutoSetterState"}, function(response) {
	$("#autoSetter #autoSetterState").prop("checked", response.state);
	if (!response.state) {
		$("#autoSetter input:not(#autoSetterState), #autoSetter select, #autoSetter .edit-button").prop("disabled", true);
	}
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
				var e = $.Event("keyup");
				e.code = "ShiftLeft";
				e.key = "Shift";
				e.keyCode = 16;
				$("#autoSetter .hotkey").trigger(e);
			}
		});
		$("#autoSetter input:not(#autoSetterState), #autoSetter select, #autoSetter .edit-button").prop("disabled", false);
    } else {
		chrome.runtime.sendMessage({message: "setAutoSetterState", state: false});
		$("#autoSetter input:not(#autoSetterState), #autoSetter select, #autoSetter .edit-button").prop("disabled", true);
    }
});
var lastHotkey;
$("#autoSetter .hotkey").on("focus", function() {
	lastHotkey = $(this).val();
	$(this).val("< press a key >");
});
$("#autoSetter .hotkey").on("blur", function() {
	if ($(this).val() == "< press a key >")
		$(this).val(lastHotkey);
});
$("#autoSetter .hotkey").on("keyup", function (event) {
	var code = getKeyCode(event);
	$(this).val(unPascalCase(code)).blur();
	chrome.runtime.sendMessage({message: "setAutoSetterHotkey", code: code});
});

// == properties ==
const autoSetterProperties = ["doorSpawnRestriction", "signShowTextMode"];
for (const prop of autoSetterProperties) {
	chrome.runtime.sendMessage({message: "getAutoSetterProperty", property: prop}, function(response) {
		$("#autoSetter ." + prop).val(response.value).change();
	});
	$("#autoSetter ." + prop).change(function() {
		var selectedOption = $(this).find("option:selected");
		chrome.runtime.sendMessage({message: "setAutoSetterProperty", property: prop, value: selectedOption.val()});
		$(this).attr("style", selectedOption.attr("style"));
	});
}
// sign text
chrome.runtime.sendMessage({message: "getAutoSetterProperty", property: "signText"}, function(response) {
	if (response.value !== -1)
		$("#autoSetter .signText").val(response.value);
});
$("#autoSetter .signText").on("input", function() {
	chrome.runtime.sendMessage({message: "setAutoSetterProperty", property: "signText", value: $(this).val()});
});

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
	$(this).prev(".sdt-clearable").val("").trigger("input").blur();
});

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

const regexUnPascal = /([^[A-Z0-9]{2,})([A-Z0-9])/g;
function unPascalCase(text) {
	return text.replace(regexUnPascal, "$1 $2");
}
/* auto setter end */

/* notes start */
chrome.runtime.sendMessage({message: "getValueOf", key: "hidePopupNotes"}, function(response) {
	$("#notes").css("display", response.value == 1 ? "none" : "block");
});
/* notes end */
