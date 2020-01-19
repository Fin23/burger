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

//Find and store the navbar ID and the corresponding selector
var target = $(document).find('meta[navbar]').map(function() {
  return {"id":$(this).attr("navbar"), "dest":$(this).attr("target")}
});

//The compized file we are pulling components from
var componentFile = "/html/compizedNav.html";
//Pulling in JSON needed to source the unique properties of each constructed component
var navInfo;
$.getJSON("json/navbars.json", function(data) {
  navInfo = data;
});
//The key set of info passed to buildCompized
//One major piece is added within navbarBuild
var buildInfo = navInfo.buildInfo;
buildInfo.specJson = navInfo; //Not defined in navbars.json b/c self-referencing
buildInfo.varList = [ //Not defined in navbars.json b/c dependent on context
    //Component variables standard to all compized builds
    {tag:"_json", value:navInfo},
    //The following two, I will try to simply handle within the process for **
    {tag:"_i", value:null},
    {tag:"_j", value:null},
    //Custom component variables unique to navbar building
    {tag:"_nav", value:navInfo[target[0].id]},
    {tag:"_sub", value:navInfo.submenus[navInfo[target[0].id].submenuId]}
  ]
};

// *** WIP ***
  //standIn: The DOM element to be replaced.
  //navbarName: Corresponds with an object in navbars.json to identify a specific navBackground
  //buildInfo: Sepcific set of data
function navbarBuild(standIn, navbarName, buildInfo) {
  return function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        //Take the lines from componentFile and store into array elements of buildInfo.compHtml
        buildInfo.compHtml = this.responseText.split("\r\n");
        //Process, parse, iterate, etc. over the compized HTML file
        var generatedNavbar = buildCompized(buildInfo);

        //Insert the processed HTML lines after the placeholder DOM element
        standIn.insertAdjacentHTML("beforebegin", generatedNavbar);
        // Remove the placeholder element
        standIn.parentNode.removeChild(standIn);
      }
      if (this.status == 404) {
        console.log('importHTML.js ERROR: Could not import "' + componentFile + '" - File is missing or inaccessible');
      }
    }
  }
}

function buildCompized(info, progress, control, activeSyntax) {
  //info.prop explanations (all constants, immutable):
    //.compHtml - Array of source HTML lines used to parse and build the document
      //NOTE: For dynamic HTML content, use the compized syntax as described in compizedNav.html
    //.specJson - JSON object from which to fill any variable references in .compHtml
    //.syntaxList - Array of objects with props used to identify syntax in compized HTML
    //.varList - An object containing - per variable - one object pair of tag and corresponding value
  //progress, if specified, shares info about/needed by current recursive call. .prop explanations:
    //.index - Array index at which to resume parsing info.compHtml
    //.commentFlag - Indicates status of scanning comment line(s):
      //0 - Not scanning a comment
      //1 - In the midst of a multi-line comment
  //control, if specified, contains details for same-line parsing and processing. .prop explanations:
    //.type - A compized syntax or var tag e.g. %%, ??, _json, etc.
    //.line - String for the current line being modified
    //.index - Character index within the current line
  //activeSyntax, if specified, contains an array of objects which detail the syntax wrapping the
  //  current section of HTML
    //[n].type - A wrapping compized syntax: ?? or **
    //FOR ?? TYPE ONLY:
    //[n].test - Contains the result of the test. If false, lines/text within will not be added
    //FOR ** TYPE ONLY:
    //[n].array - Indicates a reference(?) to the array (from navbars.json) being iterated through
    //[n].iteration - Indicates the current iteration through given array

  var line; //Index of current line to process
  var wipLine; //String (so far) of current line being built
  var builtHtml = []; //Array for the resulting compized build
  //If builtHtml is not an empty array, it is assumed that recursion has handled all remaining
  //  needed processing of compHtml, and later calls to buildCompized are skipped
  if(!progress) {
    line = 0;
    progress.index = 0; //Initialize
  }
  else {line = progress.index;}
  if(!control) {wipLine = info.compHtml[line];}
  else {wipLine = control.line;}

  //The actual array building will occur from end to beginning once recursion begins reversing
  //Thus, when beyond the final line, we want to simply return an empty array to init the build
  if(progress.index === info.compHtml.length) {return [];}

  //If starting a new line
  //Note: Everything at this scope assumes that by making the recursive call, it will be provided
  //with the most complete builtHtml possible at its level of the recursion/current line
  //-- constructive array returns will all occur outside of the following (!control) block
  if(!control) {
    //Skip inclusion of all comment or blank lines
    //Note that buildCompized does not support inline html comments, only whole- or multi-line
    if(info.compHtml[line].includes("-->")) {progress.commentFlag = 2;}
    else if(info.compHtml[line].includes("<!--")) {progress.commentFlag = 1;}
    else if ($.trim(wipLine) == "}") { //If current line closes an active syntax
      progress.commentFlag = 2;
      if(activeSyntax) {

      }
      //Decide what to do with builtHtml
    }
    if(progress.commentFlag > 0 || $.trim(wipLine) === null || $.trim(wipLine) == "") {
      progress.index++;
      if(progress.commentFlag === 2) {progress.commentFlag = 0;}
      builtHtml = buildCompized(info, progress, {}, activeSyntax);
    }

    if(!builtHtml) {
      //Check for each of the possible syntaxes
      for(var s = 0; s < info.syntaxList.length; s++) {
        //Find the first character index where this syntax is found in the line
        var inds = info.compHtml[line].indexOf(info.syntaxList[s].tag);
        if(inds) {
          control = {
            "type": info.syntaxList[s].tag,
            "line": wipLine,
            "index": inds[0];
          };
          builtHtml = buildCompized(info, progress, {}, activeSyntax);
        }
        //Continue checking syntaxes until list exhausted
      }
      //Check for each of the possible variables
      for(var v = 0; v < info.varList.length; v++) {
        //Find the first character index where this syntax is found in the line
        var inds = info.compHtml[line].indexOf(info.varList[v].tag);
        if(inds) {
          control = {
            "type": info.varList[v].tag,
            "line": wipLine,
            "index": inds[0];
          };
          builtHtml = buildCompized(info, progress, {}, activeSyntax);
        }
        //Continue checking vars until list exhausted
      }
    }

    //What is scenario for closing bracket? For ?? vs. **?
  } //End no control



  if(line > 0) {
    //Use array.unshift() above to add content during recursion reversal
    return builtHtml;
  }
  //Final return
  else {
    return builtHtml.join("");
  }
} //End buildCompized


function indexes(source, find) {
  if (!source) {
    return [];
  }
  if (!find) {
      return source.split('').map(function(_, i) { return i; });
  }
  var result = [];
  var i = 0;
  while(i < source.length) {
    if (source.substring(i, i + find.length) == find) {
      result.push(i);
      i += find.length;
    } else {
      i++;
    }
  }
  return result;
}


//Actions for this module
var loc = document.querySelector(target[0].dest);
if(loc) {

  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = navbarBuild(loc, target[0].id, buildInfo);

  xhr.open("GET", componentFile);
  xhr.send();

}
else {
  console.log('buildNavbar.js ERROR: Could not import "' + componentFile + '" - no match for selector: ' + target[0].dest);
}
