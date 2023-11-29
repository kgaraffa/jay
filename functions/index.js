// functions/index.js

const functions = require('firebase-functions');
const express = require('express');
const jayStatusApp = express();
const jayStatusIno = express();
const request = require('request');
const cheerio = require('cheerio');

var openTrails, openPartialTrails, closedTrails, groomedTrails, holdLift, closedLift, openLift;

function getJayInfo(cb) {
    request('https://digital.jaypeakresort.com/conditions/snow-report/snow-report/', function (error, response, html) {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            if ($('.SnowReport-Trail .pti-open')) {
                openTrails = $('.SnowReport-Trail .pti-open').parent().siblings();
            }
            if ($('.SnowReport-Trail .pti-closed')) {
                closedTrails = $('.SnowReport-Trail .pti-closed').parent().siblings();
            }
            if ($('.SnowReport-Lift .pti-closed')) {
                closedLift = $('.SnowReport-Lift .pti-closed').parent().parent().siblings();
            }
            if ($('.SnowReport-Lift .pti-open')) {
                openLift = $('.SnowReport-Lift .pti-open').parent().parent().siblings();
            }
            if ($('.SnowReport-Trail .pti-groomed')) {
                groomedTrails = $('.SnowReport-Trail .pti-groomed').parent().siblings();
            }
            if ($('.SnowReport-Trail .pti-open-partial')) {
                openPartialTrails = $('.SnowReport-Trail .pti-open-partial').parent().siblings();
            }
            if ($('.SnowReport-Lift .pti-hold')) {
                holdLift = $('.SnowReport-Lift .pti-hold').parent().parent().siblings();
            }
            const openTrailsList = formatJayInfo(openTrails);
            const openPartialTrailsList = formatJayInfo(openPartialTrails);
            const groomedTrailsList = formatJayInfo(groomedTrails);
            const holdLiftList = formatJayInfo(holdLift);
            const closedLiftList = formatJayInfo(closedLift);
            const openLiftList = formatJayInfo(openLift);
            const closedTrailsList = formatJayInfo(closedTrails);


            const trailInfo = {
                openTrails: openTrailsList,
                closedTrails: closedTrailsList,
                groomedTrails: groomedTrailsList,
                holdLift: holdLiftList,
                closedLift: closedLiftList,
                openPartialTrails: openPartialTrailsList,
                openLift: openLiftList
            }
            return cb(trailInfo);

        }
        throw Error("could not access jay peak info at this time");
    })
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

jayStatusIno.get('/jay-ino', (req, res) => {
    getJayInfo(({ openTrails, closedTrails, groomedTrails, holdLift, closedLift, openLift, openPartialTrails }) => {
        let map = new Map();
        const orderedList = ["Timbuktu", "Hotshot Derick", "Haynes", "U.N.", "The Jet", "Kitzbuehel", "Montrealer", "Kitz Woods", "Vermonter", "Northway", "Hell's Woods", "Hell's Crossing", "Angel's Wiggle", "Paradise Meadows", "Valhalla", "Upper Milk Run", "Canyon Land", "Taxi", "Lower Milk Run","Micky", "Bonaventure Glade", "Show-Off Glade", "601", "Lift Line", "Green Beret", "St. George's Prayer", "Deliverance", "Vertigo", "Upper Can Am", "Buckaroo Bonzai", "Doe Woods", "Buck Woods", "Quarter Moon", "Half Moon", "Full Moon", "Grammy Jay", "Raccoon Run", "Queen's Highway", "Interstate", "Upper Goat Run", "Lower River Quai", "Upper River Quai", "The Face Chutes", "Tuckerman's Chute", "Poma Line", "Ullr's Dream", "Wedelmaster", "JFK", "Alligator Alley", "Staircase", "Everglade", "Northwest Passage", "Upper Exhibition", "Racer", "Expo Glade", "Green Mountain Boys",
        "North Glade", "Deer Run", "Harmony Lane", "Subway","Bushwacker", "Kokomo", "Beaver Pond",  "Andre's Paradise", "Bonaventure Quad", "Flyer Quad", "Jet Triple", "Metro Quad", "Taxi Quad", "Village Double", "Aerial Tram"];

        mapOfTrails(openTrails, 1, map);
        mapOfTrails(closedTrails, 0, map);
        mapOfTrails(groomedTrails, 2, map);
        mapOfTrails(holdLift, 3, map);
        mapOfTrails(closedLift, 4, map);
        mapOfTrails(openLift, 5, map);
        mapOfTrails(openPartialTrails, 6, map);

        let binaryArray = [];
        // a character at the beginning of the data to signify that the rest of the data is the ordered binary string
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

exports.jayStatusApp = functions.https.onRequest(jayStatusApp);
exports.jayStatusIno = functions.https.onRequest(jayStatusIno);
