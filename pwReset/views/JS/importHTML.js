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
var imports = $(document).find('meta[import]').map(function() {
  return {"source":$(this).attr("import"), "dest":$(this).attr("target")}
});

function htmlImport(dest) {
  return function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        dest.insertAdjacentHTML("beforebegin", this.responseText);

        // Remove the placeholder element
        dest.parentNode.removeChild(dest);
      }
      if (this.status == 404) {
        console.log('importHTML.js ERROR: Could not import "' + imports[i].source + '" - File is missing or inaccessible');
      }
    }
  }
}

for(var i = 0; i < imports.length; i++) {
  var target = document.querySelector(imports[i].dest);
  if(target) {

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = htmlImport(target);

    xhr.open("GET", imports[i].source);
    xhr.send();

  }
  else {
    console.log('importHTML.js ERROR: Could not import "' + imports[i].source + '" - no match for selector: ' + imports[i].dest);
  }
}
