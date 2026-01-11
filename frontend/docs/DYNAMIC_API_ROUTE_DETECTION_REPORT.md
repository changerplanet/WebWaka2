# DYNAMIC API ROUTE DETECTION REPORT

**Generated**: December 2025  
**Phase**: A - Read-Only Discovery  
**Status**: COMPLETE - NO CODE WAS MODIFIED

---

## Detection Criteria Used

An API route is marked as requiring `force-dynamic` if it contains ANY of:
- `cookies(` from `next/headers`
- `headers(` from `next/headers`
- `getCurrentSession(`
- `getServerSession(`
- `auth(`

## Scope Scanned

```
src/app/**/route.ts
src/app/**/route.tsx
```

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Routes Requiring `force-dynamic`** | 211 |
| **Routes Already Marked Dynamic** | 0 |
| **Routes Needing Fix** | 211 |

---

## Full List of Affected Files (211 routes)

### Accounting Module (20 routes)
1. `src/app/api/accounting/coa/[id]/route.ts`
2. `src/app/api/accounting/coa/route.ts`
3. `src/app/api/accounting/entitlements/route.ts`
4. `src/app/api/accounting/expenses/[id]/[action]/route.ts`
5. `src/app/api/accounting/expenses/[id]/route.ts`
6. `src/app/api/accounting/expenses/categories/route.ts`
7. `src/app/api/accounting/expenses/route.ts`
8. `src/app/api/accounting/expenses/summary/route.ts`
9. `src/app/api/accounting/initialize/route.ts`
10. `src/app/api/accounting/journals/[id]/route.ts`
11. `src/app/api/accounting/journals/by-source/route.ts`
12. `src/app/api/accounting/journals/post-event/route.ts`
13. `src/app/api/accounting/journals/route.ts`
14. `src/app/api/accounting/ledger/accounts/route.ts`
15. `src/app/api/accounting/ledger/route.ts`
16. `src/app/api/accounting/offline/route.ts`
17. `src/app/api/accounting/periods/route.ts`
18. `src/app/api/accounting/reports/route.ts`
19. `src/app/api/accounting/tax/route.ts`
20. `src/app/api/accounting/validate/route.ts`

### Admin Module (6 routes)
21. `src/app/api/admin/capabilities/[key]/activate-for-tenant/route.ts`
22. `src/app/api/admin/capabilities/[key]/route.ts`
23. `src/app/api/admin/capabilities/[key]/suspend/route.ts`
24. `src/app/api/admin/capabilities/route.ts`
25. `src/app/api/admin/users/[userId]/route.ts`
26. `src/app/api/admin/users/route.ts`

### Analytics & Attribution (3 routes)
27. `src/app/api/analytics/route.ts`
28. `src/app/api/attribution/lock/route.ts`
29. `src/app/api/attribution/route.ts`

### Auth Module (3 routes)
30. `src/app/api/auth/login/route.ts`
31. `src/app/api/auth/session/route.ts`
32. `src/app/api/auth/v2/route.ts`

### B2B Module (1 route)
33. `src/app/api/b2b/route.ts`

### Capabilities Module (5 routes)
34. `src/app/api/capabilities/events/route.ts`
35. `src/app/api/capabilities/seed/route.ts`
36. `src/app/api/capabilities/tenant/[key]/activate/route.ts`
37. `src/app/api/capabilities/tenant/[key]/deactivate/route.ts`
38. `src/app/api/capabilities/tenant/route.ts`

### Civic Module (16 routes)
39. `src/app/api/civic/agencies/route.ts`
40. `src/app/api/civic/approvals/route.ts`
41. `src/app/api/civic/audit/route.ts`
42. `src/app/api/civic/billing-facts/route.ts`
43. `src/app/api/civic/cases/route.ts`
44. `src/app/api/civic/citizens/route.ts`
45. `src/app/api/civic/demo/route.ts`
46. `src/app/api/civic/departments/route.ts`
47. `src/app/api/civic/inspections/route.ts`
48. `src/app/api/civic/organizations/route.ts`
49. `src/app/api/civic/requests/route.ts`
50. `src/app/api/civic/route.ts`
51. `src/app/api/civic/services/route.ts`
52. `src/app/api/civic/staff/route.ts`
53. `src/app/api/civic/units/route.ts`

### Client Portal (1 route)
54. `src/app/api/client-portal/route.ts`

### Commerce Module (22 routes)
55. `src/app/api/commerce/billing/credit-notes/[id]/route.ts`
56. `src/app/api/commerce/billing/credit-notes/route.ts`
57. `src/app/api/commerce/billing/invoices/[id]/route.ts`
58. `src/app/api/commerce/billing/invoices/route.ts`
59. `src/app/api/commerce/billing/payments/[id]/route.ts`
60. `src/app/api/commerce/billing/payments/route.ts`
61. `src/app/api/commerce/billing/route.ts`
62. `src/app/api/commerce/billing/statistics/route.ts`
63. `src/app/api/commerce/payments/methods/route.ts`
64. `src/app/api/commerce/payments/partial/route.ts`
65. `src/app/api/commerce/payments/proof/route.ts`
66. `src/app/api/commerce/payments/route.ts`
67. `src/app/api/commerce/payments/status/route.ts`
68. `src/app/api/commerce/payments/transfer/route.ts`
69. `src/app/api/commerce/rules/commission/route.ts`
70. `src/app/api/commerce/rules/discounts/route.ts`
71. `src/app/api/commerce/rules/inventory/route.ts`
72. `src/app/api/commerce/rules/pricing/route.ts`
73. `src/app/api/commerce/rules/promotions/route.ts`
74. `src/app/api/commerce/rules/route.ts`

### CRM Module (11 routes)
75. `src/app/api/crm/campaigns/[id]/route.ts`
76. `src/app/api/crm/campaigns/route.ts`
77. `src/app/api/crm/engagement/route.ts`
78. `src/app/api/crm/loyalty/customer/[id]/route.ts`
79. `src/app/api/crm/loyalty/route.ts`
80. `src/app/api/crm/route.ts`
81. `src/app/api/crm/segments/[id]/route.ts`
82. `src/app/api/crm/segments/route.ts`
83. `src/app/api/crm/utils/route.ts`
84. `src/app/api/crm/validate/route.ts`

### Education Module (12 routes)
85. `src/app/api/education/academic/route.ts`
86. `src/app/api/education/assessments/route.ts`
87. `src/app/api/education/attendance/route.ts`
88. `src/app/api/education/demo/route.ts`
89. `src/app/api/education/enrollments/route.ts`
90. `src/app/api/education/fees/route.ts`
91. `src/app/api/education/grades/route.ts`
92. `src/app/api/education/guardians/route.ts`
93. `src/app/api/education/report-cards/route.ts`
94. `src/app/api/education/route.ts`
95. `src/app/api/education/staff/route.ts`
96. `src/app/api/education/students/route.ts`

### Health Suite Module (5 routes)
97. `src/app/api/health-suite/appointments/route.ts`
98. `src/app/api/health-suite/consultations/route.ts`
99. `src/app/api/health-suite/patients/route.ts`
100. `src/app/api/health-suite/prescriptions/route.ts`
101. `src/app/api/health-suite/route.ts`

### Health Module (11 routes)
102. `src/app/api/health/appointments/route.ts`
103. `src/app/api/health/billing-facts/route.ts`
104. `src/app/api/health/demo/route.ts`
105. `src/app/api/health/encounters/route.ts`
106. `src/app/api/health/facilities/route.ts`
107. `src/app/api/health/guardians/route.ts`
108. `src/app/api/health/lab-orders/route.ts`
109. `src/app/api/health/patients/route.ts`
110. `src/app/api/health/prescriptions/route.ts`
111. `src/app/api/health/providers/route.ts`
112. `src/app/api/health/visits/route.ts`

### Hospitality Module (13 routes)
113. `src/app/api/hospitality/charge-facts/route.ts`
114. `src/app/api/hospitality/demo/route.ts`
115. `src/app/api/hospitality/floors/route.ts`
116. `src/app/api/hospitality/guests/route.ts`
117. `src/app/api/hospitality/orders/route.ts`
118. `src/app/api/hospitality/reservations/route.ts`
119. `src/app/api/hospitality/rooms/route.ts`
120. `src/app/api/hospitality/route.ts`
121. `src/app/api/hospitality/shifts/route.ts`
122. `src/app/api/hospitality/staff/route.ts`
123. `src/app/api/hospitality/stays/route.ts`
124. `src/app/api/hospitality/tables/route.ts`
125. `src/app/api/hospitality/venues/route.ts`

### HR Module (10 routes)
126. `src/app/api/hr/attendance/route.ts`
127. `src/app/api/hr/employees/[id]/route.ts`
128. `src/app/api/hr/employees/route.ts`
129. `src/app/api/hr/leave/[id]/route.ts`
130. `src/app/api/hr/leave/route.ts`
131. `src/app/api/hr/payroll/[id]/route.ts`
132. `src/app/api/hr/payroll/route.ts`
133. `src/app/api/hr/payslips/[id]/route.ts`
134. `src/app/api/hr/payslips/route.ts`
135. `src/app/api/hr/route.ts`

### Instances Module (3 routes)
136. `src/app/api/instances/[id]/subscription/resume/route.ts`
137. `src/app/api/instances/[id]/subscription/route.ts`
138. `src/app/api/instances/[id]/subscription/suspend/route.ts`

### Inventory Module (28 routes)
139. `src/app/api/inventory/audits/[id]/approve/route.ts`
140. `src/app/api/inventory/audits/[id]/cancel/route.ts`
141. `src/app/api/inventory/audits/[id]/counts/route.ts`
142. `src/app/api/inventory/audits/[id]/recount/route.ts`
143. `src/app/api/inventory/audits/[id]/route.ts`
144. `src/app/api/inventory/audits/[id]/start/route.ts`
145. `src/app/api/inventory/audits/[id]/submit/route.ts`
146. `src/app/api/inventory/audits/[id]/variance/route.ts`
147. `src/app/api/inventory/audits/route.ts`
148. `src/app/api/inventory/entitlements/check/route.ts`
149. `src/app/api/inventory/entitlements/route.ts`
150. `src/app/api/inventory/events/route.ts`
151. `src/app/api/inventory/low-stock/route.ts`
152. `src/app/api/inventory/offline/conflicts/route.ts`
153. `src/app/api/inventory/offline/route.ts`
154. `src/app/api/inventory/offline/sync/route.ts`
155. `src/app/api/inventory/reorder-rules/[id]/route.ts`
156. `src/app/api/inventory/reorder-rules/route.ts`
157. `src/app/api/inventory/reorder-suggestions/[id]/approve/route.ts`
158. `src/app/api/inventory/reorder-suggestions/[id]/reject/route.ts`
159. `src/app/api/inventory/reorder-suggestions/route.ts`
160. `src/app/api/inventory/transfers/[id]/approve/route.ts`
161. `src/app/api/inventory/transfers/[id]/cancel/route.ts`
162. `src/app/api/inventory/transfers/[id]/receive/route.ts`
163. `src/app/api/inventory/transfers/[id]/reject/route.ts`
164. `src/app/api/inventory/transfers/[id]/route.ts`
165. `src/app/api/inventory/transfers/[id]/ship/route.ts`
166. `src/app/api/inventory/transfers/[id]/submit/route.ts`
167. `src/app/api/inventory/transfers/route.ts`
168. `src/app/api/inventory/warehouses/[id]/route.ts`
169. `src/app/api/inventory/warehouses/route.ts`

### Logistics Module (11 routes)
170. `src/app/api/logistics/agents/[id]/route.ts`
171. `src/app/api/logistics/agents/route.ts`
172. `src/app/api/logistics/assignments/[id]/route.ts`
173. `src/app/api/logistics/assignments/route.ts`
174. `src/app/api/logistics/events/route.ts`
175. `src/app/api/logistics/offline/route.ts`
176. `src/app/api/logistics/route.ts`
177. `src/app/api/logistics/utils/route.ts`
178. `src/app/api/logistics/validate/route.ts`
179. `src/app/api/logistics/zones/[id]/route.ts`
180. `src/app/api/logistics/zones/quote/route.ts`
181. `src/app/api/logistics/zones/route.ts`

### Marketing Module (1 route)
182. `src/app/api/marketing/route.ts`

### Parkhub Module (1 route)
183. `src/app/api/parkhub/route.ts`

### Partner Module (10 routes)
184. `src/app/api/partner/clients/[id]/subscription/route.ts`
185. `src/app/api/partner/dashboard/route.ts`
186. `src/app/api/partner/earnings/route.ts`
187. `src/app/api/partner/me/route.ts`
188. `src/app/api/partner/packages/[id]/route.ts`
189. `src/app/api/partner/packages/route.ts`
190. `src/app/api/partner/signals/route.ts`
191. `src/app/api/partner/staff/[id]/route.ts`
192. `src/app/api/partner/staff/route.ts`
193. `src/app/api/partners/me/route.ts`

### Payments Module (1 route)
194. `src/app/api/payments/route.ts`

### Procurement Module (10 routes)
195. `src/app/api/procurement/events/route.ts`
196. `src/app/api/procurement/offline/route.ts`
197. `src/app/api/procurement/orders/[id]/route.ts`
198. `src/app/api/procurement/orders/route.ts`
199. `src/app/api/procurement/receipts/[id]/route.ts`
200. `src/app/api/procurement/receipts/route.ts`
201. `src/app/api/procurement/requests/[id]/route.ts`
202. `src/app/api/procurement/requests/route.ts`
203. `src/app/api/procurement/route.ts`
204. `src/app/api/procurement/suppliers/route.ts`

### Sites-Funnels Module (6 routes)
205. `src/app/api/sites-funnels-suite/route.ts`
206. `src/app/api/sites-funnels/ai-content/route.ts`
207. `src/app/api/sites-funnels/analytics/route.ts`
208. `src/app/api/sites-funnels/domains/route.ts`
209. `src/app/api/sites-funnels/funnels/route.ts`
210. `src/app/api/sites-funnels/sites/route.ts`

### Tenants Module (1 route)
211. `src/app/api/tenants/[slug]/members/route.ts`

---

## Confirmation

✅ **NO CODE WAS MODIFIED**  
✅ This report is read-only discovery output  
✅ Detection used grep-based shell scanning  
✅ All 211 routes identified require `export const dynamic = 'force-dynamic'`

---

## Next Steps (Pending Approval)

Phase B will add the following to each detected route:
```typescript
export const dynamic = 'force-dynamic'
```

Awaiting user approval to proceed with Phase B - Bulk Mechanical Fix.
