# AIGrowth Company Profile

Website AIGrowth.id dengan CMS admin, Supabase Auth, pengelolaan konten, upload gambar, dan analytics internal.

## Fitur

- Halaman publik untuk video YouTube, event, course, dan tools.
- Login admin menggunakan akun Supabase Auth.
- CMS untuk menambah, mengubah, dan menghapus konten.
- Upload gambar ke Supabase Storage.
- Analytics page view, sumber traffic, dan klik menuju situs eksternal.
- Deployment frontend melalui Vercel.

## Setup lokal

1. Buat project Supabase baru.
2. Jalankan SQL di `supabase/migrations/202609150001_aigrowth_cms_analytics.sql` melalui Supabase SQL Editor.
3. Buat user admin melalui Authentication > Users.
4. Tambahkan user tersebut ke tabel admin:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'theadrian7@gmail.com';
   ```

5. Salin `.env.example` menjadi `.env.local`, kemudian isi URL dan anon key Supabase.
6. Install dan jalankan aplikasi:

   ```bash
   npm install
   npm run dev
   ```

Admin tersedia di `/login` dan `/admin`.

## Deployment Vercel

Hubungkan repository ini ke project Vercel yang menggunakan domain `aigrowth.id`, lalu tambahkan environment variables berikut untuk Production, Preview, dan Development:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Deploy branch `main`. Routing SPA dikonfigurasi melalui `vercel.json`.

## Catatan analytics

Analytics tidak menyimpan alamat IP atau informasi pribadi. Pengunjung dihitung berdasarkan ID sesi acak yang disimpan selama tab browser aktif. Event dari halaman `/login` dan `/admin` tidak dicatat.
