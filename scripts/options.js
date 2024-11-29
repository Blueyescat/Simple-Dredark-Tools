"use strict";

// checkboxes
var checkboxIds = [
	"#hidePopupNotes",
	"#simplifyMessages",
	"#makeMotdUrlsClickable",
	"#makeChatUrlsClickable", "#allowInteractingChatUrlsWithoutFocus", "#chatHighlighterState", "#chatHighlighterSoundState"
];
$(checkboxIds.join(", ")).change(function() {
	const key = $(this).attr("id")
	const checked = $(this).prop("checked")
	const value = key == "hidePopupNotes" ? (checked ? 1 : 0) : checked
	chrome.storage.sync.set({[key]: value});
});

// textareas
var textareaIds = ["#chatHighlighterTexts"];
var taTypingTimer;
var doneTaTypingInterval = 200;
$(textareaIds.join(", ")).on("input", function() {
	var el = $(this);
	clearTimeout(taTypingTimer);
	if (el.val()) {
		taTypingTimer = setTimeout(function() {
			chrome.storage.sync.set({[el.attr("id")]: el.val()});
		}, doneTaTypingInterval);
	}
});

var sfxBeep = new Audio(chrome.runtime.getURL("sfx/beep.mp3"));
sfxBeep.loop = false;
$("#previewHighlightSound").click(function() {
	sfxBeep.play();
});

/* - default options are in background.js - */

function showOptions() {
	chrome.storage.sync.get([
		"hidePopupNotes", "turretModeHotkey", "simplifyMessages",
		"makeMotdUrlsClickable",
		"makeChatUrlsClickable", "allowInteractingChatUrlsWithoutFocus", "chatHighlighterState", "chatHighlighterSoundState", "chatHighlighterTexts"
	], function(data) {
		$("#hidePopupNotes").prop("checked", data.hidePopupNotes == 1);

		$("#simplifyMessages").prop("checked", data.simplifyMessages == true);
			
		$("#turretModeHotkey").val(unPascalCase(data.turretModeHotkey || ""));
		
		$("#makeMotdUrlsClickable").prop("checked", data.makeMotdUrlsClickable == true);

		$("#makeChatUrlsClickable").prop("checked", data.makeChatUrlsClickable == true);
		$("#allowInteractingChatUrlsWithoutFocus").prop("checked", data.allowInteractingChatUrlsWithoutFocus == true);
		$("#chatHighlighterState").prop("checked", data.chatHighlighterState == true);
		$("#chatHighlighterSoundState").prop("checked", data.chatHighlighterSoundState == true);
		$("#chatHighlighterTexts").val(data.chatHighlighterTexts || "");
	});
  }

$(document).ready(function() {
	showOptions();
	$("#extensionVersion").text(chrome.runtime.getManifest().version);
});

// hotkeys
var lastHotkey;
const hotkeyInfo = "< press a key, right click to disable >";
$(".hotkey").on("focus", function() {
	lastHotkey = $(this).val();
	$(this).val(hotkeyInfo);
});
$(".hotkey").on("contextmenu", function() {
	$(this).val("");
	handleHotkeyChange($(this))
	this.blur()
	return false;
});
$(".hotkey").on("blur", function() {
	if ($(this).val() == hotkeyInfo)
		$(this).val(lastHotkey);
});
$(".hotkey").on("keyup", function (e) {
	var code = getKeyCode(e);
	$(this).val(unPascalCase(code)).blur();
	handleHotkeyChange($(this), code)
});
function handleHotkeyChange(el, code) {
	if (code)
		chrome.storage.sync.set({[el.attr("id")]: code})
	else
		chrome.storage.sync.remove(el.attr("id"))
}

// utils
function getKeyCode(e) {
	var code;
	if (e.code !== undefined && e.code != "")
		code = e.code;
	else if (e.key !== undefined)
		code = e.key;
	else if (e.keyCode !== undefined)
		code = e.keyCode;
	return code;
}

const regexUnPascal = /([^[A-Z0-9]{2,})([A-Z0-9])/g;
function unPascalCase(text) {
	return text.replace(regexUnPascal, "$1 $2");
}
