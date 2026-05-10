import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
      <div className="text-center p-8 max-w-2xl w-full">
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          QR-Crave
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          Supercharge your restaurant's online presence with lightning-fast digital menus.
        </p>
        <Link 
          href="/menu/the-great-burger-joint" 
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          View Sample Digital Menu
        </Link>
      </div>
    </div>
  );
}
