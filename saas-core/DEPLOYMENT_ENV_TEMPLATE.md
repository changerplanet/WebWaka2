# WebWaka Deployment Configuration
# Copy this to your deployment environment settings

# ===============================================
# DATABASE (Required)
# ===============================================
# Supabase PostgreSQL Connection
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"

# ===============================================
# APPLICATION
# ===============================================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.webwaka.app"

# ===============================================
# AUTHENTICATION
# ===============================================
JWT_SECRET="[GENERATE_A_SECURE_32_CHAR_SECRET]"
SESSION_SECRET="[GENERATE_A_SECURE_32_CHAR_SECRET]"

# ===============================================
# THIRD-PARTY SERVICES (Optional)
# ===============================================
# Resend (Email)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="onboarding@resend.dev"

# ===============================================
# ADMIN
# ===============================================
SUPER_ADMIN_EMAIL="admin@yourdomain.com"
