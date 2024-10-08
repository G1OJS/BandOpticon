# Changes
<table>
<tr>
  <th>Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th><th>Version</th><th>Changes</th>
</tr>
  
<tr>
  <td>08-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Prior%20Versions/BandOpticon%20V1.0.0'>V1.0.0</a></td><td>Added V1.0.0 to Title tag of live version</td>
</tr>

<tr>
  <td>08-10-2024</td><td><a href='https://g1ojs.github.io/BandOpticon/Prior%20Versions/BandOpticon%20V1.0.1'>V1.0.1</a></td>
  <td>
    <ol>
      <li>Fixed clock error (12:01:05 displays as 12:1:5) reintroduced when eliminating deprecated substr()</li>
      <li>Changed text in details pane from
        "Entities common to [myCall] and all calls including [myCall] are highlighted"
        to "Entities spotting / being spotted by [myCall] are highlighted where also spotted by other calls in Home"</li>
      <li>Internal code change - rename Squares to squaresArr</li>
      <li>Internal code change - removed redundant code from configuration loader introduced due to error in localstorage tag name for squares (now fixed)</li>
      <li>Removed duplicate copy of [myCall] appearing in main table when not grouping calls into Tx and Rx lists</li>
      <li>Added link to this change history</li>
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
