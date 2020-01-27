var express = require('express');
var zerodlogging = require("./zerodlogging.js");
var app = express();
var bodyParser = require('body-parser')
var moment = require('moment');
var exec = require('child_process').exec;

const CURRENCY = "alpc"
let constructLoggingObj = {
    currency: CURRENCY,
    folderPath: "./logs/",
    error: CURRENCY + "_errors.log",
    warning: CURRENCY + "_warning.log",
    txs: CURRENCY + "_txs.log",
    mattermost: {
        address: "88.198.164.255",
        port: "8065",
        hooks: "/hooks/khfsi6ijzbyidydubafibkrtja"
    }
}

let logging = new zerodlogging(constructLoggingObj);


app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));


let status = {
    alpc: []
}

app.post('/setstatus', function (req, res) {
    let CURRENCY = req.body.name;
    status[CURRENCY][0] = moment().toISOString();
    res.send("received");
})


function inspector(){
    limit = moment().toISOString();
    status[CURRENCY][1] = moment(status[CURRENCY][0]).add(1, 'm').toISOString();
    console.log("Client date -> " + limit);
    console.log("Comparison date -> " + status[CURRENCY][1]);
    if(limit > status[CURRENCY][1]){
        console.log("Fuck the deamon is dead!")
        logging.MM_Notify("### :bangbang: Withdraw scripts warning! " +
            CURRENCY + " ###\r\n - The script is no longer communicating with the sentry!");
        logging.errorHandling("Withdraw script is no longer communicating with the sentry!");

        exec("nohup node template_withdraw_ALPC.js &", (err, stdout, stderr) => {
            if (err) {
                payload = payload.replace(/\r?\n|\r/g, " ");
                console.log("Mattermost failed: " + payload);
            }
            console.log(stdout);
        });
        process.exit(0);
    }
    setInterval(inspector, 15 * 1000);
}

var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
    inspector();
})