const BlockAnalyzer = require("../packages/blockanalyzer.js");
const Web3 = require("Web3");

// https://mainnet.infura.io/v3/22ce6fb0a1454ab3a9600cc0943da06c
// https://ropsten.infura.io/v3/22ce6fb0a1454ab3a9600cc0943da06c

let constructorObj = {
  web3: {
    url: "https://ropsten.infura.io/v3/22ce6fb0a1454ab3a9600cc0943da06c",
    block: 7207840,
    timeout: 2000,
    password: ""
  },
  accounts: {
    method: "list",
    accounts: ["0x4F6879798838460f4F8184608ec69bEd6f213de2"]
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

    console.log("New deposit found!!!");
  })
  .on("error", console.log);
