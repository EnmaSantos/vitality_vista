# Vitality Vista
===========================

A comprehensive fitness tracking application that integrates exercise data, nutrition information, and meal recipes. Built with modern web technologies including React, TypeScript, Material UI, and Deno. This project serves as a learning platform for contemporary web development practices while creating a useful fitness tool.

🏋️‍♂️ Project Overview
----------------------

This application helps users track their fitness journey by providing access to:

-   A **Recipe Discovery** module leveraging the FatSecret API for searching and viewing detailed recipes.
-   Future capabilities for exercise tracking, nutrition logging, and workout planning.
-   A user-friendly interface for managing health and wellness data.

The project is built as a full-stack application with a TypeScript React frontend and a Deno backend, emphasizing modern development practices and a responsive user experience.

✨ Features
----------

-   **Recipe Discovery**: Find and view detailed recipes using the FatSecret API, including ingredients, instructions, and nutritional information.
-   **User Authentication**: Secure login and signup capabilities.
-   **Responsive Design**: Fully responsive interface that works on desktop and mobile devices using Material UI.
-   *(Placeholder for future features: Exercise Library, Nutrition Tracking, Workout Creation, Progress Visualization)*

🛠️ Technology Stack
--------------------

### Frontend

-   **React 18** with **TypeScript**: For building a robust and type-safe user interface
-   **Material UI (MUI)**: For advanced UI components and consistent design
-   **React Router**: For client-side routing
-   **Vite**: For fast development and optimized builds
-   *(Tailwind CSS might still be in the project but MUI is the primary component library)*

### Backend

-   **Deno**: A secure runtime for JavaScript and TypeScript
-   **Oak**: *(Verify if Oak is the primary middleware, update if needed)* A middleware framework for Deno.
-   **TypeScript**: For type-safe API development

### External APIs

-   **FatSecret API**: For comprehensive recipe search, details, and nutritional information.

📁 Project Structure
--------------------

*(Note: Project structure is illustrative and might vary slightly.)*

🚀 Getting Started
------------------

### Prerequisites

-   Node.js (v16+ recommended)
-   npm (or yarn)
-   Deno (v1.30+ recommended)
-   Git

### Frontend Setup (in `frontend` directory)

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite's default port).

### Backend Setup (in `backend` directory)

```bash
# Navigate to the backend directory
cd backend

# Ensure Deno is installed and accessible in your PATH.
# Create any necessary .env files if required by the backend configuration (e.g., for API keys).

# Run the Deno server (assuming a 'start' task is defined in deno.json or deno.jsonc)
deno task start

# If no task runner is configured, or for more direct control, use the deno run command:
# Example: deno run --allow-net --allow-read --allow-env server.ts
# (Adjust permissions like --allow-net, --allow-read, --allow-env based on your server's needs)
```

The backend API for the deployed version is `https://enmanueldel-vitality-vi-71.deno.dev/api`.
For local development, it's typically `http://localhost:8000/api` (verify the port your Deno server uses, often 8000 by default).

🔌 API Integrations
-------------------

### FatSecret API

The application uses the FatSecret Platform API (REST) to provide:

-   Recipe search by keywords, types, and other criteria.
-   Detailed recipe information including ingredients, instructions, and nutritional breakdown per serving.
-   Access to recipe categories/types.

*(Note: This integration requires API credentials (key/secret) to be configured in the backend environment.)*

👨‍💻 Development Workflow
--------------------------

1.  **Feature Branches**: Create a new branch for each feature or bug fix.
2.  **TypeScript First**: Write all code with TypeScript types for better code quality.
3.  **Component-Driven UI**: Build reusable components before assembling pages.
4.  **API-First Backend**: Design and document API endpoints before implementation.
5.  **Regular Commits**: Make small, focused commits with descriptive messages.

🎯 Learning Goals
-----------------

This project serves as a learning platform for:

-   TypeScript development and type safety practices
-   React component architecture and hooks
-   State management patterns in frontend applications (e.g., Context API)
-   API integration techniques
-   Deno backend development
-   Component library customization with MUI
-   Modern frontend tooling (Vite)

🤝 Contributing
---------------

As this is a personal learning project, contributions are welcome but should align with the project's learning goals. If you'd like to contribute:

1.  Fork the repository
2.  Create a feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

📝 License
----------

Distributed under the MIT License. See `LICENSE` (if one exists) for more information.

📞 Contact
----------

Enmanuel De Los Santos Cruz - [@EnmanueldelosS3](https://x.com/EnmanueldelosS3)

Project Link: <https://github.com/EnmaSantos/vitality_vista>

* * * * *

This project is part of my journey to learn modern web development. Feel free to use it as inspiration for your own learning projects!