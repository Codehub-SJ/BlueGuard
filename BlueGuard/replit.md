# BlueGuard - Coastal Monitoring & Community Reporting Platform

## Overview

BlueGuard is a comprehensive coastal monitoring application that combines real-time environmental data collection, community-driven incident reporting, and carbon credit trading capabilities. The platform serves both community members and authorities, providing tools for coastal risk assessment, environmental protection, and sustainable resource management.

The application features AI-powered risk predictions, real-time sensor data visualization, incident reporting with photo uploads, alert systems, and a carbon credit marketplace that incentivizes environmental conservation efforts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for development tooling
- **Routing**: Wouter for client-side routing with role-based page access
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state with React Context for authentication
- **Form Handling**: React Hook Form with Zod validation schemas
- **Mobile-First Design**: Responsive layout with dedicated mobile navigation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API with route-based organization
- **File Uploads**: Multer middleware for image handling with validation
- **Development**: Hot reload with Vite middleware integration
- **Error Handling**: Centralized error handling with structured responses

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: Relational schema with users, reports, alerts, coastal data, sensors, carbon credits, and predictions
- **Connection**: Neon Database serverless PostgreSQL provider
- **Migrations**: Drizzle Kit for schema migrations and database management
- **Storage Interface**: Abstract storage layer supporting both database and in-memory implementations

### Authentication and Authorization
- **Authentication**: Session-based authentication with email/password
- **Authorization**: Role-based access control (community users vs authorities)
- **User Management**: Registration with role selection and profile management
- **Protected Routes**: Client-side route protection based on authentication status

### External Dependencies
- **Database Provider**: Neon Database for managed PostgreSQL hosting
- **Image Processing**: Multer for file upload handling with type and size validation
- **Real-time Updates**: Query invalidation strategy for simulated real-time data
- **Development Tools**: Replit-specific plugins for development environment integration

The architecture emphasizes type safety throughout the stack with shared TypeScript schemas, real-time data capabilities through polling strategies, and a modular component structure that separates concerns between data visualization, user interactions, and administrative functions.