// Toggle hamburger menu
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");
const profileIcon = document.querySelector(".profile-icon");

hamburger.addEventListener("click", () => {
    console.log("Hamburger clicked!"); // Log message for debugging
    navLinks.classList.toggle("active"); // Toggles the 'active' class for nav-links
    profileIcon.classList.toggle("active"); // Toggles the 'active' class for profile icon
});
