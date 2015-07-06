define([
    'dojo/_base/declare',
    'dojo/parser',
    'dojo/ready',
    'dojo/dom-style',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!seed/seed-compare-template.html',
    'seed/compare-regions',
    'seed/SEEDClient',
    'dojox/layout/TableContainer',
    'dijit/layout/AccordionContainer',
    'dijit/layout/ContentPane',
    'dijit/dijit',
    'dijit/form/TextBox',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/form/NumberTextBox'
], function(declare, parser, ready, domStyle, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template,
	    CompareRegions, SEEDClient) {
    declare("seed.CompareRegionsWidget", [_WidgetBase, _TemplatedMixin], {
	target_div: null,
	container: null,
	palette: null,
	service_url: null,
	service: null,
	width: null,
	n_genomes: null,
	color_mode: 'blast',
	focus_feature: null,
	compare_regions: null,

	templateString: template,

	postCreate: function() {
	    window.console.log("post create");
	    this.service = new SEEDClient(this.service_url);
	    this.compare_regions = new CompareRegions(this.canvas, this.service);

            this.compare_regions.on("feature_dblclick", function(evt) {
		console.log("doubleclick ", evt.feature);
		this.set("focus_feature", evt.feature);
		this.render();
	    }.bind(this));

	},

	startup: function() {
	    this.service.get_palette('compare_region', function(palette) {
		this.compare_regions.set_palette(palette);
		this.render();
	    }.bind(this));
	},

	render: function() {
	    this.service.compare_regions_for_peg(this.focus_feature, this.width,
							 this.n_genomes, this.color_mode,
							 function(data) {
							     this.compare_regions.set_data(data);
							     this.compare_regions.render();
							 }.bind(this));
	},

	redraw: function(evt) {
	},

	left_2: function(evt) {
	    window.console.log("left_2");
	},

	right_2: function(evt) {
	    window.console.log("right_2");
	},

	left_1: function(evt) {
	    window.console.log("left_1");
	},

	right_1: function(evt) {
	    window.console.log("right_1");
	},

	display_regular: function() {
	    domStyle.set(this.advanced_settings, 'display', 'none');
	},
	
	display_advanced: function() {
	    domStyle.set(this.advanced_settings, 'display', 'block');
	},
	
	_getFocus_featureAttr: function() {
	    return this.focusFeature;
	},

	_setFocus_featureAttr: function(value) {
	    this.focus_feature = value;
	}
	
	    

    });

    ready(function() {
	window.console.log("ready!");
	parser.parse();
    });
});
