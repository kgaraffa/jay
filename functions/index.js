// functions/index.js

const functions = require('firebase-functions');
const express = require('express');
const jayStatusApp = express();
const jayStatusIno = express();
const jayDate = express();
const request = require('request');
const cheerio = require('cheerio');

function getJayInfo(cb) {
    request('https://digital.jaypeakresort.com/conditions/snow-report/snow-report/', function (error, response, html) {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);

            const holdLift = $('.SnowReport-Lift .pti-hold').parent().parent().siblings();
            const openTrails = $('.SnowReport-Trail .pti-open').parent().siblings();
            const closedTrails = $('.SnowReport-Trail .pti-closed').parent().siblings();
            const closedLift = $('.SnowReport-Lift .pti-closed').parent().parent().siblings();
            const openLift = $('.SnowReport-Lift .pti-open').parent().parent().siblings();
            const groomedTrails = $('.SnowReport-Trail .pti-groomed').parent().siblings();
            const openPartialTrails = $('.SnowReport-Trail .pti-open-partial').parent().siblings();

            // Rest of your code
            const trailInfo = {
                openTrails: formatJayInfo(openTrails),
                closedTrails: formatJayInfo(closedTrails),
                groomedTrails: formatJayInfo(groomedTrails),
                holdLift: formatJayInfo(holdLift),
                closedLift: formatJayInfo(closedLift),
                openPartialTrails: formatJayInfo(openPartialTrails),
                openLift: formatJayInfo(openLift)
            };
            return cb(trailInfo);
        }
        throw Error("could not access jay peak info at this time");
    });
}


function formatJayInfo(list) {
    trailsList = [];
    const notIncluded = ['8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:00am - 4:00pm', '8:00am - 4:00pm', '8:00am - 4:00pm', '8:00am - 4:00pm', '9:00am - 4:00pm', '9:00am - 4:00pm', '9:00am - 4:00pm', '9:00am - 4:00pm', '10:00am - 4:00pm', '10:00am - 4:00pm', 'Tramside Carpet', 'Stateside Carpet']
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

function mapOfTrails(list, valueInMap, map) {
    for (let i = 0; i < list.length; i++) {
        map.set(list[i], valueInMap);
    }
}

jayStatusApp.get('/jay-status', (req, res) => {
    getJayInfo((info) => {
        console.log(info);
        res.json(info);
    });
});

jayDate.get('/jay-date', (req, res) => {
    const currentUnixTime = Math.floor(Date.now() / 1000);

    res.send(currentUnixTime.toString());
});

jayStatusIno.get('/jay-ino', (req, res) => {
    getJayInfo(({ openTrails, closedTrails, groomedTrails, holdLift, closedLift, openLift, openPartialTrails }) => {
        let map = new Map();
        const orderedList = ["Timbuktu", "Hotshot Derick", "Haynes", "U.N.",
            "The Jet", "Kitzbuehel", "Montrealer", "Kitz Woods",
            "Hell's Woods", "Stateside Glade",  "Purgatory", "Hell's Crossing", "Paradise Meadows", "Angel's Wiggle",
            "Lower Milk Run", "Bonaventure Glade", "Show-Off Glade", "Doe Woods",
            "Grammy Jay", "Raccoon Run", "Queen's Highway", "Half Moon", "Interstate",
            "Full Moon", "Quarter Moon", "Buck Woods", "Buckaroo Bonzai", "Lower River Quai",
            "Upper River Quai", "Vertigo", "Upper Can Am", "Lift Line", "Micky", "Taxi",
            "601", "Deliverance", "Canyon Land", "Upper Milk Run", "Upper Northway", "Valhalla",
            "Green Beret", "Vermonter", "St. George's Prayer", "The Face Chutes",
            "Tuckerman's Chute", "Poma Line", "Wedelmaster", "Alligator Alley",
            "Upper Goat Run", "Everglade", "Staircase", "JFK", "Ullr's Dream",
            "Beaver Pond", "Andre's Paradise", "Kokomo", "Upper Northwest Passage", "North Glade",
            "Green Mountain Boys", "Upper Exhibition", "Expo Glade", "Racer",
            "Deer Run", "Bushwacker", "Harmony Lane", "Flyer Quad", "Metro Quad", "Aerial Tram",
            "Village Double", "Taxi Quad", "Bonaventure Quad", "Jet Triple"];

        mapOfTrails(openTrails, 1, map);
        mapOfTrails(closedTrails, 0, map);
        mapOfTrails(groomedTrails, 2, map);
        mapOfTrails(closedLift, 4, map);
        mapOfTrails(holdLift, 3, map);
        mapOfTrails(openLift, 5, map);
        mapOfTrails(openPartialTrails, 6, map);

        let binaryArray = [];
        // a character at the beginning of the data to signify that the rest of the data is the ordered binary string
        for (let i = 0; i < orderedList.length; i++) {
            let bit = map.get(orderedList[i]);
            if (bit === undefined) {
                console.log(`${orderedList[i]} cannot be found in scraped data and returned a value of ${bit}`);
            } else {
                binaryArray.push(bit);
            }
        }
        return res.send(binaryArray.join(""));
    })
})

exports.jayStatusApp = functions.https.onRequest(jayStatusApp);
exports.jayStatusIno = functions.https.onRequest(jayStatusIno);
exports.jayDate = functions.https.onRequest(jayDate);
