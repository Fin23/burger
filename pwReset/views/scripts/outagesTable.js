//importHTML.js
//Author: Brandon Smith
//Company: Netsolus
//Date: 02-2019
//
//Description: Define one or more .html documents to import to a designated position upon page load
//**Please remember to embed this script as an ES module (type="module")
//
//The destination element on index should have an id or class to match the selector ("target" attribute)
//Define each import using a meta tag with attributes:
//  import - The html file path (String)
//  target - The exact selector used to identify the element to be replaced upon import (String)
//  EXAMPLE: <meta import="/html/footer.html" target="#import-footer"/>
//    Then somewhere else in the document: <meta id="import-footer">
//
//If preferred, we can be more concise by combining the target tag and import tag onto a single element:
//  EXAMPLE: <meta import="/html/footer.html" target="#import-footer" id="import-footer"/>

//Build an array of import file paths and the corresponding selectors
// var imports = $(document).find('table#outages').map(function() {
//   return {"source":$(this).attr("import"), "dest":$(this).attr("target")}
// });
var destSelector = "#outages";
var sourceJson = "json/outages.json";

function tableInsert(dest, json) {
  var numServices = json.length;
  var maxEvents = 0;
  var htmlInsert = "";

  //Figure out the greatest number of events among any one of the services
  for(var i = 0; i < numServices; i++) {
    if(json[i].events.length > maxEvents) {
      maxEvents = json[i].events.length;
    }
  }

  //window.alert("numServices: " + numServices);

  //Build into the table element - populate column headers
  htmlInsert += '<thead><tr>';
  for(var i = 0; i < numServices; i++) {
    htmlInsert += '<th class="text-center" scope="col" style="width: 33%">' + json[i].serviceName + '</th>';
  }
  htmlInsert += '</tr></thead><tbody>'; //header row closing tags
  //Populate the rest of the table, row-by-row
  for(var i = 0; i < maxEvents; i++) {
    htmlInsert += '<tr>';
    //Populate this row's events (columns/cells)
    for(var j = 0; j < numServices; j++) {
      if(i < json[j].events.length) { //Only specify this cell if the service in this column has this many events
        htmlInsert += '<td>Event Date: ' + json[j].events[i].date +
                              '<br />Time: ' + json[j].events[i].time +
                              '<br /><a href="' + json[j].events[i].url + '">' +
                              json[j].events[i].description + '</a><br /></td>';
      }
      else { //Make it an empty cell otherwise
        htmlInsert += '<td></td>';
      }
    } //End populating this row's events
    htmlInsert += '</tr>'; //row closing tag
  } //End populating this table's rows
  dest.insertAdjacentHTML("beforeend", htmlInsert + '</tbody>'); //table closing tag

  //ERROR CHECKING
  // if (this.status == 404) {
  //   console.log('importHTML.js ERROR: Could not import "' + imports[i].source + '" - File is missing or inaccessible');
  // }
}

var target = document.querySelector(destSelector);
if(target) {

  //Load JSON, call the import function and pass it the JSON object
  $.getJSON(sourceJson, function(data) {
    tableInsert(target, data);
  });

}
else {
  console.log('importHTML.js ERROR: Could not import "' + sourceJson + '" - no match for selector: ' + destSelector);
}
