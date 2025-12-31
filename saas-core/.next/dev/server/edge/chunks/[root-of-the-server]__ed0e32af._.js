(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__ed0e32af._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/saas-core/src/lib/tenant-context.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_BRANDING",
    ()=>DEFAULT_BRANDING,
    "TENANT_HEADER",
    ()=>TENANT_HEADER,
    "TENANT_SLUG_HEADER",
    ()=>TENANT_SLUG_HEADER
]);
const DEFAULT_BRANDING = {
    id: 'default',
    tenantId: 'default',
    appName: 'SaaS Core',
    logoUrl: null,
    faviconUrl: null,
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6'
};
const TENANT_HEADER = 'x-tenant-id';
const TENANT_SLUG_HEADER = 'x-tenant-slug';
}),
"[project]/saas-core/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/saas-core/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/saas-core/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$tenant$2d$context$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/saas-core/src/lib/tenant-context.ts [middleware-edge] (ecmascript)");
;
;
// Paths that don't require tenant resolution
const PUBLIC_PATHS = [
    '/api/health',
    '/api/tenants',
    '/api/auth',
    '/_next',
    '/favicon.ico'
];
const SUPER_ADMIN_PATHS = [
    '/super-admin'
];
async function middleware(request) {
    const { pathname, hostname } = request.nextUrl;
    // Skip middleware for static files and public paths
    if (PUBLIC_PATHS.some((path)=>pathname.startsWith(path))) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // For development/preview, we use query param or header for tenant
    // In production, subdomain/custom domain resolution happens here
    const host = hostname || request.headers.get('host') || '';
    const parts = host.split(':')[0].split('.');
    // Clone the response to add headers
    const response = __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    // Try to extract tenant from subdomain
    if (parts.length >= 3) {
        const potentialSlug = parts[0];
        // Skip common non-tenant subdomains
        if (![
            'www',
            'api',
            'app',
            'admin',
            'preview',
            'localhost'
        ].includes(potentialSlug)) {
            response.headers.set(__TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$tenant$2d$context$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["TENANT_SLUG_HEADER"], potentialSlug);
        }
    }
    // Check for tenant in query param (for testing/preview)
    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    if (tenantSlug) {
        response.headers.set(__TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$tenant$2d$context$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["TENANT_SLUG_HEADER"], tenantSlug);
    }
    // Check for tenant in cookie
    const tenantCookie = request.cookies.get('tenant_slug')?.value;
    if (tenantCookie && !response.headers.get(__TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$tenant$2d$context$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["TENANT_SLUG_HEADER"])) {
        response.headers.set(__TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$tenant$2d$context$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["TENANT_SLUG_HEADER"], tenantCookie);
    }
    return response;
}
const config = {
    matcher: [
        // Match all paths except static files
        '/((?!_next/static|_next/image|favicon.ico).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__ed0e32af._.js.map