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
            if ($('.pti-open')) {
             openTrails = $('.pti-open').parent().siblings();
            }
            if ($('.pti-closed')) {
             closedTrails = $('.pti-closed').parent().siblings();
            }
            if ($('.pti-closed')) {
              closedLift = $('.pti-closed').parent().parent().siblings();
            }
            if ($('.pti-open')) {
                openLift = $('.pti-open').parent().parent().siblings();
              }
            if ($('.pti-groomed')) {
              groomedTrails = $('.pti-groomed').parent().siblings();
            }
            if ($('.pti-open-partial')) {
              openPartialTrails = $('.pti-open-partial').parent().siblings();
            }
            if ($('.pti-hold')) {
              holdLift = $('.pti-hold').parent().parent().siblings();
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
        throw Error("could not access jay peak info at this time");    })
}

function formatJayInfo(list) {
    trailsList = [];
    const notIncluded = ['8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:30am - 4:00pm', '8:00am - 4:00pm',  '8:00am - 4:00pm', '8:00am - 4:00pm', '8:00am - 4:00pm', '9:00am - 4:00pm', '9:00am - 4:00pm', '9:00am - 4:00pm', '9:00am - 4:00pm', '10:00am - 4:00pm', '10:00am - 4:00pm', 'Tramside Carpet', 'Stateside Carpet']
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
        const orderedList = ["Chalet Meadow","Deer Run","Grammy Jay","Harmony Lane","Interstate","Kangaroo Trail","Lower Can Am","Perry Merril Ave","Progression Terrain","Queen's Highway","Rabbit Trail","Raccoon Run","Subway","The Boulevard","The Interstate","Ullr's Dream","Alligator Alley","Angel's Wiggle","Cat Walk","Green Mountain Boys","Heaven's Road","Hell's Crossing","Lower Exhibition","Lower Goat Run","Lower Milk Run","Lower River Quai","Lower U.N.","Micky","Mont L'Entrepide","Montrealer","Northway","Paradise Meadows","Poma Line","Purgatory","Racer","St. George's Prayer","Sweetheart","Taxi","The Flash","The Jet Lower","The Willard","Ullr's Dream","Upper Goat Run","Vermonter","Wedelmaster","601","Hotshot Derick","Green Beret","Haynes","JFK","Kitzbuehel","Lift Line","Northwest Passage","The Jet","U.N.","Upper Can Am","Upper Exhibition","Upper Milk Run","Upper River Quai","Bushwacker","Doe Woods","Full Moon","Half Moon","Kokomo","Quarter Moon","Andre's Paradise","Beaver Pond","Bonaventure Glade","Buck Woods","Buckaroo Bonzai","Canyon Land","Deliverance","Expo Glade","Hell's Woods","Kitz Woods","North Glade","Show-Off Glade","Staircase","Stateside Glade","The Face Chutes","Timbuktu","Tuckerman's Chute","Valhalla","Vertigo", "Bonaventure Quad", "Flyer Quad", "Jet Triple", "Metro Quad", "Taxi Quad", "Village Double", "Aerial Tram"];

        mapOfTrails(openTrails, 1, map);
        mapOfTrails(closedTrails, 0, map);
        mapOfTrails(groomedTrails, 2, map);
        mapOfTrails(holdLift, 3, map);
        mapOfTrails(closedLift, 4, map);
        mapOfTrails(openLift, 5, map);
        mapOfTrails(openPartialTrails, 6, map);

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

exports.jayStatusApp = functions.https.onRequest(jayStatusApp);
exports.jayStatusIno = functions.https.onRequest(jayStatusIno);
