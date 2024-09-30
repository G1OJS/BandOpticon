
  function updateDetails(newWant){
  // this is clunky and risks not being defned if loading order differs?
    if(!(typeof newWant==='undefined')) {
       if(newWant>=0) {detailWanted=newWant} else {detailWanted="Layout"}
    };
    if(detailWanted=="Layout"){
      detail.innerHTML="<div>Band box layout:<br><strong>Band</strong><br> \
         Spots: number of spots "+
         "<span class='interzone'> Home &#8680 Home /</span>"+
         "<span class='outgoing'> Home &#8680 DX /</span>"+
         "<span class='incoming'> DX &#8680 Home</span><br>"+
         "<span class='transmit'>Tx Calls: number of unique calls in 'Home' received by anyone</span><br> \
         <span class='receive'>Rx Calls: number of unique calls in 'Home' receiving anyone</span></div>"
    } else {
      showBandActiveCallsInDetails(detailWanted);
    }
  }

  function updateControls(){
    var now = new Date;
    var utc_timestamp = now.getUTCDate()+"/"+now.getUTCMonth()+"/"+now.getUTCFullYear()+" "
       +("0"+now.getUTCHours()).substr(-2)+":"
       +("0"+now.getUTCMinutes()).substr(-2)+":"
       +("0"+now.getUTCSeconds()).substr(-2)+" UTC";
    var runningmins=Math.trunc(((now-tStart)/1000) / 60);
    controls.innerHTML="<div><strong>"+utc_timestamp+"</strong> (running for "+runningmins+" minutes)"+
       "<br>Home = Squares "+Squares.join(';')+" <a href='#controls' onclick='editSquares();'>edit</a><br>"+
       "Spots purged when older than "+purgeMinutes+" minutes"
  }

  // Define the Squares and Bands of interest
//  localStorage.removeItem('Squares')
  if(localStorage.getItem('Squares')){
    try {var Squares=JSON.parse(localStorage.getItem('Squares'));}
    catch(err) {
      localStorage.removeItem('Squares')
      var Squares=["IO","JO01","JO02","JO03","JO04"];
      localStorage.setItem('Squares', JSON.stringify(Squares));}
  } else {
    var Squares=["IO","JO01","JO02","JO03","JO04"];
    localStorage.setItem('Squares', JSON.stringify(Squares));
  }

  const Bands=["160m","80m","60m","40m","30m","20m","17m","15m","12m","10m","6m","4m","2m","70cm","23cm"];
  const refreshSeconds=2;
  const purgeMinutes=5;
  let detailWanted="Layout";
  let spots=[];
  let tWrite=Date.now();
  let tStart=Date.now();
  updateDetails();
  updateControls();


  function editSquares(){
    var resp=prompt("Enter Squares",Squares);
 //   var regex=/^(([0-9]+)(,(?=[0-9]))?)+$/;
 //   if (regex.test(resp)) {
      Squares=resp.split(', '); // convert string response back to an array
      updateControls();
      localStorage.setItem('Squares', Squares);
      spots=[];
      tWrite=0; //forces an onmessage screen update
 //   } else {
 //     alert("Squares list must be comma-separated valid squares");
 //   }
  }

// Add in the boxes for all bands, and inside them the required outputs with IDs
var toAdd = document.createDocumentFragment();
for(var i=0; i < Bands.length; i++){
   var newDiv = document.createElement('div');
   newDiv.id = Bands[i];     
   newDiv.innerHTML="<strong>"+Bands[i]+"</strong> \
     <a href='#controls' onclick='updateDetails("+i+");'> details</a><br> \
     <output id='"+Bands[i]+"spots'></output><br> \
     <output id='"+Bands[i]+"calls'></output>";
   toAdd.appendChild(newDiv);
}
document.getElementById('bandblock').appendChild(toAdd);

  // Connect to Pskreporter and subscribe on connect
  const client=mqtt.connect("wss://mqtt.pskreporter.info:1886");
  client.onSuccess=client.subscribe('pskr/filter/v2/+/FT8/+/+/+/+/+/#');
  client.on("message", (filter,message) => {onMessage(message.toString());}  );

  function onMessage(message){    
    if ( (Date.now()-tWrite)/1000 > refreshSeconds ){
    	tWrite=Date.now();
      purgeSpots();
      writeBandSpotStats();
      writeBandActiveCallStats();
      updateDetails();
      updateControls();
    }
    b=getVal("b",message); //ignore nessages for bands we aren't set up to watch
    if(!Bands.includes(b)) {return;}
    
    sl=getVal("sl",message);
    if(SquareInHome(sl)){addSpot(message); return;}
    rl=getVal("rl",message);
    if(SquareInHome(rl)){addSpot(message);}
  }
  
  function purgeSpots(){
    var del=[];
    for (let iSpot=0; iSpot < spots.length; iSpot++) {
      var spot=spots[iSpot];
      var tSpot=spot[1];
      if((Date.now()/1000-tSpot)/60 > purgeMinutes) {del.push(iSpot)}
    }
    for (let iSpot=0; iSpot <del.length;iSpot++){spots.splice(del[iSpot],1)}
  }
  
  function addSpot(message){
    band=getVal("b",message);
    senderCall=getVal("sc",message);
    receiverCall=getVal("rc",message);
    senderSq=getVal("sl",message).toUpperCase();
    receiverSq=getVal("rl",message).toUpperCase();
    tSpot=parseInt(getVal("t",message));
    spots.push([band,tSpot,senderCall,receiverCall,senderSq,receiverSq]);
  }
  
  function writeBandSpotStats(){
    var bandStats = [];
    for(let i = 0; i < Bands.length; i++) {
        bandStats[i]=[];
        bandStats[i][0]=0;
        bandStats[i][1]=0;
        bandStats[i][2]=0;
    }
    for (let iSpot=0; iSpot < spots.length; iSpot++) {
      var spot=spots[iSpot];
      var dircode=0;    // dircode is 0=H->H, 1=DX->H, 2=H->DX, 3=DX-DX
      if(!SquareInHome(spots[iSpot][4])) {dircode+=1};
      if(!SquareInHome(spots[iSpot][5])) {dircode+=2};
      iBand=Bands.indexOf(spot[0]);
      if(dircode>2 || iBand==-1){
         console.log("Bad spot "+spot);
      } else {
         bandStats[iBand][dircode]+=1;
      }
    }
    for (let iBand=0; iBand < Bands.length; iBand++) {
      var snum=bandStats[iBand];
      document.getElementById(Bands[iBand]+"spots").innerHTML=
        "Spots "+snum[0]
        +"/<span class='outgoing'>"+snum[2]
        +"</span>/<span class='incoming'>"+snum[1]
        +"</span>";
    }
  }
  
   function writeBandActiveCallStats(){
  //spots array 0=band,1=tSpot,2=senderCall,3=receiverCall,4=senderSq,5=receiverSq
     for (iBand=0; iBand<Bands.length; iBand++){
       //note - we use sets here as an easy way of counting unique calls
       var active_tx=new Set;
       var active_rx=new Set;
       for (let iSpot=1; iSpot < spots.length; iSpot++) {
         var spot=spots[iSpot];
         if(spot[0]==Bands[iBand]){
           if(SquareInHome(spot[4])) {active_tx.add(spot[2])};
           if(SquareInHome(spot[5])) {active_rx.add(spot[3])};
         }
       }
       document.getElementById(Bands[iBand]+"calls").innerHTML=
         "<span class='transmit'>Tx Calls "+active_tx.size+"</span><br>"+
         "<span class='receive'>"+"Rx Calls "+active_rx.size+"</span>";
     }
   }
    
  function showBandActiveCallsInDetails(iBand){

    var active_tx=new Set;
    var active_rx=new Set;
    var Sq2_reached=new Set;
    var Sq2_spotted=new Set;
    var Sq4_reached=new Set;
    var Sq4_spotted=new Set;
    for (let iSpot=1; iSpot < spots.length; iSpot++) {
      var spot=spots[iSpot];
      //spots array 0=band,1=tSpot,2=senderCall,3=receiverCall,4=senderSq,5=receiverSq
      if(spot[0]==Bands[iBand]){
        if(SquareInHome(spot[4])) {
           active_tx.add(spot[2]+"-"+spot[4].substr(0,4));
           Sq2_reached.add(spot[5].substr(0,2));
           Sq4_reached.add(spot[5].substr(0,4));
        }
        if(SquareInHome(spot[5])) {
           active_rx.add(spot[3]+"-"+spot[5].substr(0,4));
           Sq2_spotted.add(spot[4].substr(0,2));
           Sq4_spotted.add(spot[4].substr(0,4));
        }
      }
    }

    if(Sq4_reached.size>10) {var Sq_reached=Sq2_reached;} else {var Sq_reached=Sq4_reached;} 
    if(Sq4_spotted.size>10) {var Sq_spotted=Sq2_spotted;} else {var Sq_spotted=Sq4_spotted;} 
    
    detail.innerHTML="<div>"+ 
       "<strong>"+Bands[iBand]+"</strong><br>"+ 
       "<a href='#controls' onclick='updateDetails(-1);'> show layout</a><br>" +
       "<p class='transmit'><strong>Tx calls:</strong> "+Array.from(active_tx).toSorted().join(' ')+"<br>"+
       "<strong>Squares reached:</strong> "+Array.from(Sq_reached).toSorted().join(' ')+"<br></p>"+
       "<p class='receive'><strong>Rx calls:</strong> "+Array.from(active_rx).toSorted().join(' ')+"<br>"+
       "<strong>Squares spotted:</strong> "+Array.from(Sq_spotted).toSorted().join(' ')+"<br></p>"+
       "</div>";
  }

  function SquareInHome(sq){
    return (Squares.includes(sq.substr(0,2)) || Squares.includes(sq.substr(0,4)) || Squares.includes(sq.substr(0,6)))
  }
  
  function getVal(key,message){
    var iVal=message.indexOf('"'+key+'":');
    var iColon=message.indexOf(':',iVal);
    var iComma=message.indexOf(",",iColon);
    var val=message.slice(iColon+1,iComma).replace(/"/g, '');
    return val;
  }


