var socket = io();
let marketInfo = [] //Holds all the information about the active markets
let portfolio = {
    content: []
}
let currentGraph = "none"

socket.on('market-update', (MD) => {
    //TODO: Needs to check the market type too
    let index = marketInfo.findIndex((e) => e.MarketAbbr == MD.MarketAbbr)

    //Check if the market is even in the users portfolio
    if (index != -1) {
        //Add new info
        marketInfo[index].data.push({ CurrencyAbbr: MD.CurrencyAbbr, Value: parseFloat(MD.Value), DataTime: MD.DataTime, })
        marketInfo[index].data.shift()
        UpdateTableRows(marketInfo[index])
        if (currentGraph == `${MD.MarketType}-${MD.MarketAbbr}`) {
            GraphMarket(marketInfo[index], document.getElementById("cv"), {
                DisplayAverage: true
            })
        }
    }
})
//Holds all of the portfolio content for the user

$(document).ready(() => {
    $.getJSON(`users/1`, (userData) => {
        //Get the info for each portfolio item
        userData.data.forEach(pItem => {
            //Try to find an existing market info in memory
            let existingMInfo = marketInfo.find(e => e.MarketAbbr === pItem.MarketAbbr)

            if (existingMInfo) {
                //If it's already in out info, we dont need to request again
                HandlePortfolioItem(pItem, existingMInfo, true)
            } else {
                //No market info was found, so it needs to be requested
                FetchMarket(pItem)
            }
        });
    })
})

function UpdateTableRows(marketData) {
    //Get the portfolio items that are associated with the table row
    let pItems = portfolio.content.filter((pItem) => pItem.MarketAbbr == marketData.MarketAbbr && pItem.MarketType == marketData.MarketType)

    pItems.forEach(pItem => {
        portfolio.content.splice(portfolio.content.indexOf(pItem), 1)
        HandlePortfolioItem(pItem, marketData)
    })
}

//(Re)creates the total row with the current values in the portfolio
function UpdateTotalRow() {
    $("#total-row").remove()

    let totalValue = 0, totalPrice = 0, totalChange, totalChangeP;

    portfolio.content.forEach(pc => {
        totalValue += pc.currentValue
        totalPrice += pc.BuyPrice
    })

    totalChange = totalValue - totalPrice
    totalChangeP = ((totalValue / totalPrice) - 1) * 100

    //Once all items have been handled, we can add a total row to the table
    $('#change-table > tbody:last-child').append(`
                <tr id="total-row" class="${totalValue > totalPrice ? "table-positive" : "table-negative"}">
                    <td><b>Total</b></td>
                    <td>-</td>
                    <td>${(totalValue).toFixed(2)}</td>
                    <td class="table-color-adjustable">${(totalChange).toFixed(2)}</td>
                    <td class="table-color-adjustable">${(totalChangeP).toFixed(2)}</td>
                </tr>
            `)
}

//Fetches the market data from the server for the given portfolio item
function FetchMarket(pItem) {
    //Gives the amount of datapoints that need to be retrieved
    const dpcount = new URLSearchParams(window.location.search).get('dpcount') ?? 1440

    $.getJSON(`markets/${pItem.MarketType}/${pItem.MarketAbbr}?dpcount=${dpcount}`, (marketData) => {
        HandlePortfolioItem(pItem, marketData, true)

        //Recheck to see if the marketinfo wasnt asynchronously added, if not, add it to the array
        if (!marketInfo.some(e => e.MarketAbbr === pItem.MarketAbbr)) {
            marketInfo.push(marketData)

            const displayedGraph = new URLSearchParams(window.location.search).get('dgraph') ?? 'none'

            //If no graph is currently being displayed, make this the one that's being displayed
            if (($("#graph-dropdown").children().length == 0 && displayedGraph == "none") || marketData.MarketAbbr == displayedGraph)
                GraphMarket(marketData, cv, {
                    DisplayAverage: true
                })

            //Add the market identifier to the graph selection if it isn't already there
            if (!$("#graph-dropdown").children().toArray().some(e => e.value === pItem.MarketAbbr)) {
                $("#graph-dropdown").append(`
                            <option value=${pItem.MarketAbbr}>${pItem.MarketAbbr}</option> 
                        `)
            }
        }
    })
}

//Handles a portfolioitem by updating the profits table
function HandlePortfolioItem(pItem, marketData, firstTime) {
    //Calculates the current value and adds it to the portfolio item
    pItem.currentValue = marketData.data[marketData.data.length - 1].Value * pItem.Amount

    let trString = `
                <tr id="table-${pItem.MarketType}-${pItem.MarketAbbr}" class="${pItem.currentValue > pItem.BuyPrice ? "table-positive" : "table-negative"} ${marketData.data[marketData.data.length - 2].Value < marketData.data[marketData.data.length - 1].Value ? "table-d-positive" : "table-d-negative"}">
                    <td>${pItem.MarketAbbr}</td>
                    <td>${pItem.Amount}</td>
                    <td>${(pItem.currentValue).toFixed(2)}</td>
                    <td class="table-color-adjustable">${(pItem.currentValue - pItem.BuyPrice).toFixed(2)}</td>
                    <td class="table-color-adjustable">${((pItem.currentValue / pItem.BuyPrice - 1) * 100).toFixed(2)}</td>
                </tr>`

    if (firstTime) {
        //Append the portfolio item to the table
        //To do that, add it to the correct category
        if ($(`#row-${pItem.MarketType}`).length == 0) {
            $('#change-table > tbody:last-child').append(`
                <tr id="row-${pItem.MarketType}" class="table-section-header">
                    <th colspan="5"><b>${pItem.MarketType}</b></th>
                </tr>
            `)
        }

        $(`#row-${pItem.MarketType}`).after(trString)
    } else {
        //If the row just needs an update, replace it
        $(`#table-${pItem.MarketType}-${pItem.MarketAbbr}`).replaceWith(trString)
    }

    portfolio.content.push(pItem)

    //Let the total row update to reflect the new totals
    UpdateTotalRow(pItem)
}

//Switches the currently displayed graph
function ChangeCurrentGraph(marketAbbr) {
    let cv = document.getElementById("cv")
    let marketData = marketInfo.find(e => e.MarketAbbr === marketAbbr)
    GraphMarket(marketData, cv, 
        {
            DisplayRollingAverage: true
        }    
    )
}

function GetGraphOptions() {
    let options = {}
    
    document.querySelectorAll('#graphoptions > input:checked').forEach(inp => {
        options[inp.name] = true
    })
    document.querySelectorAll('#graphoptions > input[type=number]').forEach(inp => {
        options[inp.name] = inp.value
    })

    return options;
}

function UpdateGraph() {
    let arr = currentGraph.split('-')
    let marketData = marketInfo.find((e) => e.MarketType == arr[0] && e.MarketAbbr == arr[1])
    GraphMarket(marketData, document.getElementById('cv'))
}

//Graphs a market based on the market data, a reference to the canvas on which is is to be drawn and the color
function GraphMarket(marketData, cv) {
    let graphOptions = GetGraphOptions()

    currentGraph = `${marketData.MarketType}-${marketData.MarketAbbr}`
    let ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = (marketData.data[0].Value < marketData.data[marketData.data.length - 1].Value) ? "#0f0" : "#f00"

    let min = Math.min(...marketData.data.map(o => o.Value))
    let max = Math.max(...marketData.data.map(o => o.Value))

    let pStart = ScalePoint(
        { x: 0, y: marketData.data[0].Value },
        { width: cv.width, height: cv.height },
        { len: marketData.data.length, min: min, max: max })

    ctx.beginPath()

    ctx.moveTo(pStart.x, pStart.y)
    for (let i = 1; i < marketData.data.length; i++) {
        let p = ScalePoint(
            { x: i, y: marketData.data[i].Value },
            { width: cv.width, height: cv.height },
            { len: marketData.data.length, min: min, max: max })

        //Add labels to low and high points
        if (marketData.data[i].Value == max) {
            ctx.fillText(`€${marketData.data[i].Value}`, p.x, p.y - cv.height * 0.01)
        }
        if (marketData.data[i].Value == min) {
            ctx.fillText(`€${marketData.data[i].Value}`, p.x, p.y + cv.height * 0.03)
        }

        ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()

    if (graphOptions.DisplayAverage) {
        let sum = 0
        marketData.data.forEach(e => sum += e.Value)
        let avg = sum / marketData.data.length

        let p1 = ScalePoint(
            { x: 0, y: avg },
            { width: cv.width, height: cv.height },
            { len: marketData.data.length, min: min, max: max })
        let p2 = ScalePoint(
            { x: marketData.data.length - 1, y: avg },
            { width: cv.width, height: cv.height },
            { len: marketData.data.length, min: min, max: max })

        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
    }

    if (graphOptions.DisplayRollingAverage) {
        let windowSize = graphOptions.RollingWindowSize ?? 10
        
        ctx.moveTo(pStart.x, pStart.y)

        for (let i = 0; i < marketData.data.length; i++) {
            let sum = 0, count = 0;

            for (let j = 0; j < windowSize && i - j >= 0; j++) {
                count++
                sum += marketData.data[i - j].Value;
            }

            let avg = sum / count

            let p = ScalePoint(
                { x: i, y: avg },
                { width: cv.width, height: cv.height },
                { len: marketData.data.length, min: min, max: max })
            ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
    }
}

//Scales a point for given canvas dimensions and data dimensions.
function ScalePoint(p, cDims, dDims) {
    let vPadding = 0.05 //Specifies the percentage of the canvas at the top and bottom which is not used for the graph lines 
    let hPadding = 0.05 //Specifies the percentage of the canvas on the sides which is not used for the graph lines

    let ret = { x: 0, y: 0 }
    ret.x = hPadding * cDims.width + p.x / (dDims.len - 1) * (cDims.width * (1 - 2 * hPadding))
    if (dDims.min == dDims.max) {
        ret.y = cDims.height * 0.5
    } else {
        ret.y = cDims.height * (1 - vPadding) - ((p.y - dDims.min) / (dDims.max - dDims.min) * cDims.height * (1 - 2 * vPadding))
    }
    return ret
}