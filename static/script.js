const blob = document.querySelector(".tab-blob");
const header = document.querySelector(".header");
let blobMovement = 0;
const contentCornerProperties = [
    "borderTopLeftRadius",
    "borderTopRightRadius",
    "borderBottomRightRadius",
    "borderBottomLeftRadius"
];

function moveBlob(section, animate = true) {
    const wrapper = document.querySelector(
        ".header-button-wraper." + section
    );

    if (!wrapper) return;

    const headerRect = header.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const targetPosition = {
        home: "left",
        projects: "middle",
        resume: "right"
    }[section];
    const shouldAnimate = animate && !window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;
    const movement = ++blobMovement;

    if (shouldAnimate) {
        blob.classList.add("is-ready", "moving");
    } else {
        blob.classList.remove("is-ready", "moving");
    }

    // Start the edge morph at the same time as the blob movement.
    blob.dataset.position = targetPosition;

    blob.style.setProperty(
        "--blob-x",
        `${wrapperRect.left - headerRect.left}px`
    );
    blob.style.width = `${wrapperRect.width}px`;

    if (shouldAnimate) {
        const finishMovement = event => {
            // Ignore the shorter transform transitions bubbling from the edges.
            if (event.target !== blob || event.propertyName !== "transform") return;
            blob.removeEventListener("transitionend", finishMovement);

            if (movement === blobMovement) {
                blob.classList.remove("moving");
            }
        };

        blob.addEventListener("transitionend", finishMovement);
    } else {
        blob.getBoundingClientRect();
        requestAnimationFrame(() => {
            if (movement === blobMovement) {
                blob.classList.add("is-ready");
            }
        });
    }
}

function setActive(section) {
    const activeButton = document.querySelector(".header-button.active");
    if (activeButton?.classList.contains(section)) return;

    const currentContent = document.querySelector(".content.active");
    const nextContent = document.querySelector(`.content.${section}`);

    if (currentContent && nextContent) {
        const currentStyle = getComputedStyle(currentContent);

        contentCornerProperties.forEach(property => {
            nextContent.style[property] = currentStyle[property];
        });
    }

    // remove active everywhere
    document.querySelectorAll(".active").forEach(el => {
        el.classList.remove("active");
    });

    // activate the selected section
    document.querySelectorAll("." + section).forEach(el => {
        el.classList.add("active");
    });

    if (nextContent) {
        nextContent.getBoundingClientRect();
        requestAnimationFrame(() => {
            contentCornerProperties.forEach(property => {
                nextContent.style[property] = "";
            });
        });
    }

    moveBlob(section);
    syncProjectBlobTheme();
    syncProjectMedia();
}

document.getElementById("homeBtn").onclick = () => setActive("home");
document.getElementById("projectsBtn").onclick = () => setActive("projects");
document.getElementById("resumeBtn").onclick = () => setActive("resume");

function refreshBlob() {
    const active = document.querySelector(".header-button.active");

    if (active) {
        const section = [...active.classList].find(c =>
            ["home","projects","resume"].includes(c)
        );

        if (section) moveBlob(section, false);
    }
}

refreshBlob();
new ResizeObserver(refreshBlob).observe(header);

const projectPages = [...document.querySelectorAll(".project-page")];
const previousProjectButton = document.querySelector(".project-nav-previous");
const nextProjectButton = document.querySelector(".project-nav-next");
const currentProjectCounter = document.querySelector(".project-counter-current");
const totalProjectCounter = document.querySelector(".project-counter-total");
const projectContent = document.querySelector(".project-content");
const projectBackdrop = document.querySelector(".project-backdrop");
let currentProjectIndex = 0;
let currentProjectBackground = "";

const projectThemeProperties = {
    themeBackground: "--project-bg",
    themeSurface: "--project-surface",
    themeText: "--project-text",
    themeAccent: "--project-accent",
    themeButtonText: "--project-button-text",
    themeGlow: "--project-glow",
    themePattern: "--project-pattern",
    themeStar: "--project-star"
};

function syncProjectBlobTheme() {
    const projectIsActive = projectContent.classList.contains("active");

    if (projectIsActive && currentProjectBackground) {
        blob.style.setProperty("--blob-bg", currentProjectBackground);
    } else {
        blob.style.removeProperty("--blob-bg");
    }
}

function applyProjectTheme(page) {
    const theme = page.querySelector(".project-theme")?.dataset ?? {};

    Object.entries(projectThemeProperties).forEach(([dataKey, property]) => {
        const value = theme[dataKey];

        if (value) {
            projectContent.style.setProperty(property, value);
        } else {
            projectContent.style.removeProperty(property);
        }
    });

    currentProjectBackground = theme.themeBackground ?? "";
    projectBackdrop.dataset.effect = theme.themeEffect ?? "none";
    syncProjectBlobTheme();
}

function syncProjectMedia() {
    projectPages.forEach((page, pageIndex) => {
        page.querySelectorAll("video").forEach(video => {
            if (projectContent.classList.contains("active") && pageIndex === currentProjectIndex) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    });
}

function showProject(index, animate = true) {
    if (!projectPages.length) return;

    currentProjectIndex = Math.max(0, Math.min(index, projectPages.length - 1));
    applyProjectTheme(projectPages[currentProjectIndex]);

    projectPages.forEach((page, pageIndex) => {
        if (!animate) page.classList.add("without-transition");

        const isCurrent = pageIndex === currentProjectIndex;
        page.style.transform = `translate3d(${(pageIndex - currentProjectIndex) * 100}%, 0, 0)`;
        page.classList.toggle("is-current", isCurrent);
        page.setAttribute("aria-hidden", String(!isCurrent));
        page.inert = !isCurrent;

        if (!animate) {
            page.getBoundingClientRect();
            requestAnimationFrame(() => page.classList.remove("without-transition"));
        }
    });

    currentProjectCounter.textContent = currentProjectIndex + 1;
    totalProjectCounter.textContent = projectPages.length;
    previousProjectButton.disabled = currentProjectIndex === 0;
    nextProjectButton.disabled = currentProjectIndex === projectPages.length - 1;
    syncProjectMedia();
}

previousProjectButton.addEventListener("click", () => {
    showProject(currentProjectIndex - 1);
});

nextProjectButton.addEventListener("click", () => {
    showProject(currentProjectIndex + 1);
});

document.addEventListener("keydown", event => {
    if (!document.querySelector(".project-content.active")) return;
    if (event.target.closest("button, a, input, textarea, select")) return;

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        showProject(currentProjectIndex - 1);
    }
    if (event.key === "ArrowRight") {
        event.preventDefault();
        showProject(currentProjectIndex + 1);
    }
});

function createProjectStars() {
    const starField = document.querySelector(".project-star-field");
    const stars = document.createDocumentFragment();
    let seed = 1847;

    function random() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    for (let index = 0; index < 128; index++) {
        const star = document.createElement("span");
        const opacity = 0.4 + random() * 0.6;
        star.className = "project-star";
        star.style.setProperty("--star-x", `${random() * 100}%`);
        star.style.setProperty("--star-y", `${random() * 100}%`);
        star.style.setProperty("--star-size", `${2.5 + random() * 3}px`);
        star.style.setProperty("--star-opacity", opacity);
        star.style.setProperty("--star-low-opacity", opacity * 0.6);
        star.style.setProperty("--star-delay", `${random() * -5}s`);
        star.style.setProperty("--star-duration", `${1 + random() * 2}s`);
        stars.appendChild(star);
    }

    starField.appendChild(stars);
}

createProjectStars();
showProject(0, false);
