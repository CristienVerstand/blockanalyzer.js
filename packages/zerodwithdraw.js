const request = require('request');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');


class ZerodWithdraw {

    constructor(constructorObj) {
        // API connection parameters
        this.mainserver_prot = constructorObj.api.protocol;
        this.mainserver_addr = constructorObj.api.address;
        this.mainserver_port = constructorObj.api.port;
        this.mainserver_authtoken = null;
        this.mainserver_username = constructorObj.api.username;
        this.mainserver_password = constructorObj.api.password;

        this.currency = constructorObj.crypto.name;
    }

    
    apiNewDeposit(txData) {
        return new Promise((resolve, reject) => {
            // eth or shortname of token (omg)
            request.post({
                url: this.mainserver_prot + "://" + this.mainserver_addr + ":" + this.mainserver_port + "/api/newdeposit",
                headers: { "Content-Type": "application/json", "Authorization": this.mainserver_authtoken },
                body: txData,
                json: true
    
            }, function (error, response, body) {
                console.log(response.statusCode);
                if (response.statusCode == 406) {
                    console.log("TxID duplicated: " + txData.txid, "warning");
                    reject(406);
                    return;
                }
                if (response.statusCode == 404) {
                    reject("[ApiNewDeposit] error 404 " + txData.txid);
                    console.log(body);
                    return;
                }
                if (response.statusCode == 400) {
                    reject("[ApiNewDeposit] error 400 (Bad request) " + txData.txid, "error");
                    return;
                }
                if (response.statusCode == 401) {
                    reject("[ApiNewDeposit] error 401 UNAUTHORIZED access (invalid JWT token) " + txData.txid);
                    return;
                }
                if (!error && response.statusCode == 200) {
                    console.log("txid -> " + txData.txid + " confirmed.")
                    resolve("ok");
                } else {
                    if (!error) { reject("Response, Status Code: " + response.statusCode + " | " + txData.txid); }
                    else { reject(txData.txid + " - Response, Status Code: " + response.statusCode + " - Err: " + err); }
                }
            })
    
        })
    }


    apiGetInitiatedWithdrawals() {
        return new Promise((resolve, reject) => {
            request.get({
                url: this.mainserver_prot + "://" + this.mainserver_addr + ":" + this.mainserver_port + "/api/getInitiatedWithdrawals/" + this.currency,
                path: {
                    "currency": this.currency
                },
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": this.mainserver_authtoken
                }
            }, function (error, response, body) {
                if (error) {
                    reject({"msg": ["Error during apiGetInitiatedWithdrawals: " + error], "type": "error"});
                    return
                }
                if (response.statusCode != 200) {
                    reject({"msg": ["Error during apiGetInitiatedWithdrawals, Not 200 as response: " + response.statusCode, "\r\n" + body], "type": "verbose_error"});
                    return
                }
                resolve(body);
                return;
            });
        });
    }


    setWithdrawalStatus(txObj, response) {
        return new Promise((resolve, reject) => {

            request.post({
                url: this.mainserver_prot + "://" + this.mainserver_addr + ":" + this.mainserver_port + "/api/setWithdrawalsStatus",
                headers: { "Content-Type": "application/json", "Authorization": this.mainserver_authtoken },
                body:{
                    "withdrawals_state": [{
                        'txid': txObj.txid,
                        'dest_address': txObj.dest_address,
                        'op_id': txObj.op_id,
                        'response': response
                    }]
                },
                json: true

            }, (error, response, body) => {
                if (error) {
                    reject({"msg": ["Error during apiGetInitiatedWithdrawals: " + error], "type": "error"});
                    return
                }
                if (response.statusCode != 200) {
                    reject({"msg": ["Error during apiGetInitiatedWithdrawals, Not 200 as response: " + response.statusCode, "\r\n" + body], "type": "verbose_error"});
                    return
                }
                
                resolve("ok");
                
            });
        });
    }

}

module.exports = ZerodWithdraw;