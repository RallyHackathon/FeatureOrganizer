/*global console, Ext */
Ext.define('ProjectDialog', {
    extend: 'Rally.ui.dialog.Dialog',
    alias: 'widget.eprojectdialog',   
    width: 300,
    padding: '5px',
    items: [{
        xtype: 'panel',
        layout: { type: 'vbox' },
        itemId: 'dialog_box',
        height: 200,
        defaults: {
            padding: 5
        },
        items: [{
            xtype: 'container',
            itemId: 'outer_box',
            height: 100,
            items: [{
                xtype: 'component',
                renderTpl: "<strong>Project:</strong>"
            },
            {
                xtype: 'container',
                itemId: 'project_picker'
            }
            ]
        
        }]
    }],
    constructor: function( cfg ) {
        this.callParent(arguments);
        this.initConfig(cfg);
    },
    initComponent: function() {
        this.callParent(arguments);
        this.addEvents(
                /**
                 * @event settingsChosen
                 * Fires when user clicks OK after modifying settings
                 */
                'projectChosen'
        );
        
        this.selected_project = null;
        
        this._placeProjectSearch();        
        this._placeButtons();
    },
    _placeProjectSearch: function() {
        this.project_picker = Ext.create( 'Rally.ui.ComboBox', {
        	storeConfig: {
        		autoLoad: true,
        		model: 'Project',
        		filters: [{
        			'property': 'Name',
        			'operator': 'contains',
        			'value': 'lati'
        		}]
        	},
        	displayField: 'Name',
        	width: 200
        } );
        this.down('#project_picker').add(this.project_picker);
    },
    _placeButtons: function() {
        this.down('#dialog_box').addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            padding: '0 0 10 0',
            layout: {
                pack: 'center'
            },
            ui: 'footer',
            items: [
                {
                    xtype: 'rallybutton',
                    text: "OK",
                    scope: this,
                    userAction: 'clicked done in dialog',
                    handler: function() {
                        var project = this.project_picker.getValue();
                        this.fireEvent('projectChosen', {
                            project: project
                        });
                        this.close();
                    }
                },
                {
                    xtype: 'component',
                    itemId: 'cancelLink',
                    renderTpl: '<a href="#" class="dialog-cancel-link">Cancel</a>',
                    renderSelectors: {
                        cancelLink: 'a'
                    },
                    listeners: {
                        click: {
                            element: 'cancelLink',
                            fn: function(){
                                this.close();
                            },
                            stopEvent: true
                        },
                        scope: this
                    }
                }
            ]
        });
    }
});
