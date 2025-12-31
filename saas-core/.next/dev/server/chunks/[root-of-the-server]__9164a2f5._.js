module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/saas-core/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$saas$2d$core$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/saas-core/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$saas$2d$core$2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: ("TURBOPACK compile-time truthy", 1) ? [
        'query',
        'error',
        'warn'
    ] : "TURBOPACK unreachable"
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/saas-core/src/lib/tenant-resolver.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveTenantById",
    ()=>resolveTenantById,
    "resolveTenantBySlug",
    ()=>resolveTenantBySlug,
    "resolveTenantFromHost",
    ()=>resolveTenantFromHost
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/saas-core/src/lib/prisma.ts [app-route] (ecmascript)");
;
async function resolveTenantFromHost(hostname) {
    // Remove port if present
    const host = hostname.split(':')[0];
    // Check for custom domain first
    let tenant = await __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].tenant.findUnique({
        where: {
            customDomain: host,
            isActive: true
        },
        include: {
            branding: true
        }
    });
    if (tenant) return tenant;
    // Extract subdomain from host
    // Pattern: subdomain.domain.tld or subdomain.preview.emergentagent.com
    const parts = host.split('.');
    // Need at least 3 parts for a subdomain (sub.domain.tld)
    if (parts.length >= 3) {
        const subdomain = parts[0];
        // Skip common non-tenant subdomains
        if ([
            'www',
            'api',
            'app',
            'admin',
            'preview'
        ].includes(subdomain)) {
            return null;
        }
        tenant = await __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].tenant.findUnique({
            where: {
                slug: subdomain,
                isActive: true
            },
            include: {
                branding: true
            }
        });
        if (tenant) return tenant;
    }
    return null;
}
async function resolveTenantBySlug(slug) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].tenant.findUnique({
        where: {
            slug,
            isActive: true
        },
        include: {
            branding: true
        }
    });
}
async function resolveTenantById(id) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].tenant.findUnique({
        where: {
            id,
            isActive: true
        },
        include: {
            branding: true
        }
    });
}
}),
"[project]/saas-core/src/app/api/tenants/resolve/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/saas-core/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$tenant$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/saas-core/src/lib/tenant-resolver.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');
        const host = searchParams.get('host') || request.headers.get('host');
        let tenant = null;
        // Try slug first
        if (slug) {
            tenant = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$tenant$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveTenantBySlug"])(slug);
        } else if (host) {
            tenant = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$src$2f$lib$2f$tenant$2d$resolver$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveTenantFromHost"])(host);
        }
        if (!tenant) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                tenant: null,
                message: 'No tenant resolved - showing default/super admin view'
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                customDomain: tenant.customDomain,
                branding: tenant.branding
            }
        });
    } catch (error) {
        console.error('Failed to resolve tenant:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$saas$2d$core$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to resolve tenant'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9164a2f5._.js.map