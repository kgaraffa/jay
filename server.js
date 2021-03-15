const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const request = require('request');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/home.html'));
})

app.get('/jay', (req, res) => {
    getAbasinInfo((info) => {
        console.log(info);
        res.json(info);
    });
})

app.get('/status/jay', (req, res) => {
    getAbasinInfo(({ openTrails, closedTrails }) => {
        let map = new Map();
        const orderedList = [];

        mapOfTrails(openTrails, 1, map);
        mapOfTrails(closedTrails, 0, map);
        mapOfTrails(groomedTrails, 2, map);
        mapOfTrails(holdLift, 3, map);
        mapOfTrails(closedLift, 4, map);
        mapOfTrails(openLift, 5, map);

        console.log(map);

        let binaryArray = [];
        // a character at the beginning of the data to signify that the rest of the data is the ordered binary string
        binaryArray.push(String.fromCharCode(2));
        for (let i = 0; i < orderedList.length; i++) {
            let bit = map.get(orderedList[i]);
            if (bit === undefined) {
                console.log(`${orderedList[i]} cannot be found in scraped data and returned a value of ${bit}`);
            }
            binaryArray.push(bit);
        }
        return res.send(binaryArray.join(""));
    })
})
var openTrails, closedTrails;
function getAbasinInfo(cb) {
    request('https://digital.jaypeakresort.com/conditions/snow-report/snow-report/', function (error, response, html) {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            if ($('.pti-open')) {
             openTrails = $('.pti-open').parent().siblings();
            }
            if ($('.pti-closed')) {
             closedTrails = $('.pti-closed').parent().siblings();
            }
            console.log($('.pti-closed').parent().siblings().text());
            if ($('.pti-closed')) {
              closedLift = $('.pti-closed').parent().parent().siblings();
            }
            if ($('.pti-open')) {
                openLift = $('.pti-open').parent().parent().siblings();
              }
            if ($('.pti-groomed')) {
              groomedTrails = $('.pti-groomed').parent().siblings();
            }
            if ($('.pti-hold')) {
              holdLift = $('.pti-hold').parent().parent().siblings();
            }
            const openTrailsList = fromatJayInfo(openTrails);
            const groomedTrailsList = fromatJayInfo(groomedTrails);
            const holdLiftList = fromatJayInfo(holdLift);
            const closedLiftList = fromatJayInfo(closedLift);
            const openLiftList = fromatJayInfo(openLift);
            const closedTrailsList = fromatJayInfo(closedTrails);


            const trailInfo = {
                openTrails: openTrailsList,
                closedTrails: closedTrailsList,
                groomedTrails: groomedTrailsList,
                holdLift: holdLiftList,
                closedLift: closedLiftList,
                openLift: openLiftList
            }
            return cb(trailInfo);

        }
        throw Error("could not access a basin info at this time");    })
}

function fromatJayInfo(list) {
    trailsList = [];
    const notIncluded = ['8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:00am - 4:00pm',  '8:00am - 4:00pm', '8:00am - 4:00pm', '8:00am - 4:00pm', '9:00am - 4:00pm', '9:00am - 4:00pm', '9:00am - 4:00pm', '9:00am - 4:00pm', '10:00am - 4:00pm', '10:00am - 4:00pm', 'Tramside Carpet', 'Stateside Carpet']
    for (let i = 0; i < list.length; i++) {
        const trail = list[i];
        for (let j = 0; j < trail.children.length; j++) {
            const child = trail.children[j];
            if (child.type === "text") {
                const trailName = child.data.trim();
                if (trailName && !notIncluded.includes(trailName) && trailName !== trailsList[trailsList.length - 1]) {
                    trailsList.push(trailName);
                }
            }
        }
    }
    return trailsList;
}

//takes a list of open or closed trail names and a value to set these trails to in the map that is also passed in
//valueInMap is either 1 or 0
function mapOfTrails(list, valueInMap, map) {
    for (let i = 0; i < list.length; i++) {
        map.set(list[i], valueInMap);
    }
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
})