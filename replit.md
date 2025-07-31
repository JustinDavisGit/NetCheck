# Real Estate Net-Out Calculator

## Overview

This is a full-stack real estate net-out calculator application designed for New Mexico real estate professionals. The app helps calculate net proceeds from property sales, accounting for all commissions, taxes, fees, and closing costs specific to New Mexico's real estate market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript as the primary UI framework
- **Vite** for fast development and optimized production builds
- **Tailwind CSS** for styling with CSS custom properties for theming
- **shadcn/ui** component library for consistent, accessible UI components
- **Radix UI** primitives for low-level interactive components
- **TanStack Query** for server state management and API interactions
- **Wouter** for client-side routing
- **Framer Motion** for smooth animations and transitions
- **React Hook Form** with Zod validation for form management

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design for data operations
- **In-memory storage** (MemStorage) as the default data layer
- **Drizzle ORM** configured for PostgreSQL (ready for database integration)
- Custom middleware for request logging and error handling

### Component Structure
The frontend follows a modular component architecture:
- **Pages**: Top-level route components (`calculator`, `not-found`)
- **Components**: Reusable UI components organized by feature
  - `calculator/`: Feature-specific calculator components
  - `ui/`: Generic UI components from shadcn/ui
- **Hooks**: Custom React hooks for business logic (`use-calculation`, `use-toast`)
- **Lib**: Utility functions and configuration

## Key Components

### Calculation Engine
- **Core Logic**: Comprehensive net-out calculations including commissions, GRT taxes, closing costs, and prorated property taxes
- **New Mexico GRT Rates**: Built-in support for different GRT rates by city/location
- **What-If Scenarios**: Interactive price adjustment with real-time recalculation
- **Validation**: Zod schemas for input validation and data integrity

### Data Management
- **Storage Interface**: Abstracted storage layer supporting multiple backends
- **Schema Definition**: Drizzle ORM schemas for users and calculations
- **API Endpoints**: RESTful endpoints for saving and retrieving calculations

### User Interface
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Interactive Forms**: Real-time calculation updates as users input data
- **Progress Tracking**: Visual progress indicator showing form completion
- **Print Functionality**: Formatted print layouts for professional reports
- **Toast Notifications**: User feedback for actions and errors

## Data Flow

1. **User Input**: Property details, sale price, commissions, and closing costs entered through forms
2. **Real-time Calculation**: Calculations update automatically as inputs change
3. **Validation**: Input validation using Zod schemas before processing
4. **Storage**: Option to save calculations with optional user association
5. **Results Display**: Comprehensive breakdown with visual charts and summaries
6. **Export Options**: Print-friendly reports and detailed breakdowns

## External Dependencies

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI primitives for accessibility
- **Lucide React**: Icon library for consistent iconography
- **Framer Motion**: Animation library for smooth interactions

### Development Tools
- **TypeScript**: Type safety across the entire application
- **Vite**: Fast build tool with HMR
- **PostCSS**: CSS processing with Tailwind integration
- **ESBuild**: Fast JavaScript bundling for production

### Database (Configured)
- **Neon Database**: PostgreSQL database service (via @neondatabase/serverless)
- **Drizzle ORM**: Type-safe database operations
- **Migration Support**: Database schema migrations through Drizzle Kit

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds the React application to `dist/public`
- **Backend**: ESBuild bundles the Express server to `dist/index.js`
- **Assets**: Shared schemas and utilities bundled with both frontend and backend

### Environment Configuration
- **Development**: Uses Vite dev server with Express API proxy
- **Production**: Serves static assets from Express with API routes
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### Scripts
- `npm run dev`: Development server with hot reloading
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server
- `npm run db:push`: Database schema deployment

The application is designed to be easily deployable to platforms like Replit, Vercel, or traditional hosting providers with minimal configuration changes.