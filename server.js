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

    //TODO: THIS INPUT NEEDS TO BE SANITIZED
    con.query(`
            SELECT DataTime, CurrencyAbbr, Value
            FROM marketvalue 
            WHERE MarketAbbr = '${req.params.marketAbbr}' AND MarketType = '${req.params.marketType}';`,
        (qerr, qres) => {
            let ret = {
                MarketAbbr: req.params.marketAbbr,
                MarketType: req.params.marketType,
                data: JSON.parse(qres)
            }
            res.send(JSON.stringify(ret))

            con.end()
        })
})

app.listen(7000, () => { console.log("Webserver started on port 7000") })


const valueUpdating = require('./value-update-job')