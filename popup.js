"use strict";

for (let i = 0; i < 5; i++) {
	chrome.runtime.sendMessage({message: "getSavedNick", index: i}, function(response) {
		if (typeof response.nick !== "undefined")
			$(".saved-nickname-slot[data-slot='" + i + "']").val(response.nick);
	});
	
	chrome.runtime.sendMessage({message: "getSavedOutfit", index: i}, function(response) {
		if (typeof response.outfit !== "undefined") {
			var data = response.outfit.split("||");
			$(".saved-outfit-slot[data-slot='" + i + "'] .hair-type").val(data[0]);
			$(".saved-outfit-slot[data-slot='" + i + "'] .hair-color").val(data[1]);
			$(".saved-outfit-slot[data-slot='" + i + "'] .skin-color").val(data[2]);
			$(".saved-outfit-slot[data-slot='" + i + "'] .body-color").val(data[3]);
			$(".saved-outfit-slot[data-slot='" + i + "'] .legs-color").val(data[4]);
		}
		if (i == 4)
			colorLabels();
	});
}

$(".saved-nickname-slot").on('input', function() {
	chrome.runtime.sendMessage({message: "setSavedNick", index: $(this).data("slot"), nick: $(this).val()});
});

function outfitChanged(slot) {
	var hairType = $(".saved-outfit-slot[data-slot='" + slot + "'] .hair-type").eq(0).val();
	var hairColor = $(".saved-outfit-slot[data-slot='" + slot + "'] .hair-color").eq(0).val();
	var skinColor = $(".saved-outfit-slot[data-slot='" + slot + "'] .skin-color").eq(0).val();
	var bodyColor = $(".saved-outfit-slot[data-slot='" + slot + "'] .body-color").eq(0).val();
	var legsColor = $(".saved-outfit-slot[data-slot='" + slot + "'] .legs-color").eq(0).val();
	var data = hairType + "||" + hairColor + "||" + skinColor + "||" + bodyColor + "||" + legsColor;
	chrome.runtime.sendMessage({message: "setSavedOutfit", index: slot, outfit: data});
}

$(".saved-outfit-slot select").on('change', function() {
	outfitChanged($(this).parent().data("slot"));
});
$(".saved-outfit-slot input").on("change", function() {
	outfitChanged($(this).parent().parent().data("slot"));
});


for (let i = 0; i < 4; i++) {
	$(".saved-outfit-slot[data-slot='0']").eq(0).clone(true).attr("data-slot", i+1).appendTo("#savedOutfits ol");
}

$("input[type='color']").on("input change", function() {
	$(this).parent().css("background-color", $(this).val());
});

function colorLabels() {
	$("input[type='color']").each(function() {
		$(this).parent().css("background-color", $(this).val());
	});
}
