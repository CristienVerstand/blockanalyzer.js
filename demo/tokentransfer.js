const Tx = require('ethereumjs-tx').Transaction;
const fs = require('fs');
const ZerodWithdraw = require("../packages/zerodwithdraw.js");
var rawdata = fs.readFileSync('../config/config.json');
const config = JSON.parse(rawdata);

const Web3 = require('web3');

const mode = process.argv[2];
const web3 = new Web3(new Web3.providers.HttpProvider(config[mode].provider));
const CURRENCY = "ALPC";


let constructWithdrawObj = {
    api: {
        protocol: "https",
        address: "go4cryptos.com",
        port: "443",
        username: "etherserver",
        password: "thaeshoa6aepohGeiga1Iu9eeshia0la"
    },
    database: {
        db_url: "mongodb://localhost:27017",
        db_name: "scanner_ALPC",
        db_collection: "withdrawals_ALPC",
        db_pending: "pending_ALPC"
    },
    crypto: {
        coinbase: "coinbase",
        name: CURRENCY
    }
}


let withdrawing = new ZerodWithdraw(constructWithdrawObj);

const contractAddr = config[mode].contract_address;
const contractAbi = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "from", "type": "address" }, { "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }, { "name": "", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }];


function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


function sleep(time, callback) {
    var stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {
        ;
    }
    callback();
}


function doWithdraw(withdrawals) {
    return new Promise((resolve, reject) => {

        for (let withdraw in withdrawals) {

            if (withdrawals[withdraw]["token"] == "ALPC") {
                sendToken(withdrawals[withdraw]["dest_address"], withdrawals[withdraw]["amount"])
                    .then((txid) => {
                        console.log("   -> TXID: " + txid);
                        withdrawals[withdraw]["txid"] = txid;
                    });
            }

        }

        resolve(withdrawals);

    });
}


function executeNewWithdrawals() {
    return new Promise((resolve, reject) => {
        withdrawing.apiGetInitiatedWithdrawals()
            .then((withdrawals) => {

                //Get all initialited withdrawals from api
                withdrawals = JSON.parse(withdrawals);
                // Check if the array is not empty
                if (isEmpty(withdrawals["initiated_withdrawals"])) {
                    resolve("[*] - - No new withdraw [*]")
                }

                // Once done, execute these withdrawals
                doWithdraw(withdrawals["initiated_withdrawals"])
                    .then((withdrawals) => {

                        resolve(withdrawals);
                        //TODO: Gli spari all'API

                    })
                    .catch((err) => {
                        console.log(err);
                        reject(err);
                    });
            })
            .catch((err) => {
                reject(err);
            });

    })
}


function sendToken(receiver, amount) {
    console.log(`Start to send ${amount} tokens to ${receiver}`);
    const contract = web3.eth.contract(contractAbi).at(contractAddr);
    const data = contract.transfer.getData(receiver, amount * 1e18);
    const gasPrice = web3.eth.gasPrice;
    const gasLimit = 90000;
    const rawTransaction = {
        'from': config[mode].coinbaseG4C.addr,
        'nonce': web3.toHex(web3.eth.getTransactionCount(config[mode].coinbaseG4C.addr)),
        'gasPrice': web3.toHex(gasPrice),
        'gasLimit': web3.toHex(gasLimit),
        'to': contractAddr,
        'value': 0,
        'data': data
    };

    const privKey = new Buffer(config[mode].coinbaseG4C.key, 'hex');
    const tx = new Tx(rawTransaction, { 'chain': config[mode].network });
    tx.sign(privKey);
    const serializedTx = tx.serialize();
    web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function (err, hash) {
        if (err) {
            console.log(err);
        }

        console.log(hash);

    });
}


function main() {
    executeNewWithdrawals().then((withdrawals) => {
        console.log(withdrawals);
        sleep(10000, main);
    })
}

main();