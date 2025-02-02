document.addEventListener("DOMContentLoaded", () => {
    const toggleContainer = document.getElementById("theme-toggle");
    const body = document.body;

    toggleContainer.addEventListener("click", () => {
        if (body.classList.contains("dark-mode")) {
            body.classList.remove("dark-mode");
            body.classList.add("light-mode");
        } else {
            body.classList.remove("light-mode");
            body.classList.add("dark-mode");
        }
    });
});

// 요소를 선택
const introText = document.querySelector('.intro-text');

// 애니메이션이 끝난 후 finished 클래스를 추가하는 이벤트 리스너
introText.addEventListener('animationend', () => {
    introText.classList.add('finished');
});

