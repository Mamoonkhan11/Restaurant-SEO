"use client";
import React from 'react';
import Image from 'next/image';

const DishImage = ({ src, alt, priority = false }: { src: string, alt: string, priority?: boolean }) => {
  return (
    <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 96px, 112px"
        priority={priority}
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8/wQAAgMBAAC4vC4AAAAASUVORK5CYII="
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />
    </div>
  );
};

const menuData = [
  {
    category: 'Fast Food',
    id: 'fast-food',
    items: [
      { name: 'Truffle Parmesan Fries', price: 8.99, description: 'Crispy fries tossed in white truffle oil and aged parmesan', isBestSeller: true, isAvailable: true, rating: 4.8, ordersText: 'Ordered 120+ times this week', image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Fries' },
      { name: 'Wagyu Beef Burger', price: 18.50, description: 'Premium wagyu beef patty with caramelized onions and house sauce', isBestSeller: true, isAvailable: true, rating: 4.9, ordersText: 'Ordered 350+ times this week', image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Burger' },
      { name: 'Spicy Chicken Wrap', price: 12.50, description: 'Crispy chicken, spicy mayo, and fresh lettuce in a warm tortilla', isBestSeller: false, isAvailable: false, rating: 4.5, ordersText: 'Ordered 85 times this week', image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Chicken+Wrap' },
    ]
  },
  {
    category: 'Drinks',
    id: 'drinks',
    items: [
      { name: 'Mango Passionfruit Smoothie', price: 6.50, description: 'Fresh tropical fruits blended to perfection', isBestSeller: true, isAvailable: true, rating: 4.7, ordersText: 'Ordered 200+ times this week', image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Smoothie' },
      { name: 'Artisan Iced Coffee', price: 4.99, description: 'Cold brewed single-origin coffee with a splash of oat milk', isBestSeller: false, isAvailable: true, rating: 4.6, ordersText: 'Ordered 150 times this week', image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Iced+Coffee' },
    ]
  },
  {
    category: 'Sweets',
    id: 'sweets',
    items: [
      { name: 'Molten Chocolate Lava Cake', price: 9.50, description: 'Warm chocolate cake with a gooey center, served with vanilla bean ice cream', isBestSeller: true, isAvailable: true, rating: 4.9, ordersText: 'Ordered 240+ times this week', image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Lava+Cake' },
      { name: 'New York Cheesecake', price: 8.00, description: 'Classic creamy cheesecake with a graham cracker crust and berry compote', isBestSeller: false, isAvailable: false, rating: 4.7, ordersText: 'Ordered 110 times this week', image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Cheesecake' },
    ]
  }
];

export default function DigitalMenu({ params }: { params: { slug: string } }) {
  const restaurantName = params.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('all');

  const filteredMenuData = menuData
    .filter(category => activeCategory === 'all' || category.id === activeCategory)
    .map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gray-200">
      <style>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInSlideUp 0.4s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 p-3 bg-white rounded-full shadow-sm">
            <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl mb-4">
            {restaurantName || 'Restaurant'}
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
            Experience our carefully curated digital menu
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for a dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Sticky Category Navigation (Tab Bar) */}
        <div className="sticky top-0 z-40 bg-gray-50/95 backdrop-blur-md pt-2 pb-4 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex space-x-2 sm:space-x-3 overflow-x-auto scrollbar-hide snap-x pb-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold transition-all duration-300 snap-start focus:outline-none ${
                activeCategory === 'all' 
                  ? 'bg-gray-900 text-white shadow-md scale-105' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              All Menu
            </button>
            {menuData.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold transition-all duration-300 snap-start focus:outline-none ${
                  activeCategory === category.id
                    ? 'bg-gray-900 text-white shadow-md scale-105'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {category.category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Sections */}
        <div key={activeCategory} className="space-y-16 animate-fade-in-up">
          {filteredMenuData.length === 0 ? (
            <div className="text-center py-20">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No dishes found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search criteria.</p>
            </div>
          ) : (
            filteredMenuData.map((category) => (
              <div key={category.id} id={category.id} className="scroll-mt-28">
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold text-gray-900 border-b-4 border-blue-500 inline-block pb-2 tracking-tight">
                    {category.category}
                  </h2>
                </div>
                <div className="space-y-6">
                  {category.items.map((item, index) => (
                    <div key={index} className={`bg-white rounded-2xl shadow-sm transition-all duration-300 border border-gray-100 p-4 sm:p-6 flex flex-row gap-4 relative group ${item.isAvailable ? 'hover:shadow-xl' : 'opacity-60 grayscale-[40%]'}`}>
                      {item.isBestSeller && item.isAvailable && (
                        <div className="absolute -top-3 sm:-top-3.5 -right-2 sm:-right-4 z-10">
                          <span className="bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 tracking-wide">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            BEST SELLER
                          </span>
                        </div>
                      )}
                      {!item.isAvailable && (
                        <div className="absolute -top-3 sm:-top-3.5 -right-2 sm:-right-4 z-10">
                          <span className="bg-gray-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 tracking-wide">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            SOLD OUT
                          </span>
                        </div>
                      )}

                      {/* Thumbnail Image */}
                      <DishImage src={item.image} alt={item.name} priority={index < 2} />

                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                          <div className="min-w-0">
                            <div className="flex justify-between items-start sm:block">
                              <h3 className={`text-lg sm:text-xl font-bold truncate transition-colors ${item.isAvailable ? 'text-gray-900 group-hover:text-blue-600' : 'text-gray-600'}`}>
                                {item.name}
                              </h3>
                              <div className={`text-lg sm:text-xl font-black shrink-0 sm:hidden ${item.isAvailable ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                ${item.price.toFixed(2)}
                              </div>
                            </div>

                            {/* Rating and Social Proof */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2.5">
                              <div className={`flex items-center ${item.isAvailable ? 'text-yellow-400' : 'text-gray-400'}`}>
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                <span className="ml-1 text-xs sm:text-sm font-bold text-gray-700">{item.rating}</span>
                              </div>
                              <div className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-md border text-[10px] sm:text-xs font-semibold tracking-wide shadow-sm ${item.isAvailable ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                <svg className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${item.isAvailable ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                <span className="truncate max-w-[120px] sm:max-w-none">{item.ordersText}</span>
                              </div>
                            </div>

                            <p className="mt-2 sm:mt-3 text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          <div className={`text-xl sm:text-2xl font-black shrink-0 hidden sm:block ${item.isAvailable ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                            ${item.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400 font-medium">
            Powered by <span className="text-gray-600 font-bold">Restaurant SEO SaaS</span>
          </p>
        </div>
      </div>

      {/* Floating WhatsApp Share Button */}
      <button
        onClick={() => {
          const url = typeof window !== 'undefined' ? window.location.href : '';
          const text = `Check out our delicious menu here: ${url}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-[#25D366] text-white p-4 rounded-full shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:bg-[#128C7E] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-1 transition-all duration-300 z-50 flex items-center justify-center group cursor-pointer"
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </button>
    </div>
  );
}
