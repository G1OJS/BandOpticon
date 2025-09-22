const defaultSquaresList = "IO50:99,JO01,JO02,JO03";
const defaultCall="G1OJS";
export var squaresArr = []; // contains the full list of every square (level 4, 6, 8, 10) that we want to watch, generated from squaresList
export var squaresList = ""; // the human-firendly list of squares to watch
export var myCall;

import {parseSquares} from './geo.js';

export function updateMyCall() {
    myCall = document.getElementById('myCallInput').value;
	myCall = myCall.toUpperCase();
	document.getElementById('myCallInput').value = myCall;
    console.log("my Call updated to " + myCall);
    localStorage.setItem('myCall', myCall);
}

export function updateSquaresList() {
    let input = document.getElementById('homeSquaresInput');
    let newSquaresList = input.value; // potentially mixed case but that's OK
	console.log("squares list updated to " + newSquaresList);
    squaresArr = parseSquares(newSquaresList); // returns uppercase squares, expanded if necessary
	squaresList = newSquaresList;
    if (squaresArr == "Err") {
        input.setCustomValidity("Invalid grid square format");
    } else {
        input.setCustomValidity("");
		localStorage.setItem('squaresList', JSON.stringify(squaresList));
		console.log("Saved Squares List: " + squaresList);
    }
	input.reportValidity();
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
}
