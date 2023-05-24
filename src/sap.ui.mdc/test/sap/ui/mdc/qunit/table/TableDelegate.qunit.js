/* global QUnit, sinon */
sap.ui.define([
	"./QUnitUtils",
	"sap/ui/mdc/TableDelegate",
	"sap/ui/mdc/Table",
	"sap/ui/mdc/table/GridTableType",
	"sap/ui/mdc/table/TreeTableType",
	"sap/ui/mdc/table/ResponsiveTableType",
	"sap/ui/mdc/table/Column",
	"sap/ui/mdc/library",
	"sap/m/Text",
	"sap/m/plugins/PluginBase",
	"sap/ui/core/Core",
	"sap/ui/core/library",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter",
	"sap/ui/model/Context",
	"sap/base/util/deepEqual"
], function(
	TableQUnitUtils,
	TableDelegate,
	Table,
	GridTableType,
	TreeTableType,
	ResponsiveTableType,
	Column,
	library,
	Text,
	PluginBase,
	Core,
	coreLibrary,
	Filter,
	JSONModel,
	Sorter,
	Context,
	deepEqual
) {
	"use strict";

	var TableType = library.TableType;
	var SelectionMode = library.SelectionMode;
	var MultiSelectMode = library.MultiSelectMode;
	var sDelegatePath = "sap/ui/mdc/TableDelegate";

	var fnOriginalUpdateBindingInfo = TableDelegate.updateBindingInfo;
	TableDelegate.updateBindingInfo = function(oTable, oBindingInfo) {
		fnOriginalUpdateBindingInfo.apply(this, arguments);
		oBindingInfo.path = oTable.getPayload() ? oTable.getPayload().collectionPath : "/foo";
	};

	QUnit.module("Initialization of selection", {
		before: function() {
			TableQUnitUtils.stubPropertyInfos(Table.prototype, [{
				name: "Name",
				path: "Name_Path",
				label: "Name_Label"
			}]);
		},
		afterEach: function() {
			if (this.oTable) {
				this.oTable.destroy();
			}
		},
		after: function() {
			TableQUnitUtils.restorePropertyInfos(Table.prototype);
		},
		initTable: function(mSettings, fnBeforeInit) {
			if (this.oTable) {
				this.oTable.destroy();
			}

			this.oTable = new Table(Object.assign({
				delegate: {
					name: sDelegatePath,
					payload: {
						collectionPath: "/"
					}
				},
				columns: [
					new Column({
						propertyKey: "Name",
						header: new Text({
							text: "Column A"
						}),
						template: new Text({
							text: "{Name}"
						})
					})
				],
				models: new JSONModel([
					{Name: "Hans"},
					{Name: "Frans"},
					{Name: "Susi"}
				])
			}, mSettings));

			if (fnBeforeInit) {
				fnBeforeInit(this.oTable);
			}

			this.oTable.placeAt("qunit-fixture");
			Core.applyChanges();

			return this.oTable.initialized();
		}
	});

	QUnit.test("GridTableType", function(assert) {
		var mSelectionChangeParameters;
		var oSelectionChangeStub = sinon.stub();

		oSelectionChangeStub.callsFake(function(oEvent) {
			mSelectionChangeParameters = oEvent.getParameters();
			delete mSelectionChangeParameters.id;
		});

		return this.initTable({
			selectionMode: SelectionMode.Single,
			selectionChange: oSelectionChangeStub,
			type: new GridTableType({
				selectionLimit: 1337,
				showHeaderSelector: false
			})
		}, function(oTable) {
			assert.deepEqual(oTable.getSelectedContexts(), [], "#getSelectedContexts if not yet initialized");
		}).then(function(oTable) {
			var oPlugin = PluginBase.getPlugin(oTable._oTable, "sap.ui.table.plugins.MultiSelectionPlugin");

			assert.ok(oPlugin, "Applied sap.ui.table.plugins.MultiSelectionPlugin");
			assert.equal(oPlugin.getLimit(), 1337, "Selection limit");
			assert.ok(oPlugin.getEnableNotification(), "Limit notification enabled");
			assert.notOk(oPlugin.getShowHeaderSelector(), "Show header selector");
			assert.equal(oPlugin.getSelectionMode(), "Single", "Selection mode");
			assert.ok(oPlugin.getEnabled(), "Selection plugin enabled");
			oPlugin.fireSelectionChange({selectAll: true});
			assert.equal(oSelectionChangeStub.callCount, 1, "Selection change event of table called once if called once by the plugin");
			assert.deepEqual(mSelectionChangeParameters, {selectAll: true}, "Selection change event parameters");

			oTable.setSelectionMode(SelectionMode.None);
			assert.notOk(oPlugin.getEnabled(), "Set selection mode to 'None': Selection plugin disabled");

			oTable.setSelectionMode(SelectionMode.SingleMaster);
			assert.equal(oPlugin.getSelectionMode(), "Single", "Set selection mode to 'SingleMaster': Selection mode of plugin set to 'Single'");

			oTable.setSelectionMode(SelectionMode.Multi);
			assert.equal(oPlugin.getSelectionMode(), "MultiToggle", "Set selection mode to 'Multi': Selection mode of plugin set to 'MultiToggle'");

			oTable.getType().setSelectionLimit(123);
			assert.equal(oPlugin.getLimit(), 123, "A 'selectionLimit' change correctly affects the plugin");

			oTable.getType().setShowHeaderSelector(true);
			assert.ok(oPlugin.getShowHeaderSelector(), "A 'showHeaderSelector' change correctly affects the plugin");

			return new Promise(function(resolve) {
				oTable._oTable.attachEventOnce("rowsUpdated", function() {
					resolve(oTable);
				});
			});
		}).then(function(oTable) {
			var oPlugin = PluginBase.getPlugin(oTable._oTable, "sap.ui.table.plugins.MultiSelectionPlugin");
			return oPlugin.addSelectionInterval(1, 1).then(function() {
				return oTable;
			});
		}).then(function(oTable) {
			assert.deepEqual(oTable.getSelectedContexts(), [oTable._oTable.getRows()[1].getBindingContext()],
				"#getSelectedContexts after initialization");
		});
	});

	QUnit.test("TreeTableType", function(assert) {
		var mSelectionChangeParameters;
		var oSelectionChangeStub = sinon.stub();

		oSelectionChangeStub.callsFake(function(oEvent) {
			mSelectionChangeParameters = oEvent.getParameters();
			delete mSelectionChangeParameters.id;
		});

		return this.initTable({
			selectionMode: SelectionMode.Single,
			selectionChange: oSelectionChangeStub,
			type: new TreeTableType({
				selectionLimit: 1337,
				showHeaderSelector: false
			})
		}, function(oTable) {
			assert.deepEqual(oTable.getSelectedContexts(), [], "#getSelectedContexts if not yet initialized");
		}).then(function(oTable) {
			var oPlugin = PluginBase.getPlugin(oTable._oTable, "sap.ui.table.plugins.MultiSelectionPlugin");

			assert.ok(oPlugin, "Applied sap.ui.table.plugins.MultiSelectionPlugin");
			assert.equal(oPlugin.getLimit(), 1337, "Selection limit");
			assert.ok(oPlugin.getEnableNotification(), "Limit notification enabled");
			assert.notOk(oPlugin.getShowHeaderSelector(), "Show header selector");
			assert.equal(oPlugin.getSelectionMode(), "Single", "Selection mode");
			assert.ok(oPlugin.getEnabled(), "Selection plugin enabled");
			oPlugin.fireSelectionChange({selectAll: true});
			assert.equal(oSelectionChangeStub.callCount, 1, "Selection change event of table called once if called once by the plugin");
			assert.deepEqual(mSelectionChangeParameters, {selectAll: true}, "Selection change event parameters");

			oTable.setSelectionMode(SelectionMode.None);
			assert.notOk(oPlugin.getEnabled(), "Set selection mode to 'None': Selection plugin disabled");

			oTable.setSelectionMode(SelectionMode.SingleMaster);
			assert.equal(oPlugin.getSelectionMode(), "Single", "Set selection mode to 'SingleMaster': Selection mode of plugin set to 'Single'");

			oTable.setSelectionMode(SelectionMode.Multi);
			assert.equal(oPlugin.getSelectionMode(), "MultiToggle", "Set selection mode to 'Multi': Selection mode of plugin set to 'MultiToggle'");

			oTable.getType().setSelectionLimit(123);
			assert.equal(oPlugin.getLimit(), 123, "A 'selectionLimit' change correctly affects the plugin");

			oTable.getType().setShowHeaderSelector(true);
			assert.ok(oPlugin.getShowHeaderSelector(), "A 'showHeaderSelector' change correctly affects the plugin");

			return new Promise(function(resolve) {
				oTable._oTable.attachEventOnce("rowsUpdated", function() {
					resolve(oTable);
				});
			});
		}).then(function(oTable) {
			var oPlugin = PluginBase.getPlugin(oTable._oTable, "sap.ui.table.plugins.MultiSelectionPlugin");
			return oPlugin.addSelectionInterval(1, 1).then(function() {
				return oTable;
			});
		}).then(function(oTable) {
			assert.deepEqual(oTable.getSelectedContexts(), [oTable._oTable.getRows()[1].getBindingContext()],
				"#getSelectedContexts after initialization");
		});
	});

	QUnit.test("ResponsiveTableType", function(assert) {
		var mSelectionChangeParameters;
		var oSelectionChangeStub = sinon.stub();

		oSelectionChangeStub.callsFake(function(oEvent) {
			mSelectionChangeParameters = oEvent.getParameters();
			delete mSelectionChangeParameters.id;
		});

		return this.initTable({
			selectionMode: SelectionMode.Single,
			multiSelectMode: MultiSelectMode.ClearAll,
			selectionChange: oSelectionChangeStub,
			type: new ResponsiveTableType()
		}, function(oTable) {
			assert.deepEqual(oTable.getSelectedContexts(), [], "#getSelectedContexts if not yet initialized");
		}).then(function(oTable) {
			var oInnerTable = oTable._oTable;

			assert.equal(oInnerTable.getMode(), "SingleSelectLeft", "Selection mode");
			assert.equal(oInnerTable.getMultiSelectMode(), "ClearAll", "Multi select mode");
			oInnerTable.fireSelectionChange({selectAll: true});
			assert.equal(oSelectionChangeStub.callCount, 1, "Selection change event of table called once if called once by the inner table");
			assert.deepEqual(mSelectionChangeParameters, {selectAll: true}, "Selection change event parameters");

			oTable.setSelectionMode(SelectionMode.None);
			assert.equal(oInnerTable.getMode(), "None", "Set selection mode to 'None': Inner table selection mode set to 'None'");

			oTable.setSelectionMode(SelectionMode.SingleMaster);
			assert.equal(oInnerTable.getMode(), "SingleSelectMaster",
				"Set selection mode to 'SingleMaster': Inner table selection mode set to 'SingleSelectMaster'");

			oTable.setSelectionMode(SelectionMode.Multi);
			assert.equal(oInnerTable.getMode(), "MultiSelect",
				"Set selection mode to 'Multi': Inner table selection mode set to 'MultiSelect'");

			oTable.setMultiSelectMode(MultiSelectMode.Default);
			assert.equal(oInnerTable.getMultiSelectMode(), "SelectAll",
				"Multi select mode set to 'Default': Inner table multi select mode set to 'SelectAll'");

			return new Promise(function(resolve) {
				oInnerTable.attachEventOnce("updateFinished", function() {
					resolve(oTable);
				});
			});
		}).then(function(oTable) {
			oTable._oTable.getItems()[1].setSelected(true);
			assert.deepEqual(oTable.getSelectedContexts(), [oTable._oTable.getItems()[1].getBindingContext()],
				"#getSelectedContexts after initialization");
		});
	});

	QUnit.module("API", {
		before: function() {
			TableQUnitUtils.stubPropertyInfos(Table.prototype, [{
				name: "Name",
				path: "Name_Path",
				label: "Name_Label",
				sortable: true
			}, {
				name: "FirstName",
				path: "FirstName_Path",
				label: "FirstName_Label",
				sortable: true
			}, {
				name: "ID",
				path: "ID_Path",
				label: "ID_Label",
				sortable: true,
				text: "FirstName"
			}]);
		},
		beforeEach: function(assert) {
			this.oTable = new Table({
				delegate: {
					name: sDelegatePath,
					payload: {
						collectionPath: "/foo"
					}
				},
				p13nMode: ["Sort"],
				columns: [
					new Column({
						propertyKey: "Name",
						header: new Text({
							text: "Column A"
						}),
						hAlign: "Begin",
						importance: "High",
						template: new Text({
							text: "Column A"
						})
					})
				]
			});
			this.oTable.placeAt("qunit-fixture");
			this.oType = this.oTable.getType();
			Core.applyChanges();

			return this.oTable.initialized();
		},
		afterEach: function() {
			this.oTable.destroy();
		},
		after: function() {
			TableQUnitUtils.restorePropertyInfos(Table.prototype);
		}
	});

	QUnit.test("validateState", function(assert) {
		var oResourceBundle = Core.getLibraryResourceBundle("sap.ui.mdc");
		var oState = {};
		var oValidationState = this.oTable.validateState(oState, "Group");

		assert.equal(oValidationState.validation, coreLibrary.MessageType.None, "No message");
		assert.equal(oValidationState.message, undefined, "Message text is not defined");

		this.oTable._oMessageFilter = new Filter("Key1", "EQ", "11");
		oValidationState = this.oTable.validateState(oState, "Filter");
		assert.equal(oValidationState.validation, coreLibrary.MessageType.Information, "Information message, Filters are ignored");
		assert.equal(oValidationState.message, oResourceBundle.getText("table.PERSONALIZATION_DIALOG_FILTER_MESSAGESTRIP"), "Message text");
	});

	QUnit.test("updateBindingInfo", function(assert) {
		var oTable = this.oTable;

		return TableQUnitUtils.waitForBindingInfo(oTable).then(function() {
			oTable.setSortConditions({sorters: [{name: "Name", descending: true}]});
			oTable.setGroupConditions({groupLevels: [{name: "Name"}]});
			oTable.rebind();
		}).then(function() {
			var aSorter = [new Sorter("Name_Path", true)];
			var oBindingInfo = {};

			assert.deepEqual(oTable._oTable.getBindingInfo("rows").sorter, aSorter, "Correct sorter assigned");
			TableDelegate.updateBindingInfo(oTable, oBindingInfo);
			assert.deepEqual(oBindingInfo, {parameters: {}, sorter: aSorter, filters: [], path: "/foo"});

			oTable.setType("ResponsiveTable");
			return TableQUnitUtils.waitForBindingInfo(oTable);
		}).then(function() {
			var oSorter = oTable._oTable.getBindingInfo("items").sorter[0];

			assert.ok(oTable._oTable.getBindingInfo("items").sorter.length, 1, "One sorter assigned");
			assert.ok(oSorter.sPath === "Name_Path" && oSorter.bDescending === true && oSorter.vGroup != null, "Sorter properties");

			oTable.setGroupConditions({groupLevels: [{name: "FirstName"}]});
			oTable.rebind();
		}).then(function() {
			var aSorters = oTable._oTable.getBindingInfo("items").sorter;

			assert.ok(aSorters, 2, "Two sorters assigned");
			assert.ok(aSorters[0].sPath === "FirstName_Path" && aSorters[0].bDescending === false && aSorters[0].vGroup != null,
				"First sorter properties");
			assert.ok(aSorters[1].sPath === "Name_Path" && aSorters[1].bDescending === true && aSorters[1].vGroup == null,
				"Second sorter properties");

			var oBindingInfo = {};
			TableDelegate.updateBindingInfo(oTable, oBindingInfo);
			assert.ok(deepEqual(aSorters, oBindingInfo.sorter), "The new sorters are equal to the old sorters if grouping didn't change");

			oTable.setGroupConditions();
			oTable.rebind();
		}).then(function() {
			var aSorter = [new Sorter("Name_Path", true)];
			var oBindingInfo = {};

			assert.deepEqual(oTable._oTable.getBindingInfo("items").sorter, aSorter, "Correct sorter assigned");
			TableDelegate.updateBindingInfo(oTable, oBindingInfo);
			assert.deepEqual(oBindingInfo, {parameters: {}, sorter: aSorter, filters: [], path: "/foo"});
		});
	});

	QUnit.test("formatGroupHeader", function(assert) {
		var oResourceBundle = Core.getLibraryResourceBundle("sap.ui.mdc");
		var oContext = new Context();

		sinon.stub(oContext, "getProperty").callsFake(function(sPath) {
			switch (sPath) {
				case "FirstName_Path":
					return "Johnson";
				case "ID_Path":
					return "123";
				default:
					throw new Error("Unexpected path");
			}
		});

		assert.strictEqual(
			TableDelegate.formatGroupHeader(this.oTable, oContext, "FirstName"),
			oResourceBundle.getText("table.ROW_GROUP_TITLE", ["FirstName_Label", "Johnson"]),
			"Format property without text"
		);

		assert.strictEqual(
			TableDelegate.formatGroupHeader(this.oTable, oContext, "ID"),
			oResourceBundle.getText("table.ROW_GROUP_TITLE_FULL", ["ID_Label", "123", "Johnson"]),
			"Format property with text"
		);
	});

	QUnit.test("fetchExportCapabilities", function(assert) {
		return TableDelegate.fetchExportCapabilities(this.oTable).then(function(oExportCapabilities) {
			assert.ok(typeof oExportCapabilities === 'object', 'Function fetchExportCapabilities returns an object');
			assert.ok(oExportCapabilities.hasOwnProperty('XLSX'), 'Default export type XLSX is provided');
			assert.notOk(oExportCapabilities.hasOwnProperty('PDF'), 'Export type PDF is not provided');
		});
	});

	QUnit.test("getSupportedFeatures", function(assert) {
		var fnTest = function(sTableType, oExpectedFeatures) {
			return this.oTable.setType(sTableType).initialized().then(function(oTable) {
				var oFeatures = oTable.getControlDelegate().getSupportedFeatures(oTable);
				assert.deepEqual(oFeatures, oExpectedFeatures, sTableType + ": supported features are correct");
			});
		}.bind(this);

		return fnTest(TableType.Table, {
			"export": true,
			"expandAll": false,
			"collapseAll": false
		}).then(function() {
			return fnTest(TableType.TreeTable, {
				"export": true,
				"expandAll": false,
				"collapseAll": false
			});
		}).then(function() {
			return fnTest(TableType.ResponsiveTable, {
				"export": true,
				"expandAll": false,
				"collapseAll": false
			});
		});
	});
});