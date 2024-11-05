// Toggle hamburger menu
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");
const profileIcon = document.querySelector(".profile-icon");

hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active"); // Toggles the 'active' class for nav-links
    profileIcon.classList.toggle("active"); // Toggles the 'active' class for profile icon
});
