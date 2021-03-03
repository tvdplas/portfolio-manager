let express = require("express")
let app = express()
let path = require("path")

let mysql = require("mysql")
let con = mysql.createConnection({
    host: "192.168.2.35",
    user: "crypto",
    password: "CryptoStonks",
    database: "portfoliotracker"
});
con.connect((err) => { if (err) throw err })

app.get("/", (req, res) => {
    res.sendFile(path.resolve("./index.html"))
})

app.get("/markets/:marketType/:marketAbbr", (req, res) => {
    //Selects the amount of datapoints to display
    let dpcount = (req.query.dpcount) ? req.query.dpcount : 1440

    //TODO: THIS INPUT NEEDS TO BE SANITIZED
    con.query(`
        SELECT * 
        FROM (
            SELECT DataTime, CurrencyAbbr, Value
            FROM marketvalue 
            WHERE MarketAbbr = '${req.params.marketAbbr}' AND MarketType = '${req.params.marketType}'
            ORDER BY UNIX_TIMESTAMP(DataTime) DESC LIMIT ${dpcount}
        ) AS T
        ORDER BY UNIX_TIMESTAMP(T.DataTime) ASC`,
        (qerr, qres) => {
            let ret = {
                MarketAbbr: req.params.marketAbbr,
                MarketType: req.params.marketType,
                data: qres
            }
            res.send(JSON.stringify(ret))
        })
})

//TODO: add some form of security to this lmao
app.get("/users/:userID", (req, res) => {
    //TODO: sanitize input fields
    con.query(`
        SELECT MarketType, MarketAbbr, IsHeld, Amount, BuyPrice
        FROM portfoliocontent
        WHERE ${req.params.userID} = portfoliocontent.UserID`,
        (qerr, qres) => {
            res.send(JSON.stringify({ UserID: req.params.userID, data: qres }))
        }
    )
})

app.listen(7000, () => { console.log("Webserver started on port 7000") })


const valueUpdating = require('./value-update-job')((market) => {
    console.log(market.MarketAbbr)
})