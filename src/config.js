import {parseSquares} from './geo.js';
const defaultSquaresList = "IO50:99,JO01,JO02,JO03";

export var squaresArr = []; // contains the full list of every square (level 4, 6, 8, 10) that we want to watch, generated from squaresList
export var squaresList = ""; // the human-firendly list of squares to watch
export var myCall = "";

export const colours =   {tx:'rgba(200, 30, 30, 0.5)', 	rx:		'rgba(30, 200, 30, 0.5)',	txrx:'rgba(51, 153, 255, 0.5)',
						conn:'rgba(20, 20, 20, 1)' ,
						map:'rgba(0,0,0,0.3)'};

export function setMyCall(myCall) {
    localStorage.setItem('myCall', myCall);
    console.log("my Call updated to " + myCall);
}

export function setSquaresList() {
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

    let storedSquares = localStorage.getItem('squaresList');
    if (storedSquares) { try {squaresList = JSON.parse(storedSquares);} catch (e) {storedSquares = false;} }
	if (storedSquares) { 
		console.log("Loaded squares list "+squaresList); 
	} else {
		squaresList = defaultSquaresList;
		console.log("No local config data found for squares list: defaults applied.");
	}
    document.getElementById("homeSquaresInput").value = squaresList;
    squaresArr = parseSquares(squaresList);

	let myCall = localStorage.getItem('myCall');
	if (myCall) { 
		console.log("Loaded my call " + myCall); 
		document.getElementById('myCallInput').value = myCall.toUpperCase();;
	}

}
