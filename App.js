Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    defaults: { padding: 10 },
    items: [
        { xtype: 'container', itemId: 'add_feature_button_container' },
        { xtype: 'container', itemId: 'outer_shell', layout:{type:'hbox'}, width: 800, items: [
            {
                xtype:"container",
                itemId:"features", 
                flex:.5,
                height: 600
            },
            { 
                xtype: "container",
                itemId: "requests", 
                flex:1,
                height: 600
            }]
        }],
    layout: { type:"vbox" },
    launch: function() {
        this.selected_requests = [];
        this.wait = new Ext.LoadMask( this, {msg: "Loading data..." } );
        this.loadRequests();
        this.loadFeatures();
        this._addAddButton()
    },
    
    loadRequests:function(){
        var store1 = Ext.create('Rally.data.WsapiDataStore', {
            model: 'User Story',
            filters:[{property:'Parent', value:''}], 
            //[function(item){            
            //    return false;//item.Children.length==0;                 
            //    }],
            /*filterBy:{fn:function(record, id){
                    console.log("hello");
                    return false;
                }
            }*/
            
            //remoteFilter:false,
            autoLoad:true,
            fetch: [ 'FormattedID', 'Name', 'Children', 'ObjectID' ],
            listeners: {
                scope:this,
                load: this._onRequestsLoaded
            }
        });
    },
    _addAddButton: function() {
        console.log( "_addAddButton" );
        var that = this;
        this.down('#add_feature_button_container').add( {
            xtype: 'rallyaddnew',
            recordTypes: ['User Story'],
            listeners: {
                recordadd: function(addNew, new_item ) {
                    console.log( 'added', addNew, new_item );
                    that.add_counter = that.selected_requests.length;
                    that._setChildren( new_item.record.data, that.selected_requests );
                    /*Ext.Array.each( that.selected_requests, function(request ) {
                        that._setParent( request.data, new_item.record.data );
                    });*/
                    that.selected_requests = [];
                }
            }
        });
    },
    _setChildren: function( parent, children ) {
        console.log( "_setChildren", parent, children );
        var that = this;
        
        this.wait.show();

        Rally.data.BulkRecordUpdater.updateRecords( {
            records: children,
            propertiesToUpdate: {
                Parent: parent._ref
            },
            success: function( readOnlyRecords ) { 
                console.log("done", readOnlyRecords );
                that.loadFeatures();
                that.loadRequests();
            },
            scope: this
        });

    },
    _setParent: function( child, parent ) {
        console.log( "_setParent", child, parent );
        var that = this;
	    Rally.data.ModelFactory.getModel({
		    type: 'User Story',
		    success: function( model ) {
		        model.load( child.objectid, {
		            fetch: [ 'Parent','FormattedID' ],
		            callback: function( record, operation ) {
		                if ( operation.wasSuccessful() ) {
		                    console.log( 'going to add child', record );
		                    record.set( 'Parent', parent );
		                    record.save( { 
		                        callback: function(resultset, operation ) {
                                    console.log( operation );
                                    that.add_counter -= 1;
                                    console.log( "Counter:", that.add_counter, resultset );
                                    if ( that.add_counter < 1 ) {
                                        that.loadFeatures();
                                        that.loadRequests();
                                    }
		                        }
		                    });
		                } else {
		                    console.log("oops.", operation.error.errors[0] );
		                }
		            }
		        });
		    }
		});
    },
    _onRequestsLoaded: function(store,data,success) {
        console.log( "_onRequestsLoaded:", data );
        var that = this;
        var records = [];
        Ext.Array.each( data, function( record ) {
            if (!record.data.Children || record.data.Children.length == 0 ) {
                var tree_item = {
                    text: record.data.FormattedID + ": " + record.data.Name,
                    _ref: record.data._ref,
                    allowDrop: false,
                    data: { item: record.data },
                    allowDrag: true,
                    leaf: true,
                    objectid: record.data.ObjectID
                };
                records.push( tree_item );
            }
        });
        
        Ext.define( 'RequestTreeNodes', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'text', type: 'string' },
                { name: 'leaf', type: 'boolean' },
                { name: 'icon', type: 'string' },
                { name: 'allowDrop', type: 'boolean' },
                { name: '_ref', type: 'string' },
                { name: 'objectid', type: 'string' }
                ]
        });
        
        var tree_store = Ext.create('Ext.data.TreeStore', {
            model: 'RequestTreeNodes',
            root: {
                expanded: true,
                allowDrop: false,
                children: records
            }
        });
        
        that._showRequestTree(tree_store);
        
    },
    _onFeaturesLoaded: function( store, data, success ) {
        console.log( "_onFeaturesLoaded:", data );
        var that = this;
        var records = [];
        Ext.Array.each( data, function(record) {
            console.log( record );
            var children = [];
            if ( record.data.Children && record.data.Children.length > 0 ) {
                Ext.Array.each( record.data.Children, function(child) {
                    children.push({
                        text: child.FormattedID + ": " + child.Name,
                        leaf: true,
                        data: { item: child },
                        allowDrop: false,
                        allowDrag: false,
                        _ref: child._ref
                    });
                });
                var tree_item = {
                    text: record.data.FormattedID + ": " + record.data.Name,
                    _ref: record.data._ref,
                    objectid: record.data.ObjectID,
                    allowDrop: true,
                    data: { item: record.data },
                    allowDrag: false,
                    leaf: false,
                    children: children
                };
                records.push( tree_item );
            }
        });
        console.log( "records", records );
            
        Ext.define( 'FeatureTreeNodes', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'text', type: 'string' },
                { name: 'leaf', type: 'boolean' },
                { name: 'icon', type: 'string' },
                { name: 'allowDrop', type: 'boolean' },
                { name: '_ref', type: 'string' },
                { name: 'objectid', type: 'string' }
                ]
        });
        
        var tree_store = Ext.create('Ext.data.TreeStore', {
            model: 'FeatureTreeNodes',
            root: {
                expanded: true,
                allowDrop: false,
                children: records
            }
        });
        
        that._showFeatureTree(tree_store);
    },
    _showRequestTree: function( tree_store ) {
        var that = this;
        var tree_container = this.down("#requests");
        this.selected_requests = [];
        if ( this.request_tree ) { this.request_tree.destroy(); }
        this.request_tree = Ext.create('Ext.tree.Panel', {
            height: 500,
            allowDeselect: true,
            selModel: { mode: "SIMPLE" },
            viewConfig: {
                plugins: { ptype: 'treeviewdragdrop' },
                copy: false
            },
            store: tree_store,
            rootVisible: false,
            listeners: {
                scope: this,
                select: function( model, record, index ) {
                    console.log( "selected", model, record );
                    this._setSelectedItems(model);
                },
                deselect: function( model, record, index ) {
                    console.log( "deselected", model, record );
                    this._setSelectedItems(model);
                }
            }
        });
        tree_container.add( this.request_tree );
        this.wait.hide();
    },
    _setSelectedItems: function(model) {
        var items = model.selected.items;
        var that = this;
        
        this.selected_requests = [];
        Ext.Array.each( items, function(item) {
        console.log( "inside", item.data );
	        Rally.data.ModelFactory.getModel({
	            type: 'User Story',
	            success: function( model ) {
	                model.load( item.data.objectid, {
	                    fetch: [ 'Parent','FormattedID' ],
	                    callback: function( record, operation ) {
	                        if ( operation.wasSuccessful() ) {
	                            console.log( record, operation );
	                            that.selected_requests.push(  record );
	                        } else {
	                            console.log("oops.", operation.error.errors[0] );
	                        }
	                    }
	                });
	            }
	        });
        });
    },
    _showFeatureTree: function( tree_store ) {
        var tree_container = this.down("#features");
        var that = this;
        if ( this.feature_tree ) { this.feature_tree.destroy(); }
        this.feature_tree = Ext.create('Ext.tree.Panel', {
            height: 500,
            viewConfig: {
                plugins: { ptype: 'treeviewdragdrop' },
                copy: false,
                listeners: {
                    drop: function( node, data, overModel, dropPosition ) {
                        that.selected_requests = [];
                        
                        console.log( "Drop", node, data, overModel );
                        var item = data.records[0].data;
                        console.log( "dragged child", item );
                        
                        var parent = overModel.data;
                        console.log( "target parent", parent );
                        
                        Rally.data.ModelFactory.getModel({
                            type: 'User Story',
                            success: function( model ) {
                                model.load( item.objectid, {
                                    fetch: [ 'Parent','FormattedID' ],
                                    callback: function( record, operation ) {
                                        if ( operation.wasSuccessful() ) {
                                            console.log( 'found', record );
                                            record.set( 'Parent', parent );
                                            record.save( { 
                                                callback: function(resultset, operation ) {
                                                    console.log( "After saving", resultset );
                                                }
                                            });
                                        } else {
                                            console.log("oops.", operation.error.errors[0] );
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
            },
            store: tree_store,
            rootVisible: false
        });
        tree_container.add( this.feature_tree );
        this.wait.hide();
    },
    
     loadFeatures:function(){
        var store2 = Ext.create('Rally.data.WsapiDataStore', {
            model: 'User Story',
            fetch: [ 'FormattedID', 'Name', 'Children', 'ObjectID' ],
            filters:[{property:'Parent', value:''}, {property:'ScheduleState', operator:'>=', value:'Idea'}], 
            //function(item){            
            //    return false;//item.Children.length==0;                 
            //    }}],
            /*filterBy:{fn:function(record, id){
                    console.log("hello");
                    return false;
                }
            }*/
            
            //remoteFilter:false,
            autoLoad:true,
            listeners:{
                scope:this,
                load: this._onFeaturesLoaded
            }
        });
     }
});