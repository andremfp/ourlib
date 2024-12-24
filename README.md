# Vue PWA Template

## 📋 Overview

This project is a **Progressive Web App (PWA)** template built using **Vue** with **Vite**, **Firebase Authentication**, and **Firestore**.  
It provides a foundation to build a fully functional PWA, supporting both web and mobile platforms with a native app-like experience.

## ✨ Features

- **User Authentication**: Secure login, registration, and logout using Firebase Authentication.
- **Mobile and Web Compatibility**: Designed to work seamlessly across devices for a native feel on mobile, supporting light and dark modes.
- **SPA Layout**: Includes essential UI components like a footer, login and registration pages, and a main page for building upon.
- **Routing Guards**: Protect routes with authentication checks and ensure session persistence.

## 📦 Tech Stack

- **Frontend**: Vue 3 with Vite and Tailwind CSS.
- **Backend**: Firebase Authentication for user management and Firestore for database functionality.

## 🚀 Getting Started

To start using or customizing this template, follow these steps:

1. **Clone the Repository**

   Clone the repository and navigate to the project directory:

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install Dependencies**

   Install the required dependencies using Yarn:

   ```bash
   yarn install
   ```

3. **Set Up Firebase**

   Create a Firebase project in the Firebase Console.
   Set up Firestore and Authentication.
   Obtain your Firebase configuration values and add them to your .env file:

   ```bash
   VITE_FIREBASE_API_KEY=<your-api-key>
   VITE_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
   VITE_FIREBASE_PROJECT_ID=<your-project-id>
   VITE_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
   VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
   VITE_FIREBASE_APP_ID=<your-app-id>
   ```

4. **Run locally**

   To run the development server, use the following command:

   ```bash
   yarn dev
   ```

## 🌍 Deployment

You can deploy this app to any hosting platform that supports static files, such as Vercel, Netlify, or Firebase Hosting.

## 📄 License

This project is licensed under the MIT License. See the [license](.LICENSE) file for details.
