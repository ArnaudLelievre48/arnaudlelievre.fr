const header = document.querySelector(".header");
const pageWrapper = document.querySelector(".page-wraper");
const navigationSurface = document.querySelector(".navigation-surface");
const navigationShape = document.querySelector(".navigation-shape");
const navigationTrace = document.querySelector(".navigation-trace");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const sectionNames = ["home", "projects", "resume"];
let navigationPosition = null;
let navigationMetrics = null;
let navigationFrame = null;

function drawNavigation(position) {
    const { width, height, panelTop, radius, tabRadius, jointRadius } = navigationMetrics;
    const left = Math.max(0, Math.min(position.left, width - position.width));
    const right = left + position.width;

    // At either outer edge, shrink both adjoining curves together so they never overlap.
    const leftScale = Math.max(0, Math.min(1, left / (radius + jointRadius)));
    const rightScale = Math.max(0, Math.min(1, (width - right) / (radius + jointRadius)));
    const leftCorner = radius * leftScale;
    const rightCorner = radius * rightScale;
    const leftJoint = jointRadius * leftScale;
    const rightJoint = jointRadius * rightScale;
    const tabCorner = Math.min(tabRadius, position.width / 2, panelTop - Math.max(leftJoint, rightJoint));
    const arc = (r, sweep, x, y) => r > 0.001
        ? `A ${r} ${r} 0 0 ${sweep} ${x} ${y}`
        : `L ${x} ${y}`;
    const path = [
        `M ${radius} ${height}`,
        arc(radius, 1, 0, height - radius),
        `L 0 ${panelTop + leftCorner}`,
        arc(leftCorner, 1, leftCorner, panelTop),
        `L ${left - leftJoint} ${panelTop}`,
        arc(leftJoint, 0, left, panelTop - leftJoint),
        `L ${left} ${tabCorner}`,
        arc(tabCorner, 1, left + tabCorner, 0),
        `L ${right - tabCorner} 0`,
        arc(tabCorner, 1, right, tabCorner),
        `L ${right} ${panelTop - rightJoint}`,
        arc(rightJoint, 0, right + rightJoint, panelTop),
        `L ${width - rightCorner} ${panelTop}`,
        arc(rightCorner, 1, width, panelTop + rightCorner),
        `L ${width} ${height - radius}`,
        arc(radius, 1, width - radius, height),
        "Z"
    ].join(" ");

    navigationShape.setAttribute("d", path);
    navigationTrace.setAttribute("d", path);
    const content = document.querySelector(".content.active");
    content.style.borderTopLeftRadius = `${leftCorner}px`;
    content.style.borderTopRightRadius = `${rightCorner}px`;
    navigationPosition = { left, width: position.width };
}

function layoutNavigation(animate = false) {
    cancelAnimationFrame(navigationFrame);
    navigationFrame = null;

    const content = document.querySelector(".content.active");
    const button = document.querySelector(".header-button-wraper.active");
    const bounds = pageWrapper.getBoundingClientRect();
    const panelBounds = content.getBoundingClientRect();
    const tabBounds = button.getBoundingClientRect();
    const panelTop = panelBounds.top - bounds.top;
    const radius = Math.min(
        parseFloat(getComputedStyle(content).borderBottomLeftRadius),
        bounds.width / 2,
        (bounds.height - panelTop) / 2
    );
    navigationMetrics = {
        width: bounds.width, height: bounds.height, panelTop, radius,
        tabRadius: parseFloat(getComputedStyle(button).borderTopLeftRadius),
        jointRadius: Math.min(window.innerWidth, window.innerHeight) * 0.02
    };
    navigationSurface.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    const target = { left: tabBounds.left - bounds.left, width: tabBounds.width };

    if (!animate || reducedMotion.matches || !navigationPosition) {
        drawNavigation(target);
        return;
    }

    // A new click starts from the displayed shape, including when the previous move is unfinished.
    const start = { ...navigationPosition };
    const startedAt = performance.now();
    drawNavigation(start);
    function advance(now) {
        const progress = Math.min(1, (now - startedAt) / 1000);
        const eased = 1 - Math.pow(1 - progress, 4);
        drawNavigation({
            left: start.left + (target.left - start.left) * eased,
            width: start.width + (target.width - start.width) * eased
        });
        navigationFrame = progress < 1 ? requestAnimationFrame(advance) : null;
    }
    navigationFrame = requestAnimationFrame(advance);
}

function setActive(section) {
    if (!sectionNames.includes(section) || pageWrapper.dataset.section === section) return;
    pageWrapper.dataset.section = section;
    sectionNames.forEach(name => {
        const active = name === section;
        const button = document.getElementById(`${name}Btn`);
        const content = document.getElementById(button.getAttribute("aria-controls"));
        button.classList.toggle("active", active);
        button.parentElement.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
        content.classList.toggle("active", active);
        content.setAttribute("aria-hidden", String(!active));
        content.inert = !active;
    });
    syncNavigationTheme();
    syncProjectMedia();
    layoutNavigation(true);
}

sectionNames.forEach(section => {
    document.getElementById(`${section}Btn`).addEventListener("click", () => setActive(section));
});
const navigationResizeObserver = new ResizeObserver(() => layoutNavigation());
navigationResizeObserver.observe(pageWrapper);
navigationResizeObserver.observe(header);
document.querySelectorAll(".header-button-wraper").forEach(button => navigationResizeObserver.observe(button));
reducedMotion.addEventListener("change", () => layoutNavigation());
document.fonts.ready.then(() => layoutNavigation());

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

function syncNavigationTheme() {
    const projectIsActive = projectContent.classList.contains("active");

    if (projectIsActive && currentProjectBackground) {
        pageWrapper.style.setProperty("--panel-color", currentProjectBackground);
        pageWrapper.style.setProperty(
            "--outline-color",
            getComputedStyle(projectContent).getPropertyValue("--project-glow")
        );
    } else {
        pageWrapper.style.removeProperty("--panel-color");
        pageWrapper.style.removeProperty("--outline-color");
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
    syncNavigationTheme();
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
layoutNavigation();
