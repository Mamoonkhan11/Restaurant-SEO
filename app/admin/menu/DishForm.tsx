"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { uploadDishImage } from '@/lib/supabase';

const dishSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
});

export default function DishForm({ initialData, onClose, onSave }: { initialData?: any, onClose: () => void, onSave: (data: any) => void }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialData?.image_url || '');
  const [isUploading, setIsUploading] = useState(false);

  const standardCategories = ['Fast Food', 'Main Course', 'Drinks', 'Desserts'];
  const [isCustomCategory, setIsCustomCategory] = useState(
    initialData?.category ? !standardCategories.includes(initialData.category) : false
  );

  const [sizes, setSizes] = useState<{label: string, price: string}[]>(
    initialData?.sizes || [{ label: 'Regular', price: initialData?.price || '' }]
  );
  const [isSpecialOffer, setIsSpecialOffer] = useState(initialData?.is_special_offer || false);
  const [offerTag, setOfferTag] = useState(initialData?.offer_tag || '');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || 'Fast Food',
    }
  });

  const handleAddSize = () => setSizes([...sizes, { label: '', price: '' }]);
  const handleRemoveSize = (index: number) => setSizes(sizes.filter((_, i) => i !== index));
  const handleSizeChange = (index: number, field: 'label' | 'price', value: string) => {
    const newSizes = [...sizes];
    newSizes[index][field] = value;
    setSizes(newSizes);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsUploading(true);
      let imageUrl = previewUrl;
      
      if (imageFile) {
        imageUrl = await uploadDishImage(imageFile, 'dishes');
      }

      const basePrice = sizes.length > 0 && sizes[0].price ? parseFloat(sizes[0].price) : 0;

      const finalData = {
        ...data,
        price: basePrice, // required for existing schema
        sizes: sizes,
        is_special_offer: isSpecialOffer,
        offer_tag: isSpecialOffer ? offerTag : null,
        image_url: imageUrl,
        ...(initialData?.id ? { id: initialData.id } : {})
      };

      await onSave(finalData);
    } catch (error) {
      alert('Failed to save dish');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-gray-100 flex flex-col max-h-[90vh]">
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h3 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Dish' : 'Add New Dish'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Dish Name</label>
            <input {...register('name')} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="e.g. Wagyu Burger" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{String(errors.name.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <textarea {...register('description')} rows={2} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="Delicious ingredients..." />
            {errors.description && <p className="text-red-500 text-xs mt-1">{String(errors.description.message)}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              {!isCustomCategory ? (
                <select 
                  {...register('category')} 
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomCategory(true);
                      setValue('category', '');
                    } else {
                      setValue('category', e.target.value);
                    }
                  }}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                >
                  {standardCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="custom" className="font-bold text-blue-600">➕ Add Custom Category</option>
                </select>
              ) : (
                <div className="relative">
                  <input 
                    {...register('category')} 
                    autoFocus
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                    placeholder="Type custom category..."
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCustomCategory(false);
                      setValue('category', standardCategories[0]);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {errors.category && <p className="text-red-500 text-xs mt-1">{String(errors.category.message)}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-gray-700">Portion Sizes & Prices</label>
              <button type="button" onClick={handleAddSize} className="text-blue-600 text-sm font-bold hover:text-blue-700 flex items-center gap-1">
                + Add Size
              </button>
            </div>
            {sizes.map((size, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="e.g. Half, Full, Large"
                  value={size.label}
                  onChange={(e) => handleSizeChange(index, 'label', e.target.value)}
                  className="w-1/2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price (₹)"
                  value={size.price}
                  onChange={(e) => handleSizeChange(index, 'price', e.target.value)}
                  className="w-1/2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
                {sizes.length > 1 && (
                  <button type="button" onClick={() => handleRemoveSize(index)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-orange-900">Special Offer</label>
                <p className="text-xs text-orange-700/80 mt-0.5">Feature this item at the top of your menu.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isSpecialOffer} onChange={(e) => setIsSpecialOffer(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
            {isSpecialOffer && (
              <div>
                <input
                  type="text"
                  placeholder="Offer Tag (e.g. Eid Special 🌙, 50% Off)"
                  value={offerTag}
                  onChange={(e) => setOfferTag(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-orange-200 rounded-xl text-orange-900 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Dish Photo</label>
            <div className="mt-1 flex justify-center px-6 pt-7 pb-8 border-2 border-gray-200 border-dashed rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-colors relative bg-gray-50">
              {previewUrl ? (
                <div className="text-center w-full">
                  <img src={previewUrl} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-xl shadow-sm mb-4" />
                  <label className="cursor-pointer font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                    Change Photo
                    <input type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                  </label>
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                    <UploadCloud className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="cursor-pointer bg-transparent rounded-md font-bold text-blue-600 hover:text-blue-500">
                      <span>Click to upload</span>
                      <input type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs font-medium text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 bg-white border-2 border-gray-200 text-gray-700 px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || isUploading} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-md transition-all disabled:opacity-70 flex justify-center items-center gap-2">
              {(isSubmitting || isUploading) ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
