# Changes
Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Version | Changes
|-------|-------|-------|
|08-10-2024 | V1.0.0 | <html><ol><li>Live version of BandOpticon republished with V1.0.0 in the <title> tag.</li></ol></html>|
|in progress | V1.0.1 | <html><ol><li>Fixed clock error (12:01:05 displays as 12:1:5) reintroduced when eliminating deprecated substr()</li><li>Changed text in details pane from "Entities common to [myCall] and all calls including [myCall] are highlighted" to "Entities spotting / being spotted by [myCall] are highlighted"</li><li>Internal code change - rename Squares to squaresArr</li><li>Internal code change - removed redundant code from configuration loader introduced due to error in localstorage tag name for squares (now fixed)</li><li>Removed duplicate copy of [myCall] appearing in main table when not grouping calls into Tx and Rx lists</li><ol></html>|




# Numbering scheme
From [https://semver.org/](https://semver.org/)

Given a version number MAJOR.MINOR.PATCH, increment the:   
- MAJOR version when you make incompatible API changes   
- MINOR version when you add functionality in a backward compatible manner   
- PATCH version when you make backward compatible bug fixes

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.
