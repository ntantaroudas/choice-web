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

// Click event for selecting a scenario
$("#scenario-selector-container").on(
  "click",
  ".scenario-selector-option",
  function () {
    // If the clicked button is already selected, do nothing
    if ($(this).hasClass("selected")) return;

    // Remove 'selected' class from all buttons
    $(".scenario-selector-option").removeClass("selected");

    // Add 'selected' class to the clicked button
    $(this).addClass("selected");

    // Get the selected scenario value
    const selectedScenario = $(this).data("value");

    // Call the function to update the UI based on the selected scenario
    updateScenario(selectedScenario);
  }
);

// Example function to handle scenario selection
function updateScenario(selectedScenario) {
  console.log("Selected scenario:", selectedScenario);
  // Add your logic here to handle the change in scenario
}

// jquery Click event for Selecting Input Category (Diet Change, Food Waste, Alternative Protein)
$("#input-category-selector-container").on(
  "click",
  ".input-category-selector-option",
  function () {
    // If the clicked button is already selected, do nothing
    if ($(this).hasClass("selected")) return;

    // Remove 'selected' class from all buttons
    $(".input-category-selector-option").removeClass("selected");

    // Add 'selected' class to the clicked button
    $(this).addClass("selected");

    // Get the selected category value
    const selectedCategory = $(this).data("value");

    // Call the function to update the graphs
    initInputsUI(selectedCategory);
  }
);

const inputCategories = {
  Diet: [
    "d1",
    "d2",
    "d3",
    "d4",
    "d5",
    "d6",
    "d7",
    "d8",
    "d9",
    "d10",
    "d11",
    "d12",
    "d13",
    "d14",
    "d15",
    "d16",
    "d17",
    "d18",
    "d19",
    "d20",
    "d21",
  ],
  Food: [
    "w1",
    "w2",
    "w3",
    "w4",
    "w5",
    "w6",
    "w7",
    "w8",
    "w9",
    "w10",
    "w11",
    "w12",
    // , "w13", "w14", "w15", "w16", "w17", "w18", "w19", "w20"
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
$("#graph-category-selector-container").on(
  "click",
  ".graph-category-selector-option",
  function () {
    // If the clicked button is already selected, do nothing
    if ($(this).hasClass("selected")) return;

    // Remove 'selected' class from all buttons
    $(".graph-category-selector-option").removeClass("selected");

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

/**
 * Create a dropdown selector for switching graphs.
 */
function createGraphSelector(category, currentGraphId, onGraphChange) {
  // Get graph IDs for this category dynamically
  const categoryGraphIds = [];
  for (const spec of coreConfig.graphs.values()) {
    if (spec.graphCategory === category) {
      categoryGraphIds.push(spec.id);
    }
  }

  const selector = $('<select class="graph-selector"></select>');

  categoryGraphIds.forEach((graphId) => {
    const graphSpec = coreConfig.graphs.get(graphId);
    if (graphSpec) {
      const option = $(
        `<option value="${graphId}" ${
          graphId === currentGraphId ? "selected" : ""
        }>${str(graphSpec.titleKey)}</option>`
      );
      selector.append(option);
    }
  });

  selector.on("change", function () {
    const selectedGraphId = $(this).val();
    if (onGraphChange) {
      onGraphChange(selectedGraphId); // Trigger graph change for this selector
    }
  });

  return selector;
}

function showGraph(graphSpec, outerContainer, category) {
  // Check if there's a previous GraphView in this container and remove it from graphViews
  const previousGraphView = outerContainer.data("graphView");
  if (previousGraphView) {
    const index = graphViews.indexOf(previousGraphView);
    if (index > -1) {
      graphViews.splice(index, 1);
    }
  }

  // First, create the viewModel
  const viewModel = createGraphViewModel(graphSpec);

  // Create the dropdown selector for switching graphs
  const selector = createGraphSelector(category, graphSpec.id, (newGraphId) => {
    const newGraphSpec = coreConfig.graphs.get(newGraphId);
    if (newGraphSpec) {
      outerContainer.empty(); // Clear the current graph
      showGraph(newGraphSpec, outerContainer, category); // Render the new graph
    }
  });

  const titleContainer = $('<div class="title-container"></div>');
  titleContainer.append(selector);
  outerContainer.append(titleContainer);

  // Show the canvas/graph
  const canvas = $("<canvas></canvas>")[0];
  // innerContainer has the canvas, and only that.
  // outerContainer is the "outer-graph-container"
  const innerContainer = $('<div class="graph-container"></div>');
  outerContainer.append(innerContainer);
  innerContainer.append(canvas);

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

  // Creation of a new GraphView
  // Maybe use setTimeout here...
  const graphView = new GraphView(
    canvas,
    viewModel,
    options,
    tooltipsEnabled,
    xAxisLabel,
    yAxisLabel
  );

  outerContainer.data("graphView", graphView);
  graphViews.push(graphView);
  // ...until here

  // Show the legend items for the graph
  // Each canvas' parent container should have only the canvas as child.
  // https://github.com/chartjs/Chart.js/issues/5805

  const legendContainer = $('<div class="graph-legend"></div>');
  outerContainer.append(legendContainer);
  for (const itemSpec of graphSpec.legendItems) {
    const attrs = `class="graph-legend-item" style="background-color: ${itemSpec.color}"`;
    const label = str(itemSpec.labelKey);
    const itemElem = $(`<div ${attrs}>${label}</div>`);
    legendContainer.append(itemElem);
  }

  return graphView;
}

//fm - changed this to initialize graphs according to selected graph category
function initGraphsUI(category) {
  const graphsContainer = $("#graphs-container");
  graphsContainer.empty(); // Clear previous graphs
  graphViews = []; // Reset graphViews

  // Dynamically build graph categories based on coreConfig.graphs
  const dynamicGraphCategories = {};
  for (const spec of coreConfig.graphs.values()) {
    const graphCategory = spec.graphCategory;
    if (!graphCategory) continue; // Skip graphs without a category. (!) probably unecessary, since it's a required field.
    if (!dynamicGraphCategories[graphCategory]) {
      dynamicGraphCategories[graphCategory] = [];
    }
    dynamicGraphCategories[graphCategory].push(spec.id);
  }

  const categoryGraphIds = dynamicGraphCategories[category] || [];
  const topRowGraphIds = categoryGraphIds.slice(0, 2); // First two graphs for the top row
  const bottomRowGraphIds = categoryGraphIds.slice(2, 4); // Next two graphs for the bottom row

  // Create containers for the rows
  const topGraphRow = $('<div class="top-graph-row"></div>');
  const bottomGraphRow = $('<div class="bottom-graph-row"></div>');

  // (!) logs the coreConfig object, which contains inputs, graphs specifications. (!)
  console.log(coreConfig);

  if (coreConfig.graphs.size > 0) {
    for (const spec of coreConfig.graphs.values()) {
      if (categoryGraphIds.includes(spec.id)) {
        const outerGraphContainer = $(
          '<div class="outer-graph-container"></div>'
        );

        // Add the graph to the appropriate row
        if (topRowGraphIds.includes(spec.id)) {
          topGraphRow.append(outerGraphContainer);
        } else if (bottomRowGraphIds.includes(spec.id)) {
          bottomGraphRow.append(outerGraphContainer);
        }

        // Add the graph rendering after a delay, so that it always has animations
        setTimeout(() => {
          const graphView = showGraph(spec, outerGraphContainer, category);
          graphViews.push(graphView);
        }, 50);
      }
    }

    // Append the rows to the graphsContainer
    graphsContainer.append(topGraphRow).append(bottomGraphRow);
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

  // Generate category selector buttons
  const categoryContainer = $("#graph-category-selector-container");
  const categories = new Set( // Get unique categories
    Array.from(coreConfig.graphs.values()).map((spec) => spec.graphCategory)
  );

  categories.forEach((category) => {
    categoryContainer.append(
      `<button class="graph-category-selector-option" data-value="${category}">
        ${category}
      </button>`
    );
  });

  // Set default category to first available
  const defaultCategory = categories.values().next().value || "Food";
  initGraphsUI(defaultCategory);

  initInputsUI("Diet"); // "Diet Change" as default input category
  initOverlay();

  // Also, mark the default buttons as "selected"
  $(
    "#input-category-selector-container .input-category-selector-option[data-value='Diet']"
  ).addClass("selected");
  $(
    "#graph-category-selector-container .graph-category-selector-option[data-value='Food']"
  ).addClass("selected");
  $(
    "#scenario-selector-container .scenario-selector-option[data-value='Scenario 1']"
  ).addClass("selected");

  // When the model outputs are updated, refresh all graphs
  model.onOutputsChanged = () => {
    graphViews.forEach((graphView) => graphView.updateData());
  };
}

// Initialize the app when this script is loaded
initApp();
