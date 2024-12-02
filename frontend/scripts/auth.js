// FILE: frontend/scripts/auth.js

document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    if (response.ok) {
        // Handle successful login
        console.log("Login successful:", result);
        // Redirect to dashboard or another page
    } else {
        // Handle login error
        console.error("Login failed:", result);
    }
});

document.getElementById("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    if (response.ok) {
        // Handle successful signup
        console.log("Signup successful:", result);
        // Redirect to login page or another page
    } else {
        // Handle signup error
        console.error("Signup failed:", result);
    }
});

document.getElementById("forgot-password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = event.target.email.value;

    const response = await fetch("http://localhost:8000/auth/forgot-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    const result = await response.json();
    if (response.ok) {
        // Handle successful password reset request
        console.log("Password reset request successful:", result);
        // Inform the user to check their email
    } else {
        // Handle password reset error
        console.error("Password reset request failed:", result);
    }
});