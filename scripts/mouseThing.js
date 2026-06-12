let targetX = 50;
let targetY = 50;
let currentX = 50;
let currentY = 50;

document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth) * 100;
    targetY = (e.clientY / window.innerHeight) * 100;
});

function smoothFollow() {
    const speed = 0.01;
    currentX += (targetX - currentX) * speed;
    currentY += (targetY - currentY) * speed;
    document.documentElement.style.setProperty('--mouse-x', currentX + '%');
    document.documentElement.style.setProperty('--mouse-y', currentY + '%');

    requestAnimationFrame(smoothFollow);
}
smoothFollow();