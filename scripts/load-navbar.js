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
        });
}

// Call the function to load the navbar
loadNavbar();
