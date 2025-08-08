# ShotTracker Pro

A modern, precision shooting session tracking web application designed for competitive shooters, hunters, and firearms enthusiasts to analyze and improve their shooting performance through comprehensive data capture, visualization, and insights.

## 🎯 Overview

ShotTracker Pro provides shooters with the tools to meticulously track their shooting sessions, analyze performance patterns, and maintain detailed records of their equipment and conditions. The application uses Supabase for authentication and database management, allowing users to record detailed information about their shooting sessions, including rifle specifications, environmental conditions, shot scoring, and photos. It provides comprehensive filtering and analysis capabilities to help shooters track their progress and identify patterns in their performance.

## ✨ Key Features

### 🔐 User Management & Authentication

#### User System Architecture
```typescript
interface User {
  id: string;
  email: string;
  password: string;    // bcrypt hashed, never exposed in API
  isAdmin: boolean;    // Role-based access control
  createdAt: Date;
}

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}
```

#### Authentication Flow
```typescript
// Password hashing with bcrypt
import bcrypt from 'bcrypt';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AuthService.SALT_ROUNDS);
  }

  static async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Login validation
  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await storage.getUserByEmail(email);
    if (!user) return null;

    const isValid = await AuthService.validatePassword(password, user.password);
    if (!isValid) return null;

    // Return user without password hash
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
}
```

#### Session Management
```typescript
// Express session configuration
import session from 'express-session';
import connectPg from 'connect-pg-simple';

const pgStore = connectPg(session);

app.use(session({
  store: new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: 7 * 24 * 60 * 60, // 7 days
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// Authentication middleware
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Attach user to request
  req.user = req.session.user;
  next();
};

// Admin-only middleware
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
```

#### User Management Operations
```typescript
export class UserManager {
  // Create new user (admin only)
  async createUser(adminUserId: string, userData: CreateUserRequest): Promise<User> {
    // Verify admin permissions
    const admin = await storage.getUser(adminUserId);
    if (!admin?.isAdmin) {
      throw new Error('Admin privileges required');
    }

    // Check email uniqueness
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password and create user
    const hashedPassword = await AuthService.hashPassword(userData.password);
    const user = await storage.createUser({
      email: userData.email,
      password: hashedPassword,
      isAdmin: userData.isAdmin || false,
    });

    // Return without password
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  // List all users (admin only)
  async listUsers(adminUserId: string): Promise<UserSummary[]> {
    const admin = await storage.getUser(adminUserId);
    if (!admin?.isAdmin) {
      throw new Error('Admin privileges required');
    }

    const users = await storage.getAllUsers();
    
    // Return summary with session counts
    return Promise.all(users.map(async (user) => {
      const sessionCount = await storage.getSessionCountForUser(user.id);
      return {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        sessionCount,
        createdAt: user.createdAt,
        lastActive: await storage.getLastActivityForUser(user.id),
      };
    }));
  }

  // Update user role (admin only)
  async updateUserRole(
    adminUserId: string, 
    targetUserId: string, 
    isAdmin: boolean
  ): Promise<User> {
    const admin = await storage.getUser(adminUserId);
    if (!admin?.isAdmin) {
      throw new Error('Admin privileges required');
    }

    // Prevent self-demotion of last admin
    if (!isAdmin && adminUserId === targetUserId) {
      const adminCount = await storage.getAdminCount();
      if (adminCount <= 1) {
        throw new Error('Cannot demote the last admin user');
      }
    }

    return storage.updateUser(targetUserId, { isAdmin });
  }

  // Delete user (admin only)
  async deleteUser(adminUserId: string, targetUserId: string): Promise<void> {
    const admin = await storage.getUser(adminUserId);
    if (!admin?.isAdmin) {
      throw new Error('Admin privileges required');
    }

    // Prevent self-deletion of last admin
    if (adminUserId === targetUserId) {
      const adminCount = await storage.getAdminCount();
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    // Cascade delete will remove all user's sessions and DOPE cards
    await storage.deleteUser(targetUserId);
  }
}
```

#### Super Admin Initialization
```typescript
// Automatic super admin creation for production deployments
export async function ensureSuperAdmin(): Promise<void> {
  const superAdminEmail = 'superadmin@shottracker.com';
  const superAdminPassword = 'SuperAdmin2025!';

  try {
    const existingAdmin = await storage.getUserByEmail(superAdminEmail);
    if (existingAdmin) {
      console.log('Super admin already exists');
      return;
    }

    const hashedPassword = await AuthService.hashPassword(superAdminPassword);
    await storage.createUser({
      email: superAdminEmail,
      password: hashedPassword,
      isAdmin: true,
    });

    console.log('Super admin created successfully');
  } catch (error) {
    console.error('Failed to create super admin:', error);
  }
}

// Initialize on server startup
ensureSuperAdmin();
```

#### API Routes for User Management
```typescript
// User management routes (admin only)
app.post('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await UserManager.createUser(req.user.id, req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await UserManager.listUsers(req.user.id);
    res.json(users);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
});

app.patch('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await UserManager.updateUserRole(
      req.user.id, 
      req.params.id, 
      req.body.isAdmin
    );
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await UserManager.deleteUser(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
```

#### Data Isolation & Security
All user data is strictly isolated through database-level foreign key constraints and application-level user ID verification:

```typescript
// Example: Session access with user verification
app.get('/api/sessions/:id', requireAuth, async (req, res) => {
  try {
    const session = await storage.getSession(req.params.id, req.user.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Storage layer enforces user isolation
async getSession(sessionId: string, userId: string): Promise<Session | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(
      eq(sessions.id, sessionId),
      eq(sessions.userId, userId)  // Critical: Ensures user owns the data
    ))
    .limit(1);
    
  return session || null;
}
```

### 📊 Shooting Session Tracking

#### Session Data Structure
```typescript
interface Session {
  id: string;
  userId: string;
  name: string;
  date: string;
  rifle: string;
  calibre: string;
  bulletWeight: number;        // in grains
  distance: number;           // in yards
  elevation: number | null;   // scope adjustment in MOA
  windage: number | null;     // scope adjustment in MOA
  shots: string[];           // array of 12 shots (numeric or 'V')
  totalScore: number;        // calculated total
  vCount: number;           // calculated V-count
  photoUrl: string | null;
  notes: string | null;
  createdAt: Date;
}
```

#### Scoring Calculations
The application automatically calculates scores based on shot entries:

```typescript
// Score calculation logic
function calculateScore(shots: string[]): { totalScore: number; vCount: number } {
  let totalScore = 0;
  let vCount = 0;
  
  shots.forEach(shot => {
    if (shot === 'V' || shot === 'v') {
      totalScore += 10;  // V-ring scores 10 points
      vCount += 1;       // Count as V for tie-breaking
    } else if (shot === 'X' || shot === 'x') {
      totalScore += 10;  // X-ring scores 10 points (some competitions)
      vCount += 1;       // X counts as V for tie-breaking
    } else {
      const numericScore = parseFloat(shot);
      if (!isNaN(numericScore)) {
        totalScore += numericScore;
      }
      // Missing shots (empty strings) contribute 0 points
    }
  });
  
  return { totalScore, vCount };
}
```

#### Shot Entry Validation
```typescript
const shotValidation = z.union([
  z.string().regex(/^[0-9](\.[0-9])?$/, "Must be a number 0-10"),
  z.string().regex(/^10(\.0)?$/, "10 is the maximum score"),
  z.literal('V').or(z.literal('v')), // Bull's-eye
  z.literal('X').or(z.literal('x')), // X-ring (some competitions)
  z.literal('M').or(z.literal('m')), // Miss
  z.literal(''),                     // Empty for unfired shots
]);
```

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

#### DOPE Card Structure
DOPE (Data on Previous Engagements) cards store ballistic data for specific rifle/ammunition combinations:

```typescript
interface DopeCard {
  id: string;
  userId: string;
  name: string;        // Card identifier (e.g., "Competition Load")
  rifle: string;       // Rifle description
  calibre: string;     // Cartridge/calibre
  createdAt: Date;
}

interface DopeRange {
  id: string;
  dopeCardId: string;
  range: number;       // Distance in yards
  elevation: number;   // Scope adjustment in MOA
  windage: number;     // Windage adjustment in MOA  
  createdAt: Date;
}
```

#### Ballistic Calculations
While the app stores empirical data, typical ballistic relationships follow these patterns:

```typescript
// Example: Trajectory calculation concepts
interface BallisticData {
  range: number;           // yards
  drop: number;           // inches below line of sight
  windDrift: number;      // inches for 10mph crosswind
  velocity: number;       // fps remaining velocity
  energy: number;         // ft-lbs remaining energy
  timeOfFlight: number;   // seconds
}

// MOA conversion utilities
const MOA_TO_INCHES_AT_100YDS = 1.047;  // 1 MOA ≈ 1.047" at 100 yards

function inchesToMOA(inches: number, range: number): number {
  return (inches / (range / 100)) / MOA_TO_INCHES_AT_100YDS;
}

function moaToInches(moa: number, range: number): number {
  return moa * MOA_TO_INCHES_AT_100YDS * (range / 100);
}
```

#### ASCII Export Format
DOPE cards export as field-ready text files:

```
============================================================
                    DOPE CARD EXPORT
              Rifle: AR-15 | Calibre: .223 Rem
============================================================

+----------+-----------+---------+
| Distance | Elevation | Windage |
|   (yds)  |   (MOA)   |  (MOA)  |
+----------+-----------+---------+
| 100      | 0.0       | 0.0     |
| 200      | 1.5       | 0.2     |
| 300      | 3.2       | 0.5     |
| 400      | 5.8       | 0.8     |
| 500      | 9.1       | 1.2     |
+----------+-----------+---------+
```

#### Range Data Processing
```typescript
// DOPE card export logic
function generateDopeExport(card: DopeCard, ranges: DopeRange[]): string {
  const standardRanges = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200];
  const rangeMap = new Map(ranges.map(r => [r.range, r]));
  
  let content = createHeader(card);
  content += createTableHeader();
  
  standardRanges.forEach(distance => {
    const data = rangeMap.get(distance);
    const elevation = data?.elevation?.toFixed(1) || '';
    const windage = data?.windage?.toFixed(1) || '';
    content += formatTableRow(distance, elevation, windage);
  });
  
  return content;
}
```

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

### Database Design & Operations

#### Schema Structure
```sql
-- Users table with role-based access
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,  -- bcrypt hashed
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table with user isolation
CREATE TABLE sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  rifle TEXT NOT NULL,
  calibre TEXT NOT NULL,
  bullet_weight INTEGER NOT NULL,
  distance INTEGER NOT NULL,
  elevation REAL,
  windage REAL,
  shots TEXT[] NOT NULL,  -- Array of 12 shots
  total_score REAL NOT NULL,
  v_count INTEGER NOT NULL,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- DOPE cards and ranges
CREATE TABLE dope_cards (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rifle TEXT NOT NULL,
  calibre TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dope_ranges (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  dope_card_id VARCHAR NOT NULL REFERENCES dope_cards(id) ON DELETE CASCADE,
  range INTEGER NOT NULL,
  elevation REAL,
  windage REAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Data Access Layer (Drizzle ORM)
```typescript
// Database configuration
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Session CRUD operations
export class DatabaseStorage implements IStorage {
  // Create new session with automatic score calculation
  async createSession(userId: string, sessionData: InsertSession): Promise<Session> {
    const { totalScore, vCount } = calculateScore(sessionData.shots);
    
    const [session] = await db
      .insert(sessions)
      .values({
        ...sessionData,
        userId,
        totalScore,
        vCount,
      })
      .returning();
      
    return session;
  }

  // Get user sessions with filtering
  async getSessionsForUser(
    userId: string, 
    filters: FilterState = {}
  ): Promise<Session[]> {
    let query = db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));

    // Apply filters dynamically
    if (filters.name) {
      query = query.where(
        ilike(sessions.name, `%${filters.name}%`)
      );
    }

    if (filters.rifle) {
      query = query.where(
        ilike(sessions.rifle, `%${filters.rifle}%`)
      );
    }

    if (filters.distance) {
      query = query.where(eq(sessions.distance, filters.distance));
    }

    if (filters.dateFrom) {
      query = query.where(gte(sessions.date, filters.dateFrom));
    }

    if (filters.dateTo) {
      query = query.where(lte(sessions.date, filters.dateTo));
    }

    return query.orderBy(desc(sessions.createdAt));
  }

  // Update session with recalculation
  async updateSession(
    sessionId: string, 
    userId: string, 
    updates: Partial<InsertSession>
  ): Promise<Session> {
    // Recalculate scores if shots array is updated
    if (updates.shots) {
      const { totalScore, vCount } = calculateScore(updates.shots);
      updates.totalScore = totalScore;
      updates.vCount = vCount;
    }

    const [session] = await db
      .update(sessions)
      .set(updates)
      .where(and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, userId)  // Ensure user owns the session
      ))
      .returning();

    if (!session) {
      throw new Error('Session not found or access denied');
    }

    return session;
  }

  // Delete with user verification
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const result = await db
      .delete(sessions)
      .where(and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, userId)
      ))
      .returning();

    if (result.length === 0) {
      throw new Error('Session not found or access denied');
    }
  }

  // DOPE card operations
  async createDopeCard(userId: string, cardData: InsertDopeCard): Promise<DopeCard> {
    const [card] = await db
      .insert(dopeCards)
      .values({ ...cardData, userId })
      .returning();
      
    return card;
  }

  async addDopeRange(
    cardId: string, 
    userId: string, 
    rangeData: InsertDopeRange
  ): Promise<DopeRange> {
    // Verify user owns the card
    const card = await db
      .select()
      .from(dopeCards)
      .where(and(
        eq(dopeCards.id, cardId),
        eq(dopeCards.userId, userId)
      ))
      .limit(1);

    if (!card.length) {
      throw new Error('DOPE card not found or access denied');
    }

    const [range] = await db
      .insert(dopeRanges)
      .values({ ...rangeData, dopeCardId: cardId })
      .onConflictDoUpdate({
        target: [dopeRanges.dopeCardId, dopeRanges.range],
        set: {
          elevation: rangeData.elevation,
          windage: rangeData.windage,
        },
      })
      .returning();

    return range;
  }
}
```

#### Query Performance & Indexing
```sql
-- Performance indexes for common queries
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_rifle ON sessions(rifle);
CREATE INDEX idx_sessions_distance ON sessions(distance);
CREATE INDEX idx_dope_ranges_card_range ON dope_ranges(dope_card_id, range);

-- Composite index for filtered queries
CREATE INDEX idx_sessions_user_date_rifle ON sessions(user_id, date, rifle);
```

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

### Latest Improvements (January 2025)
- **Supabase Integration**: Complete migration from Express/PostgreSQL to Supabase
- **Authentication**: Supabase Auth with email/password login
- **Database**: PostgreSQL with Row Level Security (RLS) policies
- **Real-time Updates**: Automatic data synchronization
- **Simplified Architecture**: Removed server-side code, now fully client-side with Supabase
- **Enhanced Security**: User data isolation through RLS policies

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

### Backend Architecture (Supabase)
- **Database**: PostgreSQL with automatic scaling
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security (RLS) policies for data isolation
- **File Storage**: Supabase Storage for image uploads
- **Real-time**: Automatic data synchronization across clients
- **API**: Auto-generated REST and GraphQL APIs

### Database Design
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth integration with user profiles
- **Schema**: Multi-table design with `users`, `sessions`, `dope_cards`, and `dope_ranges` tables
- **User Isolation**: All shooting sessions are isolated per user with proper access controls
- **Admin System**: Role-based permissions with admin flag
- **Security**: Row Level Security (RLS) policies ensure users can only access their own data
- **Validation**: Zod schemas for client-side validation

### Key Features
- **User Authentication**: Supabase Auth with email/password login and admin roles
- **User Management**: Admin panel for creating users and managing accounts
- **Session Management**: Create, read, update, and delete shooting sessions (isolated per user)
- **Shot Scoring**: 12-shot arrays with support for numeric scores and 'V' (bull's-eye) notation
- **Photo Upload**: Image attachment with Supabase Storage
- **Filtering System**: Multi-criteria filtering by name, date range, rifle, and distance
- **Score Calculation**: Automatic total score and V-count calculation
- **DOPE Card Management**: Digital scope setting cards with ASCII table export functionality
- **Data Export System**: Comprehensive CSV/PDF export with smart filtering and professional formatting
- **Role-Based Access**: Admin users can access user management features
- **Responsive Design**: Mobile-first approach with adaptive layouts

### Development Workflow
- **Hot Reload**: Vite development server with HMR for rapid iteration
- **Type Checking**: Comprehensive TypeScript configuration across client code
- **Code Organization**: Clean client-side architecture with Supabase integration
- **Error Handling**: Centralized error handling with user-friendly messages

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

### Backend Services (Supabase)
- **Supabase**: Backend-as-a-Service with PostgreSQL, Auth, and Storage
- **Supabase JS**: JavaScript client library for Supabase integration

### Validation
- **Zod**: TypeScript-first schema validation library

### Export and Reporting
- **jsPDF**: PDF generation library for professional document export
- **jsPDF-AutoTable**: Table generation plugin for structured PDF reports
- **CSV Export**: Native JavaScript CSV generation with proper escaping

### Development Tools
- **Vite**: Build tool with development server and production bundling
- **Replit Integration**: Development environment plugins and error handling

## Setup Instructions

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up Supabase**:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Create a `.env` file based on `.env.example`
   - Run the migration in the Supabase SQL editor
4. **Configure Storage**:
   - Create a storage bucket named `session-photos`
   - Set appropriate policies for authenticated users
5. **Start development**: `npm run dev`

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

Run the provided SQL migration in your Supabase project to set up:
- User profiles table
- Sessions table with RLS policies
- DOPE cards and ranges tables
- Authentication triggers
- Super admin user creation

## Storage Setup

Create a storage bucket named `session-photos` with policies allowing:
- Authenticated users to upload files
- Users to read their own uploaded files
- Public read access for session photos

## 🤝 Contributing

This is a precision shooting tracking application built with modern web technologies. The codebase follows TypeScript best practices and includes comprehensive error handling and validation.

## 📄 License

This project is developed for precision shooting enthusiasts and competitive shooters to improve their performance through detailed data analysis and tracking.

---

**ShotTracker Pro** - Precision. Data. Performance.