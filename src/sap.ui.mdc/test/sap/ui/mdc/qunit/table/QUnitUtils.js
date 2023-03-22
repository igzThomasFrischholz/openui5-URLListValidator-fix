/*!
 * ${copyright}
 */
sap.ui.define([
	"../QUnitUtils",
	"sap/ui/mdc/library",
	"sap/ui/core/Core",
	"sap/ui/base/ManagedObjectObserver",
	"sap/ui/qunit/QUnitUtils",
	"sap/ui/events/KeyCodes"
], function(
	MDCQUnitUtils,
	Library,
	Core,
	ManagedObjectObserver,
	qutils,
	KeyCodes
) {
	"use strict";

	var TableType = Library.TableType;

	var QUnitUtils = Object.assign({}, MDCQUnitUtils);

	QUnitUtils.stubPropertyInfos = function(oTarget, aPropertyInfos) {
		var fnOriginalGetControlDelegate = oTarget.getControlDelegate;
		var fnOriginalAwaitControlDelegate = oTarget.awaitControlDelegate;
		var oDelegate;
		var fnOriginalFetchProperties;
		var bPropertyHelperExists;

		if (typeof fnOriginalGetControlDelegate !== "function") {
			throw new Error("The target cannot be stubbed. " + oTarget);
		}

		if (oTarget.__restorePropertyInfos) {
			throw new Error("The target is already stubbed. " + oTarget);
		}

		if (typeof oTarget.getPropertyHelper === "function") {
			bPropertyHelperExists = !!oTarget.getPropertyHelper();

			if (bPropertyHelperExists) {
				throw new Error("The target cannot be stubbed if the property helper is already initialized. " + oTarget);
			}
		}

		function getDelegate() {
			if (oDelegate) {
				return oDelegate;
			}

			oDelegate = fnOriginalGetControlDelegate.apply(this, arguments);
			fnOriginalFetchProperties = oDelegate.fetchProperties;

			oDelegate.fetchProperties = function() {
				fnOriginalFetchProperties.apply(this, arguments);
				return Promise.resolve(aPropertyInfos);
			};
			return oDelegate;
		}

		oTarget.getControlDelegate = function() {
			return getDelegate.call(this);
		};

		oTarget.awaitControlDelegate = function() {
			return fnOriginalAwaitControlDelegate.apply(this, arguments).then(function() {
				return getDelegate.call(this);
			}.bind(this));
		};

		oTarget.__restorePropertyInfos = function() {
			delete oTarget.__restorePropertyInfos;
			oTarget.getControlDelegate = fnOriginalGetControlDelegate;
			oTarget.awaitControlDelegate = fnOriginalAwaitControlDelegate;

			if (oDelegate) {
				oDelegate.fetchProperties = fnOriginalFetchProperties;
			}
		};
	};

	QUnitUtils.restorePropertyInfos = function(oTarget) {
		if (oTarget.__restorePropertyInfos) {
			oTarget.__restorePropertyInfos();
		}
	};

	QUnitUtils.poll = function(fnCheck, iTimeout) {
		return new Promise(function(resolve, reject) {
			if (fnCheck()) {
				resolve();
				return;
			}

			var iRejectionTimeout = setTimeout(function() {
				clearInterval(iCheckInterval);
				reject("Polling timeout");
			}, iTimeout == null ? 100 : iTimeout);

			var iCheckInterval = setInterval(function() {
				if (fnCheck()) {
					clearTimeout(iRejectionTimeout);
					clearInterval(iCheckInterval);
					resolve();
				}
			}, 10);
		});
	};

	QUnitUtils.waitForBindingInfo = function(oTable, iTimeout) {
		return this.poll(function() {
			var oInnerTable = oTable._oTable;
			return oInnerTable && oInnerTable.getBindingInfo(oTable._isOfType(TableType.Table, true) ? "rows" : "items");
		}, iTimeout);
	};

	QUnitUtils.openColumnMenu = function(oTable, iColumnIndex) {
		return oTable.initialized().then(function() {
			var oColumn = oTable._oTable.getColumns()[iColumnIndex];
			var oColumnDomRef = oColumn.getDomRef();
			var oMenu = Core.byId(oColumn.getHeaderMenu());
			var fnOpenBy = oMenu.openBy;

			return new Promise(function(resolve) {
				oMenu.openBy = function(oAnchor, bSuppressEvent) {
					fnOpenBy.apply(this, arguments);

					if (bSuppressEvent) {
						if (oMenu.isOpen()) {
							resolve();
						} else {
							oMenu._oPopover.attachEventOnce("afterOpen", function() {
								resolve();
							});
						}
					}
				};
				oColumnDomRef.focus();
				qutils.triggerMouseEvent(oColumnDomRef, "mousedown", null, null, null, null, 0);
				qutils.triggerMouseEvent(oColumnDomRef, "click");
			}).then(function() {
				oMenu.openBy = fnOpenBy;
			});
		});
	};

	QUnitUtils.closeColumnMenu = function(oTable) {
		return new Promise(function(resolve) {
			oTable._oColumnHeaderMenu.attachEventOnce("afterClose", function() {
				resolve();
			});
			oTable._oColumnHeaderMenu.close();

			// TODO: Delete after sap.m.table.columnmenu.Menu got the "afterClose" event
			oTable._oColumnHeaderMenu._oPopover.attachEventOnce("afterClose", function() {
				oTable._oColumnHeaderMenu.fireEvent("afterClose");
			});
			if (oTable._oColumnHeaderMenu.getMetadata().hasEvent("afterClose")) {
				throw new Error("Don't forget to delete this code! :)");
			}
		});
	};

	QUnitUtils.waitForSettingsDialog = function(oTable) {
		var oObserver;

		return new Promise(function(resolve) {
			oObserver = new ManagedObjectObserver(function(oChange) {
				if (oChange.mutation === "insert" && oChange.child.isA("sap.m.p13n.Popup")) {
					var fnOriginalOpen = oChange.child.open;
					oChange.child.open = function() {
						fnOriginalOpen.apply(this, arguments);
						resolve(oChange.child._oPopup);
					};
				}
			}).observe(oTable, {
				aggregations: ["dependents"]
			});
		}).finally(function() {
			if (oObserver) {
				oObserver.disconnect();
			}
		});
	};

	QUnitUtils.closeSettingsDialog = function(oTable) {
		var oP13nPopup = oTable.getDependents().find(function(oDepentent) {
			return oDepentent.isA("sap.m.p13n.Popup");
		});

		if (!oP13nPopup) {
			return Promise.resolve();
		}

		return new Promise(function(resolve) {
			oP13nPopup._oPopup.attachEventOnce("afterClose", function() {
				resolve();
			});
			qutils.triggerKeydown(oP13nPopup._oPopup.getDomRef(), KeyCodes.ESCAPE);
		});
	};

	return QUnitUtils;
});