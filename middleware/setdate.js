const Data = require("../models/Data")

const setDate = async function (req, res, next) {
    let isoDate = new Date().toISOString()
    let theDate;
    let date_exists = false;
    let date_form = false;
    var theRealDate;

    if (typeof req.body.date !== 'undefined') {
        theDate = req.body.date;
        date_form = true;
    } else {
        [theDate] = isoDate.split('T');
    }
    // console.log("*************")
    // console.log("we have data from the form? ", date_form)
    // console.log("the date input being used is ", theDate)
    try {
        const datas = await Data.find({})
        for (let data of datas) {
            let date = data.createdAt.toISOString()
            const [onlyDateDB] = date.split("T")
            // console.log(onlyDateDB)
            if (theDate === onlyDateDB) {
                date_exists = true;
                theRealDate = theDate;
                break;i
            }
        }
        // console.log("does the date exist in the db? ", date_exists)
        // console.log("and the date we end up using is ", theRealDate)
        if (date_exists === false) {
            // console.log('We do not have information from that date stored in the database!')
            res.locals.date = "undefined"
        } else {
            res.locals.date = theRealDate
        }
    } catch (err) {
        // console.log("Could not retrieve the data")
        res.locals.date = "undefined"
    }
    next()
}

module.exports = setDate;