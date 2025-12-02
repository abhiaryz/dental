# Super Admin Portal - Quick Reference Card

## 🚀 First Time Setup (3 Commands)

```bash
# 1. Create your first super admin
npx tsx scripts/seed-super-admin.ts

# 2. Start the app
npm run dev

# 3. Login
# Navigate to: http://localhost:3000/super-admin
```

## 📱 Portal URLs

| Page | URL | Purpose |
|------|-----|---------|
| Login | `/super-admin` | Super admin authentication |
| Dashboard | `/super-admin/dashboard` | Platform overview & metrics |
| Clinics | `/super-admin/clinics` | Manage all clinics |
| Analytics | `/super-admin/analytics` | Revenue, users, engagement |
| Settings | `/super-admin/settings` | Profile & password change |

## ⚡ Quick Actions

### View All Clinics
1. Go to `/super-admin/clinics`
2. Use search/filter to find clinics
3. Click eye icon to view details

### Suspend a Clinic
1. Find clinic in list
2. Click red ban icon
3. Confirm suspension

### Update Subscription
1. Open clinic detail page
2. Scroll to "Update Subscription"
3. Change MRR, status, or billing email
4. Click "Update Subscription"

### Impersonate for Support
1. Find clinic in list
2. Click blue user-cog icon
3. New tab opens as their admin
4. Help and close tab when done

### Change Your Password
1. Go to Settings
2. Enter current + new password
3. Click "Update Password"

## 📊 Key Metrics Dashboard

| Metric | What It Means | Where to Find |
|--------|---------------|---------------|
| MRR | Monthly Recurring Revenue | Dashboard (top cards) |
| ARR | Annual Recurring Revenue | Analytics → Revenue |
| Churn Rate | % clinics cancelled | Dashboard (churn card) |
| Active Clinics | Currently paying | Dashboard (top cards) |
| Feature Adoption | % using features | Analytics → Engagement |

## 🔐 Security

- **Sessions**: 8-hour auto-logout
- **Passwords**: Min 8 characters
- **Audit Logs**: All actions tracked
- **Impersonation**: 30-min time limit
- **Cookies**: HTTP-only, secure

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | Check email/password, verify super admin exists in DB |
| Metrics not showing | Check browser console, verify API endpoints |
| Impersonation fails | Verify clinic has ADMIN user |
| Database errors | Run `npx prisma db push` |

## 📝 Common SQL Queries

```sql
-- View all super admins
SELECT * FROM "SuperAdmin";

-- Count clinics by status
SELECT "subscriptionStatus", COUNT(*) 
FROM "Clinic" 
GROUP BY "subscriptionStatus";

-- View recent audit logs
SELECT * FROM "AuditLog" 
WHERE action LIKE 'SUPER_ADMIN_%' 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Total MRR
SELECT SUM(mrr) as total_mrr 
FROM "Clinic" 
WHERE "subscriptionStatus" = 'ACTIVE';
```

## 🎯 Subscription Status Guide

| Status | Meaning | Action |
|--------|---------|--------|
| TRIAL | New clinic testing | Convert to ACTIVE when they pay |
| ACTIVE | Paying customer | Monitor regularly |
| SUSPENDED | Temporarily disabled | Reactivate when issue resolved |
| CANCELLED | Permanently ended | Archive or delete |
| EXPIRED | Trial period ended | Follow up or suspend |

## 💰 Pricing Reference

| Plan | Price | Target |
|------|-------|--------|
| Standard | ₹2,999/month | Individual clinics |
| Plus | ₹4,999/month | Multi-location |
| Enterprise | Custom | Large chains |

*(Adjust based on your pricing strategy)*

## 📞 Support Workflow

When a clinic needs help:
1. **Find clinic**: Search in Clinics page
2. **Check status**: Verify subscription is active
3. **Review users**: Check who has admin access
4. **Impersonate**: Click user-cog icon
5. **Fix issue**: Navigate as them
6. **Document**: Add notes in clinic detail
7. **Log out**: Close impersonation tab

## 🔄 Monthly Tasks

- [ ] Review MRR trend (growing?)
- [ ] Check churn rate (< 5%?)
- [ ] Contact trial clinics (convert to paid)
- [ ] Follow up on suspended clinics
- [ ] Review feature adoption
- [ ] Export analytics for team
- [ ] Change super admin password (every 90 days)

## 📈 Growth Indicators (Healthy SaaS)

✅ MRR growing 10%+ monthly  
✅ Churn rate < 5%  
✅ Feature adoption > 70%  
✅ Active users > 80% of total  
✅ Trial to paid conversion > 20%  

## 🎓 Best Practices

1. **Daily**: Check dashboard for anomalies
2. **Weekly**: Review new signups, churn
3. **Monthly**: Deep dive analytics, plan improvements
4. **Quarterly**: Platform health report
5. **Always**: Log support actions, document decisions

## 🔗 Quick Links

- Setup Guide: `SUPER_ADMIN_SETUP.md`
- Full Documentation: `SUPER_ADMIN_IMPLEMENTATION_COMPLETE.md`
- Scripts: `scripts/` directory
- API Docs: Check route files in `src/app/api/super-admin/`

---

**Pro Tip**: Bookmark `/super-admin/dashboard` for daily access!

*Keep this reference handy for quick lookups* 📌

