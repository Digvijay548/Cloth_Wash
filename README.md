# Wenni Skin Care Academy — Client Website

An elegant, high-performance, fully data-driven single-page application (SPA) built for **Wenni Skin Care Academy**, branch Manjari Budruk, Pune. 

This website features custom scroll animations, micro-interactions, responsive grids, a 3D card tilt effect, and a direct-to-WhatsApp booking form.

---

## 🚀 Running Locally

The project runs on a simple static file server.

1. Open a terminal in the project directory.
2. Run the local development server:
   ```bash
   npx serve . --listen 3000
   ```
3. Open your browser and navigate to:
   **[http://localhost:3000](http://localhost:3000)**

---

## ⚙️ Configuration & Customization (`data.json`)

The entire website is data-driven. All text, services, ratings, testimonies, clinic hours, contact details, and images are managed directly inside **[`data.json`](file:///c:/GitHub/Clinic_website/data.json)**. No code changes are required to update content.

### 🎓 How to Toggle the Course / Academy Section
You can completely hide or show the cosmetology courses section dynamically. 

Open **[`data.json`](file:///c:/GitHub/Clinic_website/data.json)**, locate the `"academic"` object, and set the `"enabled"` flag:

```json
  "academic": {
    "enabled": true,   // Set to true to display the Courses section, false to hide it
    "eyebrow": "Wenni Skin Care Academy",
    "title": "Learn The Art Of",
    ...
  }
```

#### What happens automatically when `"enabled": false` is set:
* 🚫 **Hides Section**: The academy section (`#academic`) is set to `display: none` in the document body.
* 🧭 **Cleans Navigation**: The `"Academy"` link is automatically removed from the header navigation bar.
* 👣 **Cleans Footer**: The `"Our Academy"` link is dynamically removed from the footer quick links.
* ⚡ **Optimizes Animations**: The IntersectionObserver scroll triggers and scroll spy active links bypass the section entirely.

---

## 🎨 Visual System & Branding

* **Primary Colors**: Luxurious Plum base (`#1a0a2e`), Rose and Purple gradients (`#F472B6` to `#C084FC`), and Amber Gold accents (`#F59E0B`).
* **Typography**: Elegant **Cormorant Garamond** serif for display headers, and clean **Inter** sans-serif for body reading.

---

## ⚡ Supabase Setup (Serverless Admin Panel)

The website is integrated with **Supabase** for database, storage, and authentication. This enables a fully client-side (serverless) admin panel at `/admin.html` to manage texts, lists, and images.

Follow these step-by-step instructions to configure your Supabase backend:

### Step 1: Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com) and click **New Project**.
2. Enter your project details (e.g. name, database password) and select a hosting region closest to your audience.
3. Wait for the project database to provision.

### Step 2: Initialize the Database Table
1. Go to the **SQL Editor** tab in the left-hand sidebar of the Supabase dashboard.
2. Click **New query**.
3. Paste the following SQL script to create the `site_settings` table, enable Row Level Security (RLS), and configure access control policies:

```sql
-- 1. Create the settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id integer PRIMARY KEY DEFAULT 1,
    content jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public read access to the website configurations
CREATE POLICY "Allow public read access" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- 4. Policy: Allow logged-in authenticated users to create configurations
CREATE POLICY "Allow authenticated insert" 
ON public.site_settings 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 5. Policy: Allow logged-in authenticated users to edit configurations
CREATE POLICY "Allow authenticated update" 
ON public.site_settings 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);
```
4. Click **Run** in the top right to execute.

### Step 3: Create the Storage Bucket & Upload Policies
1. Click **Storage** in the left sidebar of the Supabase dashboard.
2. Click **New bucket** and name the bucket exactly: `cloth_wash-assets`
3. Toggle the **Public bucket** switch to **ON** (this is critical so that website visitors can load the images you upload). Click **Save**.
4. Go to your `cloth_wash-assets` bucket and click on **Policies** (or **Policies** under the Storage configuration section in the left sidebar):
   * **Read Policy (Select)**:
     - Click **New policy** -> Select **For full customization** (custom query).
     - **Name**: `Allow public read`
     - **Allowed operations**: Check **SELECT** only.
     - **Target role**: Select `public` (anyone).
     - **Policy Definition (USING expression)**: Type exactly `true` in the text editor box.
     - Click **Save policy**.
   * **Manage Policy (Insert/Update/Delete)**:
     - Click **New policy** -> Select **For full customization** (custom query).
     - **Name**: `Allow authenticated management`
     - **Allowed operations**: Check **INSERT**, **UPDATE**, and **DELETE** only.
     - **Target role**: Select `authenticated` (your logged-in admin user).
     - **Policy Definition (WITH CHECK / USING expressions)**: Type exactly `true` in both expression text editor boxes.
     - Click **Save policy**.

### Step 4: Create Admin Login Credentials
1. Click **Authentication** in the left sidebar.
2. Go to the **Users** tab.
3. Click **Add user** -> **Create user**.
4. Enter your admin email and password.
5. Make sure **Auto-confirm user** is checked **ON**. Click **Create user**. (This is your login account for `/admin.html`).
6. Next, go to **Authentication** -> **Providers** -> **Email**.
7. Ensure **Enable Email provider** is **ON**.
8. Ensure **Confirm email** toggle is **OFF** (this bypasses email link validation so you can log in immediately). Click **Save**.

### Step 5: Configure Website Connection API Keys
To connect your local codebase with your Supabase database:
1. Go to **Project Settings** (click the gear icon ⚙️ at the bottom of the left-hand sidebar).
2. Under the Project Settings menu, click on **API**.
3. **Copy the Project URL**:
   - Locate the box labeled **Project URL** (under the "API Settings" header).
   - Copy the URL link (it starts with `https://` and ends with `.supabase.co`).
4. **Copy the Anon Public Key**:
   - Scroll down to the **Project API keys** section.
   - Locate the row labeled **`anon` / `public`**.
   - Click **Copy** to copy the long string of characters (which starts with `eyJ...`).
5. Open the file [`supabase-config.js`](file:///c:/GitHub/SkinCare_Website/supabase-config.js) in your text editor.
6. Replace the placeholder values with your copied credentials. Make sure to keep the double quotes:
```javascript
window.SUPABASE_CONFIG = {
  url: "https://your-project-id.supabase.co",          // Paste your copied Project URL here
  anonKey: "your-anon-public-api-key-here"            // Paste your copied anon/public API key here
};
```

### Step 6: Migrate existing images to Supabase
1. Run the website locally (e.g. click the localhost links or run your server).
2. Go to [http://localhost:8000/admin.html](http://localhost:8000/admin.html) and sign in.
3. Once logged in, click the blue **📤 Migrate Images** button in the top right header.
4. The system will automatically fetch all local assets, upload them to your Supabase Storage bucket, map the URLs, and update the database configuration. You are now 100% serverless!

---

## 💎 Advanced Features & Admin Capabilities

We have expanded the client homepage and admin dashboard with state-of-the-art serverless capabilities:

### 1. Real-time Live Preview Editor
*   **Dual View Layout**: The admin dashboard features a side-by-side editing panel and interactive live website preview.
*   **Visual Controls**: Switch the viewport to **Mobile (📱)** or **Desktop (💻)**, and use the **Zoom (➕/➖)** keys to adjust scale.
*   **Live Synchronization**: Any text you type, switch you toggle, or image you upload dynamically pushes configurations to the live preview frame using high-performance `postMessage` synchronization without refreshing the browser or hitting save database limits.
*   **Live Preview Toggle**: Toggle the review visibility switch OFF in the header to expand the form workspace to full-screen width.

### 2. Animated Background Hero Slideshow
*   **Dynamic Slideshow**: Multiple slides can be added, updated, or removed in the **Hero Section Settings** tab.
*   **Individual Slide Titles**: Customize different Main and Accent (rose colored) titles per slide. 
*   **Crossfade Effect**: Background images crossfade every 5.5 seconds, while slide titles slide out, update text, and slide back in sync with the slide rotation.

### 3. Glassmorphic Dropdown Navigation (Mobile)
*   The responsive mobile menu overlay has been redesigned with a premium transparent frosted-glass panel (`background: rgba(26, 10, 46, 0.65)` and `backdrop-filter: blur(20px)`), sliding down elegantly from the header bar instead of blocking the screen in plain white block cards.

### 4. Dynamic Maps & Social Media Profiles
*   **Dedicated Social & Map Tab**: Manage links and toggle visibility for Instagram, Facebook, and WhatsApp shortcuts.
*   **Flexible Maps**: Paste complex `iframe` embed codes OR simple maps share links (`https://maps.app.goo.gl/xxx`). If a simple link is pasted, the client homepage automatically displays a luxury location card containing instructions, a floating pin, and a button linking to Google Maps.

### 5. Automatic Supabase File & Storage Cleanup
*   **Physical Deletions**: Deleting database cards (Services, Academy Courses, Testimonials, Gallery Showcase items) physically deletes their uploaded assets from your Supabase Storage bucket.
*   **Replacing Images**: Uploading a new image or clicking the red **Remove Image** button immediately frees up space by cleaning old files from Supabase Storage.

