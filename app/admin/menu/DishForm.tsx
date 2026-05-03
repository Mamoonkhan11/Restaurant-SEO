"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { uploadDishImage } from '@/lib/supabase';

const dishSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.any(),
  category: z.string().min(1, 'Category is required'),
});

export default function DishForm({ initialData, onClose, onSave }: { initialData?: any, onClose: () => void, onSave: (data: any) => void }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialData?.image_url || '');
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || '',
      category: initialData?.category || 'Fast Food',
    }
  });

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

      const finalData = {
        ...data,
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
            <input {...register('name')} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="e.g. Wagyu Burger" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{String(errors.name.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <textarea {...register('description')} rows={2} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="Delicious ingredients..." />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select {...register('category')} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium">
                <option>Fast Food</option>
                <option>Main Course</option>
                <option>Drinks</option>
                <option>Desserts</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Price ($)</label>
              <input type="number" step="0.01" {...register('price')} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="0.00" />
              {errors.price && <p className="text-red-500 text-xs mt-1">{String(errors.price.message)}</p>}
            </div>
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
