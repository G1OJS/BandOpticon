const defaultSquaresList = "IO50:99,JO01,JO02,JO03"; // used if squaresList value can't be set from localstorage
const defaultCall="G1OJS";
const defaultPurgeMins=20;
export var squaresArr = []; // contains the full list of every square (level 4, 6, 8, 10) that we want to watch, generated from squaresList
export var squaresList = ""; // the human-firendly list of squares to watch
export var purgeMinutes;
export var myCall;

import {parseSquares} from './geo.js';
import {purgeLiveConnections} from './conns-data.js';
import {connectToFeed} from './mqtt.js';

export function updateMyCall(event) {
    myCall = document.getElementById('myCallInput').value;
	myCall = myCall.toUpperCase();
	document.getElementById('myCallInput').value = myCall;
    console.log("my Call updated to " + myCall);
    saveConfig();
}

export function updateSquaresList(event) {
    let input = document.getElementById('homeSquaresInput');
    let newSquaresList = input.value; // potentially mixed case but that's OK
	console.log("squares list updated to " + newSquaresList);
    squaresArr = parseSquares(newSquaresList); // returns uppercase squares, expanded if necessary
	squaresList = newSquaresList;
    if (squaresArr == "Err") {
        input.setCustomValidity("Invalid grid square format");
    } else {
        input.setCustomValidity("");
        saveConfig();
        connectToFeed();
    }
	input.reportValidity();

}

export function updatePurgeMins(event) {
    purgeMinutes = document.getElementById('purgeMinutesInput').value;
    console.log("Purge mins updated to " + purgeMinutes);
    saveConfig();
    purgeLiveConnections();
}

export function saveConfig() {
    console.log("Saving config:");
    localStorage.setItem('squaresList', JSON.stringify(squaresList));
    console.log("Saved Squares List: " + squaresList);
    localStorage.setItem('myCall', myCall);
    console.log("Saved myCall: " + myCall);
    localStorage.setItem('purgeMinutes', purgeMinutes);
    console.log("Saved purgeMinutes: " + purgeMinutes);
}

export function loadConfig() {
    console.log("Loading config data");

    // squaresList (complex, so parse JSON)
    let storedSquares = localStorage.getItem('squaresList');
    if (storedSquares) {
        try {
            squaresList = JSON.parse(storedSquares);
            console.log("Loaded squares list");
        } catch (e) {
            console.warn("Failed to parse squaresList, using defaults.");
            squaresList = defaultSquaresList;
        }
    } else {
        squaresList = defaultSquaresList;
        console.log("No local config data found for squares list: defaults applied.");
    }
    document.getElementById("homeSquaresInput").value = squaresList;
    squaresArr = parseSquares(squaresList);

    // myCall (simple string, no JSON.parse)
    let storedCall = localStorage.getItem('myCall');
    if (storedCall && storedCall.trim() !== "") {
        myCall = storedCall;
        console.log("Loaded myCall " + myCall);
    } else {
        console.log("No local config data found for my callsign: defaults applied.");
        myCall = defaultCall;
    }
    document.getElementById("myCallInput").value = myCall;

    // purgeMinutes (string, convert to number)
    let storedPurge = localStorage.getItem('purgeMinutes');
    if (storedPurge && !isNaN(storedPurge)) {
        purgeMinutes = Number(storedPurge);
        console.log("Loaded purge minutes: " + purgeMinutes);
    } else {
        purgeMinutes = defaultPurgeMins;
        console.log("No valid purgeMinutes found: default applied.");
    }
    document.getElementById("purgeMinutesInput").value = purgeMinutes;
}
