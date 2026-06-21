import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache the client so we don't recreate it on every call unless credentials change
let supabaseInstance: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

/**
 * Gets the active Supabase client based on the credentials saved in local storage.
 * If credentials are not set, it returns null.
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  try {
    // Prioritaskan Environment Variables (Vercel/Netlify), jika kosong baru baca dari LocalStorage
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    let dbConfig = null;
    const storageData = localStorage.getItem('ksr-admin-storage');
    if (storageData) {
      try {
        const parsedData = JSON.parse(storageData);
        dbConfig = parsedData?.state?.cms?.database;
      } catch (e) {}
    }

    const supabaseUrl = envUrl || dbConfig?.supabaseUrl;
    const supabaseKey = envKey || dbConfig?.supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    // If credentials haven't changed, return the cached instance
    if (supabaseInstance && currentUrl === supabaseUrl && currentKey === supabaseKey) {
      return supabaseInstance;
    }

    // Create a new instance
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    currentUrl = supabaseUrl;
    currentKey = supabaseKey;

    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

/**
 * Mengunggah gambar Base64 ke Supabase Storage bucket "images".
 * Mengembalikan URL publik dari gambar yang diunggah.
 */
export const uploadBase64ToSupabase = async (base64: string, pathPrefix = 'img'): Promise<string> => {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    // Jika tidak ada Supabase, kita kembalikan saja base64-nya (sebagai fallback lokal)
    // agar aplikasi tidak rusak jika pengguna belum setting database
    return base64;
  }

  try {
    // Generate nama file unik
    const filename = `${pathPrefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

    // Konversi base64 ke file Blob yang siap diupload
    const res = await fetch(base64);
    const blob = await res.blob();

    // Upload ke bucket "images"
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filename, blob, {
        contentType: 'image/webp',
        cacheControl: '3600', // Cache 1 jam
        upsert: false
      });

    if (error) {
      console.error("Supabase Upload Error:", error);
      throw new Error(error.message);
    }

    // Ambil URL Publiknya
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Gagal mengunggah ke Supabase:", error);
    // Fallback ke penyimpanan lokal base64 jika gagal upload
    return base64;
  }
};
