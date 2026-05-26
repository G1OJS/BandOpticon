import {parseSquares} from './geoFuncs.js';
const defaultSquaresList = "IO50:99,JO01,JO02,JO03";

export var squaresArr = []; // contains the full list of every square (level 4, 6, 8, 10) that we want to watch, generated from squaresList
export var squaresList = ""; // the human-firendly list of squares to watch
export var myCall = "";

export const colours =   {tx:'rgba(200, 30, 30, 0.5)', 	rx:		'rgba(30, 200, 30, 0.5)',	txrx:'rgba(51, 153, 255, 0.5)', 
						  conn:'rgba(20, 20, 20, 1)'};
						
export const mapcolours =  {land:'rgba(180,200,180,0.5)', sea:'rgba(240,240,250,0.5)'}
						

export function setMyCall(myCallNew) {
    localStorage.setItem('myCall', myCallNew);
    console.log("my Call updated to " + myCallNew);
	myCall = myCallNew;
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

	let myCallStorred = localStorage.getItem('myCall');
	if (myCallStorred) { 
		console.log("Loaded my call " + myCallStorred); 
		document.getElementById('myCallInput').value = myCallStorred.toUpperCase();
	}

}
