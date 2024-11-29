"use strict";

var webpage = document.createElement("script");
webpage.src = chrome.runtime.getURL("scripts/webpage.js");
webpage.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(webpage);
