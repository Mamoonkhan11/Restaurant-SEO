import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
      <div className="text-center p-8 max-w-2xl w-full">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4H5a2 2 0 0 0-2 2v3" />
              <path d="M16 4h3a2 2 0 0 1 2 2v3" />
              <path d="M8 20H5a2 2 0 0 1-2-2v-3" />
              <path d="M16 20h3a2 2 0 0 0 2-2v-3" />
              <path d="M7 14a5 5 0 0 1 10 0" />
              <path d="M6 14h12" />
              <path d="M12 9V7" />
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            QR-Crave
          </h1>
        </div>
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
