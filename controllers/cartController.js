import asyncHandler from 'express-async-handler';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
  
  if (cart) {
    res.json(cart);
  } else {
    res.json({ items: [], total: 0 });
  }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (quantity > product.stock) {
    res.status(400);
    throw new Error('Not enough stock');
  }

  let cart = await Cart.findOne({ userId: req.user._id });

  if (cart) {
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity = quantity;
      existingItem.price = product.price;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
      });
    }

    cart.total = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    cart = await cart.save();
  } else {
    cart = await Cart.create({
      userId: req.user._id,
      items: [{ productId, quantity, price: product.price }],
      total: product.price * quantity,
    });
  }

  res.json(cart);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const productId = req.params.productId;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (quantity > product.stock) {
    res.status(400);
    throw new Error('Not enough stock');
  }

  const cart = await Cart.findOne({ userId: req.user._id });

  if (cart) {
    const cartItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (cartItem) {
      cartItem.quantity = quantity;
      cartItem.price = product.price;

      cart.total = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      const updatedCart = await cart.save();
      res.json(updatedCart);
    } else {
      res.status(404);
      throw new Error('Item not found in cart');
    }
  } else {
    res.status(404);
    throw new Error('Cart not found');
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const cart = await Cart.findOne({ userId: req.user._id });

  if (cart) {
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    cart.total = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const updatedCart = await cart.save();
    res.json(updatedCart);
  } else {
    res.status(404);
    throw new Error('Cart not found');
  }
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });

  if (cart) {
    cart.items = [];
    cart.total = 0;
    await cart.save();
    res.json({ message: 'Cart cleared' });
  } else {
    res.status(404);
    throw new Error('Cart not found');
  }
});

export { getCart, addToCart, updateCartItem, removeFromCart, clearCart };