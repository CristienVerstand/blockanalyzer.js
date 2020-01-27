const Web3 = require('web3');
const fs = require('fs');

const web3 = new Web3(new Web3.providers.HttpProvider("mainnet.infura.io/v3/22ce6fb0a1454ab3a9600cc0943da06c"));

let accounts = [];
let onlyaccounts = [];

for(let x = 0; x < 4000; x++){
    let account = web3.eth.accounts.create();
    onlyaccounts.push(account.address);
    accounts.push(account);
}

console.log(accounts);
fs.writeFileSync("accounts.json", JSON.stringify(accounts));
fs.writeFileSync("onlyaccounts.json", JSON.stringify(onlyaccounts));