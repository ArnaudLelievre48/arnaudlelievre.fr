const blob = document.querySelector(".tab-blob");
const header = document.querySelector(".header");
const pageWrapper = document.querySelector(".page-wraper");
const panelOutline = document.querySelector(".panel-outline");
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
    pageWrapper.dataset.section = section;

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
    refreshPanelOutline();
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

function refreshPanelOutline() {
    const content = document.querySelector(".content.active");
    if (!content) return;

    const bounds = content.getBoundingClientRect();
    const wrapperBounds = pageWrapper.getBoundingClientRect();
    Object.assign(panelOutline.style, {
        left: `${bounds.left - wrapperBounds.left}px`,
        top: `${bounds.top - wrapperBounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`
    });
}

const panelResizeObserver = new ResizeObserver(refreshPanelOutline);
panelResizeObserver.observe(pageWrapper);
document.querySelectorAll(".content").forEach(content => panelResizeObserver.observe(content));

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
        panelOutline.style.setProperty(
            "--outline-color",
            getComputedStyle(projectContent).getPropertyValue("--project-glow")
        );
    } else {
        blob.style.removeProperty("--blob-bg");
        panelOutline.style.removeProperty("--outline-color");
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
        star.style.setProperty("--star-duration", `${4 + random() * 4}s`);
        stars.appendChild(star);
    }

    starField.appendChild(stars);
}

function createProjectAtoms() {
    const atomField = document.querySelector(".project-atom-field");
    const atoms = document.createDocumentFragment();
    let seed = 2718;

    function random() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    for (let index = 0; index < 20; index++) {
        const atom = document.createElement("span");
        atom.className = "project-atom";
        atom.style.setProperty("--atom-x", `${7 + (index % 5) * 20 + (random() - 0.5) * 8}%`);
        atom.style.setProperty("--atom-y", `${10 + Math.floor(index / 5) * 24 + (random() - 0.5) * 10}%`);
        atom.style.setProperty("--atom-size", `${28 + random() * 28}px`);
        atom.style.setProperty("--atom-opacity", 0.18 + random() * 0.16);
        atom.style.setProperty("--atom-drift-x", `${(random() - 0.5) * 90}px`);
        atom.style.setProperty("--atom-drift-y", `${(random() - 0.5) * 70}px`);
        atom.style.setProperty("--atom-drift-duration", `${24 + random() * 20}s`);
        atom.style.setProperty("--atom-spin-duration", `${60 + random() * 60}s`);
        atom.style.setProperty("--atom-delay", `${random() * -100}s`);

        const symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        symbol.setAttribute("class", "project-atom-symbol");
        symbol.setAttribute("viewBox", "0 0 64 64");
        symbol.setAttribute("fill", "none");
        symbol.setAttribute("stroke", "currentColor");
        symbol.setAttribute("stroke-width", "1.8");
        symbol.innerHTML = `
            <ellipse cx="32" cy="32" rx="27" ry="10" />
            <ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(60 32 32)" />
            <ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(120 32 32)" />
            <circle cx="32" cy="32" r="3" fill="currentColor" stroke="none" />
        `;
        if (index % 3 === 0) {
            const electron = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
            Object.entries({
                class: "project-electron",
                cx: "32", cy: "32", rx: "27", ry: "10",
                pathLength: "100", "stroke-width": "2.7"
            }).forEach(([name, value]) => electron.setAttribute(name, value));
            symbol.appendChild(electron);
        }
        atom.appendChild(symbol);
        atoms.appendChild(atom);
    }

    atomField.appendChild(atoms);
}

createProjectStars();
createProjectAtoms();
showProject(0, false);
refreshPanelOutline();
