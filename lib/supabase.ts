import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// These environment variables need to be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing! Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Dish {
  id: string;
  created_at: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  rating: number | null;
  order_count: number;
  restaurant_slug: string;
}

/**
 * Fetches all dishes for a specific restaurant by slug.
 * @param slug The URL slug of the restaurant (e.g. 'the-golden-spoon')
 * @returns An array of dishes
 */
export async function getDishesByRestaurantSlug(slug: string): Promise<Dish[]> {
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('restaurant_slug', slug)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching dishes:', error);
    throw new Error(error.message);
  }

  return data as Dish[];
}

/**
 * Uploads a dish image to Supabase storage.
 * Requires a storage bucket named 'dishes' to be created in your Supabase dashboard and set to Public.
 * @param file The image file to upload
 * @param bucket The storage bucket name
 * @returns The public URL of the uploaded image
 */
export async function uploadDishImage(file: File, bucket: string = 'dishes'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file);

  if (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
