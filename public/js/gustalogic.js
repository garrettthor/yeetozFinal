const meGustaBtn = document.querySelector('.megusta-btn');
const yeetBtn = document.querySelector('.yeet-btn');
const user = require('currentUser')

meGustaBtn.addEventListener('click', meGusta);
yeetBtn.addEventListener('click', yeet);

function meGusta() {
    alert(`me gusta clicked by ${user}`)
}

function yeet() {
    alert('yeet clicked')
}