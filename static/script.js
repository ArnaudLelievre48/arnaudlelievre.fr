const blob = document.querySelector(".tab-blob");

function moveBlob(section) {

    const wrapper = document.querySelector(
        ".header-button-wraper." + section
    );

    if (!wrapper) return;

    blob.style.left = wrapper.offsetLeft + "px";
    blob.style.width = wrapper.offsetWidth + "px";
}

function setActive(section) {

    // remove active everywhere
    document.querySelectorAll(".active").forEach(el => {
        el.classList.remove("active");
    });

    // activate the selected section
    document.querySelectorAll("." + section).forEach(el => {
        el.classList.add("active");
    });

    moveBlob(section);
}

document.getElementById("homeBtn").onclick = () => setActive("home");
document.getElementById("projectsBtn").onclick = () => setActive("projects");
document.getElementById("resumeBtn").onclick = () => setActive("resume");

window.addEventListener("load", () => {
    const active = document.querySelector(".header-button.active");

    if (active) {
        const section = [...active.classList].find(c =>
            ["home","projects","resume"].includes(c)
        );

        if (section) moveBlob(section);
    }
});
