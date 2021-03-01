const schedule = require("node-schedule")
const request = require("request")
let mysql = require("mysql")

var con = mysql.createConnection({
    host: "192.168.2.35",
    user: "crypto",
    password: "CryptoStonks",
    database: "portfoliotracker"
});

con.connect((err) => { if (err) throw err })

// Update all market values in the database every minute.
const job = schedule.scheduleJob("*/1 * * * *", UpdateMarketValues)

function UpdateMarketValues() {
    con.query("SELECT * FROM markets;", (qerr, res) => {
        if (qerr) throw qerr

        res.forEach(market => {
            UpdateMarket(market)
        });
    })
}

function UpdateMarket(market) {
    let MD = {}

    //First, get the new value for the market
    if (market.MarketType = "crypto") {
        request(`https://api.litebit.eu/market/${market.MarketAbbr}`, (reqErr, res, body) => {
            if (reqErr) throw reqErr

            let rawMD = JSON.parse(body)
            console.log(rawMD)

            MD = {
                DateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                MarketType: market.MarketType,
                MarketAbbr: market.MarketAbbr,
                CurrencyAbbr: "EUR",
                Value: rawMD.sell
            }

            con.query(`
                INSERT INTO marketvalue
                VAlUES ('${MD.DateTime}', '${MD.MarketType}', '${MD.MarketAbbr}', '${MD.CurrencyAbbr}', '${MD.Value.toFixed(6)}')`,
                (err, res) => {
                    if (err) throw err;
            })
        })
    }
    else {
        throw new Error("No valid market type found")
    }

    
}