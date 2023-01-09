/*!
 * ${copyright}
 */

// Provides control sap.ui.rta.toolbar.contextBased.ManageAdaptationsDialog
sap.ui.define([
	"sap/base/Log",
	"sap/base/util/restricted/_isEqual",
	"sap/ui/base/ManagedObject",
	"sap/ui/core/Fragment",
	"sap/ui/fl/write/api/ContextBasedAdaptationsAPI",
	"sap/m/ColumnListItem",
	"sap/ui/rta/Utils"
],
function(
	Log,
	_isEqual,
	ManagedObject,
	Fragment,
	ContextBasedAdaptationsAPI,
	ColumnListItem,
	Utils
) {
	"use strict";

	var oRanking = {
		Initial: 0,
		Default: 1024,
		Before: function(iRank) {
			return iRank + 1024;
		},
		Between: function(iRank1, iRank2) {
			return (iRank1 + iRank2) / 2;
		},
		After: function(iRank) {
			return iRank + 0.5;
		}
	};

	var ManageAdaptations = ManagedObject.extend("sap.ui.rta.toolbar.contextBased.ManageAdaptations", {
		metadata: {
			properties: {
				toolbar: {
					type: "any" // "sap.ui.rta.toolbar.Base"
				}
			}
		},
		constructor: function() {
			ManagedObject.prototype.constructor.apply(this, arguments);
			this.oTextResources = this.getToolbar().getTextResources();
		}
	});

	ManageAdaptations.prototype.openManageAdaptationDialog = function() {
		if (!this._oManageAdaptationDialogPromise) {
			this._oManageAdaptationDialogPromise = Fragment.load({
				name: "sap.ui.rta.toolbar.contextBased.ManageAdaptationsDialog",
				id: this.getToolbar().getId() + "_fragment--sapUiRta_manageAdaptationDialog",
				controller: {
					formatContextColumnCell: formatContextColumnCell.bind(this),
					formatContextColumnTooltip: formatContextColumnTooltip.bind(this),
					moveUp: moveUp.bind(this),
					moveDown: moveDown.bind(this),
					onDropSelectedAdaptation: onDropSelectedAdaptation.bind(this),
					onSaveReorderedAdaptations: onSaveReorderedAdaptations.bind(this),
					onClose: onCloseDialog.bind(this)
				}
			}).then(function(oDialog) {
				this._oManageAdaptationDialog = oDialog;
				oDialog.addStyleClass(Utils.getRtaStyleClassName());
				this.getToolbar().addDependent(this._oManageAdaptationDialog);
				// TODO: discuss how to set width, height etc. when we finish implementing this dialog
				oDialog.setContentWidth("650px");
				oDialog.setContentHeight("450px");
				oDialog.setHorizontalScrolling(false);
			}.bind(this));
		} else {
			setEnabledPropertyOfMoveButton.call(this, false);
			enableSaveButton.call(this, false);
		}
		return this._oManageAdaptationDialogPromise.then(function() {
			var oRtaInformation = this.getToolbar().getRtaInformation();
			return ContextBasedAdaptationsAPI.load({control: oRtaInformation.rootControl, layer: oRtaInformation.flexSettings.layer});
		}.bind(this)).then(function(oAdaptationsModel) {
			this.oAdaptationsModel = oAdaptationsModel;
			this.oReferenceAdaptationsData = JSON.parse(JSON.stringify(oAdaptationsModel.getData()));
			this._oManageAdaptationDialog.setModel(this.oAdaptationsModel, "contextBased");
			initializeRanks(this.oAdaptationsModel);
			getAdaptationsTable.call(this).attachSelectionChange(onSelectionChange.bind(this));
			return this._oManageAdaptationDialog.open();
		}.bind(this)
		).catch(function(oError) {
			Log.error(oError.stack);
			var sMessage = "MSG_LREP_TRANSFER_ERROR";
			var oOptions = { titleKey: "BTN_MANAGE_APP_CTX" };
			oOptions.details = oError.userMessage;
			Utils.showMessageBox("error", sMessage, oOptions);
		});
	};

	// ------ formatting ------
	function formatContextColumnCell(aRoles) {
		return aRoles.length + " " + (aRoles.length > 1 ?
			this.oTextResources.getText("TXT_TABLE_CONTEXT_CELL_ROLES") : this.oTextResources.getText("TXT_TABLE_CONTEXT_CELL_ROLE"));
	}

	function formatContextColumnTooltip(aRoles) {
		return aRoles.join("\n");
	}

	function onSelectionChange(oEvent) {
		if (oEvent.getParameter("selected") === true) {
			setEnabledPropertyOfMoveButton.call(this, true);
		}
	}

	function setEnabledPropertyOfMoveButton(bIsEnabled) {
		var oUpButton = getControlInDialog.call(this, "moveUpButton");
		var oDownButton = getControlInDialog.call(this, "moveDownButton");
		oUpButton.setEnabled(bIsEnabled);
		oDownButton.setEnabled(bIsEnabled);
	}

	// ------ drag & drop of priority ------
	function moveUp(oEvent) {
		moveSelectedItem.call(this, "Up");
		oEvent.getSource().focus();
	}

	function moveDown(oEvent) {
		moveSelectedItem.call(this, "Down");
		oEvent.getSource().focus();
	}

	function compareRanks(oContextA, oContextB) {
		return oContextA.rank - oContextB.rank;
	}

	function sortByRank(oModel) {
		var aContexts = oModel.getProperty("/adaptations") || [];
		aContexts.sort(compareRanks);
		oModel.setProperty("/adaptations", aContexts);
		oModel.refresh(true);
	}

	function initializeRanks(oModel) {
		var aContexts = oModel.getProperty("/adaptations") || [];
		aContexts.forEach(function(oContext, iIndex) {
			oContext.rank = iIndex + 1;
		});
		oModel.setProperty("/adaptations", aContexts);
	}

	function moveSelectedItem(sDirection) {
		var oTable = getAdaptationsTable.call(this);
		var oSelectedItem = oTable.getSelectedItem(0);
		var oSelectedItemContext = oSelectedItem.getBindingContext("contextBased");

		var iSiblingItemIndex = oTable.indexOfItem(oSelectedItem) + (sDirection === "Up" ? -1 : 1);
		var oSiblingItem = oTable.getItems()[iSiblingItemIndex];
		var oSiblingItemContext = oSiblingItem ? oSiblingItem.getBindingContext("contextBased") : undefined;
		if (!oSiblingItemContext) {
			return;
		}

		// swap the selected and the siblings rank
		var iSiblingItemRank = oSiblingItemContext.getProperty("rank");
		var iSelectedItemRank = oSelectedItemContext.getProperty("rank");

		this.oAdaptationsModel.setProperty("rank", iSiblingItemRank, oSelectedItemContext);
		this.oAdaptationsModel.setProperty("rank", iSelectedItemRank, oSiblingItemContext);

		sortByRank(this.oAdaptationsModel);
		// after move select the sibling
		oTable.getItems()[iSiblingItemIndex].setSelected(true).focus();
		enableSaveButton.call(this, true);
	}

	function onDropSelectedAdaptation(oEvent) {
		var oDraggedItem = oEvent.getParameter("draggedControl");
		var oDraggedItemContext = oDraggedItem.getBindingContext("contextBased");
		if (!oDraggedItemContext) {
			return;
		}

		var iNewRank = oRanking.Default;
		var oDroppedItem = oEvent.getParameter("droppedControl");

		if (oDroppedItem instanceof ColumnListItem) {
			// get the dropped row data
			var sDropPosition = oEvent.getParameter("dropPosition");
			var oDroppedItemContext = oDroppedItem.getBindingContext("contextBased");
			var iDroppedItemRank = oDroppedItemContext.getProperty("rank");
			var oDroppedTable = oDroppedItem.getParent();
			var iDroppedItemIndex = oDroppedTable.indexOfItem(oDroppedItem);
			if (oDroppedItemContext === oDraggedItemContext) {
				return;
			}
			// find the new index of the dragged row depending on the drop position
			var iNewItemIndex = iDroppedItemIndex + (sDropPosition === "After" ? 1 : -1);
			var oNewItem = oDroppedTable.getItems()[iNewItemIndex];
			if (!oNewItem || iNewItemIndex === -1) {
				// dropped before the first row or after the last row
				iNewRank = iNewItemIndex === -1 ? 0.5 : oRanking[sDropPosition](iDroppedItemRank);
			} else {
				// dropped between first and the last row
				var oNewItemContext = oNewItem.getBindingContext("contextBased");
				iNewRank = oRanking.Between(iDroppedItemRank, oNewItemContext.getProperty("rank"));
			}
		}
		// set the rank property and update the model to refresh the bindings
		this.oAdaptationsModel.setProperty("rank", iNewRank, oDraggedItemContext);
		sortByRank(this.oAdaptationsModel);
		initializeRanks(this.oAdaptationsModel);
		enableSaveButton.call(this, true);
	}

	function didAdaptationsPriorityChange() {
		return !_isEqual(
			this.oAdaptationsModel.getProperty("/adaptations").map(function(oAdapation) { return oAdapation.id; }),
			this.oReferenceAdaptationsData.adaptations.map(function(oAdapation) { return oAdapation.id; })
		);
	}

	function enableSaveButton(bEnabled) {
		var oSaveButton = getControlInDialog.call(this, "manageAdaptations-saveButton");
		oSaveButton.setTooltip(bEnabled ? "" : this.oTextResources.getText("TOOLTIP_APP_CTX_DIALOG_SAVE"));
		oSaveButton.setEnabled(bEnabled);
	}

	function getAdaptationsTable() {
		return getControlInDialog.call(this, "manageAdaptationsTable");
	}

	function getControlInDialog(sId) {
		return this.getToolbar().getControl("manageAdaptationDialog--" + sId);
	}

	function onSaveReorderedAdaptations() {
		if (didAdaptationsPriorityChange.call(this)) {
			var oRtaInformation = this.getToolbar().getRtaInformation();
			var aAdaptationPriorities = this.oAdaptationsModel.getProperty("/adaptations").map(function(oAdaptation) { return oAdaptation.id; });
			ContextBasedAdaptationsAPI.reorder({control: oRtaInformation.rootControl, layer: oRtaInformation.flexSettings.layer, parameters: {priorities: aAdaptationPriorities}})
			.catch(function(oError) {
				Log.error(oError.stack);
				var sMessage = "MSG_LREP_TRANSFER_ERROR";
				var oOptions = { titleKey: "BTN_MANAGE_APP_CTX" };
				oOptions.details = oError.userMessage;
				Utils.showMessageBox("error", sMessage, oOptions);
			});
		}
		onCloseDialog.call(this);
	}

	function onCloseDialog() {
		this._oManageAdaptationDialog.getModel("contextBased").setData(null);
		this._oManageAdaptationDialog.close();
	}

	return ManageAdaptations;
});