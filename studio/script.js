const categories = [
    { id: "indoor-full", title: "전신샷 (내부)", count: 13, baseUrl: "https://cdn-dev.ohchung.com/temp/1/" },
    { id: "indoor-close", title: "상반신 근접 (내부)", count: 12, baseUrl: "https://cdn-dev.ohchung.com/temp/2/" },
    { id: "indoor-sofa", title: "소파 샷 (내부)", count: 9, baseUrl: "https://cdn-dev.ohchung.com/temp/3/" },
    { id: "indoor-floor", title: "바닥 샷 (내부)", count: 4, baseUrl: "https://cdn-dev.ohchung.com/temp/4/" },
    { id: "outdoor-full", title: "전신샷 (외부)", count: 3, baseUrl: "https://cdn-dev.ohchung.com/temp/5/" },
    { id: "confetti-black", title: "컨페티 & 블랙 컨셉", count: 6, baseUrl: "https://cdn-dev.ohchung.com/temp/6/" },
    { id: "bride-solo", title: "신부 단독 샷", count: 9, baseUrl: "https://cdn-dev.ohchung.com/temp/7/" }
];

const state = {
    view: "grid",
    activeId: categories[0].id,
    sliderCategoryId: null,
    sliderIndex: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isOpen: false,
    startDistance: 0,
    startScale: 1,
    dragOriginX: 0,
    dragOriginY: 0,
    activePointerId: null,
    pinchPointers: new Map()
};

const content = document.getElementById("content");
const categoryNav = document.getElementById("categoryNav");
const sectionTemplate = document.getElementById("sectionTemplate");
const cardTemplate = document.getElementById("cardTemplate");
const viewButtons = Array.from(document.querySelectorAll(".view-button"));
const bottomButtons = Array.from(document.querySelectorAll(".bottom-nav-button"));
const currentSectionButton = document.querySelector('[data-bottom-action="current"]');
const toggleViewButton = document.querySelector('[data-bottom-action="toggle"]');
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCategory = document.getElementById("lightboxCategory");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxViewport = document.getElementById("lightboxViewport");
const closeLightboxButton = document.getElementById("closeLightbox");
const zoomInButton = document.getElementById("zoomInButton");
const zoomOutButton = document.getElementById("zoomOutButton");
const sliderModal = document.getElementById("sliderModal");
const sliderImage = document.getElementById("sliderImage");
const sliderCategory = document.getElementById("sliderCategory");
const sliderCount = document.getElementById("sliderCount");
const sliderPrevButton = document.getElementById("sliderPrevButton");
const sliderNextButton = document.getElementById("sliderNextButton");
const closeSliderButton = document.getElementById("closeSlider");
const sliderStage = document.getElementById("sliderStage");
const sliderSwipeHint = document.getElementById("sliderSwipeHint");

let sliderTouchStartX = 0;
let sliderTouchStartY = 0;

function formatIndex(index) {
    return String(index).padStart(2, "0");
}

function getImageUrl(baseUrl, index) {
    return `${baseUrl}${formatIndex(index)}.jpg`;
}

function buildSections() {
    const sectionFragment = document.createDocumentFragment();
    const navFragment = document.createDocumentFragment();

    categories.forEach((category, categoryIndex) => {
        const sectionNode = sectionTemplate.content.firstElementChild.cloneNode(true);
        const navButton = document.createElement("button");
        const shotGrid = sectionNode.querySelector(".shot-grid");
        const label = sectionNode.querySelector(".section-label");
        const title = sectionNode.querySelector("h2");
        const count = sectionNode.querySelector(".section-count");
        const sliderButton = sectionNode.querySelector(".section-slider-button");

        sectionNode.id = category.id;
        label.textContent = `Category 0${categoryIndex + 1}`;
        title.textContent = category.title;
        count.textContent = `${category.count} cuts`;
        sliderButton.dataset.categoryId = category.id;

        navButton.type = "button";
        navButton.className = "nav-chip";
        navButton.dataset.target = category.id;
        navButton.textContent = category.title;
        navButton.setAttribute("aria-label", `${category.title} 이동`);
        navFragment.appendChild(navButton);

        for (let i = 1; i <= category.count; i += 1) {
            const cardNode = cardTemplate.content.firstElementChild.cloneNode(true);
            const button = cardNode.querySelector(".shot-button");
            const image = cardNode.querySelector("img");
            const badge = cardNode.querySelector(".shot-badge");
            const number = formatIndex(i);
            const url = getImageUrl(category.baseUrl, i);
            const titleText = `${category.title} ${number}`;

            image.src = url;
            image.alt = titleText;
            badge.textContent = number;

            button.dataset.imageSrc = url;
            button.dataset.imageTitle = titleText;
            button.dataset.category = category.title;
            button.setAttribute("aria-label", `${titleText} 확대 보기`);
            shotGrid.appendChild(cardNode);
        }

        sectionFragment.appendChild(sectionNode);
    });

    content.appendChild(sectionFragment);
    categoryNav.appendChild(navFragment);
}

function setView(view) {
    state.view = view;
    document.body.dataset.view = view;

    if (toggleViewButton) {
        toggleViewButton.textContent = view === "list" ? "Grid" : "List";
    }

    viewButtons.forEach((button) => {
        const isActive = button.dataset.view === view;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

function getCategoryById(categoryId) {
    return categories.find((category) => category.id === categoryId);
}

function updateSlider() {
    const category = getCategoryById(state.sliderCategoryId);
    if (!category) {
        return;
    }

    const imageNumber = state.sliderIndex + 1;
    const src = getImageUrl(category.baseUrl, imageNumber);
    sliderImage.src = src;
    sliderImage.alt = `${category.title} ${formatIndex(imageNumber)}`;
    sliderCategory.textContent = category.title;
    sliderCount.textContent = `${formatIndex(imageNumber)} / ${formatIndex(category.count)}`;
}

function openSlider(categoryId, startIndex = 0) {
    state.sliderCategoryId = categoryId;
    state.sliderIndex = startIndex;
    sliderModal.hidden = false;
    sliderModal.setAttribute("aria-hidden", "false");
    sliderSwipeHint.classList.remove("is-hidden");
    updateSlider();
    document.body.style.overflow = "hidden";
}

function closeSlider() {
    sliderModal.hidden = true;
    sliderModal.setAttribute("aria-hidden", "true");
    sliderImage.removeAttribute("src");
    state.sliderCategoryId = null;
    document.body.style.overflow = "";
}

function moveSlider(direction) {
    const category = getCategoryById(state.sliderCategoryId);
    if (!category) {
        return;
    }

    const nextIndex = state.sliderIndex + direction;
    if (nextIndex < 0) {
        state.sliderIndex = category.count - 1;
    } else if (nextIndex >= category.count) {
        state.sliderIndex = 0;
    } else {
        state.sliderIndex = nextIndex;
    }

    updateSlider();
}

function handleSliderTouchStart(event) {
    const touch = event.changedTouches[0];
    if (!touch) {
        return;
    }

    sliderSwipeHint.classList.add("is-hidden");
    sliderTouchStartX = touch.clientX;
    sliderTouchStartY = touch.clientY;
}

function handleSliderTouchEnd(event) {
    const touch = event.changedTouches[0];
    if (!touch || sliderModal.hidden) {
        return;
    }

    const deltaX = touch.clientX - sliderTouchStartX;
    const deltaY = touch.clientY - sliderTouchStartY;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) {
        return;
    }

    if (deltaX < 0) {
        moveSlider(1);
    } else {
        moveSlider(-1);
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
        return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateActiveNav(sectionId) {
    state.activeId = sectionId;
    const activeCategory = categories.find((category) => category.id === sectionId);

    document.querySelectorAll(".nav-chip").forEach((button) => {
        const isActive = button.dataset.target === sectionId;
        button.classList.toggle("is-active", isActive);

        if (isActive) {
            button.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
    });

    if (activeCategory && currentSectionButton) {
        currentSectionButton.textContent = activeCategory.title;
    }
}

function observeSections() {
    const sections = Array.from(document.querySelectorAll(".category-section"));
    const observer = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (visible) {
                updateActiveNav(visible.target.id);
            }
        },
        {
            rootMargin: "-24% 0px -58% 0px",
            threshold: [0.15, 0.4, 0.7]
        }
    );

    sections.forEach((section) => observer.observe(section));
}

function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
}

function applyTransform() {
    lightboxImage.style.transform = `translate(calc(-50% + ${state.offsetX}px), calc(-50% + ${state.offsetY}px)) scale(${state.scale})`;
}

function resetTransform() {
    state.scale = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    applyTransform();
}

function setScale(nextScale, centerX = 0, centerY = 0) {
    const previousScale = state.scale;
    const clampedScale = clamp(nextScale, 1, 4);
    const scaleRatio = clampedScale / previousScale;

    state.scale = clampedScale;
    state.offsetX = clamp(state.offsetX + centerX * (scaleRatio - 1), -460, 460);
    state.offsetY = clamp(state.offsetY + centerY * (scaleRatio - 1), -540, 540);

    if (state.scale === 1) {
        state.offsetX = 0;
        state.offsetY = 0;
    }

    applyTransform();
}

function openLightbox({ src, title, category }) {
    state.isOpen = true;
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    lightboxImage.src = src;
    lightboxImage.alt = title;
    lightboxCategory.textContent = category;
    lightboxTitle.textContent = title;
    resetTransform();
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    state.isOpen = false;
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.removeAttribute("src");
    state.pinchPointers.clear();
    document.body.style.overflow = "";
}

function getPointerDistance() {
    const [first, second] = Array.from(state.pinchPointers.values());
    if (!first || !second) {
        return 0;
    }

    return Math.hypot(second.x - first.x, second.y - first.y);
}

function handlePointerDown(event) {
    if (!state.isOpen) {
        return;
    }

    lightboxViewport.setPointerCapture(event.pointerId);
    state.pinchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (state.pinchPointers.size === 1) {
        state.activePointerId = event.pointerId;
        state.dragOriginX = event.clientX - state.offsetX;
        state.dragOriginY = event.clientY - state.offsetY;
    }

    if (state.pinchPointers.size === 2) {
        state.startDistance = getPointerDistance();
        state.startScale = state.scale;
    }
}

function handlePointerMove(event) {
    if (!state.isOpen || !state.pinchPointers.has(event.pointerId)) {
        return;
    }

    state.pinchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (state.pinchPointers.size === 2) {
        const distance = getPointerDistance();
        if (state.startDistance > 0) {
            setScale(state.startScale * (distance / state.startDistance));
        }
        return;
    }

    if (state.scale > 1 && event.pointerId === state.activePointerId) {
        state.offsetX = clamp(event.clientX - state.dragOriginX, -460, 460);
        state.offsetY = clamp(event.clientY - state.dragOriginY, -540, 540);
        applyTransform();
    }
}

function handlePointerUp(event) {
    state.pinchPointers.delete(event.pointerId);

    if (state.pinchPointers.size < 2) {
        state.startDistance = 0;
    }

    if (state.pinchPointers.size === 1) {
        const [pointer] = state.pinchPointers.entries();
        if (pointer) {
            state.activePointerId = pointer[0];
            state.dragOriginX = pointer[1].x - state.offsetX;
            state.dragOriginY = pointer[1].y - state.offsetY;
        }
    } else {
        state.activePointerId = null;
    }
}

function bindEvents() {
    document.addEventListener("click", (event) => {
        const viewButton = event.target.closest(".view-button");
        const sectionSliderButton = event.target.closest(".section-slider-button");
        const navChip = event.target.closest(".nav-chip");
        const shotButton = event.target.closest(".shot-button");
        const closeTarget = event.target.closest("[data-close-lightbox]");
        const closeSliderTarget = event.target.closest("[data-close-slider]");

        if (viewButton) {
            setView(viewButton.dataset.view);
            return;
        }

        if (sectionSliderButton) {
            openSlider(sectionSliderButton.dataset.categoryId);
            return;
        }

        if (navChip) {
            scrollToSection(navChip.dataset.target);
            return;
        }

        if (shotButton) {
            openLightbox({
                src: shotButton.dataset.imageSrc,
                title: shotButton.dataset.imageTitle,
                category: shotButton.dataset.category
            });
            return;
        }

        if (closeTarget) {
            closeLightbox();
            return;
        }

        if (closeSliderTarget) {
            closeSlider();
        }
    });

    bottomButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const action = button.dataset.bottomAction;

            if (action === "top") {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }

            if (action === "toggle") {
                setView(state.view === "list" ? "grid" : "list");
            }

            if (action === "current") {
                scrollToSection(state.activeId);
            }
        });
    });

    closeLightboxButton.addEventListener("click", closeLightbox);
    closeSliderButton.addEventListener("click", closeSlider);
    sliderPrevButton.addEventListener("click", () => {
        sliderSwipeHint.classList.add("is-hidden");
        moveSlider(-1);
    });
    sliderNextButton.addEventListener("click", () => {
        sliderSwipeHint.classList.add("is-hidden");
        moveSlider(1);
    });
    sliderStage.addEventListener("touchstart", handleSliderTouchStart, { passive: true });
    sliderStage.addEventListener("touchend", handleSliderTouchEnd, { passive: true });
    zoomInButton.addEventListener("click", () => setScale(state.scale + 0.25));
    zoomOutButton.addEventListener("click", () => setScale(state.scale - 0.25));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && state.isOpen) {
            closeLightbox();
        }

        if (event.key === "Escape" && !sliderModal.hidden) {
            closeSlider();
        }

        if (state.isOpen && event.key === "+") {
            setScale(state.scale + 0.25);
        }

        if (state.isOpen && event.key === "-") {
            setScale(state.scale - 0.25);
        }

        if (!sliderModal.hidden && event.key === "ArrowLeft") {
            moveSlider(-1);
        }

        if (!sliderModal.hidden && event.key === "ArrowRight") {
            moveSlider(1);
        }
    });

    lightboxViewport.addEventListener(
        "wheel",
        (event) => {
            if (!state.isOpen) {
                return;
            }

            event.preventDefault();
            const delta = event.deltaY < 0 ? 0.2 : -0.2;
            setScale(
                state.scale + delta,
                event.offsetX - lightboxViewport.clientWidth / 2,
                event.offsetY - lightboxViewport.clientHeight / 2
            );
        },
        { passive: false }
    );

    lightboxViewport.addEventListener("pointerdown", handlePointerDown);
    lightboxViewport.addEventListener("pointermove", handlePointerMove);
    lightboxViewport.addEventListener("pointerup", handlePointerUp);
    lightboxViewport.addEventListener("pointercancel", handlePointerUp);
    lightboxViewport.addEventListener("pointerleave", handlePointerUp);

}

buildSections();
setView(state.view);
bindEvents();
observeSections();
