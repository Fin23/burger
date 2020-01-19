/* handler for the signup form's onsubmit event */
function onSignupFormSubmit() {
    /*
      Decide what your minimum allowable password score is and disallow if less.
      You can check the current score using the CurrentPasswordScore property.
    */
    if (Enzoic.currentPasswordScore < Enzoic.PASSWORD_STRENGTH.Strong) {
        showToast('Entered password is not strong enough.');
        return false;
    }

    return true;
};

function showToast(msg) {
    var toastEl = document.getElementById('resultToast');
    var toastMsg = document.getElementById('resultToastMsg');
    toastMsg.innerHTML = msg;
    toastEl.className += ' fail';

    // hide toast
    setTimeout(hideToast, 2000);
}

function hideToast() {
    var toastEl = document.getElementById('resultToast');

    toastEl.className =
        toastEl.className.replace('fail', '');
}

document.getElementById('signupForm').onsubmit = onSignupFormSubmit;