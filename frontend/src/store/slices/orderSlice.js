import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI } from '../../utils/api';

export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue }) => {
    try {
      const { data } = await ordersAPI.create(orderData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await ordersAPI.getMyOrders();
      return data.orders;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchActiveOrder = createAsyncThunk(
  'orders/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await ordersAPI.getActiveOrder();
      return data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active order');
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await ordersAPI.getAll(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await ordersAPI.updateStatus(id, status);
      return data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const reorder = createAsyncThunk(
  'orders/reorder',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await ordersAPI.reorder(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reorder');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    allOrders: [],
    activeOrder: null,
    totalOrders: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {
    setActiveOrder: (state, action) => {
      state.activeOrder = action.payload;
    },
    updateOrderFromSocket: (state, action) => {
      const updatedOrder = action.payload;

      // Update in my orders
      const index = state.orders.findIndex((o) => o._id === updatedOrder._id);
      if (index !== -1) {
        state.orders[index] = updatedOrder;
      }

      // Update active order
      if (state.activeOrder?._id === updatedOrder._id) {
        state.activeOrder = updatedOrder;
      }

      // Update in all orders
      const allIndex = state.allOrders.findIndex((o) => o._id === updatedOrder._id);
      if (allIndex !== -1) {
        state.allOrders[allIndex] = updatedOrder;
      }
    },
    addOrderFromSocket: (state, action) => {
      const newOrder = action.payload;
      // Add to all orders if not already there
      if (!state.allOrders.find((o) => o._id === newOrder._id)) {
        state.allOrders.unshift(newOrder);
        state.totalOrders += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.activeOrder = action.payload.order;
        state.orders.unshift(action.payload.order);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch my orders
      .addCase(fetchMyOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch active order
      .addCase(fetchActiveOrder.fulfilled, (state, action) => {
        state.activeOrder = action.payload;
      })
      // Fetch all orders (staff/admin)
      .addCase(fetchAllOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.allOrders = action.payload.orders;
        state.totalOrders = action.payload.total;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.pages;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.allOrders.findIndex((o) => o._id === updated._id);
        if (idx !== -1) state.allOrders[idx] = updated;
        if (state.activeOrder?._id === updated._id) state.activeOrder = updated;
      })
      // Reorder
      .addCase(reorder.fulfilled, (state, action) => {
        if (action.payload.order) {
          state.activeOrder = action.payload.order;
          state.orders.unshift(action.payload.order);
        }
      });
  },
});

export const { setActiveOrder, updateOrderFromSocket, addOrderFromSocket } = orderSlice.actions;
export default orderSlice.reducer;
