



//=========== click box to un hide typed password on password reset page==========
function pwFunction() {
    var x = document.getElementById("password");
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}
//===============================================================================



//=========== click box to un hide typed confirm_password on password reset page==========
function pwFunction2() {
    var x = document.getElementById("confirm_password");
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}
//===============================================================================

//========== initial alert to tell user a code has been sent via text============
function alertFunction() {
    alert('an authentication code has been sent to your mobile device, please input your code on the next page ');
}
//================================================================================



//======================= if passwords match gives green message, if not gives red message===================
var check = function () {
    if (document.getElementById('password').value ==
        document.getElementById('confirm_password').value) {
        document.getElementById('message').style.color = 'green';
        document.getElementById('message').innerHTML = 'matching';
    } else {
        document.getElementById('message').style.color = 'red';
        document.getElementById('message').innerHTML = 'not matching';
    }
}
//========================================================================================================