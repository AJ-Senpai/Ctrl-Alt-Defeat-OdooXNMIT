import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Category } from '../types';

const categories: Category[] = [
  'Electronics',
  'Clothing',
  'Furniture',
  'Books',
  'Sports',
  'Home & Garden',
  'Toys',
  'Automotive',
  'Other',
];

// Sample placeholder images for different categories
const placeholderImages: Record<Category, string> = {
  Electronics: 'https://images.pexels.com/photos/325153/pexels-photo-325153.jpeg',
  Clothing: 'https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg',
  Furniture: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg',
  Books: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg',
  Sports: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg',
  'Home & Garden': 'https://images.pexels.com/photos/1005058/pexels-photo-1005058.jpeg',
  Toys: 'https://images.pexels.com/photos/163519/lego-blocks-bricks-toy-163519.jpeg',
  Automotive: 'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg',
  Other: 'https://images.pexels.com/photos/1126384/pexels-photo-1126384.jpeg',
};

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { addProduct } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics' as Category,
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      addProduct({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price,
        imageUrl: placeholderImages[formData.category],
        isAvailable: true,
      });
      navigate('/my-listings');
    } catch (err) {
      setError('Failed to create listing. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors mr-3"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Create a listing for your item</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Product Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Product Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Enter a descriptive title for your item"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            required
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Describe your item's condition, features, and any other relevant details"
            required
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price ($) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="0.00"
            required
          />
        </div>

        {/* Image Placeholder */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <img
                  src={placeholderImages[formData.category]}
                  alt="Category preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Image placeholder based on selected category
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  In a real application, you would upload your actual product images here
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Listing...' : 'Submit Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;