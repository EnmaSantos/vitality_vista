function loadNavbar() {
    fetch("components/navbar.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;

            // 1. Set the navbar and nav-links background color based on page ID
            const navbar = document.querySelector(".navbar");
            const navLinks = document.querySelector(".nav-links");
            const bodyID = document.body.id;
            const colors = {
                dashboard: "#a4036f",
                "food-log": "#ff595e",
                "exercise-log": "#ffca3a",
                progress: "#8ac926",
                recipes: "#1982c4"
            };
            const currentColor = colors[bodyID] || "#a4036f"; // Default color if ID not found
            navbar.style.backgroundColor = currentColor;
            navLinks.style.backgroundColor = currentColor;

            // 2. Set the active class for the current page link
            setActiveNavLink();

            // 3. Initialize the hamburger menu functionality
            const hamburger = document.getElementById("hamburger");
            const profileIcon = document.querySelector(".profile-icon");

            // Add event listener for hamburger menu toggle
            hamburger.addEventListener("click", () => {
                navLinks.classList.toggle("active");
                profileIcon.classList.toggle("active");
            });
        })
        .catch(error => console.error("Error loading navbar:", error));
}
