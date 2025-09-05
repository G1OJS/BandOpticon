
import {squaresArr} from './store-cfg.js';

export function squareIsInHome(sqm) {
    // return true if the level 4, 6, 8 or 10 square sq is in the home squares array
	if(!sqm) {return false}
	
    let sq = sqm.toUpperCase();
    if (squaresArr.includes(sq.substring(0, 4)))
        return true;
    if (squaresArr.includes(sq.substring(0, 6)))
        return true;
    if (squaresArr.includes(sq.substring(0, 8)))
        return true;
    if (squaresArr.includes(sq.substring(0, 10)))
        return true;
    return false;
}

export function parseSquares(sqsList) {
    // returns uppercase squares, expanded if necessary
    var outputSqsArr = new Array();
    var inputSqs = sqsList.toUpperCase().split(','); // internally we work with uppercase squares
    console.log("Parsing squares list " + inputSqs);
	var i;
    for ( i = 0; i < inputSqs.length; i++) {
        let sq = inputSqs[i].trim();
        if (sq.length < 4) {
			console.log("Invalid squares passed to parseSquares");
            return "Err";
		}
        let cln = sq.search(":");
        if (cln < 0) {
            outputSqsArr.push(sq)
        } else {
            if (sq.length != 7 && sq.length != 9) {
   			    console.log("Invalid squares passed to parseSquares");
                return "Err";
			}
            let root = sq.substring(0, cln - 2);
            for (let x = sq.charCodeAt(cln - 2); x < sq.charCodeAt(cln + 1) + 1; x++) {
                for (let y = sq.charCodeAt(cln - 1); y < sq.charCodeAt(cln + 2) + 1; y++) {
                    outputSqsArr.push(root + String.fromCharCode(x) + String.fromCharCode(y))
                }
            }
        }
    }
    console.log("Parsed squares result " + outputSqsArr);
    return outputSqsArr;
}

export function mhToLatLong(Sq_mixedCase, inRadians = false) {
    let Sq = Sq_mixedCase.toUpperCase();
	let lat = -90 + 10 * (Sq.charCodeAt(1) - 65) + 5;
	let lon = -180 + 20 * (Sq.charCodeAt(0) - 65) + 10;
    if (Sq.length > 2) { 
	    lat += parseInt(Sq.charAt(3)) -5 + 0.5;
        lon += 2 * parseInt(Sq.charAt(2)) -10 +1;
	}
    if (Sq.length > 4) { 
	    lat += (Sq.charCodeAt(5) - 65) / 24 - 0.5 + 1/48;
        lon += (Sq.charCodeAt(4) - 65) / 12 -1 + 1/24;
    }
    if (inRadians) { lat = lat * Math.PI / 180;  lon = lon * Math.PI / 180;}
    return [lat, lon];
}

export function squaresToKmDeg(SqA, SqB) {

    let A = mhToLatLong(SqA, true);
    let B = mhToLatLong(SqB, true);
    let dLat = B.lat - A.lat;
    let dLon = B.lon - A.lon;
    let a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(A.lat) * Math.cos(B.lat) * Math.pow(Math.sin(dLon / 2), 2);
    let c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let km = 6371.0 * c;
    let y = Math.sin(dLon) * Math.cos(B.lat);
    let x = Math.cos(A.lat) * Math.sin(B.lat) - Math.sin(A.lat) * Math.cos(B.lat) * Math.cos(dLon);
    let th = Math.atan2(y, x);
    let brg = (th * 180 / Math.PI + 360) % 360;

    return ({
        "km": Math.round(km),
        "deg": Math.round(brg)
    });
}
