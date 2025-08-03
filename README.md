# ShotTracker Pro

A modern, precision shooting session tracking web application designed for competitive shooters, hunters, and firearms enthusiasts to analyze and improve their shooting performance through comprehensive data capture, visualization, and insights.

## 🎯 Overview

ShotTracker Pro provides shooters with the tools to meticulously track their shooting sessions, analyze performance patterns, and maintain detailed records of their equipment and conditions. The application features multi-user support, advanced filtering, data export capabilities, and specialized DOPE (Data on Previous Engagements) card management for long-range shooting.

## ✨ Key Features

### 🔐 User Management & Authentication
- **Multi-User Support**: Individual user accounts with secure authentication
- **Admin Panel**: User management capabilities for administrators
- **Super Admin System**: Automated credential seeding for production deployments
- **Session-Based Security**: Secure login with persistent sessions
- **Role-Based Access**: Admin users can manage other users and access administrative features

### 📊 Shooting Session Tracking
- **Comprehensive Session Records**: Track date, rifle, calibre, bullet weight, and distance
- **12-Shot Scoring System**: Individual shot tracking with support for numeric scores and 'V' (bull's-eye) notation
- **Automatic Calculations**: Total score and V-count automatically computed
- **Scope Settings**: Record elevation and windage adjustments (MOA)
- **Photo Attachments**: Upload and attach images to shooting sessions
- **Session Notes**: Add detailed notes and observations

### 🔍 Advanced Filtering & Search
- **Multi-Criteria Filtering**: Filter by session name, date range, rifle, and distance
- **Real-Time Search**: Instant filtering as you type
- **Date Range Selection**: Flexible date filtering for historical analysis
- **Equipment-Based Filtering**: Find sessions by specific rifles or distances

### 📈 Performance Analytics
- **Session Statistics**: Total sessions, average scores, and best performance tracking
- **Performance Trends**: Visual indicators of shooting improvement over time
- **Score Analysis**: Detailed breakdown of shooting performance metrics

### 🎯 DOPE Card Management
- **Digital DOPE Cards**: Create and manage Data on Previous Engagements cards
- **Range Data Entry**: Record elevation and windage settings for multiple distances
- **ASCII Table Export**: Professional formatted text files for field use
- **Complete Range Coverage**: 100-1200 yard range tables with customizable increments
- **Mobile-Optimized Interface**: Touch-friendly controls for field use

### 📁 Data Export & Reporting
- **CSV Export**: Complete spreadsheet export with all session data
- **PDF Reports**: Professional formatted reports with session summaries
- **Filtered Exports**: Export only sessions matching current filter criteria
- **Smart File Naming**: Automatic naming based on applied filters
- **Comprehensive Data**: Includes all shots, scores, equipment details, and notes

### 📱 Mobile-First Design
- **Responsive Interface**: Optimized for both mobile and desktop use
- **Touch-Friendly Controls**: Large buttons and easy navigation on mobile devices
- **Adaptive Layouts**: Interface adapts to screen size and orientation
- **Mobile Menu System**: Collapsible navigation for smaller screens

## 🛠️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Shadcn/UI** component library built on Radix UI primitives
- **Tailwind CSS** for modern, responsive styling
- **Wouter** for lightweight client-side routing
- **TanStack React Query** for server state management and caching
- **React Hook Form** with Zod validation for type-safe forms
- **Vite** for fast development and optimized builds

### Backend Stack
- **Node.js** with Express.js framework
- **TypeScript** with ES modules throughout
- **PostgreSQL** database with Drizzle ORM
- **Session-based Authentication** with bcrypt password hashing
- **Multer** middleware for file upload handling
- **RESTful API** design with JSON responses

### Database Design
- **User Isolation**: All data is strictly isolated per user account
- **Relational Structure**: Proper foreign key relationships and data integrity
- **Performance Optimized**: Indexed queries for fast data retrieval
- **Migration Support**: Database schema versioning and updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Modern web browser

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Configure environment variables
5. Run database migrations: `npm run db:push`
6. Start the development server: `npm run dev`

### Default Admin Credentials
- **Super Admin**: superadmin@shottracker.com / SuperAdmin2025!
- **Regular Admin**: admin@shottracker.com / admin123

## 📖 User Guide

### Creating Shooting Sessions
1. Click "New Session" in the dashboard header
2. Fill in session details (date, rifle, calibre, etc.)
3. Enter scope settings (elevation/windage if applicable)
4. Record your 12 shots using numeric scores or 'V' for bull's-eyes
5. Add notes and photos as needed
6. Save the session

### Managing DOPE Cards
1. Navigate to "DOPE Cards" from the main menu
2. Create a new card with rifle and calibre information
3. Add range data by entering distances and corresponding adjustments
4. Export the card as a formatted text file for field use

### Exporting Data
1. Apply any desired filters to your session list
2. Click the "Export" button in the header
3. Choose CSV for spreadsheet analysis or PDF for reports
4. The file will download with all filtered session data

### Using Filters
- **Name Filter**: Search sessions by name or description
- **Date Range**: Select specific time periods
- **Rifle Filter**: Find sessions with specific firearms
- **Distance Filter**: Filter by shooting distance

## 🔧 Administrative Features

### User Management (Admin Only)
- Create new user accounts
- Manage existing users
- View user activity and session counts
- Admin role assignment

### System Monitoring
- Session statistics across all users
- Performance metrics and usage analytics
- Data integrity monitoring

## 📊 Data Export Formats

### CSV Export Includes:
- Session date and identification
- Rifle and ammunition details
- Shooting conditions and settings
- All 12 individual shot scores
- Total scores and V-counts
- Session notes

### PDF Export Features:
- Professional formatted reports
- Session summary tables
- Detailed individual session breakdowns
- Automatic pagination for large datasets

### DOPE Card Export:
- ASCII formatted tables for field use
- Complete range coverage (100-1200 yards)
- Proper alignment for readability
- Professional formatting standards

## 🛡️ Security Features

- **Password Security**: Bcrypt hashing for all passwords
- **Session Management**: Secure session handling with PostgreSQL storage
- **Data Isolation**: Strict user data separation
- **Input Validation**: Comprehensive server-side validation
- **File Upload Security**: Type and size validation for images

## 📈 Performance Features

- **Optimized Queries**: Indexed database operations
- **Lazy Loading**: Efficient data loading strategies
- **Caching**: Smart client-side caching with React Query
- **Mobile Optimization**: Touch-friendly interfaces
- **Fast Exports**: Efficient data processing for large datasets

## 🔄 Recent Updates

### Latest Improvements (August 2025)
- **Enhanced DOPE Export**: Complete range coverage with professional ASCII formatting
- **Column Reordering**: Distance | Elevation | Windage format for better usability
- **Zero Value Handling**: Proper display of 0.0 values in exports
- **Mobile Responsiveness**: Improved touch controls and layout optimization
- **Export Functionality**: Comprehensive CSV/PDF export with smart filtering
- **Data Validation Fixes**: Resolved form validation issues for session creation

## 🤝 Contributing

This is a precision shooting tracking application built with modern web technologies. The codebase follows TypeScript best practices and includes comprehensive error handling and validation.

## 📄 License

This project is developed for precision shooting enthusiasts and competitive shooters to improve their performance through detailed data analysis and tracking.

---

**ShotTracker Pro** - Precision. Data. Performance.