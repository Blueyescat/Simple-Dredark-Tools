"use strict";

// checkboxes
var checkboxIds = ["#makeChatUrlsClickable", "#allowInteractingChatUrlsWithoutFocus", "#chatHighlighterState", "#chatHighlighterSoundState",
        "#makeMotdUrlsClickable"];
$(checkboxIds.join(", ")).change(function() {
    chrome.storage.sync.set({[$(this).attr("id")]: $(this).prop("checked")});
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
        "makeChatUrlsClickable", "allowInteractingChatUrlsWithoutFocus", "chatHighlighterState", "chatHighlighterSoundState", "chatHighlighterTexts",
        "makeMotdUrlsClickable"
    ], function(data) {
        $("#makeChatUrlsClickable").prop("checked", data.makeChatUrlsClickable == true);
        $("#allowInteractingChatUrlsWithoutFocus").prop("checked", data.allowInteractingChatUrlsWithoutFocus == true);
        $("#chatHighlighterState").prop("checked", data.chatHighlighterState == true);
        $("#chatHighlighterSoundState").prop("checked", data.chatHighlighterSoundState == true);
        $("#chatHighlighterTexts").val(data.chatHighlighterTexts || "");
        
        $("#makeMotdUrlsClickable").prop("checked", data.makeMotdUrlsClickable == true);
    });
  }

$(document).ready(function() {
    showOptions();
    $("#extensionVersion").text(chrome.runtime.getManifest().version);
});
