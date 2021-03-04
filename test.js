let request = require('request')
let cheerio = require('cheerio')


request(`https://finance.yahoo.com/quote/^IXIC?p=^IXIC`, (reqErr, res, body) => {
    if (reqErr) throw reqErr
    const $ = cheerio.load(body.toString())
    console.log($(`.Fw\\(b\\).Fz\\(36px\\).Mb\\(-4px\\).D\\(ib\\)`, body)['0'].children[0].data)
})