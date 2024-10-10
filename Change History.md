
# Changes 

<table>
<tr>
  <th>Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th><th>Version</th><th>Changes</th>
</tr>
  
<tr>
  <td>08-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Versions/BandOpticon%20V1.0.0'>V1.0.0</a></td><td>Added V1.0.0 to Title tag of live version</td>
</tr>

<tr>
  <td>08-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Versions/BandOpticon%20V1.0.1'>V1.0.1</a></td>
  <td>
    <ol>
      <li>Fixed clock error (12:01:05 displays as 12:1:5) reintroduced when eliminating deprecated substr()</li>
      <li>Changed text in details pane from
        "Entities common to [myCall] and all calls including [myCall] are highlighted"
        to "Entities spotting / being spotted by [myCall] are highlighted when also spotted by other calls in Home"</li>
      <li>Internal code change - rename Squares to squaresArr</li>
      <li>Internal code change - removed redundant code from configuration loader introduced due to error in localstorage tag name for squares (now fixed)</li>
      <li>Removed duplicate copy of [myCall] appearing in main table when not grouping calls into Tx and Rx lists</li>
      <li>Added link to this change history</li>
    </ol>
  </td>
</tr>

<tr>
  <td>09-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Versions/BandOpticon%20V1.0.2'>V1.0.2</a></td>
  <td>
    <ol>
      <li>Updated highlighting, and explanation of highlighting, in the Band Activity Details grid</li>
      <li>Internal code change - simplified method of gathering entities spotted / reached by myCall & others / myCall only</li>
    </ol>
  </td>
</tr>

<tr>
  <td>10-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Versions/BandOpticon%20V1.0.3'>V1.0.3</a></td>
  <td>
    <ol>
      <li>Squares can now be specified using the LLNN:NN method at any level e.g. IO90ju:qr</li>
      <li>Fixed error in V1.0.0 to V1.0.2 inclusive which prevented level 6,8 and 10 squares in the squares list resulting in a subscription to the server</li>
      <li>Internal code change - moved validation of squares input including nn:mm to the function with regexps rather than checking for ':' before the call</li>
    </ol>
  </td>
</tr>

<tr>
  <td>10-10-2024</td><td>in progress</td>
  <td>
    <ol>
      <li>Update instructions in squares list edit dialogue</li>
      <li>Internal code change - take call,square to entity conversion into function in prep for allowing more options for entity type</li>
    </ol>
  </td>
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
  - switch to https://www.brailleinstitute.org/freefont/
  - allow LHS of band detail to be seen as squares (all levels) as well as calls
  - also call-square for both sides?
  - add "show distance and bearing" to RHS
  - option to combine callsign with selected detail?

Code tidying:
  - rewrite with less 'data in variable names' (the entities spotted and received by, etc)'
  - define functions to make flow more aparrent in writeStats
  - look at updateDetails and updateControls - see if they can be rationalised
     or clarified a bit (purpose vs name). updateDetails is more of a handler for 
     click to change events than anything
  - check consistency of let, var, continuation + and \ and <br> plus variable names e.g.
     - IMMUTABLE = const
     - Capital_plurals = Set
     - camelCasePluralsArr = Array 


