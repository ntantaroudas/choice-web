# Choice Web

## Overview

Choice Web is a project that uses SDEverywhere to convert Felix Vensim models into WebAssembly, making them accessible and interactive in a web browser.

## Prerequisites

Before you begin, ensure you have the following installed:  
Node.js (which includes npm, the Node.js package manager)  
You can find it here:  
https://nodejs.org/en/download/prebuilt-installer  

For Windows Users, you also have to follow these instructions to fix python PATH:  
( [GitHub Issues](https://github.com/climateinteractive/SDEverywhere/issues/359#issuecomment-2029636476) )  

- Add python3 Folder to your USER 'PATH' environmental variables.  
- Reboot your computer.  


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

- Need to install the following packages:  
@sdeverywhere/create@0.2.18  
Ok to proceed? -> y  
- Where would you like to create your new project? -> current directory  
- Would you like your project to use WebAssembly? » - Use arrow-keys. Return to submit. -> Yes, generate a WebAssembly model
- Which template would you like to use? -> Default project  
- Would you like to configure a graph to get you started? -> n  
- Would you like to configure a few sliders to get you started? -> n  
- Would you like to install the Emscripten SDK? -> Install under project directory[^1]
- Would you like to install npm dependencies? -> Y  
- Would you like to initialize a new git repository? -> n  

[^1]: If you’re working with multiple models simultaneously, it’s wiser to select “Install under parent directory” here. The Emscripten SDK is approximately 1 GB, so there’s no need to have multiple copies. By installing it under the parent directory, SDEverywhere will locate it and share it across all future projects.

5) Copy the config and packages folders into the testing folder.

6) Navigate to the testing folder and start the development server:

```
npm run dev
```

## Usage

To modify the inputs and graphs, you can edit the inputs.csv and graphs.csv files located inside the config folder.
