/*
    POLICIY, GPL STUFF 
*/

/**
 * @file blockanalyzer.js
 * @author Cristian Chirivì aka Neb <chircristiandev@gmail.com>
 * @date 2020
 */


const BlockAnalyzer = require("../packages/blockanalyzer.js");
const fs = require('fs');
const Web3 = require("Web3");

let rawdata = fs.readFileSync('../config/config.json');
let config = JSON.parse(rawdata);

let constructorObj = {
  web3: {
    url: config.testing.provider,
    block: 7212365,
    timeout: 2000,
    password: ""
  },
  personal: {
    method: "list",
    accounts: config.testing.accounts
  }
};

let blockanalyzer = new BlockAnalyzer(constructorObj);

console.log('\n8""""8 8"""88 8  8"""8 8""""8 8"""88 8""""8 ');
console.log('8    " 8    8 8  8   8 8    8 8    8 8    " ');
console.log("8e     8    8 8e 8e  8 8e   8 8    8 8e     ");
console.log("88     8    8 88 88  8 88   8 8    8 88  ee ");
console.log("88   e 8    8 88 88  8 88   8 8    8 88   8 ");
console.log("88eee8 8eeee8 88 88  8 88eee8 8eeee8 88eee8 \n");
console.log("Description: Ethereum wallet monitoring with notification system");
console.log("@dev: Cristian Chirivì - ZeroDivisonSystems\n\n");

blockanalyzer
  .listen()
  .on("newdeposit", deposits => {
    if (deposits.length == 0) {
      return;
    }

    console.log("New deposit found!!!\n", deposits);
  })
  .on("error", console.log);
