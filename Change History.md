
# Previous versions

<table>
<tr>
  <th>Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th><th>Version</th><th>Changes</th>
</tr>

<tr>
  <td>In progress</td><td><a href='https://g1ojs.github.io/BandOpticon/Archive/V1.4/BandOpticon%20V1.4.1'>V1.4.1</a></td>
  <td>
    <ol>
      <li>Rework styling top to bottom</li>
      <li>Change hypertext buttons for radio buttons and checkboxes</li>
      <li>Lots of internal code changes to enable the above</li>
    </ol>
  </td>
</tr>

<tr>
  <td>22-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Archive/V1.4/BandOpticon%20V1.4.0'>V1.4.0</a></td>
  <td>
    <ol>
      <li>Add option to highlight where transmit home calls share a common far entity with receive home calls ('reverse highlightinh'),
      opposite to the usual "transmit home calls share a common entity with another transmit home call" ('forward highlighting'). This
      choice is useful when switching between looking for reciprocal connections (reverse highlighting) and benchmarking performance (forward highlighting)</li>
      <li>Code improvements to stop the screen scrolling to the top on refresh</li>
    </ol>
  </td>
</tr>


<tr>
  <td>21-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Archive/V1.3/BandOpticon%20V1.3.0'>V1.3.0</a></td>
  <td>
    <ol>
      <li>Added more options to the band details grid:
        <li>Home calls or Home TxRx Calls</li>
        <Li>Format as group (Tx, Rx, TxRx category) or list as a separate option</Li>
      </li>
      <li>Grid resize now also works nicely when nearly empty</li>
    </ol>
  </td>
</tr>

<tr>
  <td>20-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Archive/V1.2/BandOpticon%20V1.2.1'>V1.2.1</a></td>
  <td>
    <ol>
      <li>Efficiency improvements necessary for when band details are shown with a large number of home callsigns</li>
    </ol>
  </td>
</tr>

<tr>
  <td>19-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Archive/V1.2/BandOpticon%20V1.2.0'>V1.2.0</a></td>
  <td>
    <ol>
      <li>"List all calls" view can now be filtered to single other call for benchmarking against myCall</li>
      <li>Intenal code changes - cleaned up changes to and preservation of display state.</li>
    </ol>
  </td>
</tr>

<tr>
  <td>18-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Archive/V1.1/BandOpticon%20V1.1.1'>V1.1.1</a></td>
  <td>
    <ol>
      <li>Ground-up rewrite to make code underneath Band Activity Details pane modular/reuseable for different comparison and highlighting schemes and metrics</li>
      <li>Added row in band tiles to show number of calls in home who are both transmitting and receiving ('Tx-Rx' calls), and the band details view now shows the entities that any call in that list is both reaching and spotting (which may be none, because a home call qualifies as Tx-Rx if it is spotted by anyone and recieved by anyone).</li>
      <li>Note that this version purges old connection data based on the age of the spot being generated rather than the time it was received as in V1.0.x - this means that the stats are less 'polluted' by old spots received a long time after they were generated.</li>
      <li>Band tiles can optionally be sorted based on any of the numbers displayed in them</li>
      <li>Bands watched are updated automatically based on band activity (no longer limited to a predefined list of bands).</li>
      <li>Update some text and formatting</li>
      <li>Intenal code changes - combine and optimise functions including highlighting code, add comments.</li>
    </ol>
  </td>
</tr>

<tr>
  <td>11-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Archive/V1.0/BandOpticon%20V1.0.4'>V1.0.4</a></td>
  <td>
    <ol>
      <li>Updated instructions in squares list edit dialogue</li>
      <li>Added dynamic sizing to Band Activity Details grid</li>
      <li>Revised wording of higlighting explanation in Band Activity Details</li>
      <li>Added third row for 'my Call': remote entities I'm both reaching and spotting (to highlight potential QSOs)</li>
      <li>Squares can now be specified using the LLNN:NN method at any level e.g. IO90ju:qr</li>
      <li>Fixed error in V1.0.0 to V1.0.2 inclusive which prevented level 6,8 and 10 squares in the squares list resulting in a subscription to the server</li>
      <li>Updated highlighting, and explanation of highlighting, in the Band Activity Details grid</li>
      <li>Fixed clock error (12:01:05 displays as 12:1:5) reintroduced when eliminating deprecated substr()</li>
      <li>Removed duplicate copy of [myCall] appearing in main table when not grouping calls into Tx and Rx lists</li>
      <li>Internal code changes</li>
      <li>Added link to this change history</li>
    </ol>
   </td>
</tr>

<tr>
  <td>08-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Archive/V1.0/BandOpticon%20V1.0.0'>V1.0.0</a></td><td>Added V1.0.0 to Title tag of live version</td>
</tr>

</table>  


# Numbering scheme
From [https://semver.org/](https://semver.org/)

Given a version number MAJOR.MINOR.PATCH, increment the:   
- MAJOR version when you make incompatible API changes   
- MINOR version when you add functionality in a backward compatible manner   
- PATCH version when you make backward compatible bug fixes

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

# To-do list & ideas

To do:
  - try a line in the detail grid showing "home reciprocals"
    - any home -> dx call -> any home
  - eliminate websafe colours
  - continue moving unnecessary updates out of the main screen update function and into where it's needed
  - fix legend layout (need equal height tiles) - last resort, fix with script
  - stop word wrap on filter link in LH column when not grouping calls
  - QRZ link for displayed callsigns?
  - switch to https://www.brailleinstitute.org/freefont/
  - think of a different colour for Tx-Rx spots so it doesn't look so similar to remove entities in home
  
Code tidying:
  - make the test message injector work
  - is there a better way to count for statistics?
  - move variables out of global
  - check consistency of let, var, continuation + and \ and <br> plus variable names e.g.
     - IMMUTABLE = const
     - Capital_plurals = Set
     - camelCasePluralsArr = Array 


