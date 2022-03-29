/*!
 * ${copyright}
 */

sap.ui.define([
		'sap/ui/core/Renderer',
		'sap/ui/unified/CalendarRenderer'],
	function(Renderer, CalendarRenderer) {
		"use strict";


		/**
		 * CalendarInCard renderer.
		 * @namespace
		 */
		var CalendarInCardRenderer = Renderer.extend(CalendarRenderer);
		CalendarInCardRenderer.apiVersion = 2;
		/**
		 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
		 *
		 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
		 * @param {sap.f.CalendarInCard} oCal an object representation of the control that should be rendered
		 */

		/**
		 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
		 *
		 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
		 * @param {sap.f.Calendar} oCal an object representation of the control that should be rendered
		 */
		CalendarInCardRenderer.render = function(oRm, oCal){

			// oCal._iMode = 0; // it's rendered always as DayPicker

			var sId = oCal.getId(),
				sTooltip = oCal.getTooltip_AsString(),
				aMonths = oCal.getAggregation("month"),
				sWidth = oCal.getWidth(),
				rb = sap.ui.getCore().getLibraryResourceBundle("sap.f"),
				mAccProps = {labelledby: {value: "", append: false}};

			oRm.openStart("div", oCal);
			oRm.class("sapUiCal");
			if (aMonths.length > 1) {
				oRm.class("sapUiCalMulti");
			}

			oRm.accessibilityState(oCal, mAccProps);

			if (sTooltip) {
				oRm.attr("title", sTooltip);
			}

			if (sWidth) {
				oRm.class("sapUiCalWidth");
				oRm.style("width", sWidth);
			}

			if (oCal._getSecondaryCalendarType()) {
				oRm.class("sapUiCalSecType");
			}

			oRm.openEnd(); // div element

			oRm.openStart("div", sId + "-content");
			oRm.class("sapUiCalContent");
			oRm.openEnd();
			switch (oCal.getProperty("_currentPicker")) {
				case "month": // month picker
						oRm.renderControl(aMonths[0]);
					break;
				case "monthPicker": // month picker
					oRm.renderControl(oCal._getMonthPicker());
					break;
				case "yearPicker": // year picker
					oRm.renderControl(oCal._getYearPicker());
					break;
				case "yearRangePicker": // year picker
					oRm.renderControl(oCal._getYearRangePicker());
					break;
				// no default
			}

			oRm.close("div");

			var oHeader = oCal.getAggregation("header");
			oRm.renderControl(oHeader);

			//when used in a DatePicker, in mobile there is no cancel button
			if (!oCal._bSkipCancelButtonRendering) {
				oRm.openStart("button", sId + "-cancel");
				oRm.class("sapUiCalCancel");
				oRm.attr("tabindex", "-1");
				oRm.openEnd();
				oRm.text(rb.getText("CALENDAR_CANCEL"));
				oRm.close("button");
			}

			// dummy element to catch tabbing in from next element
			oRm.openStart("div", sId + "-end");
			oRm.attr("tabindex", "0");
			oRm.style("position", "absolute");
			oRm.style("width", "0");
			oRm.style("height", "0");
			oRm.style("right", "0");
			oRm.style("bottom", "0");
			oRm.openEnd();
			oRm.close("div");

			this.renderCalContentAndArrowsOverlay(oRm, oCal, sId);

			oRm.close("div");
		};


		return CalendarInCardRenderer;

	}, /* bExport= */ true);
