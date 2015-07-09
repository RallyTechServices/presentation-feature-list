Ext.define("presentation-feature-list", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'tsinfolink'}
    ],

    stateMappings: {
        Propose: {label: 'Propose', description: 'Proposed things'},
        Discover: {label: 'Discover', description: 'Things in discovery'},
        Develop: {label: 'Develop', description: 'In development things'},
        Validate: {label: 'Validate', description: 'Things that are validated'},
        Done: {label: 'Done', description: 'Things that are done'}
    },
    modelType: 'PortfolioItem/Feature',
    linkField: 'xxx',

    launch: function(){
        
        this.add({
            xtype: 'rallycombobox',
            storeConfig: {
                autoLoad: true,
                model: 'Project',
                fetch: ['_ref','Name'],
                filters: [{
                    property: 'Parent',
                    value: this.getContext().getProject()._ref
                }],
                remoteSort: false,
                remoteFilter: true
            },
            listeners: {
                scope: this,
                ready: function(cb){
                    this._buildPrettyGrid({project: cb.getValue(), projectScopeDown: true},
                        this.stateMappings);
                },
                change: function(cb){
                    this._buildPrettyGrid({project: cb.getValue(), projectScopeDown: true},
                        this.stateMappings);
                }
            },
            valueField: '_ref',
            displayField: 'Name',
            fieldLabel: 'Select Project'
        });
    },
    _buildPrettyGrid: function(projectContext, stateMappings){

        var state_panels = [];
        _.each(stateMappings, function(obj, state){
            state_panels.push({
                xtype: 'tsfeaturegrid',
                state: state,
                label: obj.label,
                context: projectContext,
                description: obj.description,
                modelName: this.modelType
            });
        }, this);

        if (this.down('#pretty-pnl')){
            this.down('#pretty-pnl').destroy();
        }

        var pnl = Ext.create('Ext.panel.Panel', {
            itemId: 'pretty-pnl',
            flex: 1,
            border: 0,
            header: this._getHeaderPanel(stateMappings),

            defaults: {
                // applied to each contained panel
                bodyStyle: 'padding:15px'
            },
            layout: {
                // layout-specific configs go here
                type: 'vbox',
                titleCollapse: false,
                animate: true,
               // activeOnTop: true
            },
            scope: this,
            items: state_panels
        });
        this.add(pnl);
    },
    _getHeaderPanel: function(stateMappings){

        var buttons = [];
        _.each(stateMappings, function(obj, key){
            console.log('obj', obj);
            buttons.push({
                xtype: 'button',
                itemId: 'btn-' + key,
                text: obj.label,
                textAlign: 'left',
                cls: 'feature-summary-header',
                flex: 1,
                height: 20,
                listeners: {
                    scope: this,
                    click: this._onButtonClick
                }
            });
        }, this);


        return {
            collapsible: false,
            collapsed: false,
            width: '100%',
            flex: 1,
            padding: 15,
            margin: '5 5 5 5',
            items: buttons,
            cls: 'feature-summary-header'
        };
    },
    _onButtonClick: function(btn){
        this.logger.log('_onButtonClick', btn.itemId);
        var pnl_item_id = btn.itemId.replace('btn-', '#pnl-');
        this.down(pnl_item_id).expand();
    }
});