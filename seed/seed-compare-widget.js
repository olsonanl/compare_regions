define([
    'dojo/_base/declare',
    'dojo/parser',
    'dojo/ready',
    'dojo/dom-style',
    'dojo/query',
    'dijit/_Widget',
    'dijit/_AttachMixin',
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
    'dijit/form/RadioButton',
    'dijit/form/CheckBox',
    'dijit/form/NumberTextBox'
], function(declare, parser, ready, domStyle, query, _Widget, _AttachMixin, 
	    _TemplatedMixin, _WidgetsInTemplateMixin, template,
	    CompareRegions, SEEDClient) {
    declare("seed.CompareRegionsWidget", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {

	target_div: null,
	container: null,
	palette: null,
	service_url: null,
	service: null,
	n_regions: null,
	region_size: null,
	color_mode: 'blast',
	focus_feature: null,
	compare_regions: null,

	templateString: template,

	postCreate: function() {
	    window.console.log("post create");
	    this.inherited(arguments);
	    // this.button_left_2.connect("onClick", function() { window.console.log("left2"); });
	},
	
	startup: function() {

	    this.inherited(arguments);

	    this.service = new SEEDClient(this.service_url);
	    this.compare_regions = new CompareRegions(this.canvas, this.service);

            this.compare_regions.on("feature_dblclick", function(evt) {
		console.log("doubleclick ", evt.feature);
		this.set("focus_feature", evt.feature);
		this.render();
	    }.bind(this));

	    this.service.get_palette('compare_region', function(palette) {
		this.compare_regions.set_palette(palette);
		this.render();
	    }.bind(this));
	},

	render: function() {

	    var coloring_algo = query('input[type=radio]:checked', this.coloring_algo_group.domNode)[0].value;
	    var select_pinned_pegs = query('input[type=radio]:checked', this.select_pinned_pegs_group.domNode)[0].value;
	    var genome_selection = query('input[type=radio]:checked', this.genome_selection_group.domNode)[0].value;
	    var genome_sort = query('input[type=radio]:checked', this.genome_sort_group.domNode)[0].value;
	    
	    window.console.log(coloring_algo,
			       select_pinned_pegs, genome_selection, genome_sort,
			       this.region_size.get('value'),
			       this.n_regions.get('value'),
			       this.pin_cutoff.get('value'),
			       this.coloring_cutoff.get('value')
			      );

	    this.service.compare_regions_for_peg(this.focus_feature,
						 this.region_size.get('value'),
						 this.n_regions.get('value'),
						 coloring_algo,
						 function(data) {
						     this.compare_regions.set_data(data);
						     this.compare_regions.render();
						 }.bind(this));
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

	display_regular: function(val) {
	    domStyle.set(this.advanced_settings, 'display', val ? 'none' : 'block');
	},
	
	_getFocus_featureAttr: function() {
	    return this.focusFeature;
	},

	_setFocus_featureAttr: function(value) {
	    this.focus_feature = value;
	}
	
	    

    });

    ready(function() {
	window.console.log("widget ready!");

    });
});
