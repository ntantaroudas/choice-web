import $ from "jquery";
import Slider from "bootstrap-slider";
import "bootstrap-slider/dist/css/bootstrap-slider.css";
import "./index.css";

import { config as coreConfig, createModel } from "@core";
import enStrings from "@core-strings/en";

import { initOverlay } from "./dev-overlay";
import { GraphView } from "./graph-view";

let model;
let modelB;
let activeModel;

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
 * fm - Function to position tooltip correctly
 */

function positionTooltip(tooltip) {
  const icon = tooltip.siblings(".info-icon");
  const iconRect = icon[0].getBoundingClientRect();
  const tooltipElem = tooltip[0];

  // Get tooltip dimensions
  const tooltipWidth = tooltipElem.offsetWidth;
  const tooltipHeight = tooltipElem.offsetHeight;

  // Default position: below the icon, centered
  let top = iconRect.bottom + 5;
  let left = iconRect.left + iconRect.width / 2 - tooltipWidth / 2;

  // Adjust for right edge
  if (left + tooltipWidth > window.innerWidth) {
    left = window.innerWidth - tooltipWidth - 5;
  }

  // Adjust for left edge
  if (left < 0) {
    left = 5;
  }

  // Adjust for bottom edge
  if (top + tooltipHeight > window.innerHeight) {
    top = iconRect.top - tooltipHeight - 5;
  }

  // Apply corrected position
  tooltip.css({
    top: `${top}px`,
    left: `${left}px`,
  });
}

/*
 * INPUTS
 */

function addSliderItem(sliderInput, container = $("#inputs-content")) {
  const spec = sliderInput.spec;
  // console.log(spec);
  const inputElemId = `input-${spec.id}`;
  const inputValue = $(`<div class="input-value"/>`);

  // Create info icon if description exists
  // and Position it correctly, inside the viewport (!).
  let infoIcon = null;
  if (spec.hoverDescription) {
    const infoIconContainer = $('<div class="info-icon-container">');
    const icon = $('<div class="info-icon">i</div>');
    const tooltip = $(`<div class="tooltip">${spec.hoverDescription}</div>`);
    infoIconContainer.append(icon, tooltip);
    infoIcon = infoIconContainer;

    // Event listeners for positioning and visibility
    icon.on("mouseenter", function () {
      positionTooltip(tooltip);
      tooltip.css("visibility", "visible");
    });

    icon.on("mouseleave", function () {
      tooltip.css("visibility", "hidden");
    });
  }

  // Title + Info Icon container. This should be in the far left.
  const sliderTitleAndInfoContainer = $(
    '<div class="slider-title-and-info-container"/>'
  ).append(
    [
      $(`<div class="input-title">${str(spec.labelKey)}</div>`),
      infoIcon,
    ].filter((el) => el !== null)
  );

  // Value + Units container. This should be in the far right.
  const valueUnitsContainer = $('<div class="value-units-container"/>').append(
    [
      inputValue,
      $(`<div class="input-units">${str(spec.unitsKey)}</div>`),
    ].filter((el) => el !== null)
  );

  // Title row with left and right sections
  const titleRow = $(`<div class="input-title-row"/>`).append([
    sliderTitleAndInfoContainer,
    valueUnitsContainer,
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

  container.append(div);

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
  });
  return div; // fm
}

function addSwitchItem(switchInput) {
  const spec = switchInput.spec;
  // console.log(spec);
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
      // activeModel.updateOutputs(); // remove? "activeModel.updateOutputs is not a function"
    });
  }

  if (!spec.slidersActiveWhenOff && spec.slidersActiveWhenOn) {
    addCheckbox(
      "The following slider will have an effect only when this is checked."
    );
    for (const sliderId of spec.slidersActiveWhenOn) {
      const slider = activeModel.getInputForId(sliderId);
      addSliderItem(slider);
    }
  } else {
    for (const sliderId of spec.slidersActiveWhenOff) {
      const slider = activeModel.getInputForId(sliderId);
      addSliderItem(slider);
    }
    addCheckbox(
      "When this is unchecked, only the slider above has an effect, and the ones below are inactive (and vice versa)."
    );
    for (const sliderId of spec.slidersActiveWhenOn) {
      const slider = activeModel.getInputForId(sliderId);
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
  // The logic to handle the change in scenario
  activeModel = selectedScenario === "Scenario 2" ? modelB : model;

  // Green highlight for Scenario 1,
  // Red highlight for Scenario 2
  document.body.classList.toggle(
    "scenario-2",
    selectedScenario === "Scenario 2"
  );

  const selectedCategory = $(".input-category-selector-option.selected").data(
    "value"
  );
  initInputsUI(selectedCategory);
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

//
function initInputsUI(category) {
  $("#inputs-content").empty();

  // Group inputs by categoryId and input group
  const dynamicInputCategories = {};
  for (const inputSpec of coreConfig.inputs.values()) {
    const inputCategory = inputSpec.categoryId;
    const inputGroup = inputSpec.inputGroup;
    if (!inputCategory || !inputGroup) continue;

    if (!dynamicInputCategories[inputCategory]) {
      dynamicInputCategories[inputCategory] = {};
    }
    if (!dynamicInputCategories[inputCategory][inputGroup]) {
      dynamicInputCategories[inputCategory][inputGroup] = [];
    }
    dynamicInputCategories[inputCategory][inputGroup].push(inputSpec);
  }

  const categoryGroups = dynamicInputCategories[category] || {};

  if (coreConfig.inputs.size > 0) {
    Object.entries(categoryGroups).forEach(([groupName, groupInputs]) => {
      const standaloneInputs = [];
      let mainInput = null;
      const assumptionInputs = [];

      groupInputs.forEach((inputSpec) => {
        if (inputSpec.dropdown === "without") {
          standaloneInputs.push(inputSpec);
        } else if (inputSpec.dropdown === "main") {
          mainInput = inputSpec;
        } else if (inputSpec.dropdown === "Assumptions") {
          assumptionInputs.push(inputSpec);
        }
      });

      // Add standalone inputs first
      standaloneInputs.forEach((inputSpec) => {
        const input = activeModel.getInputForId(inputSpec.id);
        if (input.kind === "slider") addSliderItem(input);
        else if (input.kind === "switch") addSwitchItem(input);
      });

      // Process main input with dropdown
      if (mainInput) {
        const dropdownContainer = $('<div class="input-dropdown-group">');
        const dropdownHeader = $('<div class="dropdown-header">');
        const dropdownContent = $(
          '<div class="dropdown-content" style="display: none;">'
        );
        const expandButton = $('<button class="expand-button">▶</button>');

        // FIRST APPEND THE CONTAINER TO DOM
        $("#inputs-content").append(dropdownContainer);
        dropdownContainer.append(dropdownHeader, dropdownContent);

        // Add main input AFTER container is in DOM
        const mainInputInstance = activeModel.getInputForId(mainInput.id);
        const sliderDiv = addSliderItem(mainInputInstance, dropdownHeader);

        // Add expand button
        sliderDiv.find(".input-title-row").prepend(expandButton);

        // Add assumptions AFTER container is in DOM
        assumptionInputs.forEach((inputSpec) => {
          const input = activeModel.getInputForId(inputSpec.id);
          if (input.kind === "slider") addSliderItem(input, dropdownContent);
          else if (input.kind === "switch")
            addSwitchItem(input, dropdownContent);
        });

        // Toggle handler
        let isExpanded = false;
        expandButton.on("click", () => {
          isExpanded = !isExpanded;
          dropdownContent.slideToggle();
          expandButton.text(isExpanded ? "▼" : "▶");
        });
      }
    });
  } else {
    const msg = `No sliders configured. Edit 'config/inputs.csv' to get started.`;
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

function createGraphViewModel(graphSpec, model) {
  return {
    spec: graphSpec,
    model: model,
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
  const modelToUse = graphSpec.levels === "Scenario2" ? modelB : model; // fm - added this line
  const viewModel = createGraphViewModel(graphSpec, modelToUse); // fm - added "modelToUse"

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
    modelB = await createModel();
    activeModel = model;
  } catch (e) {
    console.error(`ERROR: Failed to load model: ${e.message}`);
    return;
  }

  // Generate GRAPH category selector buttons
  const graphCategoryContainer = $("#graph-category-selector-container");
  const graphCategories = new Set( // Get unique categories
    Array.from(coreConfig.graphs.values()).map((spec) => spec.graphCategory)
  );

  graphCategories.forEach((graphCategory) => {
    graphCategoryContainer.append(
      `<button class="graph-category-selector-option" data-value="${graphCategory}">
        ${graphCategory}
      </button>`
    );
  });

  // Generate INPUT category selector buttons
  const inputCategoryContainer = $("#input-category-selector-container");
  const inputCategories = new Set(
    Array.from(coreConfig.inputs.values()).map((spec) => spec.categoryId)
  );

  inputCategories.forEach((inputCategory) => {
    inputCategoryContainer.append(
      `<button class="input-category-selector-option" data-value="${inputCategory}">${inputCategory}</button>`
    );
  });

  // Set default graph and input categories to first available
  const defaultGraphCategory = graphCategories.values().next().value || "Food";
  const defaultInputCategory =
    inputCategories.values().next().value || "Diet Change";

  initGraphsUI(defaultGraphCategory);
  initInputsUI(defaultInputCategory);

  initOverlay();

  // Also, mark the default buttons as "selected"
  $(
    "#input-category-selector-container .input-category-selector-option[data-value='Diet Change']"
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
  modelB.onOutputsChanged = () => {
    graphViews.forEach((graphView) => graphView.updateData());
  };
}

// Initialize the app when this script is loaded
initApp();
