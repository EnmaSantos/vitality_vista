// load-footer.js

function loadFooter() {
    fetch("components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer-placeholder").innerHTML = data;

            // Set the footer background color based on page ID
            styleFooter();
        });
}

function styleFooter() {
    const footer = document.querySelector(".footer");
    const bodyID = document.body.id;
    const colors = {
        dashboard: "#a4036f",
        "food-log": "#ff595e",
        "exercise-log": "#ffca3a",
        progress: "#8ac926",
        recipes: "#1982c4"
    };
    const iconColors = {
        dashboard: "#ffca3a",
        "food-log": "#8ac926",
        "exercise-log": "#1982c4",
        progress: "#ff595e",
        recipes: "#a4036f"
    };

    footer.style.backgroundColor = colors[bodyID] || "#a4036f"; // Default color if ID not found

    // Style social media icons based on page
    const socialIcons = document.querySelectorAll(".social-icons a img");
    socialIcons.forEach(icon => {
        icon.style.fill = iconColors[bodyID] || "#ffffff"; // Default to white if ID not found
    });
}

loadFooter();
