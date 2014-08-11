/*
* adapt-learnerassistant
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	require('extensions/adapt-assessment-learnerAssistant/js/_hacks');

	var LAModel = require('extensions/adapt-assessment-learnerAssistant/js/adapt-assessment-learnerAssistant-model');

	var LADrawerAssocLearn =  require('extensions/adapt-assessment-learnerAssistant/js/drawer-associatedLearningView');
	var LABottomAssessProg = require('extensions/adapt-assessment-learnerAssistant/js/menu-bottomAssessmentProgressView');
	var LABottomAssocLearn = require('extensions/adapt-assessment-learnerAssistant/js/menu-bottomAssociatedLearningView');
	var LATopNav = require('extensions/adapt-assessment-learnerAssistant/js/menu-topNavigationView');
	var LAPanelCert = require('extensions/adapt-assessment-learnerAssistant/js/panel-certificateView');
	var LAPanelRes = require('extensions/adapt-assessment-learnerAssistant/js/panel-resultsView');

	//GLOBAL LEARNERASSISTANT CONTEXT
	var learnerassistant = new (Backbone.View.extend({ //must be a view for listento function in assessment progress .attach + detach

	//PUBLIC VARIABLES
		model: new LAModel(), //a modified copy of the assessment.getQuestionModel() model

	//UTILITY FUNCTIONS
		navigateToId: function(id) {

			var element = Adapt.findById(id)
			var typeNameConversion = {
				"component": "components",
				"article": "articles",
				"block": "blocks",
				"menu": "contentObject",
				"page": "contentObject"
			};

			_state._currentAssociatedLearningID = id;

			id = LAIfIdOffsetHiddenReturnParentId(id);

			function complete() {

					Adapt.navigateToElement("." + id, typeNameConversion[element.get("_type")] );

					Adapt.bottomnavigation.render();

			}

			if ( _state._isPanelResultsShown ) learnerassistant.panel.results.hide( complete );
			else complete()

		},

		navigateToMainMenu: function() {

			var parentId = Adapt.findById( _state._views['assessment'].model.get("_parentId") ).get("_parentId");

			if (parentId == "course") {
				
				//ASSESSMENT PARENT MENU IS COURSE
				Backbone.history.navigate("#/", {trigger: true, replace: true});

			} else { 

				//ASSESSMENT PARENT MENU NOT COURSE
				Backbone.history.navigate("#/id/" + parentId, {trigger: true, replace: true});

			}
		},

	//MENU FUNCTIONS
		menu: {

			//TOP NAVIGATION SHOW/HIDE
			topNavigation: {

				show: function() {

					$(".navigation-inner").append( _state._views['menu-topnavigation'].$el );
					
					_state._isMenuTopShown = true;
					_state._menuTop = "guidedLearning";

					_state._views['menu-topnavigation'].render();

				},

				hide: function() {

					_state._isMenuTopShown = false;
					_state._menuTop = "none";

					_state._views['menu-topnavigation'].$el.remove();

				}

			},

			//BOTTOM NAVIGATION
			bottomNavigation: {
				//ASSESSMENT PROGRESS FUNCTIONS
				assessmentProgress : {

					incrementalMarking: false,

					show: function(duration) {

						//ATTACH ASSESSMENT PROGRESS TO QUESTIONS
						var _associatedlearning = learnerassistant.model.get("_associatedlearning");
						_.each(_associatedlearning._questions, function(question) {
							learnerassistant.listenTo( Adapt.findById(question._id), "change:_isInteractionsComplete", function(model, isInteractionsComplete) {
								Adapt.bottomnavigation.render();
							});
						});

						//UPDATE STATE
						_state._isMenuBottomShown = true;
						_state._isMenuBottomAssessmentProgressShown = true;
						_state._isMenuBottomAssociatedLearningShown = false;
						_state._menuBottom = "assessmentProgress";

						//SHOW NAVIGATION
						Adapt.bottomnavigation.setCustomView( _state._views['menu-bottomassessprog'] );
						Adapt.bottomnavigation.render();
						Adapt.bottomnavigation.show(duration);
						Adapt.bottomnavigation.showMobile(false);

					},

					hide: function(duration) {

						//DETACH ASSESSMENT PROGRESS FROM QUESTIONS
						var _associatedlearning = learnerassistant.model.get("_associatedlearning");
						_.each(_associatedlearning._questions, function(question) {
							learnerassistant.stopListening( Adapt.findById(question._id), "change:_isInteractionsComplete");
						});

						//HIDE NAVIGATION
						Adapt.bottomnavigation.hide(duration);

						//UPDATE STATE
						_state._isMenuBottomShown = false;
						_state._isMenuBottomAssessmentProgressShown = false;
						_state._isMenuBottomAssociatedLearningShown = false;
						_state._menuBottom = "none";
					}
				},

				//GUIDED LEARNING / REVIEW MODE NAVIGATION FUNCTIONS
				associatedLearning: {

					show: function(duration) {

						//UPDATE STATE
						_state._isMenuBottomShown = true;
						_state._isMenuBottomAssessmentProgressShown = false;
						_state._isMenuBottomAssociatedLearningShown = true;
						_state._menuBottom = "associatedLearning";

						//CHANGE NAVIGATION VIEW TO LEARNING ASSISTANT FROM PAGELEVELPROGRESS
						Adapt.bottomnavigation.setCustomView( _state._views['menu-bottomassoclearn'] );
						Adapt.bottomnavigation.render();
						Adapt.bottomnavigation.show(duration);
						Adapt.bottomnavigation.showMobile(true);

						$(".navigation-inner").addClass("no-pageLevelProgress");
				
					},

					hide: function(duration) {

						//HIDE NAVIGATION
						Adapt.bottomnavigation.hide(duration);
						$(".navigation-inner").removeClass("no-pageLevelProgress");

						//UPDATE STATE
						_state._isMenuBottomShown = false;
						_state._isMenuBottomAssessmentProgressShown = false;
						_state._isMenuBottomAssociatedLearningShown = false;
						_state._menuBottom = "none";
					}

				}
			}

		},

		panel: {
			//RESULTS VIEW FUNCTIONS
			results: {

				show: function(callback) {
					//CHANGE ROLLAY VIEW TO RESULTS VIEW
					Adapt.rollay.forceShow(true);

					//UPDATE STATE
					_state._isPanelResultsShown = true;
					_state._isPanelCertificateShown = false;
					_state._isPanelShown = true;
					_state._panel = "results";

					//RERENDER TOP NAVIGATION
					_state._views['menu-topnavigation'].render();

					//CHANGE ROLLAY VIEW TO RESULTS VIEW
					Adapt.rollay.setCustomView( _state._views['panel-results'] );
					Adapt.rollay.render();

					Adapt.rollay.show(function() {

						Adapt.trigger("learnerassistant:resultsOpened");

						//RERENDER BOTTOM NAVIGATION
						Adapt.bottomnavigation.render();
						if (typeof callback == "function") callback();

					});
				},

				hide: function(callback) {

					Adapt.rollay.forceShow(false);

					//UPDATE STATE
					_state._isPanelResultsShown = false;
					_state._isPanelCertificateShown = false;
					_state._isPanelShown = false;
					_state._panel = "none";

					Adapt.rollay.hide(function() {
						
						//RERENDER TOP NAVIGATION
						_state._views['menu-topnavigation'].render();

						Adapt.trigger("learnerassistant:resultsClosed");

						//RERENDER BOTTON NAVIGATION
						Adapt.bottomnavigation.render();
						if (typeof callback == "function") callback();

					});

				}

			},

			//CERTIFICATE VIEW FUNCTIONS
			certificate: {

				show: function(callback) {
					//CHANGE ROLLAY VIEW TO CERTIFICATE VIEW
					Adapt.rollay.forceShow(true);

					//UPDATE STATE
					_state._isPanelResultsShown = false;
					_state._isPanelCertificateShown = true
					_state._isPanelShown = true;
					_state._panel = "certificate";

					//RERENDER TOP NAVIGATION
					_state._views['menu-topnavigation'].render();

					Adapt.rollay.setCustomView( _state._views['panel-certificate'] );
					
					Adapt.rollay.render();
					Adapt.rollay.show(function() {

						_state._views['menu-topnavigation'].render();
						
						Adapt.trigger("learnerassistant:certificateOpened");

						//RERENDER BOTTOM NAVIGATION
						Adapt.bottomnavigation.render();

						if (typeof callback == "function") callback();

					});
				},

				hide: function(callback) {
					Adapt.rollay.forceShow(false);

					//UPDATE STATE
					_state._isPanelResultsShown = false;
					_state._isPanelCertificateShown = false;
					_state._isPanelShown = false;
					_state._panel = "none";

					//RERENDER TOP NAVIGATION
					_state._views['menu-topnavigation'].render();

					Adapt.rollay.hide(function() {
						_state._views['menu-topnavigation'].render();

						Adapt.trigger("learnerassistant:certificateClosed");

						//RERENDER BOTTOM NAVIGATION
						Adapt.bottomnavigation.render();

						if (typeof callback == "function") callback();

					});
					//
				}

			}

		},

		//LEANER ASSISTANT DRAWER FUNCTIONS
		drawer: {
			associatedLearning: {

				show: function() {

					//RERENDER DRAWER
					if (typeof _state._views['drawer-assoclearn'].render == "function") _state._views['drawer-assoclearn'].render();

					//DETACH EVENTS
					_state._views['drawer-assoclearn'].undelegateEvents();

					//ADD VIEW TO DRAWER
					Adapt.drawer.triggerCustomView( _state._views['drawer-assoclearn'].$el , false);

					//REATTACH EVENTS
					_state._views['drawer-assoclearn'].delegateEvents();

					Adapt.trigger("learnerassistant:drawerOpened");
				}

			}

		}
	}))();

	var _state = learnerassistant.model.get("_state");
	var _learnerassistant = learnerassistant.model.get("_learnerassistant");

	_state._views = {
		'drawer-assoclearn': new LADrawerAssocLearn(),
		'menu-bottomassessprog': new LABottomAssessProg(),
		'menu-bottomassoclearn': new LABottomAssocLearn(),
		'menu-topnavigation': new LATopNav(),
		'panel-certificate': new LAPanelCert(),
		'panel-results': new LAPanelRes()
	};

	Handlebars.registerHelper('learnerAssistantSettings', function() {

		var rtn = eval(arguments[0]);
		return rtn;

	});

	Adapt.learnerassistant = learnerassistant;
	return learnerassistant;

});