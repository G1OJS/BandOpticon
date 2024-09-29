---
layout: default
permalink: /BandOpticon/
---



<html>
<head><style>
:root {background-color: #91FCFE; color:black;text-align: left; font-size: 1em;}
#main_content { background-color: #DFF8FE; color:black;text-align: left; font-size: 1em;}
div {margin: 2px;  padding: 5px;}
#BO_title {text-align: center; font-size: 4em;}
#BO_subtitle {text-align: center; font-size: 1.2em;}
#credits {color:black; font-size: 0.8em;}
.detail > div {background-color: rgba(255, 255, 255, 0.8);}
.transmit {color:red; }
.receive {color:green; }
.interzone {color:blue; }
.outgoing {color:Fuchsia; }
.incoming {color:olive;}
.bandblock {display: grid; grid-template-columns: auto auto auto auto auto;}
.bandblock > div {background-color: rgba(255, 255, 255, 0.8);}
</style>
</head>

<body id="BandOpticonBody"><div>
<div id="BO_title" name="BO_title">BandOpticon</div>
<div id="BO_subtitle" name="BO_subtitle">Live <a href='https://pskreporter.info/'>Pskreporter</a> statistics for FT8 spots on all bands between Home and DX</div>
<div class="detail" id="controls" name="controls"></div>
<div class="detail" id="detail" name="detail"></div>
<div class="bandblock" id="bandblock"></div>
<div class="detail" id="credits" name="credits">
  Javascript & HTML developed by me, Alan Robinson - G1OJS - G1OJS@yahoo.com, with thanks to:<BR>
  Philip Gladstone - N1DQ for https://pskreporter.info/<br>
  Tom Stanton - M0LTE for mqtt.pskreporter.info, the MQTT feed for this app<br>
  <a href='https://www.unpkg.com/browse/mqtt@5.10.1/README.md'>www.unpkg.com</a> 
  for the cdn MQTT library used here <a href='https://www.unpkg.com/browse/mqtt@5.10.1/LICENSE.md'>MIT license</a>
</div>
</div></body>

<!--Get the library for MQTT functions -->
<script src="https://unpkg.com/mqtt/dist/mqtt.min.js"></script>

<script>
  function updateDetails(newWant){
  // this is clunky and risks not being defned if loading order differs?
    if(!(typeof newWant==='undefined')) {
       if(newWant>0) {detailWanted=newWant} else {detailWanted="Layout"}
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
    controls.innerHTML="<div><strong>"+utc_timestamp+"</strong>"+
       "<br>Home = DXCCs "+DXCCs+" <a href='#controls' onclick='editDXCCs();'>edit</a><br>"+
       "Spots purged when older than "+purgeMinutes+" minutes"
  }

  // Define the DXCCs and Bands of interest
  //localStorage.removeItem('DXCCs')
  if(localStorage.getItem('DXCCs')){
    var DXCCs=JSON.parse(localStorage.getItem('DXCCs'));
  } else {
    var DXCCs=[223,114,265,122,279,106,294];
    localStorage.setItem('DXCCs', JSON.stringify(DXCCs));
  }

  const Bands=["160m","80m","60m","40m","30m","20m","17m","15m","12m","10m","6m","4m","2m","70cm","23cm"];
  const refreshSeconds=2;
  const purgeMinutes=5;
  let detailWanted="Layout";
  let spots=[];
  let tWrite=Date.now();
  updateDetails();
  updateControls();

  function editDXCCs(){
    var resp=prompt("Enter DXCCs",DXCCs);
    var regex=/^(([0-9]+)(,(?=[0-9]))?)+$/;
    if (regex.test(resp)) {
      DXCCs=resp;
      updateControls();
      localStorage.setItem('DXCCs', DXCCs);
      spots=[];
      tWrite=0; //forces an onmessage screen update
    } else {
      alert("DXCC list must be comma-separated integers");
    }
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
  // console.log(newDiv.innerHTML);
   toAdd.appendChild(newDiv);
}
document.getElementById('bandblock').appendChild(toAdd);

  // Connect to Pskreporter and subscribe on connect
  const client=mqtt.connect("wss://mqtt.pskreporter.info:1886");
  client.onSuccess=client.subscribe('pskr/filter/v2/+/FT8/+/+/+/+/+/#');
  client.on("message", (filter,message) => {onMessage(message.toString());}  );

  function onMessage(message){    
    if ( (Date.now()-tWrite)/1000 > refreshSeconds ){
      console.log("refresh");
    	tWrite=Date.now();
      purgeSpots();
      writeBandSpotStats();
      writeBandActiveCallStats();
      updateDetails();
      updateControls();
    }
    sa=parseInt(getVal("sa",message));
    if(DXCCs.includes(sa)){addSpot(message); return;}
    ra=parseInt(getVal("ra",message));
    if(DXCCs.includes(ra)){addSpot(message);}
  }
  
  function purgeSpots(){
    var del=[];
    for (let iSpot=1; iSpot < spots.length; iSpot++) {
      var spot=spots[iSpot];
      var tSpot=spot[1];
      if((Date.now()/1000-tSpot)/60 > purgeMinutes) {del.push(iSpot)}
    }
    for (let iSpot=1; iSpot <del.length;iSpot++){spots.splice(del[iSpot],1)}
  }
  
  function addSpot(message){
    band=getVal("b",message);
    senderDXCC=parseInt(getVal("sa",message));
    receiverDXCC=parseInt(getVal("ra",message));
    senderCall=getVal("sc",message);
    receiverCall=getVal("rc",message);
    tSpot=parseInt(getVal("t",message));
    spots.push([band,tSpot,senderCall,receiverCall,senderDXCC,receiverDXCC]);
  }
  
  function writeBandSpotStats(){
 //   misc.innerHTML="Total spots: "+spots.length;
  
    var bandStats = [];
    for(let i = 0; i < Bands.length; i++) {
        bandStats[i]=[];
        bandStats[i][0]=0;
        bandStats[i][1]=0;
        bandStats[i][2]=0;
    }
    for (let iSpot=1; iSpot < spots.length; iSpot++) {
      var spot=spots[iSpot];
      var dircode=0;    // dircode is 0=H->H, 1=DX->H, 2=H->DX, 3=DX-DX
      if(!DXCCs.includes(spots[iSpot][4])) {dircode+=1};
      if(!DXCCs.includes(spots[iSpot][5])) {dircode+=2};
      iBand=Bands.indexOf(spot[0]);
      if(dircode>2){
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
  //spots array 0=band,1=tSpot,2=senderCall,3=receiverCall,4=senderDXCC,5=receiverDXCC
     for (iBand=0; iBand<Bands.length; iBand++){
  //note that this sub could be written with integer counters now as it was going to do other things but now isn't
       var active_tx=new Set;
       var active_rx=new Set;
       for (let iSpot=1; iSpot < spots.length; iSpot++) {
         var spot=spots[iSpot];
         if(spot[0]==Bands[iBand]){
           if(DXCCs.includes(spot[4])) {active_tx.add(spot[2])};
           if(DXCCs.includes(spot[5])) {active_rx.add(spot[3])};
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
    var DXCC_reached=new Set;
    var DXCC_spotted=new Set;
    for (let iSpot=1; iSpot < spots.length; iSpot++) {
      var spot=spots[iSpot];
 //spots array 0=band,1=tSpot,2=senderCall,3=receiverCall,4=senderDXCC,5=receiverDXCC
      if(spot[0]==Bands[iBand]){
        if(DXCCs.includes(spot[4])) {
           active_tx.add(spot[2]);
           DXCC_reached.add(spot[5]);
        }
        if(DXCCs.includes(spot[5])) {
           active_rx.add(spot[3]);
           DXCC_spotted.add(spot[4]);
        }
      }
    }
    detail.innerHTML="<div>"+ 
       "<strong>"+Bands[iBand]+"</strong><br>"+ 
       "<a href='#controls' onclick='updateDetails(-1);'> show layout</a><br>" +
       "<p class='transmit'><strong>Tx calls:</strong> "+Array.from(active_tx).join(' ')+"<br>"+
       "<strong>DXCC reached:</strong> "+Array.from(DXCC_reached).join(' ')+"<br></p>"+
       "<p class='receive'><strong>Rx calls:</strong> "+Array.from(active_rx).join(' ')+"<br>"+
       "<strong>DXCC spotted:</strong> "+Array.from(DXCC_spotted).join(' ')+"<br></p>"+
       "</div>";
  }
  
  function getVal(key,message){
    var iVal=message.indexOf('"'+key+'":');
    var iColon=message.indexOf(':',iVal);
    var iComma=message.indexOf(",",iColon);
    var val=message.slice(iColon+1,iComma).replace(/"/g, '');
    return val;
  }
 

</script>


</html>



































































