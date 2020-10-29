"use strict";

// checkboxes
var ids = ["#makeChatUrlsClickable", "#allowInteractingChatUrlsWithoutFocus", "#allowInteractingChatWithoutFocus", "#chatHighlighterState", "#chatHighlighterSoundState",
        "#makeMotdUrlsClickable"];
$(ids.join(", ")).change(function() {
    chrome.storage.sync.set({[$(this).attr("id")]: $(this).prop("checked")});
});

// textareas
var ids = ["#chatHighlighterTexts"];
var taTypingTimer;
var doneTaTypingInterval = 300;
$(ids.join(", ")).on("input", function() {
    var el = $(this);
    clearTimeout(taTypingTimer);
    if (el.val()) {
        taTypingTimer = setTimeout(function() {
            chrome.storage.sync.set({[el.attr("id")]: el.val()});
        }, doneTaTypingInterval);
    }
});

$("#previewHighlightSound").click(function() {
    const audio = new Audio(chrome.runtime.getURL("sfx/beep.mp3"));
    audio.loop = false;
    audio.play();
});

/* - default options are in background.js - */

function showOptions() {
    chrome.storage.sync.get([
        "makeChatUrlsClickable", "allowInteractingChatUrlsWithoutFocus", "allowInteractingChatWithoutFocus", "chatHighlighterState", "chatHighlighterSoundState", "chatHighlighterTexts",
        "makeMotdUrlsClickable"
    ], function(data) {
        $("#makeChatUrlsClickable").prop("checked", data.makeChatUrlsClickable == true);
        $("#allowInteractingChatUrlsWithoutFocus").prop("checked", data.allowInteractingChatUrlsWithoutFocus == true);
        $("#allowInteractingChatWithoutFocus").prop("checked", data.allowInteractingChatWithoutFocus == true);
        $("#chatHighlighterState").prop("checked", data.chatHighlighterState == true);
        $("#chatHighlighterSoundState").prop("checked", data.chatHighlighterSoundState == true);
        $("#chatHighlighterTexts").val(data.chatHighlighterTexts || "");
        
        $("#makeMotdUrlsClickable").prop("checked", data.makeMotdUrlsClickable == true);
    });
  }

$(document).ready(function() {
    showOptions();
});
