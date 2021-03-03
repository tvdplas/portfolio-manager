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


function Schedule(cb) {
    // Update all market values in the database every minute.
    const job = schedule.scheduleJob("*/1 * * * *", UpdateMarketValues(cb))
}

function UpdateMarketValues(cb) {
    let date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    console.log(`${date} - fetching market data`)

    con.query("SELECT * FROM markets;", (qerr, res) => {
        if (qerr) throw qerr

        res.forEach(market => {
            UpdateMarket(market, date, cb)
        });
    })
}

function UpdateMarket(market, date, cb) {
    //First, get the new value for the market
    if (market.MarketType == "crypto") {
        request(`https://api.litebit.eu/market/${market.MarketAbbr}`, (reqErr, res, body) => {
            if (reqErr) throw reqErr

            let rawMD = JSON.parse(body)

            let MD = {
                DateTime: date,
                MarketType: market.MarketType,
                MarketAbbr: market.MarketAbbr,
                CurrencyAbbr: "EUR",
                Value: rawMD.result.sell
            }

            con.query(`
                INSERT INTO marketvalue
                VAlUES ('${MD.DateTime}', '${MD.MarketType}', '${MD.MarketAbbr}', '${MD.CurrencyAbbr}', '${MD.Value}')`,
                (err, res) => {
                    if (err) throw err;
                
                cb(market)
            })
        })
    }
    else if (market.MarketType == "fund") {
        if(date.slice(14,16) == "00") {
            request(`https://www.fundsquare.net/Fundsquare/application/vni/${market.MarketAbbr}`, (reqErr, res, body) => {
                if (reqErr) throw reqErr
    
                let rawMD = JSON.parse(body)
    
                let MD = {
                    DateTime: date,
                    MarketType: market.MarketType,
                    MarketAbbr: market.MarketAbbr,
                    CurrencyAbbr: "EUR",
                    Value: rawMD.EUR[0].pxSous
                }
                
                console.log(rawMD.EUR[0])
                console.log(MD.Value)
    
                con.query(`
                    INSERT INTO marketvalue
                    VAlUES ('${MD.DateTime}', '${MD.MarketType}', '${MD.MarketAbbr}', '${MD.CurrencyAbbr}', '${MD.Value}')`,
                    (err, res) => {
                        if (err) throw err;

                    cb(market)
                })
            })
        }
    }
    else {
        throw new Error("No valid market type found")
    }
}

module.exports = Schedule;