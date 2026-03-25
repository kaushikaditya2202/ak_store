import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Product, CartItem } from '../../types';

interface ProductCardProps {
  product: Product;
  cartItem?: CartItem;
  addToCart: (p: Product) => void;
  removeFromCart: (id: number) => void;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
  onClick?: (p: Product) => void;
  compact?: boolean;
  blendBg?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product, cartItem, addToCart, removeFromCart, onClick, compact = false, blendBg = false
}) => {
  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const isOutOfStock = product.out_of_stock || (product.stock !== undefined && product.stock <= 0);
  const showUnit = Boolean(product.unit && product.unit.trim() && product.unit.trim().toLowerCase() !== 'na');
  const imagePadding = compact ? 'p-1.5' : 'p-2';
  const nameClass = compact ? 'text-[11px] leading-[1.22]' : 'text-[12px] leading-[1.24]';
  const pricePillClass = compact ? 'text-[13px] px-3 py-1.5' : 'text-[14px] px-3 py-1.5';
  const controlHeight = compact ? 'h-10' : 'h-11';
  const controlMinWidth = compact ? 'min-w-[92px]' : 'min-w-[98px]';
  const qtyMinWidth = compact ? 'min-w-[98px]' : 'min-w-[104px]';
  const badgeText = compact ? 'text-[8px]' : 'text-[9px]';
  const savings = product.mrp && product.mrp > product.price ? Math.round(product.mrp - product.price) : 0;
  const imageSrc = product.image || 'https://placehold.co/300x300/f3f4f6/9ca3af?text=Product';

  return (
    <div
      className={`group flex w-full cursor-pointer flex-col ${blendBg ? 'bg-transparent' : 'bg-white'} ${isOutOfStock ? 'opacity-90' : ''}`}
      onClick={() => onClick?.(product)}
    >
      <div className={`relative flex aspect-square w-full items-center justify-center rounded-[1rem] border border-slate-200 ${blendBg ? 'bg-transparent' : 'bg-white'}`}>
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-contain ${imagePadding} transition-transform duration-300 group-hover:scale-[1.03] ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
          referrerPolicy="no-referrer"
        />

        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {discount > 0 && !isOutOfStock && (
            <span className={`bg-[#187a31] text-white ${badgeText} font-black px-2 py-1 rounded-lg shadow-sm uppercase`}>
              ₹{savings} OFF
            </span>
          )}
          {isOutOfStock && (
            <span className={`bg-slate-500 text-white ${badgeText} font-black px-2 py-1 rounded-lg shadow-sm uppercase`}>
              Sold Out
            </span>
          )}
        </div>

        <div className="absolute -bottom-3 right-2 z-10">
          {isOutOfStock ? (
            <div className={`${controlMinWidth} ${controlHeight} flex items-center justify-center rounded-[0.95rem] border border-slate-300 bg-slate-100 px-3 text-[10px] font-black uppercase tracking-tight text-slate-500 shadow-sm`}>
              Out
            </div>
          ) : cartItem && cartItem.quantity > 0 ? (
            <div
              className={`${qtyMinWidth} ${controlHeight} flex items-center justify-between overflow-hidden rounded-[0.95rem] bg-[#ff2b78] text-white shadow-md`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); removeFromCart(product.id); }}
                className={`flex w-8 items-center justify-center ${controlHeight} transition-colors hover:bg-[#e11d63]`}
              >
                <Minus size={11} strokeWidth={3} />
              </button>
              <span className="min-w-[20px] text-center text-[11px] font-black">{cartItem.quantity}</span>
              <button
                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                className={`flex w-8 items-center justify-center ${controlHeight} transition-colors hover:bg-[#e11d63]`}
              >
                <Plus size={11} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); addToCart(product); }}
              className={`${controlMinWidth} ${controlHeight} flex items-center justify-center rounded-[0.95rem] border-2 border-[#ff1493] bg-white px-4 text-[11px] font-black uppercase tracking-wide text-[#ff1493] shadow-sm transition-all hover:bg-[#ff1493] hover:text-white active:scale-95`}
            >
              ADD
            </button>
          )}
        </div>
      </div>

      <div className={`flex h-full flex-col ${blendBg ? 'bg-transparent' : 'bg-white'} px-1 pt-4 ${compact ? 'pb-0' : 'pb-0.5'}`}>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={`rounded-[0.65rem] bg-[#2e8b45] font-black leading-none text-white shadow-[0_4px_0_#1e5a2d] ${pricePillClass}`}>
            {"\u20B9"}{product.price}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-[11px] font-medium text-slate-500 line-through">{"\u20B9"}{product.mrp}</span>
          )}
        </div>

        <h4 className={`${nameClass} mt-2.5 min-h-[3.35rem] overflow-hidden font-semibold text-slate-900 line-clamp-3`}>
          {product.name}
        </h4>

        {showUnit && (
          <p className="mt-1 text-[11px] font-medium text-slate-500 line-clamp-1">
            {product.unit}
          </p>
        )}
      </div>
    </div>
  );
};
