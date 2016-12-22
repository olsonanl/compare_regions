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
    'dojox/widget/Standby',
    'dojo/text!seed/p3-compare-template.html',
    'seed/compare-regions',
    'seed/SEEDClient',
    'dijit/MenuItem',
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
	    _TemplatedMixin, _WidgetsInTemplateMixin, 
	    Standby,
	    template,
	    CompareRegions, SEEDClient,
	    MenuItem) {
    declare("seed.P3CompareRegionsWidget", [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {

	target_div: null,
	container: null,
	palette: null,
	service_url: null,
	event_url: null,
	service: null,
	n_regions: null,
	region_size: null,
	color_mode: 'blast',
	focus_feature: null,
	compare_regions: null,
	selected_features: [],

	templateString: template,

	postCreate: function() {
	    window.console.log("post create");
	    this.inherited(arguments);
	    this.focus_feature.set('value', this.focus_feature_id);
	    this.region_size.set('value', this.width);
	    this.n_regions.set('value', this.n_genomes);
	    // this.button_left_2.connect("onClick", function() { window.console.log("left2"); });
	},
	
	startup: function() {

	    this.inherited(arguments);

	    this.service = new SEEDClient(this.service_url);
	    this.compare_regions = new CompareRegions(this.canvas, this.service);

            this.compare_regions.on("feature_dblclick", function(evt) {
		console.log("doubleclick ", evt.feature, this.focus_feature);
		this.navigate_to_feature(evt.feature);
	    }.bind(this));

	    this.compare_regions.on("selection_change", function(evt) {
		this.selected_features = evt.selected_features;
	    }.bind(this));

	    /*
	     * Set up right-click menu.
	     */
	    this.compare_regions.menu_create_callback = function(feature, row_data, menu) {
		menu.addChild(new MenuItem({label: "Copy function",
					    onClick: function(evt) {
						this.copyTextToClipboard(feature['function']);
					    }.bind(this),
					   }
					  ));
		menu.addChild(new MenuItem({label: "Copy id",
					    onClick: function(evt) {
						this.copyTextToClipboard(feature['fid']);
					    }.bind(this),
					   }
					  ));
		menu.addChild(new MenuItem({label: "Copy AA sequence",
					    onClick: function(evt) {
						this.service.get_translation([feature.fid], function(fids) {
						    console.log("got data", fids, feature.fid);
						    var aa = fids[feature.fid];
						    console.log("aa is ", aa);
						    this.copyTextToClipboard(aa);
						}.bind(this),
									     function(err) {
										 console.log("lookup error", err);
									     },
									     true);
						
					    }.bind(this),
					   }
					  ));
		menu.addChild(new MenuItem({label: "Copy DNA sequence",
					    onClick: function(evt) {
						this.service.get_dna_seq([feature.fid], function(fids) {
						    console.log("got data", fids, feature.fid);
						    var dna = fids[feature.fid];
						    console.log("dna is ", dna);
						    this.copyTextToClipboard(dna);
						}.bind(this),
									     function(err) {
										 console.log("lookup error", err);
									     },
									     true);
						
					    }.bind(this),
					   }
					  ));
	    }.bind(this);
	    
	    this.service.get_palette('compare_region', function(palette) {
		this.compare_regions.set_palette(palette);
		this.render();
	    }.bind(this));

	    /*
	     * If an event URL was specified, subscribe.
	     */
	    if (this.event_url)
	    {
		console.log("Subscribe to " + this.event_url);
		this.event_source = new EventSource(this.event_url);
		this.event_source.onmessage = function(event) {
		    console.log("received event", event);
		}.bind(this);
		this.event_source.addEventListener('navigate', function(event) {
		    var id = event.data;
		    console.log("got navigate event for " + id, event);
		    this.navigate_to_feature(id);
		}.bind(this), false);
	    }

	    /*
	     * Hook into history.
	     */
	    window.onpopstate = function(event) {
		var state = event.state;
		console.log("Pop state", state);
		this.render_feature(state.feature);
	    }.bind(this);
	},

	navigate_to_feature: function(id) {
	    console.log("got navigate call for " + id);
	    var id_re = /^fig\|\d+\.\d+/;
	    var m = id_re.exec(id);
	    if (m)
	    {
		history.pushState({ feature: id }, "Show " + id, id);
		this.render_feature(id);
	    }
	    else
	    {
		console.log("navigate_to_feature: bad id " + id);
	    }
	},

	render_feature: function(id) {
	    this.focus_feature.set('value', id);
	    this.render();
	},

	render: function() {
	    // var coloring_algo = query('input[type=radio]:checked', this.coloring_algo_group.domNode)[0].value;
	    var select_pinned_pegs = query('input[type=radio]:checked', this.select_pinned_pegs_group.domNode)[0].value;
	    var genome_filter = query('input[type=radio]:checked', this.genome_selection_group.domNode)[0].value;
	    var genome_selection = query('input[type=radio]:checked', this.genome_selection_group.domNode)[0].value;

	    var coloring_algo = select_pinned_pegs;
	    
	    window.console.log(coloring_algo,
			       genome_filter,
			       select_pinned_pegs, genome_selection, 
			       this.region_size.get('value'),
			       this.n_regions.get('value')
			      );

	    var compare_opts = { pin: [this.focus_feature],
				 n_genomes: this.n_regions.get('value'),
				 width: this.region_size.get('value'),
				 pin_compute_method:  select_pinned_pegs,
				 limit_to_genomes: [],
				 close_genome_collapse: genome_selection,
				 coloring_method: coloring_algo,
				 features_for_cdd: this.selected_features,
				 pin_alignment: 'stop'
			       };
	    window.console.log(compare_opts);

	    this.standby.show();
/*
	    this.service.compare_regions(compare_opts, 	
					 function(data) {
					     this.standby.hide(),
					     this.compare_regions.set_data(data);
					     this.compare_regions.render();
					 }.bind(this),
					 function(err) {
					     this.standby.hide();
					     window.console.log("compare error", err);
					 }.bind(this)
					 );
*/
/**/
	    this.service.compare_regions_for_peg(this.focus_feature.get('value'),
						 this.region_size.get('value'),
						 this.n_regions.get('value'),
						 coloring_algo,
						 genome_filter,
						 function(data) {
						     this.standby.hide();
						     this.compare_regions.set_data(data);
						     this.compare_regions.render();
						 }.bind(this),
						 function(err) {
						     this.standby.hide();
						     window.console.log("compare error", err);
						 }.bind(this));
						     
/**/
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
	    return this.focus_feature;
	},

	_setFocus_featureAttr: function(value) {
	    this.focus_feature = value;
	},
	
	copyTextToClipboard: function(text) {
	    var textArea = document.createElement("textarea");

	    //
	    // *** This styling is an extra step which is likely not required. ***
	    //
	    // Why is it here? To ensure:
	    // 1. the element is able to have focus and selection.
	    // 2. if element was to flash render it has minimal visual impact.
	    // 3. less flakyness with selection and copying which **might** occur if
	    //    the textarea element is not visible.
	    //
	    // The likelihood is the element won't even render, not even a flash,
	    // so some of these are just precautions. However in IE the element
	    // is visible whilst the popup box asking the user for permission for
	    // the web page to copy to the clipboard.
	    //

	    // Place in top-left corner of screen regardless of scroll position.
	    textArea.style.position = 'fixed';
	    textArea.style.top = 0;
	    textArea.style.left = 0;

	    // Ensure it has a small width and height. Setting to 1px / 1em
	    // doesn't work as this gives a negative w/h on some browsers.
	    textArea.style.width = '2em';
	    textArea.style.height = '2em';

	    // We don't need padding, reducing the size if it does flash render.
	    textArea.style.padding = 0;

	    // Clean up any borders.
	    textArea.style.border = 'none';
	    textArea.style.outline = 'none';
	    textArea.style.boxShadow = 'none';

	    // Avoid flash of white box if rendered for any reason.
	    textArea.style.background = 'transparent';


	    textArea.value = text;

	    document.body.appendChild(textArea);

	    textArea.select();

	    try {
		var successful = document.execCommand('copy');
		var msg = successful ? 'successful' : 'unsuccessful';
		console.log('Copying text command was ' + msg);
	    } catch (err) {
		console.log('Oops, unable to copy');
	    }

	    document.body.removeChild(textArea);
	}
	    

    });

    ready(function() {
	window.console.log("widget ready!");

    });



});
