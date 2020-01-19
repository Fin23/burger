var modalHeader = ".ns-modal > h2";
//Things that update the position of the account indicator
var $curModal = $(".ns-modal")[0];
var lastSize = {
  width: $(".ns-modal").width(),
  height: Math.ceil($(".ns-modal").height())
};
var strength = { //For password strength meter
  0: "Unsafe",
  1: "Poor",
  2: "Weak",
  3: "Secure",
  4: "Strong"
}
var serverSession = "00000000"; //Current session's ID
var serverResults = null;
//Info about the most recent call to the server
var callParams = null;
var need2fa = 0; //Will be filled from server after email submission
//Stand-in variables for server-side operations
var server_failCount = 0;
var server_need2fa = true;


$(document).ready(function() {

  window.setTimeout(function () {
  AOS.init( {
      // uncomment below for on-scroll animations to played only once
      // once: true
    }); // initialize animate on scroll library
  }, 300);

  //Ensure proper placement of floating elements e.g. account indicator
  $(window).resize();

}); //End page load functions

// Light Box
$(document).on("click", '[data-toggle="lightbox"]', function(event) {
  event.preventDefault();
  $(this).ekkoLightbox();
});


//Uses distinct cues to determine whether a device is mobile
function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
};

//Retrieve the page filename as a string, excluding the extension
function pageName() {
  var temp = window.location.pathname.split(".");
  if(temp.length > 1) {
    temp = temp[temp.length-2].split("/");
    return temp[temp.length-1];
  }
  else {return "index";}
};

//Return the vertical offset of a given element (by ID) relative to page 1/3rd point
//Helps identify which page section is currently in view
function idHotOffset(ident, divisor) {
  var result = 0;
  divisor = (divisor ? divisor : 3); //Divisor defaults to 3 if not specified
  try {
    result = $(ident).offset().top - ($(window).scrollTop() + Math.ceil( $(window).height()/divisor ));
    return result;
  }
  catch(err) {
    //No need to actually do anything with the error
  }
};

//Test whether the cursor is within the triggering div/parent element
function cursorInBounds() {
  var boundOb = $(event.currentTarget);
  try {boundOb.offset();} catch {return false;}
  var xTest = boundOb.offset().left;
  var yTest = boundOb.offset().top;

  if(event.pageX >= xTest && event.pageY >= yTest && event.pageX <= xTest+boundOb.width() && event.pageY <= yTest+boundOb.height()) {
    return true;
  }
  return false;
};

//Shorthand an oft-used debugging tool
function stringAlert(str) {
  window.alert(JSON.stringify(str));
}

//A quick trigger for the Bootstrap modal
function bsModal(title, body) {
  $("#modal-general-title").text(title);
  $("#modal-general-body").text(body);
  $("#modal-general").modal('show');
}


//Initiate the loading animation
function setLoading(state, modalThis) {
  if(state) {
    //Yes, this is a copypasta of loadStep 0 from animatedLoading.js, but is needed to prevent ugly animation startup
    $(divBox).css({
      width: (parseInt($(".ns-modal").css("width")) - ((8)*2)) + "px"
    });
    //Section above added from general animation step, needed to update loading div width
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

    // Show the loading animation
    $(".ns-modal-loading").css({
      visibility: "visible",
      opacity: 1
    });
    $(".menu-dimmer").css({ //Prevent interaction during load
      visibility: "visible"
    });
    $(".ns-account").css({
      opacity: 0.7
    });
    $(modalThis).css({
      transition: "opacity .6s"
    });
    $(modalThis).css({
      opacity: 0.7
    });
  }
  else {
    //Hide the loading anim
    $(".ns-modal-loading").css({
      visibility: "hidden",
      opacity: 0
    });
    $(".menu-dimmer").css({
      visibility: "hidden"
    });
    $(".ns-account").css({
      opacity: 1
    });
    $(modalThis).css({
      transition: "opacity .2s"
    });
    $(modalThis).css({
      opacity: 1
    });
  }
}

//Debug stand-in for calls to backend server (acts as server, fake responses)
function fakeFetch(toServer) {
  //DEBUG: Show values sent TO server
  console.log("toServer: " + JSON.stringify(toServer));

  window.setTimeout(function() { //Fake load time, for now
    //Set result vars based on request id + tests on supplied data
    switch(toServer.RID) {
      //E-mail submitted for login (RID, email)
      case 0:
        serverResults = {
          RID: toServer.RID,
          SID: "12345678", //A new session ID
          verified: (toServer.email == "rjameson@netsolus.com"), //Account with this email address exists?
          authEnabled: server_need2fa, //This account has 2FA enabled?
          pwExpired: true, //This account's password has expired?
          attemptsFailed: 0 //Number of failed attempts logging into this acct.
        };
      break;
      //Password submitted for login (RID, SID, password, auth)
      case 1:
        var verifyResult = true;
        //If password or 2fa code (where required) do not match
        if(toServer.password != "test123" || (server_need2fa && toServer.auth != "123456")) {
          verifyResult = false;
          server_failCount++;
        }
        serverResults = {
          RID: toServer.RID,
          verified: verifyResult,
          attemptsFailed: server_failCount
        };
      break;
      //Before password-options, confirm cell exists for SMS (RID, SID)
      case 2:
        serverResults = {
          RID: toServer.RID,
          smsLastThree: "980"
        };
      break;
      //Recovery option: current password (RID, SID, password)
      case 3:
        serverResults = {
          RID: toServer.RID,
          verified: (toServer.password == "test123")
        };
      break;
      //Recovery option: SMS code (RID, SID)
      case 4:
        serverResults = {
          RID: toServer.RID,
          codeSent: true
        };
      break;
      //SMS submitted for reset (RID, SID, code)
      case 5:
        serverResults = {
            RID: toServer.RID,
            //test sms code 
          verified: (toServer.code == "123456")
        };
      break;
      //New password submitted (RID, SID, password)
      case 6:
        serverResults = {
          RID: toServer.RID,
          passChanged: true
        };
      break;
      //A bad/expired session means server only sends an RID of 99 TO CLIENT,
      //and no other data. The user is then logged out (if applicable) and
      //returned to Login home.
      default:
      break;
    }
    //Call dataIn
    setLoading(0, callParams.modalThis);
    dataIn(serverResults);
    serverResults = null;
  }, 1200);
}

//Debug stand-in call for data received from backend server
function dataIn(results) {
  var acctText = "";
  var acctShow = 0;

  console.log("dataIn: " + JSON.stringify(results));


  //Act based on the type of request being returned for
  switch(results.RID) {
    //EVENT: E-mail submitted for login
    case 0:
      //If server confirmed account existence
      if(results.verified) {
        serverSession = results.SID;
        acctShow = 1; //Set flag to show the account indicator
        //Set the account indicator text
        if($("#tbox-email")[0].value) {
          acctText = $("#tbox-email")[0].value;
        }

        //If needed, show the expired password popup and change modalNext to password-options
        if(results.pwExpired) {
          $("#modal-pass-expired").modal('show');
          $("#expired-acct").text(acctText);
          callParams.modalNext = "#password-options";
        }
        //If 2fa enabled for this account, show the 2fa entry box
        if(results.authEnabled) {
          need2fa = 1;
          $("#section-2fa").removeClass("d-none");
        }
        //If attempt counter is on last attempt, show warning
        if($("#warn-lockout").hasClass("d-none") && results.attemptsFailed == 2) {
          $("#warn-lockout").removeClass("d-none");
        }
        //If account locked out, change modalNext to login-lockout
        if(results.attemptsFailed >= 3) {
          callParams.modalNext = "#login-lockout";
        }

        //Debug the "session expired" notification - 30 secs after email submission
        // setTimeout(function(){
        //   dataIn({RID: 99});
        // },30000);
      }
      //Otherwise, prevent transition to next page
      else {
        callParams.modalNext = null;
        $("#tbox-email").removeClass("border-dark");
        $("#tbox-email").addClass("border-danger");
        // #("#tbox-email")[0].value = "";
        $("#tbox-email")[0].focus();
        $("#warn-no-account").removeClass("d-none");
      }
    break;

    //EVENT: Password submitted for login
    case 1:
      //Password correct
      if(results.verified) {
        window.alert("Password correct -- direct to Stem landing page.");
        //modalNext = "#password-reset";
      }
      else {
        //There are attempts remaining
        if(results.attemptsFailed < 3) {
          $("#login-pass")[0].value = "";
          $("#tbox-2fa")[0].value = "";
          if(!($("#submit-pw").hasClass("disabled"))) {
            $("#login-pass").removeClass("border-dark");
            $("#login-pass").addClass("border-danger");
            $("#login-pass")[0].focus();
            $("#tbox-2fa").removeClass("border-dark");
            $("#tbox-2fa").addClass("border-danger");
            $("#submit-pw").attr("disabled", "");
            $("#warn-wrong-password").removeClass("d-none");
          }
          if($("#warn-lockout").hasClass("d-none") && results.attemptsFailed == 2) {
            $("#warn-lockout").removeClass("d-none");
          }
        }
        //This was the last failed attempt - lock out
        else {
          callParams.modalNext = "#login-lockout";
        }
      }
    break;

    //EVENT: Before password-options, confirm cell exists for SMS
    case 2:
      //Enable the SMS option if account has phone number
      if(results.smsLastThree != "") {
        $("#rad-sms").removeAttr("disabled");
        $("#pw-options-phone").removeClass("d-none");
        $("#text-sms-three")[0].innerHTML = results.smsLastThree;
        $("#pw-options-disabled").addClass("d-none");
      }
      else {
        $("#rad-sms").attr("disabled", "");
        $("#pw-options-phone").addClass("d-none");
        $("#pw-options-disabled").removeClass("d-none");
      }
    break;

    //EVENT: Transition away from password-options
    //Option A: Enter current password
    case 3:
      // Check server-side test result
      if(results.verified) {
        callParams.modalNext = "#password-reset";
      }
      else {
        $("#warn-wrong-current").removeClass("d-none");
        $("#reset-auth-pass")[0].value = "";
        $("#reset-auth-pass").removeClass("border-dark");
        $("#reset-auth-pass").addClass("border-danger");
        $("#reset-auth-pass")[0].focus();
      }
    break;
    //Option B: Verify a code sent by SMS
    case 4:
      // window.alert("PASS");
      if(results.codeSent) {
        //If we're not already on the SMS verification page
        if(callParams.modalThis != "#password-option-sms") {
          callParams.modalNext = "#password-option-sms";
        }
        else {
          //Ensure we stay on the SMS verification page
          callParams.modalNext = null;
          bsModal("Resent SMS Verification Code",
            "When received, please submit the new code.");
          //Revert the warning styles around the code entry box
          $("#sms-code").removeClass("border-danger");
          $("#sms-code").addClass("border-dark");
          $("#warn-wrong-code").addClass("d-none");
          $("#sms-code")[0].value = "";
        }
      }
      else { //Failed to send the code by SMS, for whatever reason
        //Ensure we don't change modals
        callParams.modalNext = null;
        bsModal("SMS Failure",
          "The server was unable to text a verification code to the number on file for this account.");
      }
    break;

    //EVENT: Transition away from password-option-sms
    case 5:
      // Check result of server-side code test
      if(results.verified) {
        callParams.modalNext = "#password-reset";
      }
      else {
        $("#warn-wrong-code").removeClass("d-none");
        $("#sms-code").removeClass("border-dark");
        $("#sms-code").addClass("border-danger");
        $("#sms-code")[0].focus();
      }
    break;

    //EVENT: Password successfully changed
    case 6:
      if(results.passChanged) {
        bsModal("Password Change Success","This account has been updated. Please login using the new password.");
      }
      else {
        bsModal("Unable to Change Password","Please try again or contact Netsolus for further assistance.");
      }
      $('#modal-general').on('hidden.bs.modal', function (e) {
        window.location.reload();
      });
    break;

    //EVENT: Server response indicates bad or expired Session
    case 99:
      bsModal("Login Session Expired","You will be directed to the login homepage.");
      $('#modal-general').on('hidden.bs.modal', function (e) {
        window.location.reload();
      });
    break;
  }


  //Animate the modal transition
  if(callParams.modalNext) {
    var thisHeader = $(callParams.modalThis).find("h2")[0]; //Referenced for acct label x location (prior to modal transition)
    var nextHeader = $(callParams.modalNext).find("h2")[0]; //Referenced for acct label y location
    var thisInput = $(callParams.modalThis).find(".ns-primary-input")[0]; //Referenced for acct label start x/y location
    var nextInput = $(callParams.modalNext).find(".ns-primary-input")[0]; //Sets focus if next modal has primary input
    var nextStartX = $(callParams.modalThis).offset().left + $(callParams.modalThis).outerWidth() + ($(callParams.modalNext).outerWidth()/2) + 16;
    var thisEndX = $(callParams.modalThis).offset().left - ($(callParams.modalNext).outerWidth()/2) - 16;
    var acctTop = $(nextHeader).offset().top + $(nextHeader).outerHeight() + 16;
    var acctLeft = $(thisHeader).offset().left + ($(thisHeader).outerWidth() / 2);

      //New modal
    $(callParams.modalNext).removeClass("ns-modal-hidden");
    $(callParams.modalNext).addClass("ns-modal");
    $(callParams.modalNext).css("left", nextStartX);
    $(callParams.modalNext).animate({"left": "50%"}, 200, "linear");
    if(nextInput) {
      nextInput.focus();
    }
      //Old modal
    $(callParams.modalThis).css("opacity", 0);
    $(callParams.modalThis).animate({"left": thisEndX}, 200, "linear");
    //Wrapping the following with a function to pass callParams and
    //make it accessible in the new scope.
    (function(callParams) {
      window.setTimeout(function() {
        $(callParams.modalThis).css("opacity", ""); //Cut out the overriding css value from the previous animation
        $(callParams.modalThis).removeClass("ns-modal");
        $(callParams.modalThis).addClass("ns-modal-hidden");
      }, 200);
    })(callParams);
      //Account indicator, if needed
    if(acctShow) {
      //Yes, this IS the same test as below -- this part needs to come before the next 3 lines
      $(".ns-account > inline").text(acctText);
    }
    //Before mimicking the password input box, capture what the final div dimensions will be
    var acctWidth = $(".ns-account").outerWidth();
    var acctHeight = $(".ns-account").outerHeight();

    //If the acctShow flag is true, show the account indicator
    if(acctShow) {
      //Make the div appear as the shape and size of the password box
      $(".ns-account").css({
        "opacity": 1,
        "visibility": "visible",
        "left": ($(thisInput).offset().left + ($(thisInput).outerWidth/2)) + "px",
        "top": $(thisInput).offset().top + "px",
        "width": $(thisInput).outerWidth() + "px",
        "height": $(thisInput).outerHeight() + "px",
        "text-align": "left",
        "padding-top": ($(thisInput).outerHeight()/5) + "px",
        "bottom": "auto",
      });
    }
      //Always re-adjust account indicator's position if it is visible
    if($(".ns-account").css("visibility") == "visible") {
      $(".ns-account").animate({
        "left": acctLeft + "px",
        "top": acctTop + "px",
        "width": acctWidth + "px",
        "height": acctHeight + "px",
        "padding-top": "0"
      }, 200);
    } //End of account indicator

  }
  // else {
  //   setLoading(0, callParams.modalThis);
  //   serverResults = null;
  // }

  callParams = null;
}


//Enter key event on textboxes, for nav buttons
$(".ns-modal-input > input").keyup(function(event){
  var modalThis = "#" + $(this).parents(".ns-modal")[0].id;
  var modalBtn = $(modalThis).find(".ns-primary-btn")[0];
  if(event.which == 13 && modalBtn) {
      modalBtn.click();
  }
  // Make sure the form isn't submitted
  event.preventDefault();
});
//Key events on selectors (e.g. radio buttons)
$(".ns-modal-selection > input").keyup(function(event){
  var modalThis = "#" + $(this).parents(".ns-modal")[0].id;
  var modalBtn = $(modalThis).find(".ns-primary-btn")[0];
  //Enter key for nav buttons
  if(event.which == 13 && modalBtn) {
      modalBtn.click();
  }
  //Spacebar for this selector
  if(event.which == 32) {
      $(this).prop("checked", true).trigger("click");
  }
  // Make sure the form isn't submitted
  event.preventDefault();
});

//Modal nav button events
$(".ns-btn-nav").click(function () {
  var toServer = null;
  callParams = { //Used here and by dataIn() for context
    modalThis: "#" + $(this).parents(".ns-modal")[0].id, //Modal to transition away from
    modalNext: this.getAttribute("data-nav-to"), //Modal transitioning to
    btnId: $(this)[0].id //ID of the button clicked
  };


  //CASE: E-mail submitted for login
  if(callParams.modalThis == "#login-email" && callParams.modalNext == "#login-password") {
    // >> Send to server: RID 0, E-mail address
    toServer = {
      RID: 0,
      email: $(callParams.modalThis).find(".ns-primary-input")[0].value
    };
    // << Before continuing, wait for: E-mail existence conf.
  }

  //CASE: Password submitted for login
  if(callParams.modalThis == "#login-password" && callParams.btnId == "submit-pw") {
    // >> Send to server: RID 1, Session ID, pw entry, 2FA entry where applicable
    toServer = {
      RID: 1,
      SID: serverSession,
      password: $("#login-pass")[0].value,
      auth: $("#tbox-2fa")[0].value
    };
    // << Before continuing, wait for: Password (& maybe 2FA) entry conf.
  }


  //CASE: Before password-options, confirm cell exists for SMS
  if(callParams.modalNext == "#password-options") {
    // >> Send to server: RID 2, SID
    toServer = {
      RID: 2,
      SID: serverSession
    };
    // << Before continuing, wait for: Last 3 digits of SMS, if appl.
  }

  //CASE: Multi-action - from password-options
  if(callParams.modalThis == "#password-options") {
    //Option A: Enter current password
    if($("#rad-current-pw").prop("checked")) {
      // >> Send to server: RID 3, Session ID, current pw entry
      toServer = {
        RID: 3,
        SID: serverSession,
        password: $("#reset-auth-pass")[0].value
      };
      // << Before continuing, wait for: Correct pw submitted conf.
    }
    //Option B: Verify a code sent by SMS
    else if($("#rad-sms").prop("checked")) {
      // >> Send to server: RID 4, Session ID
      toServer = {
        RID: 4,
        SID: serverSession
      };
      // << Before continuing, wait for: SMS sent conf.
      callParams.modalNext = "#password-option-sms";
    }
    //Option C: Open a helpdesk ticket
    else if($("#rad-new-ticket").prop("checked")) {
      // Nothing sent to server here, move on immediately
      callParams.modalNext = "#password-option-ticket";
    }
  }

  //CASE: From SMS verification...
  if(callParams.modalThis == "#password-option-sms") {
    //CASE: SMS code submitted for reset
    if(callParams.btnId == "sms-btn"){
      // >> Send to server: RID 5, Session ID, current sms code entry
      toServer = {
        RID: 5,
        SID: serverSession,
        code: $("#sms-code")[0].value
      };
      // << Before continuing, wait for: SMS code entry conf.
    }
    else if(callParams.btnId == "nav-sms-resend") {
      //Ensure we stay in this modal
      callParams.modalNext = null;
      // >> Send to server: RID 4, Session ID
      toServer = {
        RID: 4,
        SID: serverSession
      };
    }
  }

  //CASE: From password reset
  if(callParams.modalThis == "#password-reset") {
    // >> Send to server: RID 6, Session ID, new password
    toServer = {
      RID: 6,
      SID: serverSession,
      password: $("#reset-new")[0].value
    };
  }


  //Initiate the loading animation, communicate with server
  if(toServer != null) {
    setLoading(1, callParams.modalThis);
    fakeFetch(toServer);
  }
  //Skip loading animation if server comm. not needed
  else {
    dataIn({});
  }
});

//Show password toggle button
$(".ns-pass-toggle").click(function () {
  var showPass = $(this).children(".fa-eye")[0];
  var hidePass = $(this).children(".fa-eye-slash")[0];

  if(showPass) {
    $(showPass).removeClass("fa-eye").addClass("fa-eye-slash");
    $(this).siblings("input").attr("type","password");
  }
  else if(hidePass) {
    $(hidePass).removeClass("fa-eye-slash").addClass("fa-eye");
    $(this).siblings("input").attr("type","text");
  }
});


//Keep position of .ns-account updated
$(window).resize(function() {
  var setTop = $(modalHeader).offset().top + $(modalHeader).outerHeight() + 16;
  var setLeft = $(modalHeader).offset().left + ($(modalHeader).outerWidth() / 2);
  $(".ns-account").css({
    "left": setLeft + "px",
    "top": setTop + "px",
    "bottom": "auto",
    "-webkit-transform": "translate(-50%, 0%)",
    "-moz-transform": "translate(-50%, 0%)",
    "-ms-transform": "translate(-50%, 0%)",
    "transform": "translate(-50%, 0%)"
  });
});

//Account indicator: keep in the correct position
setInterval(function () {
  var curSize = {
    width: $(".ns-modal").width(),
    height: Math.ceil($(".ns-modal").height())
  };

  // console.log("curSize: " + JSON.stringify(curSize));
  // console.log("lastSize: " + JSON.stringify(lastSize));

  if(JSON.stringify(curSize) != JSON.stringify(lastSize) && $(".ns-account").css("visibility") == "visible" && !($(".ns-account").is(":animated")) && !callParams) {
    //stringAlert($curModal.id);
    lastSize = curSize;
    $curModal = $(".ns-modal")[0];
    var modalThis = "#" + $curModal.id;
    var thisHeader = $(modalThis).find("h2")[0];
    var acctLeft = $(thisHeader).offset().left + ($(thisHeader).outerWidth() / 2);
    var acctTop = $(thisHeader).offset().top + $(thisHeader).outerHeight() + 16;

    //Adjust account indicator's position
    $(".ns-account").animate({
      "left": acctLeft + "px",
      "top": acctTop + "px",
      "padding-top": "0"
    }, 200);
  }

  //React if serverResults object has become populated
  //This won't be used really until actual server comm, maybe?
  // if(serverResults != null) {
  //   setLoading(0, callParams.modalThis);
  //   dataIn(serverResults);
  //   serverResults = null;
  // }

  //setTimeout(updateAccountInd, 100);
}, 100);


//Login Email Modal: On textbox change
$("#tbox-email")[0].addEventListener('input', function() {
  var email = $("#tbox-email")[0].value;

  //Disable the confirm button if the code entered is fewer than 6 characters
  if(email.includes("@") && email.includes(".")) {
    if($("#email-btn")[0].hasAttribute("disabled")) {
      $("#email-btn").removeAttr("disabled");
    }
  }
  else if(!($("#email-btn")[0].hasAttribute("disabled"))) {
    $("#email-btn").attr("disabled", "");
  }
});

//Login Password Modal: On password change
$("#login-pass")[0].addEventListener('input', function() {
  var pass = $("#login-pass")[0].value;
  var auth = $("#tbox-2fa")[0].value;

  //Disable the confirm button if the code entered is fewer than 6 characters
  if(pass.length > 0 && (auth.length >= 6 || !need2fa)) {
    if($("#submit-pw")[0].hasAttribute("disabled")) {
      $("#submit-pw").removeAttr("disabled");
    }
  }
  else if(!($("#submit-pw")[0].hasAttribute("disabled"))) {
    $("#submit-pw").attr("disabled", "");
  }
});
//Login Password Modal: On 2fa change
$("#tbox-2fa")[0].addEventListener('input', function() {
  var pass = $("#login-pass")[0].value;
  var auth = $("#tbox-2fa")[0].value;

  //Disable the confirm button if the code entered is fewer than 6 characters
  if(pass.length > 0 && (auth.length >= 6 || !need2fa)) {
    if($("#submit-pw")[0].hasAttribute("disabled")) {
      $("#submit-pw").removeAttr("disabled");
    }
  }
  else if(!($("#submit-pw")[0].hasAttribute("disabled"))) {
    $("#submit-pw").attr("disabled", "");
  }
});

//SMS Modal: On sms code text change
$("#sms-code")[0].addEventListener('input', function() {
  var code = $("#sms-code")[0].value;

  //Disable the confirm button if the code entered is fewer than 6 characters
  if(code.length >= 6) {
    if($("#sms-btn")[0].hasAttribute("disabled")) {
      $("#sms-btn").removeAttr("disabled");
    }
  }
  else if(!($("#sms-btn")[0].hasAttribute("disabled"))) {
    $("#sms-btn").attr("disabled", "");
  }
});

//Password Reset Modal: On password text change
$("#reset-new")[0].addEventListener('input', function() {
  var pass = $("#reset-new")[0].value;
  var passVerify = $("#reset-verify")[0].value;
  var result = zxcvbn(pass);

  // Update the password strength meter
  $("#password-strength-meter")[0].value = result.score + 1;

  //Hide the strength meter if no password has been entered
  if(pass) {
    $("#password-strength-meter").css("display", "block");
    $("#password-strength-text").css("display", "block");
    $("#password-strength-text")[0].innerHTML = "Password strength: <strong>" + strength[result.score] + "</strong>";
  }
  else {
    $("#password-strength-meter").css("display", "");
    $("#password-strength-text").css("display", "");
  }

  //Disable the reset button if the password strength is lower than "Secure"
  if(result.score >= 3 && pass == passVerify) {
    if($("#reset-btn")[0].hasAttribute("disabled")) {
      $("#reset-btn").removeAttr("disabled");
    }
  }
  else if(!($("#reset-btn")[0].hasAttribute("disabled"))) {
    $("#reset-btn").attr("disabled", "");
  }
  //Show respective password strength notice when relevant
  if(!(pass == "" && passVerify == "")) {
    if(result.score < 3 && $("#notify-weak-password").hasClass("d-none")) {
      $("#notify-weak-password").removeClass("d-none");
      $("#notify-strong-password").addClass("d-none");
    }
    if(result.score >= 3 && $("#notify-strong-password").hasClass("d-none")) {
      $("#notify-strong-password").removeClass("d-none");
      $("#notify-weak-password").addClass("d-none");
    }
  }
  else if(!($("#notify-strong-password").hasClass("d-none")) || !($("#notify-weak-password").hasClass("d-none"))) {
    $("#notify-strong-password").addClass("d-none");
    $("#notify-weak-password").addClass("d-none");
  }
  //Show respective "passwords must match" message when relevant
  if(!(pass == "" && passVerify == "")) {
    if(pass != passVerify && $("#password-mismatch-text").hasClass("d-none")) {
      $("#password-mismatch-text").removeClass("d-none");
      $("#password-match-text").addClass("d-none");
    }
    if(pass == passVerify && $("#password-match-text").hasClass("d-none")) {
      $("#password-match-text").removeClass("d-none");
      $("#password-mismatch-text").addClass("d-none");
    }
  }
  else if(!($("#password-match-text").hasClass("d-none")) || !($("#password-mismatch-text").hasClass("d-none"))) {
    $("#password-mismatch-text").addClass("d-none");
    $("#password-match-text").addClass("d-none");
  }
});

//Password Reset Modal: On password verification text change
$("#reset-verify")[0].addEventListener('input', function() {
  var pass = $("#reset-new")[0].value;
  var passVerify = $("#reset-verify")[0].value;
  var result = zxcvbn(pass);

  //Disable the reset button if the password strength is lower than "Secure"
  if(result.score >= 3 && pass == passVerify) {
    if($("#reset-btn")[0].hasAttribute("disabled")) {
      $("#reset-btn").removeAttr("disabled");
    }
  }
  else if(!($("#reset-btn")[0].hasAttribute("disabled"))) {
    $("#reset-btn").attr("disabled", "");
  }


  //Show respective "passwords must match" message when relevant
  if(!(pass == "" && passVerify == "")) {
    if(pass != passVerify && $("#password-mismatch-text").hasClass("d-none")) {
      $("#password-mismatch-text").removeClass("d-none");
      $("#password-match-text").addClass("d-none");
    }
    if(pass == passVerify && $("#password-match-text").hasClass("d-none")) {
      $("#password-match-text").removeClass("d-none");
      $("#password-mismatch-text").addClass("d-none");
    }
  }
  else if(!($("#password-match-text").hasClass("d-none")) || !($("#password-mismatch-text").hasClass("d-none"))) {
    $("#password-mismatch-text").addClass("d-none");
    $("#password-match-text").addClass("d-none");
  }
});


//Came with old bootstrap template..
window.setTimeout(function () {

    $('[data-toggle="tooltip"]').tooltip();

}, 10); //End many different functions
