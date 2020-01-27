# blockanalyzer.js

[![Build Status](https://img.shields.io/badge/Build%20Status-Alpha-informational)](https://travis-ci.org/joemccann/dillinger)

![blockanalyzer.js logo](https://i.imgur.com/7P7ZdsP.png)

This is an npm module for ethereum developed to facilitate the development of applications where the main need or important part is to do monitoring and control of transaction blocks.
Its purpose is also to peck transactions involving addresses in the wallet.

### Usage
---

``` javascript
const BlockAnalyzer = require("../packages/blockanalyzer.js");

let blockanalyzer = new BlockAnalyzer(constructorObj);

let constructorObj = {
  web3: {
    url: "YOUR ENDPOINT",
    block: 7207840,
    timeout: 2000,
    password: ""
  },
  accounts: {
    method: "list",
    accounts: [""]
  }
};

blockanalyzer
  .listen()
  .on("newdeposit", deposits => {
    if (deposits.length == 0) {
      return;
    }

    console.log("New deposit found!!!");
  })
  .on("error", console.log);
```

### License
---
GPL v 3
