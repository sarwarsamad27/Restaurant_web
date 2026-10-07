import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    const savedRestaurant = localStorage.getItem('cartRestaurant');
    
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    if (savedRestaurant) {
      setRestaurant(JSON.parse(savedRestaurant));
    }
  }, []);

  const saveCart = (newCart, newRestaurant) => {
    setCart(newCart);
    setRestaurant(newRestaurant);
    localStorage.setItem('cart', JSON.stringify(newCart));
    if (newRestaurant) {
      localStorage.setItem('cartRestaurant', JSON.stringify(newRestaurant));
    }
  };

  const addToCart = (item, quantity = 1, customizations = null) => {
    // Check if item is from same restaurant
    if (restaurant && restaurant.id !== item.restaurant_id) {
      const confirm = window.confirm(
        'Your cart contains items from another restaurant. Do you want to clear the cart and add this item?'
      );
      if (!confirm) return;
      clearCart();
    }

    const existingItemIndex = cart.findIndex(
      (cartItem) => 
        cartItem.id === item.id && 
        JSON.stringify(cartItem.customizations) === JSON.stringify(customizations)
    );

    let newCart;
    if (existingItemIndex > -1) {
      newCart = [...cart];
      newCart[existingItemIndex].quantity += quantity;
    } else {
      newCart = [...cart, { ...item, quantity, customizations }];
    }

    const itemRestaurant = restaurant || {
      id: item.restaurant_id,
      name: item.restaurant?.name,
      delivery_fee: item.restaurant?.delivery_fee,
      minimum_order: item.restaurant?.minimum_order,
    };

    saveCart(newCart, itemRestaurant);
    toast.success('Item added to cart!');
  };

  const removeFromCart = (itemId, customizations = null) => {
    const newCart = cart.filter(
      (item) => 
        !(item.id === itemId && 
          JSON.stringify(item.customizations) === JSON.stringify(customizations))
    );
    
    if (newCart.length === 0) {
      clearCart();
    } else {
      saveCart(newCart, restaurant);
    }
    toast.info('Item removed from cart');
  };

  const updateQuantity = (itemId, quantity, customizations = null) => {
    if (quantity <= 0) {
      removeFromCart(itemId, customizations);
      return;
    }

    const newCart = cart.map((item) => {
      if (item.id === itemId && 
          JSON.stringify(item.customizations) === JSON.stringify(customizations)) {
        return { ...item, quantity };
      }
      return item;
    });

    saveCart(newCart, restaurant);
  };

  const clearCart = () => {
    setCart([]);
    setRestaurant(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('cartRestaurant');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.discount_price || item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getTax = () => {
    return getCartTotal() * 0.10; // 10% tax
  };

  const getDeliveryFee = () => {
    return parseFloat(restaurant?.delivery_fee) || 0;
  };

  const getGrandTotal = () => {
    return getCartTotal() + getTax() + getDeliveryFee();
  };

  const value = {
    cart,
    restaurant,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getTax,
    getDeliveryFee,
    getGrandTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
