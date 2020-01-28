/*
    POLICIY, GPL STUFF 
*/

/**
 * @file blockanalyzer.js
 * @author Cristian Chirivì aka Neb <chircristiandev@gmail.com>
 * @date 2020
 */

"use strict";

const Web3 = require("Web3");
const fs = require("fs");
const Web3PromiEvent = require("web3-core-promievent");
const Wallet = require("ethereumjs-wallet");

class BlockAnalyzer {
  constructor(constructorObj) {
    this.constructorObj = constructorObj;
    //TODO: Controls about constructorObj

    //TODO: web3 provider setting parameters

    // HttpProvider, WebsocketProvider, IpcProvider
    this.web3 = new Web3();
    this.web3.setProvider(this.constructorObj.web3.url);

    //this.connectionChecking();

    // PromiEvent objects declaration
    this.generalEvent = Web3PromiEvent();
    this.promiEvent = Web3PromiEvent();
    this.currentBlock = constructorObj.web3.block;

    this.interval = null;
    this.timeout = this.constructorObj.web3.timeout;
    this.addresses = null;
    this.counter = 0;
  }

  connectionChecking() {
    if (!this.web3.isConnected()) {
      // show some dialog to ask the user to start a node
      return false;
    } else {
      // start web3 filters, calls, etc
      return true;
    }
  }

  // Load file section

  accountLoader() {
    //TODO: Improve account loader method...
    return new Promise((resolve, reject) => {
      if (this.constructorObj.personal.method == "node") {
        //TODO: Check argument passed
        this.loadAccountsFromNode()
          .then(resolve)
          .catch(reject);
      }
      if (this.constructorObj.personal.method == "file") {
        //TODO: Check argument passed
        this.loadAccountsFromFile().then(() => {
          resolve();
        });
      }
      if (this.constructorObj.personal.method == "keystore") {
        //TODO: Check argument passed
        this.addresses = this.loadAccountsFromKeystore(
          this.constructorObj.personal.path
        );
        resolve();
      }
      if (this.constructorObj.personal.method == "list") {
        //TODO: Check argument passed
        this.addresses = this.constructorObj.personal.accounts;
        resolve("ok");
      }
    });
  }

  loadAccountsFromNode() {
    return new Promise((resolve, reject) => {
      this.web3.eth
        .getAccounts()
        .then(accounts => {
          this.addresses = accounts;
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  loadAccountsFromKeystore(path, password) {
    return new Promise((resolve, reject) => {
      let keystore = [];

      let folder = fs.readdirSync(path);

      for (let file in folder) {
        const myWallet = Wallet.fromV3(
          fs.readFileSync(path + folder[file]).toString(),
          password,
          true
        );
        keystore.push({
          address: myWallet.getAddress().toString("hex"),
          privkey: myWallet.getPrivateKey().toString("hex")
        });
        this.addresses.push(myWallet.getAddress().toString("hex"));
      }

      resolve();
    });
  }

  loadAccountsFromFile() {
    return fs.readFileSync(this.constructorObj.accounts.path);
  }

  checkTransaction(transactionslist) {
    let deposits = [];

    for (let txobj in transactionslist) {
      if (transactionslist[txobj]["to"] === null) {
        continue;
      }

      for (let addrex in this.addresses) {
        let walletaddress = this.addresses[addrex];

        if (
          walletaddress.toUpperCase() ==
          transactionslist[txobj]["to"].toUpperCase()
        ) {
          deposits.push(transactionslist[txobj]);
        }
      }
    }

    return deposits;
  }

  sleep(time) {
    var stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {}
    return "ok";
  }

  newBlockScan() {
    return new Promise((resolve, reject) => {
      this.sleep(this.timeout);

      this.web3.eth.getBlock(this.currentBlock).then(blockobj => {
        console.log(this.currentBlock);

        // Check if new block is generated and fully
        if (blockobj == null) {
          reject("Block is not generated or fully");
          return;
        }

        // Checking sync status
        if (blockobj.number == 0) {
          reject("Blockchain not synced");
          return;
        }

        this.currentBlock = blockobj.number;

        resolve(blockobj);
        return;
      });
    });
  }

  discoverDeposit(blockobj) {
    return new Promise((resolve, reject) => {
      let promises = [];

      for (let transaction in blockobj.transactions) {
        let transactionhash = blockobj.transactions[transaction];
        promises.push(this.web3.eth.getTransaction(transactionhash));
      }

      Promise.all(promises).then(alltxobj => {
        let deposits = this.checkTransaction(alltxobj);

        this.currentBlock += 1;

        console.log("Deposits --" + deposits);
        resolve(deposits);
      });
    });
  }

  listen() {
    this.newBlockScan()
      .then(blockobj => {
        this.accountLoader().then(() => {
          this.discoverDeposit(blockobj).then(depositsobj => {
            this.generalEvent.eventEmitter.emit("newdeposit", depositsobj);
            this.listen();
          });
        });
      })
      .catch(error => {
        if (error === "Block is not generated or fully") {
          this.listen();
        }
        if (error === "Blockchain not synced!") {
          throw new Error("Blockchain not synced!");
        }
      });

    return this.generalEvent.eventEmitter;
  }
}

module.exports = BlockAnalyzer;
