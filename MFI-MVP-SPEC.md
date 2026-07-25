# MFI (Microcredit/NGO Loan Institution) Software — MVP Specification

> এই ডকুমেন্টটি VS Code এজেন্টকে (Claude Code বা অন্য AI coding agent) পুরো প্রজেক্টের context দেওয়ার জন্য তৈরি। যেকোনো নতুন টাস্ক দেওয়ার আগে এজেন্টকে এই ফাইলটি পড়তে বলুন।

---

## ১. প্রজেক্ট ওভারভিউ

**লক্ষ্য:** বাংলাদেশের একটি Microcredit/NGO ঋণদান সংস্থার জন্য একটি ওয়েব-ভিত্তিক সফটওয়্যার, যা সঞ্চয়, ঋণ, কিস্তি সংগ্রহ, এবং বেসিক অ্যাকাউন্টিং ম্যানেজ করবে।

**মডেল:** Group-lending based MFI (গ্রামীণ ব্যাংক স্টাইল) — Client → Group → Center → Branch হায়ারার্কি।

**MVP Scope বাদ যা থাকছে না:** MFS পেমেন্ট ইন্টিগ্রেশন (bKash/Nagad), অফলাইন সিঙ্ক, নেটিভ মোবাইল অ্যাপ, মাল্টি-ব্রাঞ্চ কনসোলিডেশন, SMS নোটিফিকেশন, ডাবল-এন্ট্রি ফুল অ্যাকাউন্টিং, MRA রিপোর্ট ফরম্যাট। এগুলো Phase 2/3-এ যুক্ত হবে।

---

## ২. টেক স্ট্যাক

| লেয়ার | প্রযুক্তি | কারণ |
|---|---|---|
| Backend | Node.js + Express.js | দ্রুত সেটআপ, AI agent-দের জন্য সবচেয়ে ভালো ডকুমেন্টেড, JS একটাই ভাষা full-stack এ |
| Database | PostgreSQL | রিলেশনাল ডাটা (Client-Group-Loan সম্পর্ক জটিল), ACID কমপ্লায়েন্ট — টাকার হিসাবে জরুরি |
| ORM | Prisma | Type-safe, migration ম্যানেজমেন্ট সহজ, AI agent দিয়ে কাজ করানো সহজ (schema ফাইল একটাই জায়গায় থাকে) |
| Frontend | React (Vite) + TailwindCSS | দ্রুত UI বানানো যায়, কম্পোনেন্ট রিইউজেবল |
| Auth | JWT (jsonwebtoken + bcrypt) | সহজ, স্ট্যান্ডার্ড, সেশন সার্ভারে রাখতে হয় না |
| API স্টাইল | REST (JSON) | AI agent-দের জন্য সবচেয়ে predictable, GraphQL এখন দরকার নেই |
| Hosting (পরে) | Railway/Render (backend+db), Vercel (frontend) | ফ্রি টায়ারে শুরু করা যায় |

**কেন এই স্ট্যাক একা vibe-coder-দের জন্য ভালো:** পুরো ইকোসিস্টেমে বিপুল পরিমাণ ট্রেনিং ডাটা আছে, তাই AI এজেন্ট এখানে সবচেয়ে কম ভুল করে। JavaScript/TypeScript একটাই ভাষা ফ্রন্টএন্ড-ব্যাকএন্ড দুই জায়গায় — শেখার/ডিবাগ করার বোঝা কমে।

---

## ৩. প্রজেক্ট ফোল্ডার স্ট্রাকচার

```
mfi-system/
├── backend/
│   ├── src/
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # business logic
│   │   ├── middleware/      # auth, error handling
│   │   ├── services/        # loan calculation, schedule generation
│   │   ├── utils/
│   │   └── index.js         # entry point
│   ├── prisma/
│   │   ├── schema.prisma    # database schema (single source of truth)
│   │   └── migrations/
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/             # API call functions
│   │   └── App.jsx
│   └── package.json
└── MFI-MVP-SPEC.md          # এই ফাইল
```

---

## ৪. ডাটাবেস স্কিমা (এন্টিটি-রিলেশনশিপ)

### 4.1 হায়ারার্কি
```
Branch → FieldOfficer → Center → Group → Client
```

### 4.2 মূল টেবিল

**User** (system login — staff)
- id, name, phone, email, password_hash, role (ADMIN / BRANCH_MANAGER / FIELD_OFFICER), branch_id, created_at

**Branch**
- id, name, address, created_at

**Center** (একটা এলাকায় সাপ্তাহিক মিটিং পয়েন্ট)
- id, name, branch_id, field_officer_id, meeting_day, created_at

**Group** (৫-১৫ জন ক্লায়েন্টের গ্রুপ, group-lending মডেলের মূল ভিত্তি)
- id, name, center_id, created_at

**Client**
- id, name, nid_number, phone, address, photo_url, guardian_name, group_id, join_date, status (ACTIVE/INACTIVE), created_at

**SavingsAccount**
- id, client_id, account_type (COMPULSORY/VOLUNTARY), balance, opened_date

**SavingsTransaction**
- id, savings_account_id, type (DEPOSIT/WITHDRAWAL), amount, transaction_date, recorded_by (user_id)

**LoanProduct** (ঋণের টেমপ্লেট — একাধিক প্রোডাক্ট থাকতে পারে ভবিষ্যতে, MVP-তে ১-২টা দিয়ে শুরু)
- id, name, interest_rate, interest_method (FLAT/REDUCING), default_term_weeks

**Loan**
- id, client_id, loan_product_id, principal_amount, interest_rate, term_weeks, disbursement_date, status (PENDING/APPROVED/DISBURSED/CLOSED/DEFAULTED), approved_by (user_id), created_at

**LoanInstallmentSchedule** (অটো-জেনারেটেড, লোন ডিসবার্স হলে তৈরি হবে)
- id, loan_id, installment_number, due_date, principal_due, interest_due, total_due, status (PENDING/PAID/OVERDUE)

**LoanRepayment** (আসল কালেকশন এন্ট্রি)
- id, loan_id, installment_schedule_id, amount_paid, payment_date, recorded_by (user_id)

**CashTransaction** (বেসিক ক্যাশ বুক — MVP-র সরল অ্যাকাউন্টিং)
- id, type (CASH_IN/CASH_OUT), category (DISBURSEMENT/COLLECTION/SAVINGS_DEPOSIT/SAVINGS_WITHDRAWAL/EXPENSE), amount, related_loan_id (nullable), related_savings_id (nullable), transaction_date, recorded_by

### 4.3 গুরুত্বপূর্ণ সম্পর্ক (Relations)
- Branch 1—N Center 1—N Group 1—N Client
- Client 1—1 SavingsAccount (MVP-তে একজন ক্লায়েন্টের একটাই সঞ্চয় হিসাব)
- Client 1—N Loan
- Loan 1—N LoanInstallmentSchedule
- LoanInstallmentSchedule 1—N LoanRepayment (আংশিক পরিশোধ হতে পারে বলে ১-N)

---

## ৫. Loan হিসাব লজিক (সবচেয়ে গুরুত্বপূর্ণ — এখানে ভুল করা যাবে না)

### Flat Rate পদ্ধতি (বাংলাদেশের অনেক MFI-তে জনপ্রিয়)
```
মোট সুদ = principal × interest_rate × (term_weeks / 52)
প্রতি কিস্তির পরিমাণ = (principal + মোট সুদ) / term_weeks
```

### Reducing Balance পদ্ধতি (বেশি ব্যাংকিং-স্ট্যান্ডার্ড)
```
প্রতিটি কিস্তিতে সুদ হিসাব হবে অবশিষ্ট principal-এর উপর।
এজেন্টকে amortization schedule generate করার standard formula ব্যবহার করতে বলা হবে।
```

**নির্দেশনা এজেন্টের জন্য:** LoanProduct-এ `interest_method` ফিল্ড অনুযায়ী schedule generation লজিক আলাদা হবে — এটা `services/loanCalculationService.js`-এ আলাদা ফাংশন হিসেবে রাখতে হবে, যাতে পরে টেস্ট করা সহজ হয়।

---

## ৬. API এন্ডপয়েন্ট লিস্ট (MVP)

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Branch/Center/Group
- `GET/POST /api/branches`
- `GET/POST /api/centers`
- `GET/POST /api/groups`

### Client
- `GET /api/clients` (filter by group/center)
- `POST /api/clients`
- `GET /api/clients/:id`
- `PUT /api/clients/:id`

### Savings
- `POST /api/savings/deposit`
- `POST /api/savings/withdraw`
- `GET /api/savings/:clientId/transactions`

### Loan
- `POST /api/loans` (আবেদন তৈরি)
- `PUT /api/loans/:id/approve`
- `PUT /api/loans/:id/disburse` (এটা schedule অটো-জেনারেট করবে)
- `GET /api/loans/:id`
- `GET /api/loans/:id/schedule`
- `POST /api/loans/:id/repayment`
- `GET /api/loans/overdue` (overdue রিপোর্ট)

### Reports
- `GET /api/reports/daily-collection`
- `GET /api/reports/portfolio-summary`

---

## ৭. Frontend পেজ লিস্ট (MVP)

1. Login
2. Dashboard (সামারি কার্ড: total clients, active loans, today's collection, overdue count)
3. Clients — list, add, edit, detail view
4. Groups/Centers — list, add
5. Loan Application — form
6. Loan Approval — pending list, approve button
7. Loan Disbursement — approved list, disburse button
8. Loan Detail — schedule টেবিল, repayment এন্ট্রি ফর্ম
9. Savings — deposit/withdraw ফর্ম, transaction history
10. Reports — daily collection sheet, overdue list, portfolio summary

---

## ৮. Role-based Access (MVP এ সরল রাখা)

| রোল | পারমিশন |
|---|---|
| ADMIN | সব কিছু |
| BRANCH_MANAGER | নিজের branch-এর সব ডাটা দেখা, loan approve করা |
| FIELD_OFFICER | নিজের center/group-এর client দেখা, collection এন্ট্রি করা, loan application তৈরি করা (approve করতে পারবে না) |

---

## ৯. টাস্ক ব্রেকডাউন (এজেন্টকে ধাপে ধাপে দেওয়ার জন্য)

এই ক্রম মেনে একটা একটা করে টাস্ক এজেন্টকে দিন। প্রতিটার পর টেস্ট করে তারপর পরেরটা দিন।

1. **Project setup** — backend (Express) + frontend (Vite React) স্ক্যাফোল্ড, PostgreSQL কানেকশন, Prisma init
2. **Database schema** — Section ৪ অনুযায়ী `schema.prisma` লেখা + migration রান
3. **Auth module** — User model, login API, JWT middleware
4. **Branch/Center/Group/Client CRUD** — backend API + সংশ্লিষ্ট frontend পেজ
5. **Savings module** — deposit/withdraw API + frontend ফর্ম
6. **Loan application + approval workflow** — API + frontend
7. **Loan calculation service** — flat rate পদ্ধতি (প্রথমে একটাই method দিয়ে শুরু করুন, পরে reducing balance যোগ করবেন)
8. **Loan disbursement + schedule generation** — disburse করলে schedule auto তৈরি
9. **Repayment entry** — collection এন্ট্রি API + frontend
10. **Overdue detection logic** — cron/scheduled check বা query-based (MVP-তে query-based সহজ)
11. **Dashboard + reports** — সামারি ডাটা, daily collection sheet
12. **Polish** — validation, error handling, basic UI cleanup

---

## ১০. এজেন্টকে দেওয়ার নিয়ম (আপনার জন্য reminder)

- প্রতিটা টাস্ক দেওয়ার সময় বলুন: *"MFI-MVP-SPEC.md ফাইলটা পড়ে নাও, এখন Section ৯-এর টাস্ক #X কর।"*
- একটা টাস্ক শেষে **অ্যাপ চালিয়ে ম্যানুয়ালি টেস্ট করুন** (যেমন একটা client add করে দেখা)
- কাজ করলে **git commit** করুন (`git add . && git commit -m "task X done"`)
- সমস্যা হলে error message কপি করে এখানে (Claude chat-এ) নিয়ে আসুন — সমাধান বুঝে তারপর এজেন্টকে নির্দেশ দিন
