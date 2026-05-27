# CanteenHub Premium UI Redesign — TODO

## Milestone: Portfolio-worthy premium dark futuristic UI (React + Tailwind + Framer Motion)

### Step 0 — Baseline verification
- [ ] Run frontend dev server to confirm current functionality
- [ ] Capture current routes/pages list that must visually update

### Step 1 — Design system consistency
- [ ] Update `frontend/src/index.css` (glow/gradient/border/radius/tokens polish)
- [ ] Ensure existing component classnames still work

### Step 2 — Motion + transition system
- [ ] Update `frontend/src/components/ui/PageTransition.jsx` and motion helpers
- [ ] Ensure route/page transitions are applied consistently

### Step 3 — Authentication redesign
- [ ] Replace `frontend/src/pages/auth/Login.jsx` with premium Google login experience

### Step 4 — Student redesign
- [ ] Upgrade `frontend/src/pages/student/StudentDashboard.jsx` (hero/featured/trending/search/category polish)
- [ ] Upgrade `frontend/src/pages/student/MenuPage.jsx` (filters/search/menu cards/skeletons)
- [ ] Upgrade `frontend/src/pages/student/OrderTracking.jsx` (timeline micro-interactions + status UX)
- [ ] Upgrade `frontend/src/pages/student/OrderHistory.jsx` (premium empty/table UI)
- [ ] Upgrade `frontend/src/components/cart/CartDrawer.jsx`

### Step 5 — Admin + Staff redesign
- [ ] Upgrade `frontend/src/pages/admin/AdminDashboard.jsx`
- [ ] Upgrade `frontend/src/pages/admin/AllOrders.jsx`
- [ ] Upgrade `frontend/src/pages/admin/MenuManagement.jsx`
- [ ] Upgrade `frontend/src/pages/admin/UserManagement.jsx`
- [ ] Upgrade `frontend/src/pages/admin/SystemControls.jsx`
- [ ] Upgrade `frontend/src/pages/staff/StaffDashboard.jsx`
- [ ] Upgrade `frontend/src/pages/staff/StaffInventory.jsx`

### Step 6 — Layout chrome consistency
- [ ] Upgrade `frontend/src/components/layout/MainLayout.jsx`
- [ ] Upgrade `frontend/src/components/layout/Navbar.jsx`
- [ ] Upgrade `frontend/src/components/layout/Sidebar.jsx`
- [ ] Upgrade `frontend/src/components/layout/MobileNav.jsx`

### Step 7 — Reusable UI polish
- [ ] Ensure `frontend/src/components/ui/Button.jsx` and `Card.jsx` match new design system
- [ ] Audit key UI primitives: Badge/Input/Modal/StatCard/Skeleton/EmptyState

### Step 8 — QA
- [ ] Run `npm run build` in `frontend`
- [ ] Manual smoke-test: auth, menu browsing, cart, order tracking (socket), admin actions

