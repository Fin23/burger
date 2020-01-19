const speakeasy = require("speakeasy");

var verified = speakeasy.totp.verify({
    secret: '^E3?lE!KH/a/OiX&I<v0',
    encoding: 'ascii',
    token: '238565'
});

console.log(verified);