const preDeleteBtn = document.querySelector('.delete-btn');
const cancelBtn = document.querySelector('.cncl-btn-modal');

preDeleteBtn.addEventListener('click', openModal);

function openModal() {
    document.querySelector('.modal').style = 'display: block;';

};

cancelBtn.addEventListener('click', cancelDel);

function cancelDel() {
    document.querySelector('.modal').style = 'display: none;';
};