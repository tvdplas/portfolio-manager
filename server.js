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

app.get("/", (req, res) => {
    res.sendFile(path.resolve("./index.html"))
})

app.get("/markets/:marketID", (req, res) => {
    con.connect((err) => {
        if (err) throw err;


        //TODO: THIS INPUT NEEDS TO BE SANITIZED
        con.query(`SELECT * FROM marketvalue WHERE MarketAbbr = '${req.params.marketID}';`, (qerr, qres) => {
            res.send(JSON.stringify(qres))
        })
    })
})

app.listen(7000, () => {console.log("Webserver started on port 7000")})


const valueUpdating = require('./value-update-job')