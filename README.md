# 🍽️ CanteenHub - Smart Self-Service College Canteen Management System

A modern, full-stack web application for managing college canteen operations with real-time capabilities, three-role architecture (Student, Staff, Admin), and a seamless ordering experience.

## ✨ Features

### 👨‍🎓 Student Panel
- Beautiful dashboard with active order tracking and quick actions
- Browse menu by categories (Snacks, Meals, Drinks, Combos)
- Search & filter food items
- Animated cart drawer with quantity controls
- Simulated payment step with success/failure
- Live order tracking with animated progress timeline
- Real-time status updates via Socket.io
- Order history with reorder functionality
- Dark/Light mode toggle

### 👨‍🍳 Staff Panel
- Live order queue with three columns (Incoming, Preparing, Ready)
- Quick status transitions (Accept → Prepare → Ready → Complete)
- Search & filter orders by Order ID or status
- Inventory management (toggle item availability)
- Real-time updates via Socket.io
- Basic analytics dashboard

### 👑 Admin Panel
- Overview dashboard with key metrics and charts
- Interactive charts using Recharts (daily orders, revenue, popular items)
- Menu management with CRUD operations and image upload
- User management (role changes, activation/deactivation)
- System controls (open/close ordering, system message)
- All orders view with pagination and filters

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Redux Toolkit** for state management
- **React Router v6** for routing
- **Socket.io Client** for real-time
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Google OAuth 2.0** for login
- **Socket.io** for real-time communication
- **Zod** for input validation
- **Multer** for file uploads

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Google OAuth credentials

### 1. Clone the repository
```bash
git clone <repository-url>
cd canteen-hub
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Google OAuth credentials
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env with your Google Client ID
npm install
npm run dev
```

### 4. Open the app
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 🔐 Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Set **Application type** to **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:5173`
7. Add authorized redirect URIs:
   - `http://localhost:5173`
8. Copy the **Client ID** to both:
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID`
   - `backend/.env` → `GOOGLE_CLIENT_ID`

## Design System

CanteenHub uses a warm premium food-tech visual language (amber/gold + cream + espresso), implemented in `frontend/tailwind.config.js` and `frontend/src/index.css`.

### Color tokens

| Token | Usage |
|-------|--------|
| `brand-*` | Primary CTAs, accents, active nav (amber/gold) |
| `espresso-*` | Text, borders, dark surfaces |
| `accent-*` | Success states, ready orders |
| `surface` | Page background (cream) |

### Typography

- **Display:** Outfit — headings, logo, order IDs
- **Body:** Inter — UI copy, tables, forms

### Breakpoints & layout

| Viewport | Student | Staff / Admin |
|----------|---------|----------------|
| `< 768px` | Bottom tab nav + cart button | Hamburger → slide-out sidebar |
| `≥ 768px` | Top navbar links + desktop cart | Top navbar + fixed left sidebar (`lg+`) |
| `≥ 1024px` | Menu grid 4 columns | Admin charts 2-column |

### Motion

- Page enter: fade + 12px Y (`PageTransition`)
- Lists: stagger 0.08s (`staggerContainer` / `staggerItem`)
- Drawers/modals: spring stiffness 300, damping 30
- Respects `prefers-reduced-motion`

### UI components

Reusable primitives live in `frontend/src/components/ui/`: `Button`, `Card`, `Badge`, `Input`, `PageHeader`, `StatCard`, `EmptyState`, `PageTransition`, `Skeleton`, `ChartTooltip`.

## 📁 Project Structure

```
canteen-hub/
├── backend/
│   ├── src/
│   │   ├── config/        # DB connection, env config
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routes
│   │   ├── socket/        # Socket.io setup
│   │   └── index.js       # Server entry point
│   ├── uploads/           # Image uploads
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store & slices
│   │   └── utils/         # API & socket clients
│   └── package.json
└── README.md
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user

### Menu
- `GET /api/menu` - List menu items (with filters)
- `GET /api/menu/:id` - Get single item
- `POST /api/menu` - Create item (Admin)
- `PUT /api/menu/:id` - Update item (Admin)
- `DELETE /api/menu/:id` - Delete item (Admin)
- `PATCH /api/menu/:id/toggle` - Toggle availability (Staff/Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my` - Get my orders
- `GET /api/orders/active` - Get active order
- `GET /api/orders` - Get all orders (Staff/Admin)
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id/status` - Update status (Staff/Admin)
- `POST /api/orders/:id/reorder` - Reorder
- `PATCH /api/orders/:id/cancel` - Cancel order

### Admin
- `GET /api/admin/dashboard` - Dashboard analytics
- `GET /api/admin/orders` - All orders with pagination
- `GET /api/admin/system` - System state
- `PATCH /api/admin/system` - Update system settings

### Users
- `GET /api/users` - List users (Admin)
- `PATCH /api/users/:id/role` - Update role (Admin)
- `PATCH /api/users/:id/toggle-active` - Toggle active (Admin)

## 🚢 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set framework to **Vite**
4. Add environment variables:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_API_URL` (backend URL)
5. Deploy

### Backend (Railway / Render)
1. Create a new web service
2. Connect GitHub repository
3. Set:
   - Root directory: `backend`
   - Start command: `npm start`
4. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `FRONTEND_URL` (deployed frontend URL)
5. Deploy

## 👥 Roles

- **Student**: Browse menu, place orders, track orders, view history
- **Staff**: Manage order queue, update status, control inventory
- **Admin**: Full access to all features, analytics, user & menu management

## 📄 License

MIT
