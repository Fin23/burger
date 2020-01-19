
// ==================== Dependencies ================================
const express = require("express");
const path = require('path');
const nunjucks = require("nunjucks");
const app = express();

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const TotpStrategy = require('passport-totp').Strategy;

const speakeasy = require('speakeasy');
const BodyParser = require("body-parser");
const QRCode = require('qrcode');

const messagebird = require('messagebird')
    // this is a test access string and will not actually send the message but will print in console and run the code as if it was a production level access key, 
    ('GT8WT6jTnxZ7rpYkX0O9mTh6t');
//==============================================================


// =================== Sets up the Express App ====================
var PORT = process.env.PORT || 8080;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//===============================================================


//===================== static file set up =========================
app.use(express.static("views"));

//===========================================================


//======================== template engine set up ============================
//app.set makes it so i don't need to include the .njk file extension
//instead i can just use index or other file name
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
//Apply nunjucks and add custom filter and function (for example). 
var env = nunjucks.configure(['views/'], { // set folders with templates
    autoescape: true,
    express: app,
    trimBlocks: true,
    lstripBlocks: true
});
//async filters must be known at compile-time
env.addFilter('myFilter', function (obj, arg1, arg2) {
    console.log('myFilter', obj, arg1, arg2);
    // Do smth with obj
    return obj;
});
env.addGlobal('myFunc', function (obj, arg1) {
    console.log('myFunc', obj, arg1);
    // Do smth with obj
    return obj;
});
nunjucks.precompile('views', { env: env });
//==============================================================


//========== two step authentication ============================
// Generate a secret key.
//app.post("/totp-secret", (reqest, response, next) => {
//});
var secret = speakeasy.generateSecret({
    name: "TEST",
    length: 20
});
console.log(secret);
//response.send({ "secret": secret.base32 })
//console.log(secret);
QRCode.toDataURL(secret.otpauth_url, function (err, data) {
    //console.log(data, secret);
});


//const speakeasy = require("speakeasy");


//var token = speakeasy.totp({
//    secret: secret.base32,
//    encoding: 'base32'
//});
//console.log("token number: ", token);
 //Returns token for the secret at the current time
 //Compare this to user input
 //Verify a given token
//var tokenValidates = speakeasy.totp.verify({
//    secret: secret.base32,
//    encoding: 'base32',
//    token: 'token',
//    window: 6
//});
//console.log("did token validate: ",tokenValidates);
//// Use otpauthURL() to get a custom authentication URL for SHA512
//var url = speakeasy.otpauthURL({ secret: secret.ascii, label: 'Name of Secret', algorithm: 'sha512' });
//// Get the data URL of the authenticator URL
// Returns true if the token matches
// end of auth enrollment step 
//================================================================


// ================= send sms for verification with message bird =============
messagebird.messages.create({
    originator: 'SDKDemo',
    recipients: ['1816-456-8980'],
    body: 'Hi! This is your first message, this is a test'
},
    function (err, response) {
        if (err) {
            console.log("ERROR:");
            console.log(err);
        } else {
            console.log("SUCCESS:");
            console.log(response);
        }
    });
//=====================end of message bird=======================



//======================= Routes ==================================
app.get('/pwSetUp', function (req, res) {
    var data = {
        pageName: 'index',
        firstName: 'Ross',
        lastName: 'Jameson',
        sunny: true,
        posts: [{ 'title': '(1) Technology in 2019', 'author': 'Jameson' },
        { 'title': '(2) Dune', 'author': 'Herbert' },
        { 'title': '(3) Jinja/nunjucks practice', 'author': 'horton' },
        { 'title': '(4) Expansion of oil in Russia', 'author': 'Bob' }]
    };
    res.render('pwSetUp.html', data);
});
app.get('/', function (req, res) {
    var data = {
        pageName: 'index',
        firstName: 'Ross',
        lastName: 'Jameson',
        sunny: true,
        posts: [{ 'title': '(1) Technology in 2019', 'author': 'Jameson' },
        { 'title': '(2) Dune', 'author': 'Herbert' },
        { 'title': '(3) Jinja/nunjucks practice', 'author': 'horton' },
        { 'title': '(4) Expansion of oil in Russia', 'author': 'Bob' }]
    };
    res.render('index.html', data);
});
//app.get('/contact', function (req, res) {
//    var data = {
//        pageName: 'contact',
//        firstName: 'Dynamic',
//        lastName: 'can I get yo numba'
//    };
//    res.render('contact-us.html', data);
//});
//==============================================================



//=========================== listening port ==================
app.listen(PORT, function () {
    console.log("Server app on PORT " + PORT);
});
//=============================================================


