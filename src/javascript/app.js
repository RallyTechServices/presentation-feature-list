Ext.define("presentation-feature-list", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'message_box',tpl:'Hello, <tpl>{_refObjectName}</tpl>'},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],

    stateMappings: {
        New: {label: 'Launched', description: 'Launched things'},
        InProgress: {label: 'In Development', description: 'In development things'},
        Done: {label: 'Released', description: 'Released things'}
    },

    launch: function() {
        this._buildPrettyGrid({project: this.getContext().getProject()._ref, projectScopeDown: true},
            this.stateMappings);
    },
    _buildPrettyGrid: function(projectContext, stateMappings){
        var title = _.values(stateMappings);

        var state_panels = [];
        _.each(_.keys(stateMappings), function(state){
            state_panels.push(this._getStatePanel(state, stateMappings));
        }, this);

        var pnl = Ext.create('Ext.panel.Panel', {
       //     title: stateMappings,
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
        var p = this.add(pnl);


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
            //title: '',
            collapsible: false,
            collapsed: false,
            width: '100%',
            flex: 1,
            padding: 15,
            margin: '5 5 5 5',
            items: buttons,
            cls: 'feature-summary-header',
            //header: {
            //   cls: 'feature-summary-header',
            //    padding: 15
            //}
        };
    },
    _getStatePanel: function(state, stateMappings){
        return {
            title: '<span class="feature-header-title">' + stateMappings[state].label + '</span><span class="feature-header-description">&nbsp;(0) ' + stateMappings[state].description + '</span><span class="chevron icon-chevron-down"></span>',
            collapsible: true,
            collapsed: true,
            width: '100%',
            itemId: 'pnl-' + state,
            flex: 1,
            hideCollapseTool: true,
            titleCollapse: true,
            margin: '5 5 5 5',
            header: {
                cls: 'feature-header',
                padding: 20
            },
            html: 'Panel content!',
            listeners: {
                scope: this,
                collapse: this._collapsePanel,
                expand: this._expandPanel
            }
        };
    },
    _expandPanel: function(pnl, toolEl, owner, tool){
        pnl.setTitle(pnl.title.replace('icon-chevron-down','icon-chevron-up'));
    },
    _collapsePanel: function(pnl, toolEl, owner, tool){
        pnl.setTitle(pnl.title.replace('icon-chevron-up','icon-chevron-down'));
    },
    _onButtonClick: function(btn){
        this.logger.log('_onButtonClick', btn.itemId);
        var pnl_item_id = btn.itemId.replace('btn-', '#pnl-');
        this.down(pnl_item_id).expand();
    }
});
