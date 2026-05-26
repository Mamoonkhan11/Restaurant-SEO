import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// These environment variables need to be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        cache: 'no-store',
      });
    },
  },
});

export interface Dish {
  id: string;
  created_at: string;
  name: string;
  price?: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  rating: number | null;
  order_count: number;
  restaurant_slug: string;
  sizes?: Record<string, number>;
  is_special_offer?: boolean;
  offer_tag?: string | null;
  special_tag?: string | null;
}

/**
 * Fetches all dishes for a specific restaurant by slug.
 * @param slug The URL slug of the restaurant (e.g. 'the-golden-spoon')
 * @returns An array of dishes
 */
export async function getDishesByRestaurantSlug(slug: string): Promise<Dish[]> {
  // Try to find the restaurant first to get the correct restaurant_id
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single();

  const query = supabase.from('dishes').select('*');

  if (restaurant) {
    query.eq('restaurant_id', restaurant.id);
  } else {
    query.eq('restaurant_slug', slug);
  }

  const { data, error } = await query
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching dishes:', error);
    throw new Error(error.message);
  }

  return data as Dish[];
}

/**
 * Fetches all dishes for the authenticated admin's restaurant.
 */
export async function getDishesForAdmin(): Promise<Dish[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!restaurant) {
    return [];
  }

  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching admin dishes:', error);
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

/**
 * Updates the image_url field for a specific dish in the database.
 * @param id The dish ID
 * @param newImageUrl The new image URL to save
 */
export async function updateDishImageInDb(id: string | number, newImageUrl: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single();
  if (!restaurant) {
    throw new Error('Restaurant settings not found');
  }

  const { data, error } = await supabase
    .from('dishes')
    .update({ image_url: newImageUrl })
    .eq('id', id)
    .eq('restaurant_id', restaurant.id)
    .select();

  if (error) {
    console.error('Error updating dish image in database:', error);
    throw new Error('Failed to update database');
  }

  if (!data || data.length === 0) {
    throw new Error('No rows updated. Make sure the item belongs to your restaurant.');
  }
}

/**
 * Removes an old image from Supabase storage using its public URL.
 * @param imageUrl The public URL of the image to remove
 * @param bucket The storage bucket name
 */
export async function removeDishImage(imageUrl: string, bucket: string = 'dishes') {
  try {
    // Extract the file path from the public URL
    const urlParts = imageUrl.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length === 2) {
      const filePath = urlParts[1];
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) {
        console.error('Error removing old image:', error);
      }
    }
  } catch (err) {
    console.error('Failed to parse and remove old image:', err);
  }
}

/**
 * Updates the availability status of a dish.
 */
export async function updateDishAvailability(id: string | number, is_available: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single();
  if (!restaurant) {
    throw new Error('Restaurant settings not found');
  }

  const { data, error } = await supabase
    .from('dishes')
    .update({ is_available })
    .eq('id', id)
    .eq('restaurant_id', restaurant.id)
    .select();

  if (error) {
    console.error('Error updating availability:', error);
    throw new Error('Failed to update availability');
  }

  if (!data || data.length === 0) {
    throw new Error('No rows updated. Make sure the item belongs to your restaurant.');
  }
}

/**
 * Deletes a dish from the database.
 */
export async function deleteDishFromDb(id: string | number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single();
  if (!restaurant) {
    throw new Error('Restaurant settings not found');
  }

  const { data, error } = await supabase
    .from('dishes')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', restaurant.id)
    .select();

  if (error) {
    console.error('Error deleting dish:', error);
    throw new Error('Failed to delete dish');
  }

  if (!data || data.length === 0) {
    throw new Error('No rows deleted. Make sure the item belongs to your restaurant.');
  }
}

/**
 * Upserts a dish (creates if no id, updates if id exists).
 */
export async function upsertDish(dishData: any) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('User ID:', user.id);

  // Fetch the restaurant to get the restaurant_id
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (restError || !restaurant) {
    // This exact error string can be caught and shown as an alert in the UI
    throw new Error('Please set up your restaurant in Settings first!');
  }

  // Ownership Check: If updating an existing dish, verify it belongs to this restaurant
  if (dishData.id) {
    const { data: existingDish } = await supabase
      .from('dishes')
      .select('restaurant_id')
      .eq('id', dishData.id)
      .single();

    if (existingDish && existingDish.restaurant_id !== restaurant.id) {
      throw new Error('Unauthorized: You do not own this dish.');
    }
  }

  const payload = {
    ...dishData,
    owner_id: user.id,
    restaurant_id: restaurant.id,
    is_special_offer: Boolean(dishData.is_special_offer),
    offer_tag: dishData.offer_tag ? String(dishData.offer_tag) : null,
  };

  // Strictly remove price key as it's no longer used in the new schema
  delete payload.price;

  console.log('Final Payload:', payload);

  const { data, error } = await supabase
    .from('dishes')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error upserting dish:', error);
    // Extract the exact Supabase error so the user knows if columns are missing
    throw new Error(`Database Error: ${error.message} (Hint: ${error.hint || 'Make sure your Supabase schema matches the new features.'})`);
  }
  return data;
}

/**
 * Logs an admin action to the activity_logs table.
 */
export async function logAdminAction(actionType: string, description: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!restaurant) return;

    const { error } = await supabase.from('activity_logs').insert({
      restaurant_id: restaurant.id,
      admin_id: user.id,
      action_type: actionType,
      description: description
    });

    if (error) {
      console.error('Insert activity log failed:', error.message);
    }
  } catch (err: any) {
    console.error('Failed to log admin action:', err.message || err);
  }
}

/**
 * Broadcasts an update to connected clients so the digital menu refreshes immediately.
 */
export async function broadcastMenuUpdate(slug: string) {
  const channel = supabase.channel(`public-data-${slug}`);
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({
        type: 'broadcast',
        event: 'refresh-menu',
        payload: { timestamp: Date.now() },
      });
      // Optionally remove channel after short delay
      setTimeout(() => supabase.removeChannel(channel), 1000);
    }
  });
}
