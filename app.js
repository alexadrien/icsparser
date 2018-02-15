var xmlParser = require('xml2js').parseString;
var http = require('http');
var ical = require('ical-generator');
var moment = require('moment');
var fs = require("fs");

var groupesToParse = [];

var icsSavePath = "";
var icsSavePath = "/var/www/html/icsprovider/";

gogogo();
setInterval(gogogo, 1000 * 60 * 30);

function gogogo() {
    fs.readFile('groupes.json', 'utf-8', (err, data) => {
        if (err) throw err;
        groupesToParse = JSON.parse(data);

        for (var j = 0; j < groupesToParse.length; j++) {
            getBoundHttpGet(groupesToParse[j].href, j)();
        }
    });
}

function getBoundHttpGet(xmlHref, indice) {
    return (function () {
        http.get(xmlHref, (res) => {
            const {
                statusCode
            } = res;
            const contentType = res.headers['content-type'];

            let error;
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
            }
            if (error) {
                console.error(error.message);
                // consume response data to free up memory
                res.resume();
                return;
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                xmlParser(rawData, function (err, result) {

                    var oneCal = ical().timezone('Europe/Paris');

                    for (var i = 0; i < result.timetable.event.length; i++) {
                        //            for (var i = 0; i < 1; i++) {
                        try {
                            //                    console.log("----------");
                            //                    console.log("date : " + result.timetable.event[i].$.date);
                            //                    console.log("startTime : " + result.timetable.event[i].starttime);
                            //                    console.log("endTime : " + result.timetable.event[i].endtime);
                            //                    console.log("category : " + result.timetable.event[i].category);
                            //                            console.log(result.timetable.event[i].resources[0].staff);

                            var summary = "",
                                description = "",
                                location = "";

                            summary = result.timetable.event[i].category;

                            if (result.timetable.event[i].resources[0].module != undefined) {
                                summary += " ";
                                summary += result.timetable.event[i].resources[0].module[0].item;
                            } else if (result.timetable.event[i].resources[0].group != undefined) {
                                description = JSON.stringify(result.timetable.event[i].resources[0].group[0].item);
                            }

                            if (result.timetable.event[i].notes != undefined) {
                                description += " ";
                                description += JSON.stringify(result.timetable.event[i].notes);
                            }

                            if (result.timetable.event[i].resources[0].staff != undefined) {
                                description += " ";
                                description += JSON.stringify(result.timetable.event[i].resources[0].staff[0].item);
                            }

                            if (result.timetable.event[i].resources[0].room != undefined) {
                                location = JSON.stringify(result.timetable.event[i].resources[0].room[0].item);
                            }

                            oneCal.createEvent({
                                summary: summary,
                                description: description,
                                start: moment(result.timetable.event[i].$.date + " " + result.timetable.event[i].starttime, 'DD/MM/YYYY HH:mm', true).add(result.timetable.event[i].day[0], 'day').add(1,"hour").toDate(),
                                end: moment(result.timetable.event[i].$.date + " " + result.timetable.event[i].endtime, 'DD/MM/YYYY HH:mm', true).add(result.timetable.event[i].day[0], 'day').add(1,"hour").toDate(),
                                location: location,
                                floating: true
                            });
                            
                            console.log(moment(result.timetable.event[i].$.date + " " + result.timetable.event[i].starttime, 'DD/MM/YYYY HH:mm', true).add(result.timetable.event[i].day[0], 'day').utc().toDate());

                        } catch (err) {
                            console.log("#####################ERROR");
                            console.log(err);

                            //                    console.log("category : " + result.timetable.event[i].category);
                            console.log("resources : " + JSON.stringify(result.timetable.event[i].resources[0].group[0].item));
                        }

                    }

                    //                    console.log(indice);
                    //                    console.log(groupesToParse[indice].name);
                    oneCal.saveSync(icsSavePath + groupesToParse[indice].name + ".ics");

                });
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
        });
    });
}
