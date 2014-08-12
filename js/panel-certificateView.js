/*
* adapt-learnerassistant-certificateView
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var panel = Backbone.View.extend({		
		//UI
		className : "la-certificate",
		template : "panel-certificate",
		internalOn: false,

		initialize: function() {
			var thisHandle = this;
			Adapt.on("learnerassistant:initialized", function() {
				thisHandle.model = Adapt.learnerassistant.model;
			});
		},

		render: function() {

			var template = Handlebars.templates[this.template];
			this.$el.html(template(this.model.toJSON()));
			_.defer(_.bind(function() {
				this.postRender();
			}, this));

		},
		postRender: function() {

			var _settings = this.model.get("_learnerassistant")._certificateGraphics;
			_settings._titleText.text = Adapt.course.get("title");
			_settings._userText.text = require("extensions/adapt-contrib-spoor/js/scormWrapper").instance.getStudentName();
			if (_settings._userText.text === undefined) _settings._userText.text = "Unknown User";

			function complete(imgUrl) {

				_settings._rendered = imgUrl;

				var img = document.createElement("img");
				img.src = imgUrl;

				$("#image-container").html("").append(img);

			}

			if (_settings._rendered !== undefined) complete(_settings._rendered);
			else Adapt.learnerassistant.certificateRender(_settings, complete );

		},
	
		//INTERACTION
		events : {
			'click .la-close': 'onCloseClick'
		},

		onCloseClick: function(event) {
			event.preventDefault();

			Adapt.trigger("learnerassistant:reviewEnd");

		}
	});

	return panel;
});