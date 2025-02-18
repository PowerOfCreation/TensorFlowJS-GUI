"use strict";

function init_tabs () {
	var tabs_settings = {
		activate: function (event, ui) {
			disable_hidden_chardin_entries();
			hide_annoying_tfjs_vis_overlays();
		}
	};

	$("#ribbon").children().each(function (i, e) {
		var title = $(e).prop("title");
		if(title) {
			var named_id = $(e).prop("id");
			$("#tablist").append("<li><a href=#" + named_id + ">" + title + "</a></li>");
		}
	});

	$("#ribbon").tabs(tabs_settings);
	$("#right_side").tabs(tabs_settings);
	$("#visualization_tab").tabs(tabs_settings);
	$("#tfvis_tab").tabs(tabs_settings);
	$("#code_tab").tabs(tabs_settings);
}

function init_set_all_options () {
	var initializer_keys = Object.keys(initializers);
	var activation_functions = Object.keys(activations);

	var set_all_bias_initializers = $('#set_all_bias_initializers')
	var set_all_kernel_initializers = $('#set_all_kernel_initializers');
	var set_all_activation_functions = $('#set_all_activation_functions');

	for (var i = 0; i < initializer_keys.length; i++) {
		set_all_bias_initializers.append($('<option>', {
			value: initializer_keys[i],
			text: initializer_keys[i]
		}));

		set_all_kernel_initializers.append($('<option>', {
			value: initializer_keys[i],
			text: initializer_keys[i]
		}));
	}

	for (var i = 0; i < activation_functions.length; i++) {
		set_all_activation_functions.append($('<option>', {
			value: activation_functions[i],
			text: activation_functions[i]
		}));
	}

	document.addEventListener('keydown', function(event) {
		if (event.ctrlKey && event.key === 'z') {
			undo();
		} else if (event.ctrlKey && event.key === 'y') {
			redo();
		} else if (event.ctrlKey && event.key === ';') {
			$("#jump_to_training_tab").click();
			$("#jump_to_predict_tab").click();
			train_neural_network();
		} else if (event.ctrlKey && event.key === ',') {
			train_neural_network();
		} else if (event.ctrlKey && event.key === 'L') {
			$("#jump_to_predict_tab").click();
			$("#jump_to_training_tab").click();
		} else if (event.ctrlKey && event.altKey && event.key === 'h') {
			$("[href='#home_ribbon']").click();
		} else if (event.altKey && event.key === 't') {
			$("[href='#tf_ribbon']").click();
		} else if (event.altKey && event.key === 'm') {
			$("#visualization_tab_label").click();
			$("#math_tab_label").click();
		} else if (event.ctrlKey && event.key === '#') {
			if($("#demomode").css("display") == "none") {
				start_demo_mode();
			} else {
				end_demo_mode();
			}
		} else if (event.altKey && event.key === 'v') {
			$("[href='#visualization_ribbon']").click();
		}
	});
}

function init_page_contents (chosen_dataset) {
	global_disable_auto_enable_valid_layer_types = true;
	disable_show_python_and_create_model = true;

	$("#width").val(width);
	$("#height").val(height);

	$("#train_data_set_group").hide();

	init_dataset_category(1).then(() => {
		global_disable_auto_enable_valid_layer_types = true;
		set_batchSize(5);
	});

	document.getElementById("upload_x_file").addEventListener("change", handle_x_file, false);
	document.getElementById("upload_y_file").addEventListener("change", handle_y_file, false);
	document.getElementById('upload_model').addEventListener('change', upload_model, false);
	document.getElementById('upload_weights').addEventListener('change', upload_weights, false);

	determine_input_shape();

	$("#layers_container").sortable({
		placeholder: 'sortable_placeholder',
		axis: 'y',
		opacity: 0.6,
		revert: true,
		update: function( ) {
			updated_page();
		}
	});

	$("#tablist").show();

	if(["image"].includes($("#dataset_category").val())) {
		$("#train_data_set_group").show();
	}

	set_config();

	global_disable_auto_enable_valid_layer_types = false;
	disable_show_python_and_create_model = false;

	if(chosen_dataset) {
		$("#dataset").val(chosen_dataset);
		$("#dataset").trigger("change");
	}

	set_mode();
}

function dataset_already_there (dataset_name) {
	var already_there = false;
	$("#dataset").children().each(
		function (id, e) {
			if(e.text == dataset_name) {
				already_there = true;
				return;
			}
		}
	);

	return already_there;
}

function init_categories () {
	var chosen_category = $("#dataset_category").val();
	var categories = Object.keys(traindata_struct);

	$("#dataset").html("");

	for (var i = 0; i < categories.length; i++) {
		var existing_keys = $.map($("#dataset_category option"), e => $(e).val())
		var folder_name = traindata_struct[categories[i]]["category_name"];
		var category = categories[i];
		if(!existing_keys.includes(folder_name)) {
			$("#dataset_category").prepend(`<option value="${folder_name}">${category}</option>`);
		}

		if(folder_name == chosen_category) {
			var datasets = traindata_struct[categories[i]]["datasets"];

			var dataset_names = Object.keys(datasets);
			for (var j = 0; j < dataset_names.length; j++) {
				var dataset_name = dataset_names[j];
				if(!dataset_already_there(dataset_name)) {
					var dataset_value = datasets[dataset_names[j]]["name"];
					var existing_keys_in_dataset = $.map($("#dataset option"), e => $(e).val())
					if(!existing_keys_in_dataset.includes(folder_name)) {
						$("#dataset").append(`<option value="${dataset_value}">${dataset_name}</option>`);
					}
				}
			}
		}
	}

	number_of_initialized_layers = 0;
}

function fix_graph_color () {
	$(".subsurface-title").css("background-color", "transparent").css("border-bottom", "transparent");
}

$(document).ready(function() {
	assert(layer_types_that_dont_have_default_options().length == 0, "There are layer types that do not have default options");
	init_tabs();
	init_set_all_options();
	init_categories();

	//$("#dataset_category").val("image");
	$("#dataset_category").val("classification");

	init_page_contents();

	document.getElementById("upload_tfjs_weights").onchange = function(evt) {
		if(!window.FileReader) return;
		var reader = new FileReader();

		reader.onload = function(evt) {
			if(evt.target.readyState != 2) return;
			if(evt.target.error) {
				alert('Error while reading file');
				return;
			}

			var filecontent = evt.target.result;
			set_weights_from_string(filecontent, 1);

			add_layer_debuggers();

			$("#predictcontainer").show();
		};

		reader.readAsText(evt.target.files[0]);
	};

	show_or_hide_load_weights();

	change_data_origin(0);

	window.onresize = reset_view;

	setInterval(allow_training, 500);

	setInterval(fix_lenet_width, 700);

	setInterval(fix_graph_color, 700);

	//$("#lenet_tab_label").click();
	//$("#code_tab_label").click()

	setInterval(show_load_weights, 1000);
});
