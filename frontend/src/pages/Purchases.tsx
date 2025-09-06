import React from 'react';
import { Package, Calendar, DollarSign } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Purchases: React.FC = () => {
  const { purchases } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purchase History</h1>
        <p className="text-gray-600 mt-1">Your previous sustainable purchases</p>
      </div>

      {purchases.length > 0 ? (
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Order #{purchase.id.slice(0, 8)}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>{purchase.products.length} item{purchase.products.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium text-emerald-600">${purchase.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Completed
                  </div>
                </div>

                <div className="space-y-4">
                  {purchase.products.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-full sm:w-20 h-20">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{item.product.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.product.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                            {item.product.category}
                          </span>
                          <span className="text-gray-600">Qty: {item.quantity}</span>
                          <span className="text-gray-600">Price: ${item.priceAtPurchase}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">
                          ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total Amount</span>
                    <span className="text-lg font-bold text-emerald-600">${purchase.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Package className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No purchases yet</h3>
          <p className="text-gray-600 mb-6">
            Your purchase history will appear here once you start buying sustainable items.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Start Shopping
          </button>
        </div>
      )}
    </div>
  );
};

export default Purchases;