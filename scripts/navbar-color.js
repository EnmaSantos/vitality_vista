// navbar-color.js
document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".navbar");
    const bodyID = document.body.id;
  
    // Define color palette
    const colors = {
      dashboard: "#a4036f",       // Fandango
      foodLog: "#ff595e",         // Bittersweet
      exerciseLog: "#ffca3a",     // Sunglow
      progress: "#8ac926",        // Yellow Green
      recipes: "#1982c4",         // Steel Blue
    };
  
    // Set navbar color based on body ID
    switch (bodyID) {
      case "dashboard":
        navbar.style.backgroundColor = colors.dashboard;
        break;
      case "food-log":
        navbar.style.backgroundColor = colors.foodLog;
        break;
      case "exercise-log":
        navbar.style.backgroundColor = colors.exerciseLog;
        break;
      case "progress":
        navbar.style.backgroundColor = colors.progress;
        break;
      case "recipes":
        navbar.style.backgroundColor = colors.recipes;
        break;
      default:
        navbar.style.backgroundColor = colors.dashboard;
        break;
    }
  });
  