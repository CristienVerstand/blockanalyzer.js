const ZerodLogging = require("../../libs/zerodlogging.js");
const ZerodWithdraw = require("../../libs/zerodwithdraw.js");
const Client = require('bitcoin-core');
const ArgumentParser = require('argparse').ArgumentParser;

const confile = require("/home/zerod/go4cryptos/scripts/conf.js");

const SYMBOL = "ALPC";
const CURRENCY = "alpcoincash";


const parser = new ArgumentParser({
    version: 'Version: 0.8.10b - Developed by ZeroDivisionSystem, c.chirivi@zerodivision.it',
    addHelp: true,
    description: 'ZDS ' + SYMBOL + ' withdraw script, type -h for show help'
});
parser.addArgument(
    ['-m', '--mode'],
    {
        help: '-m=MODE, ex: -m "testing", -m "production". Testing means: testing api, testing daemon.'
    }
);
parser.addArgument(
    ['-n', '--notify'],
    {
        help: 'Enable or disable notify, ex: -n true, -n false'
    }
);

var args = parser.parseArgs();

if (args.mode != "production") { args.mode = "testing" }

console.log(args);
const alpcClient = new Client({
    host: confile.coinserver[args.mode][CURRENCY].host,
    port: confile.coinserver[args.mode][CURRENCY].port,
    username: confile.coinserver[args.mode][CURRENCY].username,
    password: confile.coinserver[args.mode][CURRENCY].password,
    timeout: confile.coinserver[args.mode][CURRENCY].timeout,
    ssl: confile.coinserver[args.mode][CURRENCY].ssl
});

const constructLoggingObj = {
    SYMBOL: SYMBOL,
    folderPath: "./logs/",
    error: SYMBOL + "_errors.log",
    verbose_error: SYMBOL + "_verbose_errors.log",
    warning: SYMBOL + "_warnings.log",
    txs: SYMBOL + "_txs.log",
    notify: args.notify,
    mattermost: {
        address: confile.mattermost.address,
        port: confile.mattermost.port,
        hooks: confile.mattermost.hooks
    }
}

const constructWithdrawObj = {
    api: {
        protocol: confile.api[args.mode].protocol,
        address: confile.api[args.mode].address,
        port: confile.api[args.mode].port,
        username: confile.api[args.mode].username,
        password: confile.api[args.mode].password
    },
    database: {
        db_url: confile.db.url,
        db_name: "scanner_" + SYMBOL,
        db_collection: "withdrawals_" + SYMBOL,
        db_pending: "pending_" + SYMBOL
    },
    crypto: {
        coinbase: "coinbase",
        name: SYMBOL
    }
}


let logging = new ZerodLogging(constructLoggingObj);


// Core Functions ----------------------------------------------

function getBlockFromNumber(blockNumber){
    return new Promise ((resolve, reject) => {

        let batch = [
            { method: 'getblockhash', parameters: [blockNumber] }
        ]

        alpcClient.command(batch).then((hash) => {

            batch = [
                { method: 'getblock', parameters: hash }
            ]

            alpcClient.command(batch).then((blockObj) => {

                resolve(blockObj);

            }).catch((err) => { reject(err)});


        }).catch((err) => { reject(err)});

    });
}


// Main --------------------------------------------------------

blockchain.mongoDBConnection()
.then((res) => {

    if (res) { console.log("[*] MongoDB Connected! [*]")};

    blockchain.getBlockObj(3000, getBlockFromNumber)
    .then((blockObj) => {

        console.log(blockObj);

        blockchain.analyzeTransactions(blockObj[0].tx)
        .then((res) => {

            console.log(res);
    
        })
        .catch((err) => {
            logging.errorHandling(logging.craftPayloadError(err));
            logging.MM_Notify(logging.craftPayloadError(err));
        });

    })
    .catch((err) => {
        logging.errorHandling(logging.craftPayloadError(err));
        logging.MM_Notify(logging.craftPayloadError(err));
    });

});