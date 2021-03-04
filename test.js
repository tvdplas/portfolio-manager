let request = require('request')
let cheerio = require('cheerio')


request(`https://finance.yahoo.com/quote/ABN.AS?p=ABN.AS`, (reqErr, res, body) => {
    if (reqErr) throw reqErr
    const $ = cheerio.load(body.toString())
    console.log($(`#quote-header-info`, body)[0])
})