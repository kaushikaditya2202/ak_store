import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ArrowLeft, Trash2, ShoppingCart, Eye, X, Upload, Receipt, FileText, Plus, Trash, LayoutGrid, Pencil, CheckCircle } from 'lucide-react';
import { User, Order, Product, Category, PickupLocation, PickupSlot } from '../../types';
import { InvoiceModal } from '../components/InvoiceModal';

interface AdminProps {
  user: User | null;
  setView: (view: any) => void;
  products: Product[];
  categories: Category[];
  fetchProducts: () => void;
}

export const Admin: React.FC<AdminProps> = ({ user, setView, products, categories, fetchProducts }) => {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [usersNext, setUsersNext] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'products' | 'users' | 'carts' | 'discounts' | 'pickup'>(() => {
    return (localStorage.getItem('adminTab') as any) || 'stats';
  });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedUserCart, setSelectedUserCart] = useState<any>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [deliverySlots, setDeliverySlots] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [categoryPreviewUrl, setCategoryPreviewUrl] = useState('');
  const [newProductPreviewUrl, setNewProductPreviewUrl] = useState('');
  const [selectedCreateCategoryId, setSelectedCreateCategoryId] = useState<number | ''>('');
  const [selectedCreateSubcategoryId, setSelectedCreateSubcategoryId] = useState<number | ''>('');
  const [selectedEditCategoryId, setSelectedEditCategoryId] = useState<number | ''>('');
  const [selectedEditSubcategoryId, setSelectedEditSubcategoryId] = useState<number | ''>('');
  const [productsPage, setProductsPage] = useState(1);
  const productsPerPage = 50;

  useEffect(() => {
    return () => {
      if (categoryPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(categoryPreviewUrl);
      if (newProductPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(newProductPreviewUrl);
    };
  }, [categoryPreviewUrl, newProductPreviewUrl]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [pickupSlots, setPickupSlots] = useState<PickupSlot[]>([]);
  const [newPickupLocation, setNewPickupLocation] = useState({ name: '', address: '', city: 'Raxaul', pincode: '845305' });
  const [newPickupSlot, setNewPickupSlot] = useState({ location_id: 0, name: '', start_time: '', end_time: '' });

  const rootCategories = categories.filter(c => !c.parent_id);
  const createSubcategories = selectedCreateCategoryId === ''
    ? []
    : categories.filter(c => c.parent_id === selectedCreateCategoryId);
  const editSubcategories = selectedEditCategoryId === ''
    ? []
    : categories.filter(c => c.parent_id === selectedEditCategoryId);
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aKey = String(a.product_id || `ZZZ-${a.id}`).toLowerCase();
      const bKey = String(b.product_id || `ZZZ-${b.id}`).toLowerCase();
      return aKey.localeCompare(bKey, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [products]);

  useEffect(() => {
    setProductsPage(1);
  }, [sortedProducts.length]);

  const productsTotalPages = Math.max(1, Math.ceil(sortedProducts.length / productsPerPage));
  const pagedProducts = sortedProducts.slice((productsPage - 1) * productsPerPage, productsPage * productsPerPage);

  useEffect(() => {
    if (rootCategories.length === 0) return;
    const currentRootExists = rootCategories.some(c => c.id === selectedCreateCategoryId);
    if (!currentRootExists) {
      setSelectedCreateCategoryId(rootCategories[0].id);
      setSelectedCreateSubcategoryId('');
    }
  }, [categories]);

  useEffect(() => {
    if (selectedCreateCategoryId === '' || createSubcategories.length === 0) {
      if (selectedCreateSubcategoryId !== '') setSelectedCreateSubcategoryId('');
      return;
    }
    const currentSubExists = createSubcategories.some(c => c.id === selectedCreateSubcategoryId);
    if (!currentSubExists) setSelectedCreateSubcategoryId('');
  }, [selectedCreateCategoryId, categories]);

  useEffect(() => {
    if (!editingProduct || categories.length === 0) {
      setSelectedEditCategoryId('');
      setSelectedEditSubcategoryId('');
      return;
    }

    const currentCategory = categories.find(c => c.id === editingProduct.category_id);
    const parentId = currentCategory?.parent_id || currentCategory?.id || '';
    const subId = editingProduct.subcategory_id || (currentCategory?.parent_id ? currentCategory.id : '');

    setSelectedEditCategoryId(prev => (prev === '' ? parentId as number | '' : prev));
    setSelectedEditSubcategoryId(prev => (prev === '' ? subId as number | '' : prev));
  }, [editingProduct?.id, categories.length]);

  useEffect(() => {
    if (selectedEditCategoryId === '' || editSubcategories.length === 0) {
      if (selectedEditSubcategoryId !== '') setSelectedEditSubcategoryId('');
      return;
    }
    const currentSubExists = editSubcategories.some(c => c.id === selectedEditSubcategoryId);
    if (!currentSubExists) setSelectedEditSubcategoryId('');
  }, [selectedEditCategoryId, categories]);

  useEffect(() => {
    localStorage.setItem('adminTab', activeTab);
  }, [activeTab]);

  const handleInlineUpdate = async (productId: number, data: any) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/inline`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token || ''
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update');
      }
    } catch (e) { console.error(e); }
  };


  const uploadAdminImage = async (file: File): Promise<string | null> => {
    if (!user?.token) {
      alert('Admin session expired. Please log in again.');
      return null;
    }

    setUploadingImage(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': user.token },
        body
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        alert(data.error || data.detail || 'Image upload failed');
        return null;
      }

      return data.url as string;
    } catch (e) {
      console.error(e);
      alert('Image upload failed. Check backend/server connection.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'users' || activeTab === 'carts') fetchUsers('reset');
    if (activeTab === 'discounts') {
      fetchCoupons();
      fetchDeliverySlots();
    }
    if (activeTab === 'pickup') fetchPickup();
  }, [activeTab]);

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats', { headers: { 'Authorization': user?.token || '' } });
    const data = await res.json();
    setStats(data);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', { headers: { 'Authorization': user?.token || '' } });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async (mode: 'reset' | 'more' = 'reset') => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const includeCart = activeTab === 'carts';
      const startPhone = mode === 'more' ? usersNext : null;
      const url = `/api/admin/users?include_cart=${includeCart ? 'true' : 'false'}&limit=100${startPhone ? `&start_phone=${encodeURIComponent(startPhone)}` : ''}`;
      const res = await fetch(url, { headers: { 'Authorization': user?.token || '' } });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        setUsersError(txt || `HTTP ${res.status}`);
        if (mode === 'reset') setUsers([]);
        setUsersNext(null);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      const next = typeof data?.next_start_phone === 'string' ? data.next_start_phone : null;
      if (mode === 'more') setUsers(prev => [...prev, ...items]);
      else {
        setUsers(items);
        setUsersNext(null);
      }
      setUsersNext(next);
    } catch (e) { console.error(e); }
    finally { setUsersLoading(false); }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', { headers: { 'Authorization': user?.token || '' } });
      const data = await res.json();
      if (Array.isArray(data)) setCoupons(data);
    } catch (e) { console.error(e); }
  };

  const fetchDeliverySlots = async () => {
    try {
      const res = await fetch('/api/delivery-slots', { headers: { 'Authorization': user?.token || '' } });
      const data = await res.json();
      if (Array.isArray(data)) setDeliverySlots(data);
    } catch (e) { console.error(e); }
  };

  const fetchUserCart = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/cart`, { headers: { 'Authorization': user?.token || '' } });
      const data = await res.json();
      setSelectedUserCart({ userId, items: data });
    } catch (e) { console.error(e); }
  };

  const fetchPickup = async () => {
    try {
      const lRes = await fetch('/api/pickup-locations?all=true');
      if (lRes.ok) setPickupLocations(await lRes.json());
      const sRes = await fetch('/api/pickup-slots?all=true');
      if (sRes.ok) setPickupSlots(await sRes.json());
    } catch (e) { console.error(e); }
  };

  const handleTogglePickupLocation = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/pickup-locations/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': user?.token || '' }
      });
      if (res.ok) fetchPickup();
    } catch (e) { console.error(e); }
  };

  const handleTogglePickupSlot = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/pickup-slots/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': user?.token || '' }
      });
      if (res.ok) fetchPickup();
    } catch (e) { console.error(e); }
  };

  const handleAddPickupLocation = async () => {
    if (!newPickupLocation.name) return;
    try {
      const res = await fetch('/api/admin/pickup-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': user?.token || '' },
        body: JSON.stringify(newPickupLocation)
      });
      if (res.ok) {
        setNewPickupLocation({ name: '', address: '', city: 'Raxaul', pincode: '845305' });
        fetchPickup();
      }
    } catch (e) { console.error(e); }
  };

  const handleDeletePickupLocation = async (id: number) => {
    if (!confirm('Delete this location?')) return;
    try {
      const res = await fetch(`/api/admin/pickup-locations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': user?.token || '' }
      });
      if (res.ok) fetchPickup();
    } catch (e) { console.error(e); }
  };

  const handleAddPickupSlot = async () => {
    if (!newPickupSlot.location_id || !newPickupSlot.name) return;
    try {
      const res = await fetch('/api/admin/pickup-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': user?.token || '' },
        body: JSON.stringify(newPickupSlot)
      });
      if (res.ok) {
        setNewPickupSlot({ location_id: 0, name: '', start_time: '', end_time: '' });
        fetchPickup();
      }
    } catch (e) { console.error(e); }
  };

  const handleDeletePickupSlot = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/pickup-slots/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': user?.token || '' }
      });
      if (res.ok) fetchPickup();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
            <LayoutDashboard className="text-emerald-600" />
            Admin Dashboard
          </h2>
          <button onClick={() => setView('home')} className="flex items-center gap-2 text-slate-500 font-medium hover:text-emerald-600 transition-colors">
            <ArrowLeft size={20} /> Back to Store
          </button>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {['stats', 'orders', 'products', 'users', 'carts', 'discounts', 'pickup'].map((tab: any) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl font-bold capitalize transition-all shrink-0 ${activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {tab === 'carts' ? 'Active Carts' : tab === 'discounts' ? 'Discounts & Settings' : tab === 'pickup' ? 'Pickup Points' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              <p className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Total Revenue</p>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">₹{stats.revenue}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              <p className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Total Orders</p>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">{stats.total_orders}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              <p className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Total Users</p>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">{stats.total_users}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md border-rose-100 dark:border-rose-900/30">
              <p className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Low Stock</p>
              <h3 className="text-xl md:text-3xl font-black text-rose-500 italic tracking-tighter">{stats.low_stock}</h3>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Order ID</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Customer</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Total</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Fee</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Status</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Date</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-sm font-bold dark:text-slate-300">#{order.id}</td>
                    <td className="px-6 py-4 text-sm dark:text-slate-400">{order.user_name}</td>
                    <td className="px-6 py-4 text-sm font-black dark:text-white">₹{order.total}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-400">₹{order.delivery_fee || 0}</td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={order.status}
                        disabled={updatingStatus === order.id}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          setUpdatingStatus(order.id);
                          try {
                            const res = await fetch(`/api/admin/orders/${order.id}/status`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': user?.token || ''
                              },
                              body: JSON.stringify({ status: newStatus })
                            });
                            if (res.ok) {
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                            } else {
                              const err = await res.json();
                              alert(`Failed to update: ${err.detail || 'Forbidden'}`);
                            }
                          } catch (e) {
                            alert('Network error while updating status');
                          } finally {
                            setUpdatingStatus(null);
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all shadow-sm ${updatingStatus === order.id ? 'opacity-50' : 'opacity-100'} ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'packed' ? 'bg-indigo-100 text-indigo-700' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-100 text-slate-700'
                          }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => setSelectedOrderForInvoice(order)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        title="View Invoice"
                      >
                        <FileText size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          const pwd = prompt(`Enter admin password to delete order #${order.id}`);
                          if (pwd) {
                            const res = await fetch(`/api/admin/orders/${order.id}?password=${encodeURIComponent(pwd)}`, {
                              method: 'DELETE',
                              headers: { 'Authorization': user?.token || '' }
                            });
                            if (res.ok) fetchOrders();
                            else alert('Failed to delete order (incorrect password?)');
                          }
                        }}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold mb-4 dark:text-white">Manage Categories</h3>
              <form onSubmit={async (e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                if (!data.parent_id) delete data.parent_id;

                const res = await fetch('/api/admin/categories', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user?.token || ''
                  },
                  body: JSON.stringify(data)
                });
                if (res.ok) {
                  e.target.reset();
                  setCategoryPreviewUrl('');
                  alert('Category saved!');
                  window.location.reload();
                }
              }} className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input name="name" placeholder="Category Name" required className="px-4 py-2 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                  <select name="parent_id" className="px-4 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    <option value="">Main Category (Root)</option>
                    {categories.filter(c => !c.parent_id).map(c => (
                      <option key={c.id} value={c.id}>Subcategory of: {c.name}</option>
                    ))}
                  </select>
                  <div className="flex-1 flex gap-2 items-center">
                    <input type="hidden" name="image_url" id="cat_img_url" />
                    <button
                      type="button"
                      onClick={() => document.getElementById('cat_img_file')?.click()}
                      className="w-full h-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all bg-white dark:bg-slate-900"
                    >
                      {uploadingImage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      ) : (
                        <>
                          <Upload size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Upload Category Image</span>
                        </>
                      )}
                    </button>
                    <input
                      type="file"
                      id="cat_img_file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const previewUrl = URL.createObjectURL(file);
                        if (categoryPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(categoryPreviewUrl);
                        setCategoryPreviewUrl(previewUrl);
                        const url = await uploadAdminImage(file);
                        if (url) {
                          (document.getElementById('cat_img_url') as HTMLInputElement).value = url;
                        } else {
                          setCategoryPreviewUrl('');
                        }
                        e.currentTarget.value = '';
                      }}
                      className="hidden"
                    />
                  </div>
                  {categoryPreviewUrl && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white shrink-0">
                      <img src={categoryPreviewUrl} alt="Category preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <button type="submit" className="bg-emerald-600 text-white font-bold rounded-xl px-6 py-2 hover:bg-emerald-700 transition-colors">Save Category</button>
                </div>
              </form>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="relative group p-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-white mb-2">
                      {cat.image_url ? (
                        <img src={cat.image_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-2xl uppercase">{cat.name[0]}</div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 text-center line-clamp-1">{cat.name}</span>
                    <button
                      onClick={async () => {
                        if (confirm(`Delete ${cat.name}?`)) {
                          const res = await fetch(`/api/admin/categories/${cat.id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': user?.token || '' }
                          });
                          if (res.ok) window.location.reload();
                        }
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-10 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
              <form onSubmit={async (e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                const image = (document.getElementById('prod_img_url') as HTMLInputElement).value;
                if (!image) {
                  alert('Please upload a product image first.');
                  return;
                }
                const finalCategoryId = Number(selectedCreateSubcategoryId || selectedCreateCategoryId);
                const payload = {
                  ...data,
                  image: image,
                  price: parseFloat(data.price as string),
                  cost_price: parseFloat(data.cost_price as string || '0'),
                  category_id: finalCategoryId,
                  subcategory_id: selectedCreateSubcategoryId === '' ? null : Number(selectedCreateSubcategoryId),
                  mrp: data.mrp ? parseFloat(data.mrp as string) : 0,
                  discount: data.discount ? parseFloat(data.discount as string) : 0,
                  stock: parseInt(data.stock as string || '0')
                };
                try {
                  const res = await fetch('/api/admin/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': user?.token || '' },
                    body: JSON.stringify(payload)
                  });
                  if (res.ok) {
                    e.target.reset();
                    (document.getElementById('prod_img_url') as HTMLInputElement).value = '';
                    setNewProductPreviewUrl('');
                    if (rootCategories.length > 0) setSelectedCreateCategoryId(rootCategories[0].id);
                    setSelectedCreateSubcategoryId('');
                    alert('Product added successfully!');
                    fetchProducts();
                  } else {
                    const err = await res.json();
                    alert('Failed to add product: ' + (err.detail || err.error || 'Unknown error'));
                  }
                } catch (err) {
                  alert('Network error while adding product. Make sure the backend is running.');
                }
              }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-[0.2em]">Basic Information</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Product ID <span className="text-red-400">*</span></label>
                        <input name="product_id" placeholder="E.g. AK-001" required className="w-full px-5 py-3.5 rounded-2xl border-2 border-blue-200 dark:bg-slate-900 dark:text-white dark:border-blue-800 font-bold font-mono focus:ring-2 focus:ring-blue-500 transition-all text-blue-700 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-900/10 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Unit</label>
                        <input name="unit" placeholder="500g, 1kg" required className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold text-sm" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Product Name</label>
                      <input name="name" placeholder="E.g. Fresh Chicken Masala" required className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Category</label>
                      <select
                        name="category_id"
                        required
                        value={selectedCreateCategoryId}
                        onChange={e => {
                          const next = Number(e.target.value);
                          setSelectedCreateCategoryId(next);
                          setSelectedCreateSubcategoryId('');
                        }}
                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 bg-white font-bold text-sm"
                      >
                        {rootCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Sub Category</label>
                      <select
                        value={selectedCreateSubcategoryId}
                        onChange={e => setSelectedCreateSubcategoryId(e.target.value ? Number(e.target.value) : '')}
                        disabled={createSubcategories.length === 0}
                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 bg-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{createSubcategories.length === 0 ? 'No sub categories' : 'No sub category'}</option>
                        {createSubcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-[0.2em]">Pricing & Inventory</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">CP (Cost Price) ₹</label>
                        <input name="cost_price" type="number" step="0.01" placeholder="80.00" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold bg-blue-50/30 dark:bg-blue-900/10 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">SP (Selling Price) ₹</label>
                        <input name="price" type="number" step="0.01" placeholder="99.00" required className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold bg-emerald-50/30 dark:bg-emerald-900/10 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">MRP (Retail) ₹</label>
                        <input name="mrp" type="number" step="0.01" placeholder="120.00" className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Initial Stock</label>
                        <input name="stock" type="number" defaultValue={50} required className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-purple-600 tracking-[0.2em] mb-4">Logistics & Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Best Before</label>
                        <input name="mfg_date" placeholder="Jan 2024" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Country</label>
                        <input name="country_of_origin" defaultValue="India" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Brand</label>
                      <input name="brand" placeholder="E.g. Catch" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-orange-600 tracking-[0.2em] mb-4">Media & Content</h4>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Product Image <span className="text-red-400">*</span></label>
                      <input type="hidden" name="image" id="prod_img_url" />
                      <div
                        onClick={() => document.getElementById('prod_img_file')?.click()}
                        className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 transition-all bg-white dark:bg-slate-900 group relative overflow-hidden"
                      >
                        {uploadingImage ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        ) : newProductPreviewUrl ? (
                          <img src={newProductPreviewUrl} alt="Product preview" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div id="prod_img_placeholder" className="flex flex-col items-center">
                            <Upload className="text-slate-400 group-hover:text-emerald-500 transition-colors" size={32} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Click to Upload</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        id="prod_img_file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const previewUrl = URL.createObjectURL(file);
                          if (newProductPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(newProductPreviewUrl);
                          setNewProductPreviewUrl(previewUrl);
                          const url = await uploadAdminImage(file);
                          if (url) {
                            (document.getElementById('prod_img_url') as HTMLInputElement).value = url;
                          } else {
                            setNewProductPreviewUrl('');
                          }
                          e.currentTarget.value = '';
                        }}
                      />
                      {newProductPreviewUrl && (
                        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/10 p-3 flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0">
                            <img src={newProductPreviewUrl} alt="Uploaded product preview" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Image Ready</p>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">This is the image that will be saved with the product.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Tagline</label>
                      <input name="catch" placeholder="Pure & Aromatic" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Detailed Description</label>
                    <textarea name="description" rows={3} placeholder="Write something about the product..." className="w-full px-6 py-4 rounded-3xl border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-bold" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-3xl px-8 py-5 hover:scale-[1.02] transition-all shadow-xl shadow-black/10 active:scale-95 text-lg italic">
                  Confirm & Save Product
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm mt-8 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-2xl font-black dark:text-white flex items-center gap-3 italic">
                  <LayoutGrid className="text-emerald-600" /> Current Products ({sortedProducts.length})
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Page</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black disabled:opacity-40"
                      disabled={productsPage <= 1}
                      onClick={() => setProductsPage(p => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <div className="max-w-[260px] overflow-x-auto whitespace-nowrap scrollbar-hide">
                      {Array.from({ length: productsTotalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setProductsPage(p)}
                          className={`mx-0.5 px-2.5 py-1.5 rounded-xl text-xs font-black ${p === productsPage ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black disabled:opacity-40"
                      disabled={productsPage >= productsTotalPages}
                      onClick={() => setProductsPage(p => Math.min(productsTotalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100 dark:border-slate-800 w-10 text-center">#</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100 dark:border-slate-800">Product ID</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100 dark:border-slate-800 min-w-[180px]">Product</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100 dark:border-slate-800">Category</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100 dark:border-slate-800">Sub Category</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-blue-400 tracking-widest border-r border-slate-100 dark:border-slate-800 text-center">CP ₹</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-emerald-500 tracking-widest border-r border-slate-100 dark:border-slate-800 text-center">SP ₹</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100 dark:border-slate-800 text-center">MRP ₹</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-orange-400 tracking-widest border-r border-slate-100 dark:border-slate-800 text-center">Discount</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100 dark:border-slate-800 text-center">Stock</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedProducts.map((product, idx) => {
                      const discountAmt = product.mrp && product.price ? (product.mrp - product.price) : (product.discount || 0);
                      const discountPct = product.mrp && product.price && product.mrp > 0 ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
                      return (
                        <tr key={product.id} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-950/40'}`}>
                          <td className="px-4 py-3 text-xs text-slate-400 font-bold text-center border-r border-slate-100 dark:border-slate-800">{(productsPage - 1) * productsPerPage + idx + 1}</td>
                          <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                            <span className="font-black text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md font-mono whitespace-nowrap">
                              {product.product_id || `#${product.id}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-slate-100 shadow-sm shrink-0">
                                <img src={product.image} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = 'https://via.placeholder.com/40'; }} />
                              </div>
                              <div>
                                <p className="font-bold text-xs leading-tight line-clamp-1 dark:text-white">{product.name}</p>
                                <p className="text-[9px] text-slate-400 uppercase tracking-tighter">{product.unit}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {categories.find(c => c.id === (categories.find(c => c.id === product.category_id)?.parent_id || product.category_id))?.name || "Misc"}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                              {categories.find(c => c.id === product.subcategory_id)?.name || (categories.find(c => c.id === product.category_id)?.parent_id ? categories.find(c => c.id === product.category_id)?.name : "?")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800">
                            <input
                              type="number"
                              defaultValue={product.cost_price || 0}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val !== product.cost_price) handleInlineUpdate(product.id, { cost_price: val });
                              }}
                              className="w-16 bg-blue-50/50 dark:bg-blue-900/10 px-2 py-1 rounded text-xs font-bold text-blue-600 dark:text-blue-400 outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800">
                            <input
                              type="number"
                              defaultValue={product.price || 0}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val !== product.price) handleInlineUpdate(product.id, { price: val });
                              }}
                              className="w-16 bg-emerald-50/50 dark:bg-emerald-900/10 px-2 py-1 rounded text-xs font-black text-emerald-600 outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800">
                            <input
                              type="number"
                              defaultValue={product.mrp || 0}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val !== product.mrp) handleInlineUpdate(product.id, { mrp: val });
                              }}
                              className="w-16 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold text-slate-500 outline-none focus:ring-1 focus:ring-slate-400"
                            />
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800">
                            {discountAmt > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/20 text-[9px] font-black text-orange-600 dark:text-orange-400">
                                ₹{discountAmt.toFixed(0)} ({discountPct}%)
                              </span>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col items-center gap-1.5">
                              <input
                                type="number"
                                defaultValue={product.stock ?? 0}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (val !== product.stock) handleInlineUpdate(product.id, { stock: val });
                                }}
                                className={`w-14 px-2 py-1 rounded text-xs font-black text-center outline-none focus:ring-1 ${(product.stock ?? 0) <= 0 || product.out_of_stock ? 'bg-red-50 text-red-600 focus:ring-red-500' : (product.stock ?? 0) <= 10 ? 'bg-amber-50 text-amber-600 focus:ring-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-slate-400'}`}
                              />
                              <button
                                onClick={() => handleInlineUpdate(product.id, { out_of_stock: !product.out_of_stock })}
                                className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full transition-all ${product.out_of_stock ? 'bg-red-500 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                              >
                                {product.out_of_stock ? 'Out of Stock' : 'In Stock'}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setEditingProduct({ ...product })}
                                title="Edit Product"
                                className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={async () => {
                                  const pwd = prompt(`Delete "${product.name}"? Enter admin password:`);
                                  if (pwd) {
                                    const res = await fetch(`/api/admin/products/${product.id}?password=${encodeURIComponent(pwd)}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': user?.token || '' }
                                    });
                                    if (res.ok) fetchProducts();
                                    else alert('Failed to delete (incorrect password?)');
                                  }
                                }}
                                title="Delete Product"
                                className="p-2 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-100 transition-all shadow-sm"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
            {usersLoading && (
              <div className="px-6 py-4 text-xs font-bold text-slate-500">Loading users...</div>
            )}
            {!usersLoading && users.length === 0 && (
              <div className="px-6 py-4 text-xs font-bold text-slate-500">
                {usersError ? `Failed to load users: ${usersError}` : 'No users loaded.'}
              </div>
            )}
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">ID</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Name</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Contact</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">OTP</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Role</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Address</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 text-sm text-slate-500">#{u.id}</td>
                    <td className="px-6 py-4 text-sm font-bold dark:text-white">{u.name}</td>
                    <td className="px-6 py-4 text-sm dark:text-slate-400">
                      <div className="flex flex-col">
                        <span>{u.email}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{u.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-slate-400">
                      <div className="flex min-w-[150px] flex-col gap-1">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                          {u.otp || 'No OTP'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {u.otp_expiry ? new Date(u.otp_expiry).toLocaleString() : 'No expiry'}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            u.otp_delivery_status === 'sent'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : u.otp_delivery_status === 'failed'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {u.otp_delivery_status || 'unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">
                      <select
                        value={u.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          const res = await fetch(`/api/admin/users/${u.id}/role`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': user?.token || ''
                            },
                            body: JSON.stringify({ role: newRole })
                          });
                          if (res.ok) {
                            setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, role: newRole as any } : usr));
                          } else {
                            alert('Failed to update role');
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-xs font-bold uppercase cursor-pointer outline-none transition-colors ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'executive' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}
                      >
                        <option value="customer">Customer</option>
                        <option value="executive">Executive</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{u.address}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => fetchUserCart(u.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg relative group"
                      >
                        <ShoppingCart size={18} />
                        {u.cart_count > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">{u.cart_count}</span>}
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete user?')) {
                            const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE', headers: { 'Authorization': user?.token || '' } });
                            if (res.ok) fetchUsers();
                          }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usersNext && (
              <div className="px-6 py-4">
                <button
                  disabled={usersLoading}
                  onClick={() => fetchUsers('more')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase"
                >
                  {usersLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'carts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.filter(u => u.cart_count > 0).length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <ShoppingCart size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold">No active carts at the moment.</p>
              </div>
            ) : (
              users.filter(u => u.cart_count > 0).map(u => (
                <div key={u.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{u.name}</h4>
                      <p className="text-xs text-slate-500">{u.phone}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full text-emerald-600 font-black text-xs">
                      ₹{u.cart_total}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-sm font-bold text-slate-400">{u.cart_count} Items</span>
                    <button
                      onClick={() => fetchUserCart(u.id)}
                      className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <Eye size={14} /> View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedUserCart && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                  <ShoppingCart className="text-emerald-600" />
                  User's Live Cart
                </h3>
                <button onClick={() => setSelectedUserCart(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {selectedUserCart.items.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">This user's cart is empty.</p>
                ) : (
                  selectedUserCart.items.map((item: any) => (
                    <div key={item.product_id} className="flex gap-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                      <img src={item.product_image} className="w-16 h-16 rounded-xl object-cover bg-white" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 dark:text-white">{item.product_name}</p>
                        <p className="text-sm text-slate-500">Qty: {item.quantity} × ₹{item.product_price}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">₹{item.quantity * item.product_price}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <p className="text-slate-500 font-medium">Total Amount</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">₹{selectedUserCart.items.reduce((acc: number, item: any) => acc + (item.quantity * item.product_price), 0)}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discounts' && (
          <div className="space-y-12">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8">
              <h3 className="text-xl font-bold mb-6 dark:text-white">Delivery Slots Management</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const newSlot = {
                  name: (form.elements.namedItem('name') as HTMLInputElement).value,
                  start_time: (form.elements.namedItem('start_time') as HTMLInputElement).value,
                  end_time: (form.elements.namedItem('end_time') as HTMLInputElement).value
                };
                const res = await fetch('/api/admin/delivery-slots', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': user?.token || '' },
                  body: JSON.stringify(newSlot)
                });
                if (res.ok) {
                  form.reset();
                  fetchDeliverySlots();
                }
              }} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <input name="name" required placeholder="Name (e.g. Morning Slot)" className="px-4 py-2 border dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-lg" />
                <input name="start_time" required type="time" className="px-4 py-2 border dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-lg" />
                <input name="end_time" required type="time" className="px-4 py-2 border dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-lg" />
                <button type="submit" className="bg-emerald-600 text-white font-bold rounded-lg py-2 hover:bg-emerald-700">Add Slot</button>
              </form>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {deliverySlots.map(slot => (
                  <div key={slot.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl relative group bg-slate-50 dark:bg-slate-900/50">
                    <p className="font-bold dark:text-white">{slot.name}</p>
                    <p className="text-sm text-slate-500">{slot.start_time} - {slot.end_time}</p>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this slot?')) {
                          const res = await fetch(`/api/admin/delivery-slots/${slot.id}`, { method: 'DELETE', headers: { 'Authorization': user?.token || '' } });
                          if (res.ok) fetchDeliverySlots();
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    ><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8">
              <h3 className="text-xl font-bold mb-6 dark:text-white">Coupon Codes Management</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const newCoupon = {
                  code: (form.elements.namedItem('code') as HTMLInputElement).value.toUpperCase(),
                  discount_value: parseFloat((form.elements.namedItem('discount') as HTMLInputElement).value),
                  is_percentage: (form.elements.namedItem('is_percent') as HTMLInputElement).checked,
                  min_order_amount: parseFloat((form.elements.namedItem('min_order') as HTMLInputElement).value) || 0,
                  user_id: parseInt((form.elements.namedItem('user_id') as HTMLSelectElement).value) || null
                };
                const res = await fetch('/api/admin/coupons', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': user?.token || '' },
                  body: JSON.stringify(newCoupon)
                });
                if (res.ok) {
                  form.reset();
                  fetchCoupons();
                }
              }} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8 items-end">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Coupon Code</label>
                  <input name="code" required placeholder="e.g. SAVE20" className="w-full px-4 py-2 border dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-lg uppercase" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Discount</label>
                  <input name="discount" required type="number" step="0.01" className="w-full px-4 py-2 border dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Min Order ₹</label>
                  <input name="min_order" type="number" defaultValue="0" className="w-full px-4 py-2 border dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Specific User?</label>
                  <select name="user_id" className="w-full px-4 py-2 border dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-lg">
                    <option value="">All Users</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.phone})</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm font-bold dark:text-white cursor-pointer h-10 border dark:border-slate-700 rounded-lg px-2">
                    <input name="is_percent" type="checkbox" className="w-4 h-4 accent-emerald-600" />
                    Percent %
                  </label>
                  <button type="submit" className="bg-emerald-600 text-white font-bold rounded-lg py-2 hover:bg-emerald-700 h-10">Create</button>
                </div>
              </form>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="p-4 border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 rounded-xl relative bg-emerald-50/50 dark:bg-emerald-900/10 group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-black text-emerald-700 dark:text-emerald-400 text-lg tracking-wider">{coupon.code}</p>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this coupon?')) {
                            const res = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE', headers: { 'Authorization': user?.token || '' } });
                            if (res.ok) fetchCoupons();
                          }
                        }}
                        className="p-1.5 bg-red-50 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      ><Trash2 size={14} /></button>
                    </div>
                    <p className="text-sm font-bold dark:text-white">
                      Discount: {coupon.discount_value}{coupon.is_percentage ? '%' : '₹'}
                    </p>
                    <div className="mt-2 text-xs text-slate-500 space-y-1">
                      <p>Min Order: ₹{coupon.min_order_amount}</p>
                      {coupon.user_id && <p className="text-purple-600 font-bold">Specific User: {users.find(u => u.id === coupon.user_id)?.name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pickup' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Pickup Locations Management */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                  <h3 className="text-2xl font-black dark:text-white tracking-tight italic">Store Pickup Points</h3>
                  <p className="text-sm text-slate-400 font-bold mt-1">Manage locations where customers can collect their orders</p>
                </div>
                <div className="h-1 bg-emerald-100 dark:bg-emerald-900/30 flex-1 hidden md:block mx-8 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Point Name</label>
                  <input
                    value={newPickupLocation.name}
                    onChange={e => setNewPickupLocation(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Raxaul Main Outlet"
                  />
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Full Address</label>
                  <input
                    value={newPickupLocation.address}
                    onChange={e => setNewPickupLocation(p => ({ ...p, address: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Bank Road, Raxaul, Bihar"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">City</label>
                    <input
                      value={newPickupLocation.city}
                      onChange={e => setNewPickupLocation(p => ({ ...p, city: e.target.value }))}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Pincode</label>
                    <input
                      value={newPickupLocation.pincode}
                      onChange={e => setNewPickupLocation(p => ({ ...p, pincode: e.target.value }))}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddPickupLocation}
                    className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                  >
                    <Plus size={20} strokeWidth={3} /> Add Point
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pickupLocations.map(loc => (
                  <div key={loc.id} className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] p-8 relative overflow-hidden transition-all hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                        <Receipt size={24} />
                      </div>
                      <button
                        onClick={() => handleDeletePickupLocation(loc.id)}
                        className="w-10 h-10 flex items-center justify-center text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl transition-all hover:bg-rose-500 hover:text-white"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase italic">{loc.name}</h4>
                    <div className="space-y-1 text-xs text-slate-500 font-bold mb-6">
                      <p>{loc.address}</p>
                      <p>{loc.city}, {loc.pincode}</p>
                    </div>
                    <div className="pt-6 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${loc.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${loc.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {loc.is_active ? 'Active Store Point' : 'Permanently Stopped'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleTogglePickupLocation(loc.id)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${loc.is_active
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                      >
                        {loc.is_active ? 'Stop' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup Slots Management */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                  <h3 className="text-2xl font-black dark:text-white tracking-tight italic">Pickup Time Slots</h3>
                  <p className="text-sm text-slate-400 font-bold mt-1">Define available collection windows for each store point</p>
                </div>
                <div className="h-1 bg-blue-100 dark:bg-blue-900/30 flex-1 hidden md:block mx-8 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Store Point</label>
                  <select
                    value={newPickupSlot.location_id}
                    onChange={e => setNewPickupSlot(p => ({ ...p, location_id: parseInt(e.target.value) }))}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value={0}>Select Location...</option>
                    {pickupLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Slot Label</label>
                  <input
                    value={newPickupSlot.name}
                    onChange={e => setNewPickupSlot(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Morning Session"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Start Time</label>
                  <input
                    value={newPickupSlot.start_time}
                    onChange={e => setNewPickupSlot(p => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:border-blue-500 outline-none transition-all"
                    placeholder="10:00 AM"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">End Time</label>
                  <input
                    value={newPickupSlot.end_time}
                    onChange={e => setNewPickupSlot(p => ({ ...p, end_time: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:border-blue-500 outline-none transition-all"
                    placeholder="01:00 PM"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddPickupSlot}
                    className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 hover:scale-[1.02] transition-all shadow-xl shadow-blue-500/20"
                  >
                    Create Slot
                  </button>
                </div>
              </div>

              <div className="space-y-10">
                {pickupLocations.map(loc => {
                  const slots = pickupSlots.filter(s => s.location_id === loc.id);
                  return (
                    <div key={loc.id} className="bg-white dark:bg-slate-800/20 p-8 rounded-[2rem] border border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black italic shadow-lg">
                          {loc.name[0]}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 dark:text-white tracking-widest uppercase">{loc.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{slots.length} timings configured</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {slots.length === 0 ? (
                          <div className="w-full p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">No time slots added for this location.</p>
                          </div>
                        ) : (
                          slots.map(slot => (
                            <div key={slot.id} className={`group relative flex items-center gap-6 bg-white dark:bg-slate-900 border px-6 py-4 rounded-[1.5rem] transition-all ${slot.is_active ? 'border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5' : 'border-dashed border-slate-200 opacity-60'}`}>
                              <div>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${slot.is_active ? 'text-slate-400' : 'text-rose-400'}`}>{slot.name} {!slot.is_active && '(Stopped)'}</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{slot.start_time} — {slot.end_time}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleTogglePickupSlot(slot.id)}
                                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${slot.is_active ? 'text-rose-500 hover:bg-rose-500 hover:text-white' : 'text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                                  title={slot.is_active ? 'Stop Slot' : 'Enable Slot'}
                                >
                                  {slot.is_active ? <X size={14} /> : <Plus size={14} />}
                                </button>
                                <button
                                  onClick={() => handleDeletePickupSlot(slot.id)}
                                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={selectedOrderForInvoice !== null}
        onClose={() => setSelectedOrderForInvoice(null)}
        order={selectedOrderForInvoice}
        user={selectedOrderForInvoice ? { name: selectedOrderForInvoice.user_name || 'Customer' } as any : null}
      />

      {/* ── Edit Product Modal ── */}
      {editingProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
                  <Pencil size={20} className="text-blue-500" />
                  Edit Product
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Product ID: <span className="font-mono text-blue-500">#{editingProduct.id}</span></p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-8 space-y-6">
              {/* Row 1: Product ID + Name + Unit */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 space-y-1">
                <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Product ID (Admin-defined)</label>
                <input
                  value={editingProduct.product_id || ''}
                  onChange={e => setEditingProduct((p: any) => ({ ...p, product_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 dark:bg-slate-800 dark:border-blue-700 dark:text-white font-black text-sm font-mono text-blue-700 dark:text-blue-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="E.g. AK-001"
                />
                <p className="text-[10px] text-blue-400 font-bold">This is the public-facing Product ID set by you. Customer ID is auto-assigned by the system.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Product Name</label>
                  <input
                    value={editingProduct.name || ''}
                    onChange={e => setEditingProduct((p: any) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit</label>
                  <input
                    value={editingProduct.unit || ''}
                    onChange={e => setEditingProduct((p: any) => ({ ...p, unit: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="500g, 1kg..."
                  />
                </div>
              </div>

              {/* Row 2: Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</label>
                  <select
                    value={selectedEditCategoryId}
                    onChange={e => {
                      const nextCategoryId = e.target.value ? parseInt(e.target.value, 10) : '';
                      setSelectedEditCategoryId(nextCategoryId as number | '');
                      setSelectedEditSubcategoryId('');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {rootCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sub Category</label>
                  <select
                    value={selectedEditSubcategoryId}
                    onChange={e => {
                      const nextSubcategoryId = e.target.value ? parseInt(e.target.value, 10) : '';
                      setSelectedEditSubcategoryId(nextSubcategoryId as number | '');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60"
                    disabled={editSubcategories.length === 0}
                  >
                    <option value="">No sub category</option>
                    {editSubcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Pricing spreadsheet */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800">
                  {['CP (Cost Price) ₹', 'SP (Selling Price) ₹', 'MRP ₹', 'Discount (Auto)'].map(h => (
                    <div key={h} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 border-r last:border-r-0 border-slate-200 dark:border-slate-800">{h}</div>
                  ))}
                </div>
                <div className="grid grid-cols-4">
                  <div className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                    <input type="number" step="0.01" value={editingProduct.cost_price || ''} onChange={e => setEditingProduct((p: any) => ({ ...p, cost_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-transparent font-bold text-blue-600 text-sm outline-none" placeholder="0.00" />
                  </div>
                  <div className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                    <input type="number" step="0.01" value={editingProduct.price || ''} onChange={e => setEditingProduct((p: any) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-transparent font-black text-emerald-600 text-sm outline-none" placeholder="0.00" />
                  </div>
                  <div className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                    <input type="number" step="0.01" value={editingProduct.mrp || ''} onChange={e => setEditingProduct((p: any) => ({ ...p, mrp: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-transparent font-bold text-slate-500 text-sm outline-none" placeholder="0.00" />
                  </div>
                  <div className="px-4 py-3 flex flex-col justify-center">
                    {editingProduct.mrp > 0 && editingProduct.price > 0 ? (
                      <>
                        <span className="text-xs font-black text-orange-500">₹{(editingProduct.mrp - editingProduct.price).toFixed(2)} off</span>
                        <span className="text-[10px] text-orange-400 font-bold">{Math.round(((editingProduct.mrp - editingProduct.price) / editingProduct.mrp) * 100)}% saving</span>
                      </>
                    ) : <span className="text-slate-300 text-xs">Enter MRP & SP</span>}
                  </div>
                </div>
              </div>

              {/* Row 4: Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stock Count</label>
                  <input type="number" value={editingProduct.stock ?? 0} onChange={e => setEditingProduct((p: any) => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Brand</label>
                  <input value={editingProduct.brand || ''} onChange={e => setEditingProduct((p: any) => ({ ...p, brand: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Brand name" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Best Before</label>
                  <input value={editingProduct.mfg_date || ''} onChange={e => setEditingProduct((p: any) => ({ ...p, mfg_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Jan 2024" />
                </div>
              </div>

              {/* Row 5: Image URL + Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Product Image</label>
                <div className="flex gap-4 items-center">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 group cursor-pointer"
                    onClick={() => document.getElementById('edit_prod_img_file')?.click()}>
                    {editingProduct.image ? (
                      <img src={editingProduct.image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <Upload size={20} className="text-slate-400" />
                        <span className="text-[8px] font-black text-slate-400">UPLOAD</span>
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent animate-spin rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] text-slate-500 font-bold leading-tight">Click the box to upload a new product image. The previous image will be replaced.</p>
                    <button
                      type="button"
                      onClick={() => document.getElementById('edit_prod_img_file')?.click()}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                    >
                      Change Image
                    </button>
                  </div>
                  <input
                    type="file"
                    id="edit_prod_img_file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await uploadAdminImage(file);
                      if (url) {
                        setEditingProduct((p: any) => ({ ...p, image: url }));
                      }
                      e.currentTarget.value = '';
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</label>
                <textarea rows={3} value={editingProduct.description || ''} onChange={e => setEditingProduct((p: any) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
              <button onClick={() => setEditingProduct(null)} className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-sm hover:bg-slate-50 transition-all">Cancel</button>
              <button
                disabled={savingProduct}
                onClick={async () => {
                  setSavingProduct(true);
                  try {
                    const finalEditCategoryId = Number(selectedEditSubcategoryId || selectedEditCategoryId || editingProduct.category_id);
                    const payload = {
                      ...editingProduct,
                      price: parseFloat(editingProduct.price),
                      cost_price: parseFloat(editingProduct.cost_price || 0),
                      mrp: parseFloat(editingProduct.mrp || 0),
                      stock: parseInt(editingProduct.stock || 0),
                      category_id: finalEditCategoryId,
                      subcategory_id: selectedEditSubcategoryId === '' ? null : Number(selectedEditSubcategoryId),
                      discount: editingProduct.mrp > 0 ? Math.round(((editingProduct.mrp - editingProduct.price) / editingProduct.mrp) * 100) : 0
                    };
                    const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': user?.token || '' },
                      body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                      fetchProducts();
                      setEditingProduct(null);
                    } else {
                      const err = await res.json();
                      alert(err.detail || 'Failed to save product');
                    }
                  } finally {
                    setSavingProduct(false);
                  }
                }}
                className="flex-[2] px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {savingProduct ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle size={18} />}
                {savingProduct ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
