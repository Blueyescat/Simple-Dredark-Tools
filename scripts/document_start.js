"use strict";

var wshook = document.createElement("script");
wshook.src = chrome.runtime.getURL("scripts/wshook.js");
wshook.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(wshook);
