# BandOpticon Geo
### A live, visual, geographic view showing all bands and modes at once across the whole world, plus band detail.
This software uses data from Pskreporter to present a view of band activity on all active bands simultaneously, and you can filter and zoom in as much or as little as you need. 

The software runs in Javascript on your machine and requires no downloads. Just click [here](https://g1ojs.github.io/BandOpticon/BandOpticon) to watch the views evolve.

## What does BandOpticon do that's different to Pskreporter itself / other tools?
I wrote BandOpticon because it wasn’t easy for me to get the views that I wanted from Pskreporter. So the key features that I added include:

* carousel view shows geographic extent / intensity of activity for all bands and selected mode, separated into tiles for each band with colours discriminating Tx-only, Rx-only and Tx-Rx stations

* can automatically highlight connections according to different filters:
    * *only those involving my callsign*, providing a visual comparison of my Rx (and/or Tx) reach vs close peers
    * *all connections, coloured according to home callsign*, allowing the reach of other callsigns to be compared with each other (is someone doing really well compared to the rest?)
    *  *only connections that are reciprocal (A hears B *and* B hears A)* showing paths that are likely to support QSOs rather than just spots, and which are surprisingly rare. When these appear in the carousel view, this helps identify *bands* that are supporting QSOs rathern than just spots.

* automatic 'zoom to activity' option for both carousel and main view
  
* choice of map projection

* what shows up is driven entirely by the data - so if a new mode appears on a new band, it will appear unless you've narrowed the filters. I found several modes I hadn't heard of this way, and what bands they are used on typically.

I used to have browser bookmarks for every band, to load Pskreporter views for ‘6m me’, ‘6m England’ etc. BandOpticon provides this in a fraction of the time that it took me to load these pages, and I’d never have tried loading all my bookmarks at once!

Also, I've tried to ensure:

* the page loads relatively quickly

* minimal number of settings needed

* works on mobile devices

## All activity Carousel
The carousel near the top of the page gives an instant impression of activity on your selected mode(s), with a choice of full-world view or automated 'zoom to activity'. This screenshot shows a rectangular map projection being used. You can also select 'great circle' (Azimuthal Equidistant) as shown in the usage example below.
<img width="1391" height="568" alt="carousel" src="https://github.com/user-attachments/assets/3aef5960-401e-4b42-a9b6-b3e3ab532af5" />


## Band detail view
Click on any tile in the carousel to see a bigger view here, again either zoomed out to the whole world or zoomed to activity. In this view, a 'zoom to activity once' option is also available ('=' button) which doesn't change zoom as new spots arrive.

Connections are shown for all home callsigns, coloured differently for each home callsign, or for a single callsign coloured according to transmit or receive. The single callsign is specified in the input at the top of the page, and can be temporarily changed by hovering the mouse over another callsign spot.

#### Example Usage: Checking Receive Performance:
The image below shows how I use BandOpticon to check my receive performance against that of other stations nearby. I've set the map to show only spots involving nearby stations who are receiving, and only show connection lines for my callsign. The remote red dots (and blue dots) are remote transmitters (and transmitter receivers) heard by at least one 'home' receiver. The green connecting lines show how many of these that I'm also receiving. The same can be done for transmit performance by selecting the option to show only spots involving nearby stations who are transmitting.

<img width="692" height="905" alt="Rx performance example" src="https://github.com/user-attachments/assets/928ae318-74fd-4c7f-af83-bad19e15c669" />


#### Example Usage: Visualising Connectivity:
<img width="868" height="475" alt="2m connectivity e g" src="https://github.com/user-attachments/assets/192bc8a6-e249-4ff5-91ad-118a9ee6eb7c" />

[GitHub repo](https://github.com/G1OJS/BandOpticon/)

[Current Version](https://g1ojs.github.io/BandOpticon/BandOpticon)

### A mention in The Communicator
Thanks to Editor John Schouten VE7TI [communicator@VE7SAR.net](communicator@VE7SAR.net) for mentioning an [early version](https://github.com/G1OJS/BandOpticon/releases/tag/V2.0.0) of BandOpticon in the March/April 2025 issue of [The Communicator - the magazine for Canada's Surrey Amateur Radio Society (SARC)](https://www.ve7sar.net/communicator). I've bookmarked this magazine & encourage you to check it out; free, readable online, packed with really good & succinct articles!




