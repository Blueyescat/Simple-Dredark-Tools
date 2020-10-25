"use strict";
// checkboxes
var ids = ["#makeChatUrlsClickable", "#allowInteractingChatUrlsWithoutFocus", "#allowInteractingChatWithoutFocus",
        "#makeMotdUrlsClickable"];
$(ids.join(", ")).change(function() {
    saveCheckbox($(this));
});
function saveCheckbox(el) {
    chrome.storage.sync.set({[el.attr("id")]: el.prop("checked")});
}

chrome.storage.sync.get({option: "default"}, function() {
    chrome.storage.sync.set({["makeChatUrlsClickable"]: true});
    chrome.storage.sync.set({["allowInteractingChatUrlsWithoutFocus"]: true});
    chrome.storage.sync.set({["makeMotdUrlsClickable"]: true});
});

function showOptions() {
    chrome.storage.sync.get([
        "makeChatUrlsClickable", "allowInteractingChatUrlsWithoutFocus", "allowInteractingChatWithoutFocus",
        "makeMotdUrlsClickable"
    ], function(data) {
        $("#makeChatUrlsClickable").prop("checked", data.makeChatUrlsClickable == true);
        $("#allowInteractingChatUrlsWithoutFocus").prop("checked", data.allowInteractingChatUrlsWithoutFocus == true);
        $("#allowInteractingChatWithoutFocus").prop("checked", data.allowInteractingChatWithoutFocus == true);
        
        $("#makeMotdUrlsClickable").prop("checked", data.makeMotdUrlsClickable == true);
    });
  }

$(document).ready(function() {
    showOptions();
});
