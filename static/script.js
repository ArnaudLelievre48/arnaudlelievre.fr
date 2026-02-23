const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let currentPageId = 0;
const projectPage = document.getElementById("1");
const whoAmIPage= document.getElementById("2");
const contactMePage= document.getElementById("3");

const projectBtn = document.getElementById("projectBtn");
const whoAmIBtn = document.getElementById("whoAmIBtn");
const contactMeBtn = document.getElementById("contactMeBtn");

projectPage.classList.add("inactive");
whoAmIPage.classList.add("inactive");
contactMePage.classList.add("inactive");

projectBtn.addEventListener("click", () => {
  if (!projectBtn.classList.contains("active")) {
    const currentPage = document.getElementById(String(currentPageId));
    currentPageId = 1;
    currentPage.classList.add("inactive");
    currentPage.classList.remove("active");

    projectPage.classList.remove("inactive");
    projectPage.classList.add("active");
    projectBtn.classList.add("active")
  } else {
    const homePage = document.getElementById(0);
    currentPageId = 0;
    homePage.classList.remove("inactive");
    homePage.classList.add("active");

    projectPage.classList.add("inactive");
    projectPage.classList.remove("active");
    projectBtn.classList.remove("active")
  }
});
