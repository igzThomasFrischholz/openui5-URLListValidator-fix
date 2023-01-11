/*
 * ! ${copyright}
 */

sap.ui.define([
	"sap/ui/core/Core",
	"sap/ui/mdc/library",
	"sap/ui/test/Opa5",
	"test-resources/sap/ui/mdc/testutils/opa/table/waitForTable",
	"sap/ui/test/matchers/Ancestor",
	"sap/ui/test/matchers/Properties",
	"sap/ui/test/matchers/PropertyStrictEquals"
], function(
	/** @type sap.ui.core.Core */ Core,
	/** @type sap.ui.mdc.library */ MdcLibrary,
	/** @type sap.ui.test.Opa5 */ Opa5,
	/** @type sap.ui.test.Opa5 */ waitForTable,
	/** @type sap.ui.test.matchers.Ancestor */ Ancestor,
	/** @type sap.ui.test.matchers.Properties */ Properties,
	/** @type sap.ui.test.matchers.PropertyStrictEquals */ PropertyStrictEquals) {
	"use strict";

	var TableType = MdcLibrary.TableType;

	/**
	 * @class Assertions
	 * @extends sap.ui.test.Opa5
	 * @private
	 * @alias sap.ui.mdc.qunit.table.OpaTests.pages.Assertions
	 */
	return {
		/**
		 * Checks if a MDCTable is visible on the MDCTable
		 *
		 * @function
		 * @name iShouldSeeATable
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeATable: function(oControl) {
			return waitForTable.call(this, oControl);
		},

		/**
		 * Checks if the 'Select all' check box is visible on the MDCTable.
		 * Succeeds only if {@link sap.ui.mdc.Table#multiSelectMode} is set to 'Default'
		 * when using a ResponsiveTable or if {@link sap.ui.table.plugins.MultiSelectionPlugin#limit} is set
		 * to '0' when using a GridTable.
		 *
		 * @function
		 * @name iShouldSeeTheSelectAllCheckBox
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeTheSelectAllCheckBox: function(oControl) {
			var sTableId = typeof oControl === "string" ? oControl : oControl.getId();

			return waitForTable.call(this, oControl, {
				success: function(oTable) {
					if (oTable._isOfType(TableType.ResponsiveTable)) {
						return this.waitFor({
							id: sTableId + "-innerTable-sa",
							controlType: "sap.m.CheckBox",
							success: function(oCheckBox) {
								Opa5.assert.ok(oCheckBox, "Table has 'Select All' check box");
							},
							errorMessage: "Did not find the 'Select all' checkbox"
						});
					} else {
						var $checkBox = Opa5.getWindow().jQuery("#" + sTableId + "-innerTable-selall");

						return this.waitFor({
							check: function() {
								return $checkBox.length === 1;
							},
							success: function() {
								Opa5.assert.ok(true, "Table has 'Select All' check box");
							},
							errorMessage: "Did not find the 'Select all' checkbox"
						});
					}
				}
			});
		},

		/**
		 * Checks if the 'Deselect all' icon is visible on the MDCTable.
		 * Succeeds only if {@link sap.ui.mdc.Table#multiSelectMode} is set to 'ClearAll'
		 * when using a ResponsiveTable or if {@link sap.ui.table.plugins.MultiSelectionPlugin#limit} is set
		 * to greater '0' when using a GridTable.
		 *
		 * @function
		 * @name iShouldSeeTheDeselectAllIcon
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeTheDeselectAllIcon: function(oControl) {
			var sTableId = typeof oControl === "string" ? oControl : oControl.getId();

			return waitForTable.call(this, oControl, {
				success: function(oTable) {
					if (oTable._isOfType(TableType.ResponsiveTable)) {
						return this.waitFor({
							id: sTableId + "-innerTable-clearSelection",
							controlType: "sap.ui.core.Icon",
							success: function(oIcon) {
								Opa5.assert.ok(oIcon, "Table has 'Deselect all' icon");
							},
							errorMessage: "Did not find the 'Deselect all' icon"
						});
					} else {
						var $checkBox = Opa5.getWindow().jQuery("#" + sTableId + "-innerTable-selall");

						return this.waitFor({
							check: function() {
								return $checkBox.length === 1;
							},
							success: function() {
								Opa5.assert.ok(true, "Table has 'Deselect all' icon");
							},
							errorMessage: "Did not find the 'Deselect all' icon"
						});
					}
				}
			});
		},

		/**
		 * Checks if the table header with the give text is visible on the MDCTable.
		 * Succeeds only if {@link sap.ui.mdc.Table#headerVisible} is set to <code>true</code>.
		 *
		 * @function
		 * @name iShouldSeeTheHeaderText
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @param {String} sHeaderText The text that the MDCTable header should contains
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeTheHeaderText: function(oControl, sHeaderText) {
			var sTableId = typeof oControl === "string" ? oControl : oControl.getId();

			return waitForTable.call(this, oControl, {
				success: function(oTable) {
					return this.waitFor({
						id: sTableId + "-title",
						controlType: "sap.m.Title",
						check: function(oTitle) {
							return oTable.getHeaderVisible() && oTitle.getText().indexOf(sHeaderText) !== -1;
						},
						success: function() {
							Opa5.assert.ok(true, "Table header with text '" + sHeaderText + "' is visible");
						},
						errorMessage: "No table header found"
					});
				}
			});
		},

		/**
		 * Checks if the table count is visible on the MDCTable as part of the header text.
		 * Succeeds only if {@link sap.ui.mdc.Table#headerVisible} and {@link sap.ui.mdc.Table#showRowCount}
		 * are set to <code>true</code>.
		 *
		 * @function
		 * @name iShouldSeeTheCount
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeTheCount: function(oControl) {
			var sTableId = typeof oControl === "string" ? oControl : oControl.getId();

			return waitForTable.call(this, oControl, {
				success: function(oTable) {
					return this.waitFor({
						id: sTableId + "-title",
						controlType: "sap.m.Title",
						check: function() {
							return oTable.getHeaderVisible() && oTable.getShowRowCount();
						},
						success: function(oTitle) {
							var aMatches = oTitle.getText().match(/.*\([0-9]*\)/);
							Opa5.assert.ok(aMatches.length === 1, "Table title contains item count");
						},
						errorMessage: "No table item count found"
					});
				}
			});
		},

		/**
		 * Checks if the variant management is visible on the MDCTable.
		 *
		 * @function
		 * @name iShouldSeeTheVariantManagement
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeTheVariantManagement: function(oControl) {
			var sTableId = typeof oControl === "string" ? oControl : oControl.getId();

			return this.waitFor({
				id: sTableId + "-vm",
				controlType: "sap.ui.fl.variants.VariantManagement",
				success: function(oVariantManagement) {
					Opa5.assert.ok(oVariantManagement, "Table variant management is visible");
				},
				errorMessage: "No table variant management found"
			});
		},

		/**
		 * Checks if the Show/Hide Details button is visible on the MDCTable.
		 *
		 * @function
		 * @name iShouldSeeTheShowHideDetailsButton
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeTheShowHideDetailsButton: function(oControl) {
			var sTableId = typeof oControl === "string" ? oControl : oControl.getId();

			return this.waitFor({
				id: sTableId + "-showHideDetails",
				controlType: "sap.m.SegmentedButton",
				success: function(oSegmentedButton) {
					Opa5.assert.ok(oSegmentedButton, "Show/Hide Details button is visible");
				},
				errorMessage: "No Show/Hide Details button found"
			});
		},

		/**
		 * Checks if the Paste button is visible on the MDCTable.
		 *
		 * @function
		 * @name iShouldSeeThePasteButton
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeThePasteButton: function(oControl) {
			var sTableId = typeof oControl === "string" ? oControl : oControl.getId();

			return this.waitFor({
				id: sTableId + "-paste",
				controlType: "sap.m.Button",
				success: function(oButton) {
					Opa5.assert.ok(oButton, "Paste button is visible");
				},
				errorMessage: "No Paste button found"
			});
		},

		/**
		 * Checks if the P13n button is visible on the MDCTable.
		 *
		 * @function
		 * @name iShouldSeeTheP13nButton
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeTheP13nButton: function(oControl) {
			var sTableId = typeof oControl === "string" ? oControl : oControl.getId();

			return this.waitFor({
				id: sTableId + "-settings",
				controlType: "sap.m.Button",
				success: function(oButton) {
					Opa5.assert.ok(oButton, "P13n button is visible");
				},
				errorMessage: "No P13n button found"
			});
		},

		/**
		 * Checks if the Export button is visible on the MDCTable.
		 *
		 * @function
		 * @name iShouldSeeTheExportMenuButton
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeTheExportMenuButton: function(oControl) {
			var sTableId = typeof oControl === "string" ? oControl : oControl.getId();

			return this.waitFor({
				id: sTableId + "-export",
				controlType: "sap.m.MenuButton",
				success: function(oMenuButton) {
					Opa5.assert.ok(oMenuButton, "Export button is visible");
				},
				errorMessage: "No Export button found"
			});
		},

		/**
		 * Checks if there should be visible columns in the pop-in area or not.
		 *
		 * @function
		 * @name iShouldSeePopins
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @param {Boolean} bHasPopins Rather there should be visible columns in the pop-in area or not
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeePopins: function(oControl, bHasPopins) {
			return waitForTable.call(this, oControl, {
				success: function(oTable) {
					var oInnerTale = oTable._oTable;

					if (bHasPopins) {
						Opa5.assert.ok(oInnerTale._getVisiblePopin().length, "Table has visible pop-ins");
					} else {
						Opa5.assert.notOk(oInnerTale._getVisiblePopin().length, "Table has no visible pop-ins");
					}
				},
				errorMessage: "No table found"
			});
		},

		/**
		 * Checks if all visible rows should be selected or deselected.
		 *
		 * @function
		 * @name iShouldSeeAllVisibleRowsSelected
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @param {Boolean} bSelectAll Flag to selected or deselected all
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeAllVisibleRowsSelected: function(oControl, bSelectAll) {
			return waitForTable.call(this, oControl, {
				success: function(oTable) {
					var oInnerTable = oTable._oTable;

					if (oTable._isOfType(TableType.ResponsiveTable)) {
						if (bSelectAll) {
							Opa5.assert.equal(oInnerTable.getItems().filter(function(oItem) {
								return oItem.getSelected() && Opa5.getWindow().jQuery('#' + oItem.getId()).hasClass('sapMLIBSelected');
							}).length, oInnerTable.getItems().length, "All visible rows are selected");
						} else {
							Opa5.assert.equal(oInnerTable.getItems().filter(function(oItem) {
								return !oItem.getSelected() && !Opa5.getWindow().jQuery('#' + oItem.getId()).hasClass('sapMLIBSelected');
							}).length, oInnerTable.getItems().length, "All visible rows are de-selected");
						}
					} else {
						var oSelectionPlugin = oInnerTable.getPlugins()[0];

						if (bSelectAll) {
							Opa5.assert.equal(oSelectionPlugin.getSelectedIndices().length, oInnerTable.getBinding("rows").aContexts.length, "All visible rows are selected");
						} else {
							Opa5.assert.equal(oSelectionPlugin.getSelectedIndices().length, 0, "All visible rows are de-selected");
						}
					}
				},
				errorMessage: "No table found"
			});
		},

		/**
		 * Checks if the given rows are selected.
		 *
		 * @function
		 * @name iShouldSeeSomeRowsSelected
		 * @param {String|sap.ui.mdc.Table} oControl Id or control instance of the MDCTable
		 * @param {Number} iStartIndex Index from which the selection starts
		 * @param {Number} iEndIndex Index up to the selection ends
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeSomeRowsSelected: function(oControl, iStartIndex, iEndIndex) {
			return waitForTable.call(this, oControl, {
				success: function(oTable) {
					var iIndex = iStartIndex;
					var oInnerTable = oTable._oTable;

					if (oTable._isOfType(TableType.ResponsiveTable)) {
						var oItem;
						for (iIndex; iIndex <= iEndIndex; iIndex++) {
							oItem = oInnerTable.getItems()[iIndex];
							Opa5.assert.ok(oItem.getSelected() && Opa5.getWindow().jQuery('#' + oItem.getId()).hasClass('sapMLIBSelected'), "Row at index " + iIndex + " is selected");
						}
					} else {
						var oRow;
						for (iIndex; iIndex <= iEndIndex; iIndex++) {
							oRow = oInnerTable.getRows()[iIndex];
							Opa5.assert.ok(Opa5.getWindow().jQuery('#' + oRow.getId()).hasClass('sapUiTableRowSel'), "Row at index " + iIndex + " is selected");
						}
					}
				},
				errorMessage: "No table found"
			});
		},

		/**
		 * Checks if the dialog, showing the actual process status of the export,
		 * is visible on the screen.
		 *
		 * @function
		 * @name iShouldSeeExportProcessDialog
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeExportProcessDialog: function() {
			return this.waitFor({
				autoWait: false,
				controlType: "sap.m.Dialog",
				success: function(aDialogs) {
					var oDialog = aDialogs[0];
					var oResourceBundle = Core.getLibraryResourceBundle("sap.ui.export");
					return this.waitFor({
						autoWait: false,
						controlType: "sap.m.Title",
						searchOpenDialogs: true,
						matchers: new PropertyStrictEquals({
							name: "text",
							value: oResourceBundle.getText("PROGRESS_TITLE")
						}),
						success: function() {
							Opa5.assert.ok(oDialog, "Export process dialog is visible");
						},
						errorMessage: "No dialog title found"
					});
				},
				errorMessage: "No Export process dialog found"
			});
		},

		/**
		 * Checks if the {@type sap.ui.unified.Menu} shows up after
		 * pressing on the arrow button performed in {@see iPressExportArrowButton}.
		 *
		 * @function
		 * @name iShouldSeeExportMenu
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeExportMenu: function() {
			return this.waitFor({
				controlType: "sap.ui.unified.Menu",
				success: function(oMenu) {
					Opa5.assert.ok(oMenu.length, "Export menu is visible");
				},
				errorMessage: "No Export menu found"
			});
		},

		/**
		 * Checks if the {@type sap.m.Dialog} 'exportSettingsDialog' is visible on the screen after
		 * pressing on the 'Export as...' button performed in {@see iPressExportAsButtonInMenu}.
		 *
		 * @function
		 * @name iShouldSeeExportSettingsDialog
		 * @returns {Promise} OPA waitFor
		 * @private
		 */
		iShouldSeeExportSettingsDialog: function() {
			return this.waitFor({
				id: "exportSettingsDialog",
				controlType: "sap.m.Dialog",
				success: function(oDialog) {
					Opa5.assert.ok(oDialog, "'Export settings' dialog is visible");
				},
				errorMessage: "No 'Export settings' dialog found"
			});
		}
	};
});