
export function squareIsInHome(sqm, squaresArr) {
    // return true if the level 4, 6, 8 or 10 square sq is in the home squares array
	if(!sqm) {return false}
	
    const sq = sqm.toUpperCase();
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

export function mhToLatLong(Sq_mixedCase) {
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
    return {'lat':lat, 'lon':lon};
}
	
export function latlonToKmDeg(Adegdeg, Bdegdeg){
	const f = Math.PI/180.0;
	const A = {'lat':Adegdeg.lat*f, 'lon':Adegdeg.lon*f}
	const B = {'lat':Bdegdeg.lat*f, 'lon':Bdegdeg.lon*f}
    const dLat = B.lat - A.lat;
    const dLon = B.lon - A.lon;
    const a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(A.lat) * Math.cos(B.lat) * Math.pow(Math.sin(dLon / 2), 2);
    const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = 6371.0 * c;
    const y = Math.sin(dLon) * Math.cos(B.lat);
    const x = Math.cos(A.lat) * Math.sin(B.lat) - Math.sin(A.lat) * Math.cos(B.lat) * Math.cos(dLon);
    const th = Math.atan2(y, x);
    const brg = (th * 180 / Math.PI + 360) % 360;

    return ({
        "km": km,
        "deg": brg
    });
}

export function squaresToKmDeg(SqA, SqB) {
	return (latlonToKmDeg(mhToLatLong(SqA), mhToLatLong(SqB)));
}