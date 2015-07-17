Ext.define("presentation-feature-list", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'settings_box'},
        {xtype:'tsinfolink'}
    ],

    config: {
        defaultSettings: {
            stateMappings: {},
            linkField: 'c_PublishToRoadmapURL',
            publishedField: 'c_PublishToRoadmap',

        }
    },
    modelType: 'PortfolioItem/Feature', //'PortfolioItem/Features',
    linkFieldURL: null,
    modelStates: undefined,
    model: null,
    externalAppSettingsKey: 'technicalServicesRoadmapAppSettings',

    launch: function(){
        Rally.data.ModelFactory.getModel({
            type: this.modelType,
            scope: this,
            success: function(model) {
                this.model = model;
                model.getField('State').getAllowedValueStore().load({
                    scope: this,
                    callback: function(records, operation, success) {
                        if (success){
                            var modelStates = [];
                            Ext.Array.each(records, function(allowedValue) {
                                if (allowedValue.get('StringValue') && allowedValue.get('StringValue').length > 0){
                                    modelStates.push(allowedValue.get('StringValue'));
                                }
                            });
                            this.modelStates = modelStates;
                            if (this.isExternal()){
                               // this.showSettings(this.config)
                                this.getExternalAppSettings(this.externalAppSettingsKey);
                            } else {
                                this.onSettingsUpdate(this.getSettings());
                            }
                        } else {
                            Rally.ui.notify.Notifier.showError({message: Ext.String.format('Unable to load State field values for {0}: [{1}]',this.modelType, operations.error.errors.join(', '))});
                        }
                    }
                });
            },
            failure: function(){
                Rally.ui.notify.Notifier.showError({message: Ext.String.format('Unable to load model type [{0}]',this.modelType)});
            }
        });
    },
    _prepareApp: function(){
        var model = this.model;
        if (model && model.getField(this.linkField) && model.getField(this.linkField).attributeDefinition){
            this.linkFieldURL = model.getField(this.linkField).attributeDefinition.URL;
        }
        this._addProjectPicker();
    },
    _addProjectPicker: function(){


        if (_.isEmpty(this.stateMappings)){
            this.add({
                xtype: 'container',
                itemId: 'ct-no-settings',
                flex: 1,
                style: {
                    textAlign: 'center'
                },
                html: '<b>No states are configured to be displayed.  Please use the App Settings to display at least one State</b>'
            });
            return;
        }
        if (this.down('#ct-no-settings')){
            this.down('#ct-no-settings').destroy();
        }
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
            console.log('obj',obj);
            state_panels.push({
                xtype: 'tsfeaturegrid',
                state: state,
                label: obj.label,
                context: projectContext,
                description: obj.description,
                modelName: this.modelType,
                linkField: this.linkField,
                linkFieldURL: this.linkFieldURL,
                publishedField: this.publishedField
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
    },
    /********************************************
     /* Overrides for App class
     /*
     /********************************************/
    //getSettingsFields:  Override for App
    getSettingsFields: function() {
        var me = this;

        return [
            {
                name: 'publishedField',
                xtype: 'tsbooleanfieldcombobox',
                fieldLabel: 'Published Field',
                model: this.modelType,
                labelWidth: 200,
                labelAlign: 'right',
                minValue: 0
            },{
                name: 'linkField',
                xtype: 'tsweblinkfieldcombobox',
                model: this.modelType,
                fieldLabel: 'Publish To Roadmap Link Field',
                labelWidth: 200,
                labelAlign: 'right',
                minValue: 0
            },{
                name: 'encodedStateMapping',
                xtype: 'tsmappersettings',
                states: this.modelStates,
                fieldLabel: 'State Mappings',
                margin: 15,
                labelAlign: 'top'
            }
        ];
    },
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    showSettings: function(options) {
        this._appSettings = Ext.create('Rally.app.AppSettings', Ext.apply({
            fields: this.getSettingsFields(),
            settings: this.getSettings(),
            defaultSettings: this.getDefaultSettings(),
            context: this.getContext(),
            settingsScope: this.settingsScope,
            autoScroll: true
        }, options));

        this._appSettings.on('cancel', this._hideSettings, this);
        this._appSettings.on('save', this._onSettingsSaved, this);
        if (this.isExternal()){
            if (this.down('#settings_box').getComponent(this._appSettings.id)==undefined){
                this.down('#settings_box').add(this._appSettings);
            }
        } else {
            this.hide();
            this.up().add(this._appSettings);
        }
        return this._appSettings;
    },
    _onSettingsSaved: function(settings){
        Ext.apply(this.settings, settings);
        this._hideSettings();
        this.onSettingsUpdate(settings);
    },
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this.saveExternalAppSettings(this.externalAppSettingsKey, settings);
        if (!_.isEmpty(settings.encodedStateMapping)){
            this.stateMappings = Ext.JSON.decode(settings.encodedStateMapping);
        } else {
            this.stateMappings = {};
        }
        this._prepareApp();
    },
    saveExternalAppSettings: function(key, settings){

        var prefs = {};
        _.each(settings, function(val, setting_key){
            var pref_key = key + '.' + setting_key;
            prefs[pref_key] = val;
        });

        this.logger.log('SaveExternalAppSettings', key, settings, prefs);
        Rally.data.PreferenceManager.update({
            project: this.getContext().getProject()._ref,
            settings: prefs,
            scope: this,
            success: function(updatedRecords, notUpdatedRecords) {
               this.logger.log('settings saved', key, updatedRecords, notUpdatedRecords);
            }
        });
    },
    getExternalAppSettings: function(key){
        Rally.data.PreferenceManager.load({
            project: this.getContext().getProject()._ref,
            additionalFilters: [{
                property: 'name',
                operator: 'contains',
                value: key
            }],
            scope: this,
            cache: false,
            success: function(prefs) {
                this.logger.log('settings loaded', key, prefs);
                _.each(prefs, function(val, pref_name){
                    if (/\.linkField$/.test(pref_name)){
                        this.linkField = val;
                    }
                    if (/\.publishedField$/.test(pref_name)){
                        this.publishedField = val;
                    }
                    if (/\.encodedStateMapping$/.test(pref_name)){
                        if (val && !_.isEmpty(val)){
                            this.stateMappings = Ext.JSON.decode(val);
                        }
                    }
                }, this);

                this._prepareApp();
            }
        });

    }
});
