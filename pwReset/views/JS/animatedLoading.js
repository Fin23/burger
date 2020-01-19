var divBox = ".ns-modal-loading";
var divFront = ".ns-modal-loading-front";
var divBack = ".ns-modal-loading-back";
var bounds = {
  div: divBox,
  width: parseInt($(divBox).css("width"), 10), //Set in main.css
  height: parseInt($(divBox).css("height"), 10), //Set in main.css
  marginX: 16, //Margin of animation space on left and right sides
  innerWidth: 0 //Is auto-set after this object
}
bounds.innerWidth = bounds.width - (bounds.marginX*2);
var orbs = {
  diameter: 12, //Diameter of both orbs. Always ensure that CSS width/height matches this.
  front: {
    div: divFront,
    color: [],
    x1: [],
    y1: [],
    x2: [], //Ended up actually being the WIDTH value
    y2: [],
    offsetTransY: 0,
    homeTransY: -.25,
    homeColor: "#EEEEEE"
  },
  back: {
    div: divBack,
    color: [],
    x1: [],
    y1: [],
    x2: [], //Ended up actually being the WIDTH value
    y2: [],
    offsetTransY: -1, //Always included into this orb's translation
    homeTransY: -.75,
    homeColor: "#444444"
  },
  yFrames: 3,
  key: function(n) { //Allows referencing object values like array
      return this[Object.keys(this)[n]];
  }
};
//Animation timeline:
//1. 300ms: Transition x
//2. 300ms: Transition color, y (to reverse orb roles)
//3. 300ms: Transition x (orb roles reversed)
//4. 300ms: Transition color, y (return orbs to origin)
//Total frame count: 12
var loopTimeframe = 12;
var loadStep = 0; //Indicates current stage of the loading process
var aName = ["color","x1","x2","y1","y2"]; //All props to be animated
//Set front orb anim frames (not rly keyframes, more like anim-initiation frames)
//note: frame 0 is only a starting point - time from 0 to 1 is 0ms & frame 0 never reused
//note: x locations are always adjusted for bounds.marginX (read: it is added)
function getAnimVals(bounds, orbs, divBox) {
  var divBox = ".ns-modal-loading";
  bounds.width = parseInt($(divBox).css("width"), 10);
  bounds.height = parseInt($(divBox).css("height"), 10);
  bounds.innerWidth = bounds.width - (bounds.marginX*2);

  orbs.front.x1 = [
    {frame: 0, val: 0, time: 0},
    {frame: 1, val: bounds.innerWidth-orbs.diameter, time: 300},
    {frame: 7, val: 0, time: 100}
  ];
  orbs.front.x2 = [
    {frame: 0, val: orbs.diameter, time: 0},
    {frame: 1, val: bounds.innerWidth*.5, time: 100},
    {frame: 2, val: orbs.diameter, time: 200},
    {frame: 7, val: bounds.innerWidth*.5, time: 100},
    {frame: 8, val: orbs.diameter, time: 200}
  ];
  orbs.front.y1 = [
    {frame: 0, val: Math.round(orbs.diameter*orbs.front.homeTransY), time: 0},
    {frame: 4, val: Math.round(orbs.diameter*orbs.back.homeTransY), time: orbs.yFrames*100},
    {frame: 10, val: Math.round(orbs.diameter*orbs.front.homeTransY), time: orbs.yFrames*100}
  ];
  orbs.front.color = [
    {frame: 0, val: orbs.front.homeColor, time: 0},
    {frame: 4, val: orbs.back.homeColor, time: orbs.yFrames*100},
    {frame: 10, val: orbs.front.homeColor, time: orbs.yFrames*100}
  ];
  //y2 not really needed in this case
  orbs.back.x1 = [
    {frame: 0, val: bounds.innerWidth-orbs.diameter, time: 0},
    {frame: 1, val: 0, time: 100},
    {frame: 7, val: bounds.innerWidth-orbs.diameter, time: 300}
  ];
  // console.log("At loadStep #"+loadStep+", frame 0 x1: "+orbs.back.x1[0].val);
  orbs.back.x2 = [
    {frame: 0, val: orbs.diameter, time: 0},
    {frame: 1, val: bounds.innerWidth*.5, time: 100},
    {frame: 2, val: orbs.diameter, time: 200},
    {frame: 7, val: bounds.innerWidth*.5, time: 100},
    {frame: 8, val: orbs.diameter, time: 200}
  ];
  orbs.back.y1 = [
    {frame: 0, val: Math.round(orbs.diameter*orbs.back.homeTransY), time: 0},
    {frame: 4, val: Math.round(orbs.diameter*orbs.front.homeTransY), time: orbs.yFrames*100},
    {frame: 10, val: Math.round(orbs.diameter*orbs.back.homeTransY), time: orbs.yFrames*100}
  ];
  orbs.back.color = [
    {frame: 0, val: orbs.back.homeColor, time: 0},
    {frame: 4, val: orbs.front.homeColor, time: orbs.yFrames*100},
    {frame: 10, val: orbs.back.homeColor, time: orbs.yFrames*100}
  ];

  var ret = {};
  ret.orbs = orbs;
  ret.bounds = bounds;
  // window.alert(JSON.stringify(ret));
  return ret;
}



//Animate the loading indicator
setInterval(function () {

  //Update loading box position relative to current modal
  if($(".ns-modal-loading").css("visibility") == "visible") {
    var curModal = $(".ns-modal");
    var loadingBox = $(".ns-modal-loading");
    var marginTop = 8;
    var marginX = 8;
    var yDest = Math.round(($(window).height()/2) - ((curModal.height()/2)+parseInt(curModal.css("padding-top"))))+marginTop+"px";

    //If the height/position of the login window has changed, re-calculate keyframe
    //coordinates of orb animations to match new size
    if(loadingBox.css("top") != yDest) {
      // console.log("BEFORE yDest: "+loadingBox.height()+", loadingBox top:"+loadingBox.css("top"));

      loadingBox.css({
        top: yDest,
        width: parseInt(curModal.css("width")) - (marginX*2) + "px"
      });
      var aVals = getAnimVals(bounds, orbs, divBox);
      bounds = aVals.bounds;
      orbs = aVals.orbs;

      // console.log("AFTER yDest: "+yDest+", loadingBox top:"+loadingBox.css("top"));
    }
  }

  //Set both orbs' home location on first time animation reset
  if(loadStep == 0) {
    var aVals = getAnimVals(bounds, orbs, divBox);
    bounds = aVals.bounds;
    orbs = aVals.orbs;

    for(var i = 1; i <= 2; i++) {
      $(orbs.key(i).div).css({
        backgroundColor: orbs.key(i).color[0].val,
        left: (bounds.marginX+orbs.key(i).x1[0].val).toString()+"px",
        width: (orbs.key(i).x2[0].val).toString()+"px",
        top: (Math.round(bounds.height/2)+(orbs.key(i).offsetTransY*orbs.diameter)+orbs.key(i).y1[0].val).toString()+"px",
        height: orbs.diameter
      });
    }
    loadStep = 1;
    // window.alert("First loadStep, back orb left prop: "+(bounds.marginX+orbs.key(2).x1[0].val));
  }

  //For loop to iterate through orbs' x and y keyframes and apply anim calls if for current keyframe
  //i: Iterate through the (2) orbs -- orbs.key(i).???
  for(var i = 1; i <= 2; i++) {
    var curOrb = orbs[(i == 1 ? "front" : "back")]; //Keys of current orb as an array
    //j: Iterate through animated properties -- curOrb[aName[j]]
    for(var j = 0; j < aName.length; j++) {
      //k: Iterate through per-frame values of current property -- (curOrb[j])[k].???
      for(var k = 0; k < curOrb[aName[j]].length; k++) {

        //If this animation needs to start on the current frame
        if((curOrb[aName[j]])[k].frame == loadStep && $(divBox).css("visibility") == "visible") {
          var fVal = (curOrb[aName[j]])[k].val;
          var fTime = (curOrb[aName[j]])[k].time;
          //console.log("Orb #"+i+", "+aName[j]+" Frame "+loadStep.toString());

          switch(aName[j]) { //Act according to property being animated
            case "color": //Color
              var t = orbs.key(i).div;
              $(t).animate({
                backgroundColor: fVal
              },{
                queue: false, //This is IMPORTANT, allows multiple simultaneous animations
                duration: fTime,
                complete: (function(t, fVal) {
                  // window.alert("Target: "+t+", Color: "+col);
                  $(t).css("z-index", (fVal == orbs.back.homeColor ? 5 : 6));
                  //window.alert("Target: "+t+", Color: "+fVal);
                })(t,fVal)
              });
              //window.alert("Target: "+t+", Color: "+fVal);
            break;
            case "x1": //x1
              $(orbs.key(i).div).animate({
                left: (bounds.marginX+fVal).toString()+"px"
              },{
                queue: false,
                duration: fTime
              });
            break;
            case "x2": //x2
              $(orbs.key(i).div).animate({
                width: (fVal).toString()+"px"
              },{
                queue: false,
                duration: fTime
              });
            break;
            case "y1": //y1
              $(orbs.key(i).div).animate({
                top: (Math.round(bounds.height/2)+(orbs.key(i).offsetTransY*orbs.diameter)+fVal).toString()+"px"
              },{
                queue: false,
                duration: fTime
              });
            break;
            case "y2": //y2
              $(orbs.key(i).div).animate({
                height: orbs.diameter
              },{
                queue: false,
                duration: fTime
              });
            break;
            default:
            break;
          }
        }
      }
    }
  }

  //Advance the animation frame (only) when the loading indicator is visible
  if($(divBox).css("visibility") == "visible") {
    if(++loadStep > loopTimeframe) {
      loadStep = 1;
    }
  }
}, 100);
