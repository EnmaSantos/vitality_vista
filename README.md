Vitality Vista
===========================

A comprehensive fitness tracking application that integrates exercise data, nutrition information, and meal recipes. Built with modern web technologies including React, TypeScript, Tailwind CSS, Material UI, and Deno. This project serves as a learning platform for contemporary web development practices while creating a useful fitness tool.

🏋️‍♂️ Project Overview
-----------------------

This application helps users track their fitness journey by providing access to:

-   A comprehensive exercise database with detailed instructions and images
-   Nutritional information from the USDA food database
-   Recipe suggestions from TheMealDB
-   Workout planning and progress tracking capabilities

The project is built as a full-stack application with a TypeScript React frontend and a Deno backend, emphasizing modern development practices and a responsive user experience.

✨ Features
----------

-   **Exercise Library**: Browse and search through hundreds of exercises with detailed instructions, images, and muscle group information
-   **Nutrition Tracking**: Access nutritional data for thousands of food items using the USDA API
-   **Recipe Discovery**: Find and save recipes based on nutritional goals and dietary preferences
-   **Workout Creation**: Build custom workout routines by selecting exercises from the database
-   **Progress Visualization**: Track fitness progress with intuitive charts and statistics
-   **Responsive Design**: Fully responsive interface that works on desktop and mobile devices

🛠️ Technology Stack
--------------------

### Frontend

-   **React 18** with **TypeScript**: For building a robust and type-safe user interface
-   **Tailwind CSS**: For utility-first styling and responsive design
-   **Material UI (MUI)**: For advanced UI components and consistent design
-   **React Router**: For client-side routing
-   **Vite**: For fast development and optimized builds

### Backend

-   **Deno**: A secure runtime for JavaScript and TypeScript
-   **Oak**: A middleware framework for Deno, similar to Express
-   **TypeScript**: For type-safe API development

### External APIs

-   Custom Exercise API (self-developed)
-   USDA Food Database API
-   TheMealDB Recipe API

📁 Project Structure
--------------------

```
fitness-tracker/
├── backend/                # Deno backend
│   ├── controllers/        # API route handlers
│   ├── models/             # Data models
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic
│   ├── deps.ts             # Dependencies (like package.json)
│   └── server.ts           # Main server file
├── frontend/               # React frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client code
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Helper functions
│   │   ├── App.tsx         # Main App component
│   │   └── index.tsx       # Entry point
│   ├── vite.config.ts      # Vite configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── package.json        # Frontend dependencies
└── README.md               # Project documentation

```

🚀 Getting Started
------------------

### Prerequisites

-   Node.js (v16+)
-   npm or yarn
-   Deno (v1.30+)
-   Git

### Frontend Setup

```
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev

```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```
# Navigate to the backend directory
cd backend

# Run the Deno server
deno run --allow-net --allow-read --allow-env server.ts

```

The backend API will be available at `http://localhost:8000`

🔌 API Integrations
-------------------

### Exercise API

The application uses a custom-built Exercise API (previously developed with FastAPI) that provides detailed information about exercises, including:

-   Instructions
-   Target muscle groups
-   Required equipment
-   Difficulty levels
-   Calorie burning estimates

### USDA Food Database API

For nutritional information, the app integrates with the USDA FoodData Central API:

-   Comprehensive nutritional profiles
-   Food search capabilities
-   Portion size calculations

### TheMealDB API

Recipe data is sourced from TheMealDB API:

-   Thousands of recipes with ingredients and instructions
-   Categorized by cuisine, ingredients, and dietary preferences
-   Video tutorials for many recipes

👨‍💻 Development Workflow
--------------------------

1.  **Feature Branches**: Create a new branch for each feature or bug fix
2.  **TypeScript First**: Write all code with TypeScript types for better code quality
3.  **Component-Driven UI**: Build reusable components before assembling pages
4.  **API-First Backend**: Design and document API endpoints before implementation
5.  **Regular Commits**: Make small, focused commits with descriptive messages

🎯 Learning Goals
-----------------

This project serves as a learning platform for:

-   TypeScript development and type safety practices
-   React component architecture and hooks
-   State management patterns in frontend applications
-   API integration techniques
-   Deno backend development
-   CSS architecture with Tailwind
-   Responsive design implementation
-   Component library customization with MUI

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

Distributed under the MIT License. See `LICENSE` for more information.

📞 Contact
----------

Your Name - [@your_twitter](https://twitter.com/your_twitter) - your.email@example.com

Project Link: <https://github.com/yourusername/fitness-tracker>

* * * * *

This project is part of my journey to learn modern web development. Feel free to use it as inspiration for your own learning projects!
