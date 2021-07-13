const closeButton = document.querySelector('.close-out-btn');
const flashWindow = document.querySelector('.flash-window');

closeButton.addEventListener('click', closeFlash);

function closeFlash() {
    flashWindow.style = 'display: none;';
};