# Indexical JS SDK

The Indexical SDK for Javascript/Typescript makes it easier to use the Indexical API **for JS/TS projects that are interacting with an existing codebase**. It primarily contains helper functions that can extract the appropriate sources from code/configuration files, for use in Indexical API calls.

Currently, the SDK supports analyzing projects written in JS/TS or in Python. Specifically, the SDK can extract sources in the following ways:

In JS/TS projects:

- Analyzing a JS/TS source file (`extractSourcesFromJS`)
- Analyzing a package.json file (`extractSourcesFromPackageJSON`)
- Analyzing a package-lock.json file (`extractSourcesFromPackageLockJSON`)

In Python projects:

- Analyzing a Python JS/TS source file (`extractSourcesFromPy`)
- Analyzing a requirements.txt file (`extractSourcesFromRequirementsTxt`)

## Installation

```bash
npm install indexical-sdk
```

## Usage

All `extractSourcesFrom...` functions expect a single argument (the input file's contents, as a string), and return an object that can be combined with the body of your API request (containing either the `npm` or the `pypi` key, depending on the type of project being analyzed). The Indexical SDK is meant to work with whatever library you're currently using for accessing file contents and making API calls. The example here uses `fetch` and node's `fs/promises`, but could easily be adapted for any other choice:

```js
import indexical from "indexical-sdk";
import * as fs from "fs/promises";

const packageFileContents = await fs.readFile("/path/to/package.json", "utf-8");
const prompt = "your prompt here";

const response = fetch("https://api.indexical.dev/context", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.INDEXICAL_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ...indexical.extractSourcesFromPackageJSON(packageFileContents),
    prompt,
  }),
});

const result = await response.json();
print(result.context); // The context returned from Indexical (see https://indexical.dev/docs for API docs)
```

The same example applies for using any of the SDK's included extractors (listed above, in the first section of the README).
