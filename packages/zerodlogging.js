var exec = require('child_process').exec;
var fs = require("fs");

class ZerodLogging {

    constructor(constructorObj) {

        this.symbol = constructorObj.symbol;

        this.folderPath = constructorObj.folderPath;
        this.error = constructorObj.error;
        this.warning = constructorObj.warning;
        this.verbose_error = constructorObj.verbose_error;
        this.txs = constructorObj.txs;
        this.notify = constructorObj.notify;

        this.mattermost_address = constructorObj.mattermost.address;
        this.mattermost_port = constructorObj.mattermost.port;
        this.mattermost_hooks = constructorObj.mattermost.hooks;

        this.makeLoggingStructure();
    }


    makeLoggingStructure() {

        let errorlog = "An error was found during the making of logging structure, check permissions!\nErr -> "

        if (!fs.existsSync(this.folderPath)) {
            try { fs.mkdirSync(this.folderPath) } catch (error) {
                this.errorHandling(errorlog + error);
            }
        }

        if (!fs.existsSync(this.folderPath + this.verbose_error)) {
            try { fs.openSync(this.folderPath + this.verbose_error, "w") } catch (error) {
                this.errorHandling(errorlog + error);
            }
        }

        if (!fs.existsSync(this.folderPath + this.error)) {
            try { fs.openSync(this.folderPath + this.error, "w") } catch (error) {
                this.errorHandling(errorlog + error);
            }
        }

        if (!fs.existsSync(this.folderPath + this.warning)) {
            try { fs.openSync(this.folderPath + this.warning, "w") } catch (error) {
                this.errorHandling(errorlog + error);
            }
        }

        if (!fs.existsSync(this.folderPath + this.txs)) {
            try { fs.openSync(this.folderPath + this.txs, "w") } catch (error) {
                this.errorHandling(errorlog + error);
            }
        }

    }


    writeOnFile(object) {
        if (typeof object["msg"][0] == undefined) { return 'Error undefined payload' }
        var datetime = new Date();
        var log = "[" + datetime + "]" + " - " + object["msg"][0] + "\r\n";
        if (object["type"] === "verbose_error") {
            log = "┌──[" + datetime + "]" + "\r\n└──> " + object["msg"][0] + object["msg"][1] + "\r\n\r\n"
            fs.appendFileSync(this.folderPath + this.verbose_error, log);
            return;
        }
        if (object["type"] === "error") { fs.appendFileSync(this.folderPath + this.error, log); return }
    }

    writeTxLog(txLogString){
        console.log("    - Writing tx on log file: " + this.txs);
        console.log(txLogString);
        fs.appendFileSync(this.folderPath + this.txs, txLogString);
    }


    secondsFromEpoch() {
        var d = new Date()
        var ms = d.getTime()
        var s = Math.floor(ms / 1000);
        return s;
    }


    loggingHandling(object) {
        if (typeof object["type"] === undefined) { object["type"] = "error"; object["msg"][0] += " Type was undefined!" }
        console.log("[✘] " + object["type"] + " -> ", object["msg"][0]);
        this.writeOnFile(object);
        if (object["msg"][0].includes("Mattermost failed: ")) { return }
        let payloadError = this.craftPayloadError(object["msg"][0]);
        this.MM_Notify(payloadError);
        return;
    }

    craftPayloadTX(depositObj) {

        let payload = "[" + depositObj.timestamp + "] - " + depositObj.symbol + " - " + depositObj.txid + " - " +
            depositObj.amount + " => " + depositObj.address_dest + "\n\r";

        return payload;

    }

    craftPayloadNotify(token, sender, receiver, amount, timestamp, txid) {
        let payload = "### Nuova Transazione "
            + token + "###\nSender: "
            + sender + "\nReceiver:"
            + receiver + " \nAmount:" +
            amount + "\nTimestamp: " + timestamp
            + "\nTxID: " + txid;
        return payload;
    }


    craftPayloadError(payload) {
        payload = "### :x: Error " + this.symbol + " :x: ###\n**Error**: " + payload;
        return payload;
    }


    MM_Notify(payload) {
        if(!this.notify || this.notify != "true" || this.notify == false) { return }
        return new Promise((resolve, reject) => {
            var msg = {
                text: payload
            };
            var cmd = 'curl -i -X POST -d payload=\'' + JSON.stringify(msg) + '\' http://' +
                this.mattermost_address + ':' + this.mattermost_port + this.mattermost_hooks;

            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    payload = payload.replace(/\r?\n|\r/g, " ");
                    reject("Mattermost failed: " + payload);
                }
                resolve(stdout);
            });
        });
    }

}

module.exports = ZerodLogging;