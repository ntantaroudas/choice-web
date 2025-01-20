import $ from "jquery";
import Slider from "bootstrap-slider";
import "bootstrap-slider/dist/css/bootstrap-slider.css";
import "./index.css";

import { config as coreConfig, createModel } from "@core";
import enStrings from "@core-strings/en";

import { initOverlay } from "./dev-overlay";
import { GraphView } from "./graph-view";

let model;
let graphViews = [];

/**
 * Return the base (English) string for the given key.
 */
function str(key) {
  return enStrings[key];
}

/**
 * Return a formatted string representation of the given number.
 */
function format(num, formatString) {
  switch (formatString) {
    case ".1f":
      return num.toFixed(1);
    case ".2f":
      return num.toFixed(2);
    default:
      return num.toString();
  }
}

/*
 * INPUTS
 */

function addSliderItem(sliderInput) {
  const spec = sliderInput.spec;
  const inputElemId = `input-${spec.id}`;
  const inputValue = $(`<div class="input-value"/>`);
  const titleRow = $(`<div class="input-title-row"/>`).append([
    $(`<div class="input-title">${str(spec.labelKey)}</div>`),
    inputValue,
    $(`<div class="input-units">${str(spec.unitsKey)}</div>`),
  ]);

  let tickPos =
    (spec.defaultValue - spec.minValue) / (spec.maxValue - spec.minValue);
  if (spec.reversed) {
    tickPos = 1 - tickPos;
  }
  const sliderRow = $(`<div class="input-slider-row"/>`).append([
    $(`<div class="input-slider-tick" style="left:${tickPos * 100}%"></div>`),
    $(`<input id="${inputElemId}" class="slider" type="text"></input>`),
  ]);

  const div = $(`<div class="input-item"/>`).append([
    titleRow,
    sliderRow,
    $(
      `<div class="input-desc">${
        spec.descriptionKey ? str(spec.descriptionKey) : ""
      }</div>`
    ),
  ]);

  $("#inputs-content").append(div);

  const value = sliderInput.get();
  const slider = new Slider(`#${inputElemId}`, {
    value,
    min: spec.minValue,
    max: spec.maxValue,
    step: spec.step,
    reversed: spec.reversed,
    tooltip: "hide",
    selection: "none",
    rangeHighlights: [{ start: spec.defaultValue, end: value }],
  });

  // Show the initial value and update the value when the slider is changed
  const updateValueElement = (v) => {
    inputValue.text(format(v, spec.format));
  };
  updateValueElement(value);

  // Update the model input when the slider is dragged or the track is clicked
  slider.on("change", (change) => {
    const start = spec.defaultValue;
    const end = change.newValue;
    slider.setAttribute("rangeHighlights", [{ start, end }]);
    updateValueElement(change.newValue);
    sliderInput.set(change.newValue);
    // model.updateOutputs()
  });
}

function addSwitchItem(switchInput) {
  const spec = switchInput.spec;
  const inputElemId = `input-${spec.id}`;
  function addCheckbox(desc) {
    const div = $(`<div class="input-item"/>`).append([
      $(
        `<input id="${inputElemId}" class="switch-checkbox" name="${inputElemId}" type="checkbox"/>`
      ),
      $(
        `<label for="${inputElemId}" class="switch-label">${str(
          spec.labelKey
        )}</label>`
      ),
      $(`<div class="input-desc">${desc}</div>`),
    ]);
    $("#inputs-content").append(div);
    $(`#${inputElemId}`).on("change", function () {
      if ($(this).is(":checked")) {
        switchInput.set(spec.onValue);
      } else {
        switchInput.set(spec.offValue);
      }
      model.updateOutputs();
    });
  }

  if (!spec.slidersActiveWhenOff && spec.slidersActiveWhenOn) {
    addCheckbox(
      "The following slider will have an effect only when this is checked."
    );
    for (const sliderId of spec.slidersActiveWhenOn) {
      const slider = model.getInputForId(sliderId);
      addSliderItem(slider);
    }
  } else {
    for (const sliderId of spec.slidersActiveWhenOff) {
      const slider = model.getInputForId(sliderId);
      addSliderItem(slider);
    }
    addCheckbox(
      "When this is unchecked, only the slider above has an effect, and the ones below are inactive (and vice versa)."
    );
    for (const sliderId of spec.slidersActiveWhenOn) {
      const slider = model.getInputForId(sliderId);
      addSliderItem(slider);
    }
  }
}

/**
 * Initialize the UI for the inputs menu and panel.
 */

// jquery Click event for Selecting Input Category (Diet Change, Food Waste, Alternative Protein)
$("#input-selector-container").on(
  "click",
  ".input-selector-option",
  function () {
    // If the clicked button is already selected, do nothing
    if ($(this).hasClass("selected")) return;

    // Remove 'selected' class from all buttons
    $(".input-selector-option").removeClass("selected");

    // Add 'selected' class to the clicked button
    $(this).addClass("selected");

    // Get the selected category value
    const selectedCategory = $(this).data("value");

    // Call the function to update the graphs
    initInputsUI(selectedCategory);
  }
);

const inputCategories = {
  Diet: ["1", "2", "3", "4", "5", "6", "7", "8"],
  Food: [
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
  ],
  //Protein: ["", "", "", ""],
};

//
function initInputsUI(category) {
  $("#inputs-content").empty();

  const categoryInputIds = inputCategories[category] || [];

  if (coreConfig.inputs.size > 0) {
    for (const inputId of coreConfig.inputs.keys()) {
      if (categoryInputIds.includes(inputId)) {
        const input = model.getInputForId(inputId);
        if (input.kind === "slider") {
          addSliderItem(input);
        } else if (input.kind === "switch") {
          addSwitchItem(input);
        }
      }
    }
  } else {
    const msg = `No sliders configured. You can edit 'config/inputs.csv' to get started.`;
    $("#inputs-content").html(`<div style="padding-top: 10px">${msg}</div>`);
  }
}

/*
 * GRAPHS
 */

// jquery Click event for Selecting Graph Category (Food, Climate, LandUse, Fertilizer)
$("#graph-selector-container").on(
  "click",
  ".graph-selector-option",
  function () {
    // If the clicked button is already selected, do nothing
    if ($(this).hasClass("selected")) return;

    // Remove 'selected' class from all buttons
    $(".graph-selector-option").removeClass("selected");

    // Add 'selected' class to the clicked button
    $(this).addClass("selected");

    // Get the selected category value
    const selectedCategory = $(this).data("value");

    // Call the function to update the graphs
    initGraphsUI(selectedCategory);
  }
);

function createGraphViewModel(graphSpec) {
  return {
    spec: graphSpec,
    style: "normal",
    getLineWidth: () => window.innerWidth * (0.5 / 100),
    getScaleLabelFontSize: () => window.innerWidth * (1.2 / 100),
    getAxisLabelFontSize: () => window.innerWidth * (1.0 / 100),
    getSeriesForVar: (varId, sourceName) => {
      return model.getSeriesForVar(varId, sourceName);
    },
    getStringForKey: (key) => {
      return str(key);
    },
    formatYAxisTickValue: (value) => {
      return format(value, graphSpec.yFormat);
    },
  };
}

function showGraph(graphSpec, container) {
  const canvas = $("<canvas></canvas>")[0];
  container.append(canvas);
  const viewModel = createGraphViewModel(graphSpec);
  const options = {
    fontFamily: "Helvetica, sans-serif",
    fontStyle: "bold",
    fontColor: "#231f20",
  };
  const tooltipsEnabled = true;
  const xAxisLabel = graphSpec.xAxisLabelKey
    ? str(graphSpec.xAxisLabelKey)
    : undefined;
  const yAxisLabel = graphSpec.yAxisLabelKey
    ? str(graphSpec.yAxisLabelKey)
    : undefined;
  const graphView = new GraphView(
    canvas,
    viewModel,
    options,
    tooltipsEnabled,
    xAxisLabel,
    yAxisLabel
  );

  // Show the legend items for the graph
  // (?) chartJs problem w/ canvas (?)
  // (?) Each canvas' parent container needs only the canvas as child. (?)

  // const legendContainer = $('<div class="graph-legend"></div>');
  // container.append(legendContainer);
  // for (const itemSpec of graphSpec.legendItems) {
  //   const attrs = `class="graph-legend-item" style="background-color: ${itemSpec.color}"`;
  //   const label = str(itemSpec.labelKey);
  //   const itemElem = $(`<div ${attrs}>${label}</div>`);
  //   legendContainer.append(itemElem);
  // }

  return graphView;
}

/**
 * Initialize the UI for the graphs panel.
 */

// ORIGINAL initGraphsUI() function
// function initGraphsUI() {
//   const graphsContainer = $("#graphs-container");
//   graphsContainer.empty();
//   graphViews = []; // Reset graphViews
//   if (coreConfig.graphs.size > 0) {
//     for (const spec of coreConfig.graphs.values()) {
//       const graphContainer = $('<div class="graph-container"></div>');
//       graphsContainer.append(graphContainer);
//       const graphView = showGraph(spec, graphContainer);
//       graphViews.push(graphView); // Store each graphView
//     }
//   } else {
//     graphsContainer.text(
//       `No graphs configured. You can edit 'config/graphs.csv' to get started.`
//     );
//   }
// }

//fm
const graphCategories = {
  Food: ["food1", "food2", "food3", "food4"],
  Climate: ["cc1", "cc2", "cc3", "cc4"],
  LandUse: ["lu1", "lu2", "lu3", "lu4"],
  Fertilizer: ["fu1", "fu2", "fu3", "fu4"],
};

//fm - changed this to initialize graphs according to selected graph category
function initGraphsUI(category) {
  const graphsContainer = $("#graphs-container");
  graphsContainer.empty(); // Clear previous graphs
  graphViews = []; // Reset graphViews

  const categoryGraphIds = graphCategories[category] || [];
  const topRowGraphIds = categoryGraphIds.slice(0, 2); // First two graphs for the top row
  const bottomRowGraphIds = categoryGraphIds.slice(2, 4); // Next two graphs for the bottom row

  // Create containers for the rows
  const topGraphRow = $('<div class="top-graph-row"></div>');
  const bottomGraphRow = $('<div class="bottom-graph-row"></div>');

  if (coreConfig.graphs.size > 0) {
    // Iterate over the coreConfig.graphs and filter by category
    for (const spec of coreConfig.graphs.values()) {
      if (categoryGraphIds.includes(spec.id)) {
        const graphContainer = $('<div class="graph-container"></div>');

        // Add the graph to the top row if it's in the topRowGraphIds
        if (topRowGraphIds.includes(spec.id)) {
          topGraphRow.append(graphContainer); // Add to the top row
          const graphView = showGraph(spec, graphContainer);
          graphViews.push(graphView); // Store the graph view
        }

        // Add the graph to the bottom row if it's in the bottomRowGraphIds
        else if (bottomRowGraphIds.includes(spec.id)) {
          bottomGraphRow.append(graphContainer); // Add to the bottom row
          const graphView = showGraph(spec, graphContainer);
          graphViews.push(graphView); // Store the graph view
        }
      }
    }

    // After processing, append the rows to the graphsContainer
    graphsContainer.append(topGraphRow);
    graphsContainer.append(bottomGraphRow);
  } else {
    graphsContainer.text(
      `No graphs configured. You can edit 'config/graphs.csv' to get started.`
    );
  }
}

/*
 * INITIALIZATION
 */

/**
 * Initialize the web app. This will load the wasm model asynchronously,
 * and upon completion will initialize the user interface.
 */
async function initApp() {
  try {
    model = await createModel();
  } catch (e) {
    console.error(`ERROR: Failed to load model: ${e.message}`);
    return;
  }

  initInputsUI("Diet"); // "Diet Change" as default input category
  initGraphsUI("Food"); // "Food" as default graph category
  initOverlay();

  // Also, mark the default buttons as "selected"
  $(
    "#input-selector-container .input-selector-option[data-value='Diet']"
  ).addClass("selected");
  $(
    "#graph-selector-container .graph-selector-option[data-value='Food']"
  ).addClass("selected");

  // When the model outputs are updated, refresh all graphs
  model.onOutputsChanged = () => {
    graphViews.forEach((graphView) => graphView.updateData());
  };
}

// Initialize the app when this script is loaded
initApp();
