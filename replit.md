# ShotTracker Pro

## Overview

ShotTracker Pro is a precision shooting logger application designed for tracking and analyzing shooting sessions. The application allows users to record detailed information about their shooting sessions, including rifle specifications, environmental conditions, shot scoring, and photos. It provides comprehensive filtering and analysis capabilities to help shooters track their progress and identify patterns in their performance.

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
- **API Design**: RESTful API with JSON responses
- **File Uploads**: Multer middleware for handling image uploads with size and type validation
- **Data Storage**: In-memory storage implementation with interface for future database integration
- **Session Management**: Express sessions with PostgreSQL session store configuration

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Schema**: Single `sessions` table with comprehensive shooting session data
- **Fields**: Includes session metadata, rifle specifications, environmental conditions, shot arrays, calculated scores, and optional photo URLs
- **Validation**: Drizzle-Zod integration for runtime schema validation

### Key Features
- **Session Management**: Create, read, update, and delete shooting sessions
- **Shot Scoring**: 12-shot arrays with support for numeric scores and 'V' (bull's-eye) notation
- **Photo Upload**: Image attachment with file type and size validation
- **Filtering System**: Multi-criteria filtering by name, date range, rifle, and distance
- **Score Calculation**: Automatic total score and V-count calculation
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