"use strict";

// checkboxes
var checkboxIds = [
    "#hidePopupNotes",
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
        "hidePopupNotes",
        "makeMotdUrlsClickable",
        "makeChatUrlsClickable", "allowInteractingChatUrlsWithoutFocus", "chatHighlighterState", "chatHighlighterSoundState", "chatHighlighterTexts"
    ], function(data) {
        console.log(data);
        $("#hidePopupNotes").prop("checked", data.hidePopupNotes == 1);
        
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
