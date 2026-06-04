# MoneyTrack — คู่มือ Deploy ฉบับสมบูรณ์

## ไฟล์ในโปรเจกต์นี้
```
moneytrack/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example          ← template สำหรับ API keys
├── supabase-schema.sql   ← SQL สำหรับสร้าง database
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── lib/
    │   └── supabase.js
    └── pages/
        ├── LoginPage.jsx
        └── Dashboard.jsx
```

---

## ขั้นตอน Deploy (ใช้เวลาประมาณ 15-20 นาที)

### ขั้นตอนที่ 1 — สร้าง Supabase Project (ฟรี)

1. ไปที่ **https://supabase.com** → กด **Start your project**
2. Sign up ด้วย GitHub หรือ Email
3. กด **New project** → ตั้งชื่อ `moneytrack` → ตั้ง Database Password (จดไว้) → กด Create
4. รอประมาณ 1-2 นาทีจนโปรเจกต์พร้อม
5. ไปที่ **SQL Editor** (เมนูซ้าย) → คัดลอก SQL ทั้งหมดจากไฟล์ `supabase-schema.sql` → วางแล้วกด **Run**
6. ไปที่ **Settings → API** → คัดลอก:
   - **Project URL** (เช่น `https://abcxyz.supabase.co`)
   - **anon public** key

### ขั้นตอนที่ 2 — อัปโหลดโค้ดขึ้น GitHub (ฟรี)

1. ไปที่ **https://github.com** → สมัคร/Login
2. กด **New repository** → ตั้งชื่อ `moneytrack` → กด Create
3. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น GitHub

   **วิธีง่ายที่สุด (ลาก-วาง):**
   - เปิดหน้า repo ที่สร้างไว้
   - ลากโฟลเดอร์ `moneytrack` ทั้งหมดวางในหน้าเว็บ
   - กด **Commit changes**

   **วิธีใช้ Git (ถ้ามี):**
   ```bash
   cd moneytrack
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/moneytrack.git
   git push -u origin main
   ```

### ขั้นตอนที่ 3 — Deploy บน Vercel (ฟรี)

1. ไปที่ **https://vercel.com** → Sign up ด้วย GitHub
2. กด **Add New → Project** → เลือก repo `moneytrack`
3. ใน **Environment Variables** ให้เพิ่ม 2 ค่านี้:
   ```
   VITE_SUPABASE_URL    = https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOi...
   ```
4. กด **Deploy** → รอ 2-3 นาที
5. Vercel จะให้ URL เช่น `https://moneytrack-abc123.vercel.app` 🎉

### ขั้นตอนที่ 4 — เปิดใช้ Google Login (ไม่บังคับ)

1. ไปที่ Supabase → **Authentication → Providers → Google**
2. เปิด Enable และทำตามขั้นตอนสร้าง Google OAuth credentials
3. ใส่ Redirect URL: `https://your-app.vercel.app`

---

## ฟีเจอร์ที่มี

- ✅ สมัครสมาชิก / เข้าสู่ระบบ ด้วย Email+Password
- ✅ Login ด้วย Google
- ✅ ข้อมูลแยกต่อคน (Row Level Security)
- ✅ จัดการ Subscription (เพิ่ม/ลบ/ดูวันตัดบัญชี)
- ✅ บันทึกรายรับ-รายจ่าย พร้อมอัปโหลดรูป
- ✅ Dashboard สรุปยอด + กราฟ
- ✅ แจ้งเตือน subscription ที่ใกล้ถึง
- ✅ รองรับหลายสกุลเงิน (฿, $, €)
- ✅ Dark / Light Mode
- ✅ Responsive ใช้ได้ทั้งมือถือและ desktop

## ค่าใช้จ่าย

| บริการ | ฟรี tier |
|--------|----------|
| Vercel | ฟรีตลอดไป (สำหรับ personal projects) |
| Supabase | ฟรี: 50,000 rows, 1GB storage, 50MB database |

**สรุป: ฟรี 100% สำหรับการใช้งานทั่วไปครับ** 🎉
