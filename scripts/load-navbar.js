// load-navbar.js

// Function to load the navbar from navbar.html
function loadNavbar() {
    fetch("components/navbar.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;

            // After loading, adjust navbar color based on page ID
            const navbar = document.querySelector(".navbar");
            const bodyID = document.body.id;
            const colors = {
                dashboard: "#a4036f",
                "food-log": "#ff595e",
                "exercise-log": "#ffca3a",
                progress: "#8ac926",
                recipes: "#1982c4"
            };
            navbar.style.backgroundColor = colors[bodyID] || "#a4036f"; // Default color if ID not found
             // After loading, add the active class based on the current page
             setActiveNavLink();
        });
}


function setActiveNavLink() {
    // Get the current page's path (e.g., "food-log.html")
    const currentPage = window.location.pathname.split("/").pop();

    // Select all navbar links
    const navLinks = document.querySelectorAll(".nav-links a");

    // Loop through each link to find a match
    navLinks.forEach(link => {
        // If the link's href matches the current page, add the active class
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
        }
    });
}

// Call the function to load the navbar
loadNavbar();
