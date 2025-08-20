'use client';

import { NAVIGATION_ITEMS } from '@/constants';

export default function NavbarTestPage() {
  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🧪 Navbar Integration Test</h1>
        
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">✅ Navigation Items Configuration</h2>
          <div className="space-y-3">
            {NAVIGATION_ITEMS.map((item, index) => (
              <div key={item.href} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  {item.icon && <span className="text-xl">{item.icon}</span>}
                  <div>
                    <div className="text-white font-medium">{item.name}</div>
                    <div className="text-gray-400 text-sm">{item.href}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                  <a 
                    href={item.href}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    → Visit
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">🏷️ DAT Pages Added</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">🏭</span>
                <h3 className="text-white font-semibold">Training Market</h3>
                {/* <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">NEW</span> */}
              </div>
              <p className="text-gray-300 text-sm mb-3">
                Complete marketplace for AI training data contribution and validation
              </p>
              <a href="/training" className="text-blue-400 hover:text-blue-300 text-sm">
                → Visit Training Market
              </a>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">🏷️</span>
                <h3 className="text-white font-semibold">My DATs</h3>
                {/* <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">NEW</span> */}
              </div>
              <p className="text-gray-300 text-sm mb-3">
                Portfolio of Data Anchoring Tokens with verification status
              </p>
              <a href="/dats" className="text-blue-400 hover:text-blue-300 text-sm">
                → Visit DAT Portfolio
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">🎯 Testing Instructions</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start space-x-3">
              <span className="text-green-400 mt-1">✅</span>
              <div>
                <strong className="text-white">Navbar Icons:</strong> Check that each navigation item now displays its corresponding emoji icon
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-400 mt-1">✅</span>
              <div>
                <strong className="text-white">NEW Badges:</strong> Training Market and My DATs should show "NEW" badges in purple/blue gradient
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-400 mt-1">✅</span>
              <div>
                <strong className="text-white">Mobile Navigation:</strong> Test mobile menu (&lt; 768px) to ensure icons and badges display correctly
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-400 mt-1">✅</span>
              <div>
                <strong className="text-white">Link Functionality:</strong> All navigation links should work and show active state
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-400 mt-1">✅</span>
              <div>
                <strong className="text-white">DAT Pages:</strong> Training Market and DAT Portfolio should be fully functional
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>🚀 Success!</strong> The navbar now includes complete DAT ecosystem navigation with:
            Training Market (🏭), DAT Portfolio (🏷️), visual icons, and NEW badges for recently added features.
          </p>
        </div>
      </div>
    </div>
  );
}