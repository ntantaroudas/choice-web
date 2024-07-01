# Choice Web

## Overview

Choice Web is a project that uses SDEverywhere to convert Felix Vensim models into WebAssembly, making them accessible and interactive in a web browser.

## Prerequisites

Before you begin, ensure you have the following installed:  
Node.js (which includes npm, the Node.js package manager)  
You can find it here:  
https://nodejs.org/en/download/prebuilt-installer

## Installation

Follow these steps to set up and run the project:

1) Create a "testing" folder

```
mkdir testing
```

2) Copy your Vensim model file (.mdl) into the testing folder.

3) Run the following command to create a new SDEverywhere project:

```
npm create @sdeverywhere@latest
```

4) Follow the wizard prompts to set up the project.

Where would you like to create your new project? -> current directory  
Which template would you like to use? -> Default project  
Would you like to configure a graph to get you started? -> n  
Would you like to configure a few sliders to get you started? -> n  
Would you like to install the Emscripten SDK? -> Install under project directory  
Would you like to install npm dependencies? -> Y  
Would you like to initialize a new git repository? -> n  

5) Copy the config and packages folders into the testing folder.

6) Navigate to the testing folder and start the development server:

```
npm run dev
```

## Usage

To modify the inputs and graphs, you can edit the inputs.csv and graphs.csv files located inside the config folder.