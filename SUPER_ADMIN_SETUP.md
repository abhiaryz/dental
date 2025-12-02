# Super Admin Portal - Setup Guide

## Overview

The Super Admin Portal has been successfully implemented! This portal allows you to manage all clinics on your SaaS platform, monitor analytics, and handle subscriptions.

## 🎯 What's Included

### Database
- ✅ `SuperAdmin` model for platform administrators
- ✅ `SubscriptionStatus` enum (TRIAL, ACTIVE, SUSPENDED, CANCELLED, EXPIRED)
- ✅ `PlatformMetric` model for tracking SaaS metrics
- ✅ Enhanced `Clinic` model with subscription fields (MRR, billing, etc.)

### Authentication
- ✅ Separate JWT-based authentication for super admins
- ✅ HTTP-only cookies for security
- ✅ 8-hour session expiry
- ✅ Login/Logout/Me endpoints

### UI Pages
- ✅ Login page at `/super-admin`
- ✅ Dashboard with platform metrics
- ✅ Clinics management page with search/filter
- ✅ Clinic detail page with full information
- ✅ Analytics page with revenue/user/engagement metrics
- ✅ Settings page with password change

### API Routes
- ✅ Clinic management (list, detail, update, suspend, activate)
- ✅ Analytics APIs (overview, revenue, users, engagement)
- ✅ Clinic impersonation for support
- ✅ Password change API

### Features
- ✅ View all clinics with subscription status
- ✅ Suspend/Activate clinics
- ✅ Update subscription details and MRR
- ✅ Platform analytics and metrics
- ✅ Impersonate clinic admins for support
- ✅ Audit logging for all actions
- ✅ Secure password change

## 🚀 Setup Instructions

### Step 1: Create Your First Super Admin

Run the interactive setup script:

```bash
chmod +x scripts/create-super-admin.sh
./scripts/create-super-admin.sh
```

Or run the TypeScript script directly:

```bash
npx tsx scripts/seed-super-admin.ts
```

Follow the prompts to create your super admin account.

### Step 2: Add Environment Variable (Optional)

For enhanced security, add a custom JWT secret for super admin tokens:

```env
# Add to .env file
SUPER_ADMIN_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
IMPERSONATION_SECRET=your-impersonation-secret-key-change-this
```

### Step 3: Start the Application

```bash
npm run dev
```

### Step 4: Login

Navigate to: `http://localhost:3000/super-admin`

Use the credentials you created in Step 1.

## 📱 Portal Features

### Dashboard
- **Total Clinics**: Active clinic count
- **Total Users**: Users across all clinics
- **Monthly Revenue (MRR)**: Total recurring revenue
- **Signup Growth**: Month-over-month growth
- **Clinic Status Breakdown**: By subscription status
- **Churn Metrics**: Retention analysis
- **Revenue Trend**: Last 12 months
- **Signup Trend**: New clinics per month

### Clinics Page
- **Search**: By name, code, or owner email
- **Filter**: By subscription status
- **Actions**:
  - View clinic details
  - Suspend/Activate clinic
  - Impersonate clinic admin (for support)
- **Pagination**: 50 clinics per page

### Clinic Detail Page
- Full clinic information
- User list with roles
- Subscription management
- Update MRR, billing email, status
- Quick suspend/activate actions

### Analytics Page
- **Revenue Analytics**:
  - MRR, ARR, Average MRR
  - Revenue by clinic type
  - Top clinics by MRR
- **User Analytics**:
  - Total users, active users (7d/30d)
  - Users by role distribution
  - User growth trend
- **Engagement Analytics**:
  - Patients, appointments, treatments
  - Invoice statistics
  - Feature adoption rates (dental charts, templates, patient portal)

### Settings Page
- View profile information
- Change password securely
- Security best practices

## 🔐 Security Features

- **Separate Authentication**: Super admin login is completely isolated from clinic users
- **JWT Tokens**: Secure, HTTP-only cookies with 8-hour expiry
- **Password Hashing**: Bcrypt with salt rounds
- **Audit Logging**: All super admin actions are logged
- **Rate Limiting**: (Can be added) Prevent brute force attacks
- **Impersonation Tokens**: Time-limited (30 min) for support access

## 🎯 Common Use Cases

### 1. Onboard a New Clinic

When a clinic signs up:
1. They auto-create with `subscriptionStatus: "TRIAL"`
2. Navigate to the clinic's detail page
3. Set their MRR (e.g., ₹2999)
4. Change status to "ACTIVE" when they pay

### 2. Suspend a Clinic

For non-payment or policy violations:
1. Go to Clinics page
2. Click the "Ban" icon next to the clinic
3. Confirm suspension
4. Status changes to "SUSPENDED" and `isActive: false`

### 3. Support a Clinic

To help a clinic admin:
1. Go to Clinics page
2. Click the "UserCog" icon
3. A new tab opens with you logged in as their admin
4. Help them with their issue
5. Action is logged for audit

### 4. Monitor Platform Health

Check the Analytics page daily/weekly for:
- MRR trends (growing?)
- Churn rate (too high?)
- User engagement (clinics using features?)
- Feature adoption (which features are popular?)

### 5. Update Subscription

When a clinic upgrades/downgrades:
1. Go to clinic detail page
2. Update MRR field
3. Update subscription status if needed
4. Click "Update Subscription"

## 📊 Understanding Metrics

### MRR (Monthly Recurring Revenue)
- Sum of all active clinic subscriptions
- Key metric for SaaS health

### ARR (Annual Recurring Revenue)
- MRR × 12
- Used for annual planning

### Churn Rate
- Percentage of clinics that cancelled this month
- Target: < 5% monthly churn

### Feature Adoption
- Percentage of clinics using key features
- Helps prioritize development

## 🛠️ Troubleshooting

### Can't Login
- Verify email/password
- Check database: `SELECT * FROM "SuperAdmin";`
- Verify JWT secret is set

### Metrics Not Showing
- Check database has data
- Open browser console for errors
- Verify API routes are accessible

### Impersonation Not Working
- Check impersonation secret is set
- Verify clinic has at least one ADMIN user
- Check browser console for errors

## 🔮 Future Enhancements

Consider adding:
- **2FA**: Two-factor authentication for super admins
- **Bulk Actions**: Suspend multiple clinics at once
- **Email Notifications**: Alert when MRR drops, churn increases
- **Automated Reports**: Weekly summary emails
- **Subscription Billing**: Integrate Razorpay/Stripe
- **Advanced Filters**: Filter clinics by date range, MRR range
- **Export Data**: CSV export of clinics, analytics
- **API Keys**: For programmatic access
- **Webhooks**: Notify external systems of events

## 📝 Notes

- **Database**: All super admin actions are logged to `AuditLog` table
- **Sessions**: Super admin sessions are separate from clinic user sessions
- **Cookies**: Named `super-admin-token` to avoid conflicts
- **Security**: Always use HTTPS in production
- **Backup**: Regularly backup super admin credentials

## 🎉 Success!

Your Super Admin Portal is fully functional and ready to manage your SaaS platform!

---

**Need Help?**
- Check audit logs for debugging
- Review API responses in browser dev tools
- Database issues: Check Prisma schema sync

**Created by**: Super Admin Portal Implementation
**Date**: November 2024
**Version**: 1.0.0

