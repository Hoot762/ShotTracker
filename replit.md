# ShotTracker Pro

## Overview

ShotTracker Pro is a precision shooting logger application designed for tracking and analyzing shooting sessions. The application allows users to record detailed information about their shooting sessions, including rifle specifications, environmental conditions, shot scoring, and photos. It provides comprehensive filtering and analysis capabilities to help shooters track their progress and identify patterns in their performance.

## Recent Changes (July 31, 2025)

- **Fixed Data Saving Issues**: Resolved critical validation errors in session creation by fixing form default values, adding proper type conversion, and updating validation schemas to handle optional fields correctly
- **Improved DOPE Card Interface**: Enhanced mobile responsiveness with better spacing, optimized table styling, and replaced "Add Range" button with "Save & Close" functionality
- **Fixed Range Editing Bug**: Corrected DOPE card range editing to work for all distances (100-1200 yards) instead of defaulting to 100 yards only
- **Enhanced Mobile Experience**: Improved touch-friendly controls, better button sizing, and optimized input field layouts for mobile devices

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **UI Components**: Shadcn/UI component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful API with JSON responses and authentication middleware
- **Authentication**: Session-based authentication with bcrypt password hashing
- **Authorization**: Route-level middleware for user authentication and admin access control
- **File Uploads**: Multer middleware for handling image uploads with size and type validation
- **Data Storage**: PostgreSQL database with Drizzle ORM for type-safe operations
- **Session Management**: Express sessions with secure cookie configuration

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Authentication**: User accounts with email/password authentication and bcrypt hashing
- **Schema**: Multi-table design with `users` and `sessions` tables with proper foreign key relationships
- **User Isolation**: All shooting sessions are isolated per user with proper access controls
- **Admin System**: Role-based permissions with admin flag for user management
- **Fields**: Users (email, password hash, admin flag) and Sessions (all shooting data with user reference)
- **Validation**: Drizzle-Zod integration for runtime schema validation

### Key Features
- **User Authentication**: Multi-user support with email/password login and admin roles
- **User Management**: Admin panel for creating users and managing accounts
- **Session Management**: Create, read, update, and delete shooting sessions (isolated per user)
- **Shot Scoring**: 12-shot arrays with support for numeric scores and 'V' (bull's-eye) notation
- **Photo Upload**: Image attachment with file type and size validation
- **Filtering System**: Multi-criteria filtering by name, date range, rifle, and distance
- **Score Calculation**: Automatic total score and V-count calculation
- **Role-Based Access**: Admin users can access user management features
- **Responsive Design**: Mobile-first approach with adaptive layouts

### Development Workflow
- **Hot Reload**: Vite development server with HMR for rapid iteration
- **Type Checking**: Comprehensive TypeScript configuration across client, server, and shared code
- **Code Organization**: Monorepo structure with shared types and schemas
- **Error Handling**: Centralized error handling with user-friendly messages
- **Logging**: Request/response logging for API endpoints

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript, React DOM, and React Hook Form
- **TanStack React Query**: Server state management and data fetching
- **Wouter**: Lightweight routing library for single-page application navigation

### UI and Styling
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **Class Variance Authority**: Type-safe variant handling for component styling
- **Lucide React**: Modern icon library with React components

### Backend Services
- **Express.js**: Web application framework for Node.js
- **Multer**: Middleware for handling multipart/form-data file uploads
- **Connect PG Simple**: PostgreSQL session store for Express sessions

### Database and Validation
- **Drizzle ORM**: Type-safe SQL query builder and ORM
- **Neon Database**: Serverless PostgreSQL database provider
- **Zod**: TypeScript-first schema validation library
- **Drizzle-Zod**: Integration between Drizzle ORM and Zod validation

### Development Tools
- **Vite**: Build tool with development server and production bundling
- **ESBuild**: Fast JavaScript bundler for server-side code
- **TSX**: TypeScript execution environment for development
- **Replit Integration**: Development environment plugins and error handling