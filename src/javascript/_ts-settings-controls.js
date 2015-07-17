Ext.define('Rally.technicalservices.BooleanFieldComboBox',{
    extend: 'Rally.ui.combobox.FieldComboBox',
    alias: 'widget.tsbooleanfieldcombobox',

    _isNotHidden: function(field) {
        return (!field.hidden && field.attributeDefinition && field.attributeDefinition.AttributeType == 'BOOLEAN');
    }
});

Ext.define('Rally.technicalservices.WebLinkFieldComboBox',{
    extend: 'Rally.ui.combobox.FieldComboBox',
    alias: 'widget.tsweblinkfieldcombobox',

    _isNotHidden: function(field) {
        return (!field.hidden && field.attributeDefinition && field.attributeDefinition.AttributeType == 'WEB_LINK');
    }
});

Ext.define('Rally.technicalservices.StateMapper',{
    extend: 'Ext.form.field.Base',
    alias: 'widget.tsmappersettings',
    config: {
        value: undefined,
        states: undefined,
        decodedValue: {}
    },
    fieldSubTpl: '<div id="{id}" class="settings-grid"></div>',

    width: '100%',
    cls: 'column-settings',

    onDestroy: function() {
        if (this._grid) {
            this._grid.destroy();
            delete this._grid;
        }
        this.callParent(arguments);
    },

    onRender: function() {
        var decodedValue = {};
        if (this.value && !_.isEmpty(this.value)){
            decodedValue = Ext.JSON.decode(this.value);
        }
        this.callParent(arguments);

        var data = [];
        _.each(this.states, function(s){
            var dsp = false,
                lbl = s,
                desc = '';

            if (decodedValue[s]){
                dsp = true;
                lbl = decodedValue[s].label;
                desc = decodedValue[s].description;
            }
            data.push({stateName: s, display: dsp, label: lbl, description: desc})
        }, this);

        this._store = Ext.create('Ext.data.Store', {
            fields: ['stateName', 'display', 'label', 'description'],
            data: data
        });

        this._grid = Ext.create('Rally.ui.grid.Grid', {
            autoWidth: true,
            renderTo: this.inputEl,
            columnCfgs: this._getColumnCfgs(),
            showPagingToolbar: false,
            showRowActionsColumn: false,
            enableRanking: false,
            store: this._store,
            editingConfig: {
                publishMessages: false
            }
        });
    },

    _getColumnCfgs: function() {
        var columns = [
            {
                text: 'State',
                dataIndex: 'stateName'
            },
            {
                text: 'Show',
                dataIndex: 'display',
                renderer: function (value) {
                    return value === true ? 'Yes' : 'No';
                },
                editor: {
                    xtype: 'rallycombobox',
                    displayField: 'name',
                    valueField: 'value',
                    editable: false,
                    storeType: 'Ext.data.Store',
                    storeConfig: {
                        remoteFilter: false,
                        fields: ['name', 'value'],
                        data: [
                            {'name': 'Yes', 'value': true},
                            {'name': 'No', 'value': false}
                        ]
                    }
                }
            },
            {
                text: 'Label',
                dataIndex: 'label',
                emptyCellText: '-- No Mapping --',
                editor: {
                    xtype: 'rallytextfield'
                }
            },
            {
                text: 'Description',
                dataIndex: 'description',
                emptyCellText: '',
                flex: 1,
                editor: {
                    xtype: 'rallytextfield'
                }
            }
        ];
        return columns;
    },

    /**
     * When a form asks for the data this field represents,
     * give it the name of this field and the ref of the selected project (or an empty string).
     * Used when persisting the value of this field.
     * @return {Object}
     */
    getSubmitData: function() {
        var data = {};
        data[this.name] = Ext.JSON.encode(this._buildSettingValue());
        return data;
    },
    _buildSettingValue: function() {
        var mappings = {};
        this._store.each(function(record) {
            if (record.get('display')) {
                mappings[record.get('stateName')] = {
                    label: record.get('label'),
                    description: record.get('description')
                };
            }
        }, this);
        return mappings;
    },

    getErrors: function() {
        var errors = [];
        if (this._storeLoaded && !Ext.Object.getSize(this._buildSettingValue())) {
            errors.push('At least one state must be mapped and displayed.');
        }
        return errors;
    },

    setValue: function(value) {
        this.callParent(arguments);
        this._value = value;
    }
});

