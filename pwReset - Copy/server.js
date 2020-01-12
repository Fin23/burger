// Dependencies
// =============================================================
const express = require("express");
const path = require('path');
const nunjucks = require("nunjucks");
const app = express();
//==============================================================

// Sets up the Express App
// =============================================================
var PORT = process.env.PORT || 8080;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//===============================================================

//static file set up
//===========================================================
app.use(express.static("views"));
//===========================================================

//template engine set up
//============================================================
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





//Routes
//=============================================================
app.get('/index', function (req, res) {

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
    res.render('p1.html', data);
});
//app.get('/contact', function (req, res) {
//    var data = {
//        pageName: 'contact',
//        firstName: 'Dynamic',
//        lastName: 'can I get yo numba'
//    };
//    res.render('contact-us.html', data);
//});
//app.get('/services', function (req, res) {
//    var data = {
//        pageName: 'services',
//        firstName: 'services',
//        lastName: 'username'
//    };

//    res.render('services.html', data);
//});
//app.get('/overview', function (req, res) {
//    var data = {
//        pageName: 'overview',
//        firstName: 'overview',
//        lastName: 'hi'
//    };

//    res.render('overview.html', data);
//});
//app.get('/about', function (req, res) {
//    var data = {
//        pageName: 'about',
//        firstName: 'about',
//        lastName: 'netsolus'
//    };

//    res.render('about.html', data);
//});
//app.get('/clients', function (req, res) {
//    var data = {
//        pageName: 'clients',
//        firstName: 'clients',
//        lastName: 'payMe'
//    };

//    res.render('clients.html', data);
//});
//==============================================================


//set up listening port
//=============================================================
app.listen(PORT, function () {
    console.log("App listening on PORT " + PORT);
});
//=============================================================


//random Javascript / ignore 
//================================================================
var x = 100;
var y = 222;

function add(x, y) {
    return x + y;
}

console.log(add(x, y));