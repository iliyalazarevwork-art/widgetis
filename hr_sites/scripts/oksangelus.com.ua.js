// source: https://oksangelus.com.ua/
// extracted: 2026-05-07T21:20:33.253Z
// scripts: 1

// === script #1 (length=847) ===
document.querySelector('.open-form-button').addEventListener('click', function(event) {
    event.preventDefault(); 
    var modalId = '#call-me'; 
    Modal.open(modalId); 
});


var Modal = {
    open: function(modalId) {
        var modal = document.querySelector(modalId);
        if (modal) {
            modal.style.display = 'flex'; 
        }
    },
    close: function(modalId) {
        var modal = document.querySelector(modalId);
        if (modal) {
            modal.style.display = 'none'; 
        }
    }
};

document.querySelector('.close-btn').addEventListener('click', function() {
    Modal.close('#call-me'); 
});

window.addEventListener('click', function(event) {
    var modal = document.getElementById('call-me');
    if (event.target === modal) {
        Modal.close('#call-me');
    }
});
