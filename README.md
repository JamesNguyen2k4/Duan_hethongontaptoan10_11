# Hệ thống ôn tập Toán 10–11

Nền tảng học Toán theo vòng học khép kín: **Lý thuyết → Bài tập → Phân tích điểm yếu → Ôn tập ngắt quãng**.

## Yêu cầu

- Node.js **18+**
- PostgreSQL **15+** (hoặc Docker)
- npm 9+

## Khởi động nhanh (Development)

### 1. Cài packages

```bash
npm install
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env.local
# Chỉnh DATABASE_URL và AUTH_SECRET trong .env.local
```

### 3. Khởi động PostgreSQL bằng Docker

```bash
docker-compose up db -d
```

### 4. Tạo database và seed dữ liệu

```bash
npm run db:push        # Tạo bảng từ schema
npm run db:seed        # Seed tài khoản mặc định
```

### 5. Chạy dev server

```bash
npm run dev
```

Mở <http://localhost:3000>

### Tài khoản mặc định (sau khi seed)

| Vai trò      | Email                  | Mật khẩu       |
|--------------|------------------------|----------------|
| Quản trị     | admin@ontap.vn         | admin123       |
| Giáo viên    | giaovien@ontap.vn      | giaovien123    |

## Cấu trúc thư mục

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/              # Trang đăng nhập, đăng ký
│   ├── (student)/           # Khu vực học sinh (có layout riêng)
│   ├── (admin)/             # Khu vực quản trị
│   └── api/                 # API routes
│       └── auth/[...nextauth]/ # Auth.js handler
├── features/                # Logic theo từng chức năng
│   ├── auth/                # Đăng nhập, đăng ký, phân quyền
│   ├── ly-thuyet/           # Module lý thuyết
│   ├── bai-tap/             # Ngân hàng bài tập
│   ├── lam-bai/             # Làm bài & lịch sử
│   ├── phan-tich/           # Phân tích điểm yếu
│   ├── on-tap/              # Ôn tập ngắt quãng (SM-2)
│   └── dien-dan/            # Diễn đàn học tập
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── shared/              # Components dùng chung
│   └── layouts/             # Layout components
├── lib/
│   ├── auth.ts              # Auth.js config
│   ├── db.ts                # Prisma client
│   ├── utils.ts             # Tiện ích
│   └── spaced-repetition.ts # Thuật toán SM-2
├── middleware.ts            # Phân quyền theo route
└── types/                   # TypeScript type declarations
prisma/
├── schema.prisma            # Database schema
└── seed.ts                  # Dữ liệu khởi tạo
```

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run db:push` | Đồng bộ schema với DB |
| `npm run db:migrate` | Tạo migration |
| `npm run db:studio` | Prisma Studio (GUI xem DB) |
| `npm run db:seed` | Seed dữ liệu mặc định |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |

## Chạy bằng Docker (Production)

```bash
cp .env.example .env.local
# Điền AUTH_SECRET và AUTH_URL vào .env.local
docker-compose up --build
```

