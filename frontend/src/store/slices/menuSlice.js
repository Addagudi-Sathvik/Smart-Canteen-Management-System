import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { menuAPI } from '../../utils/api';

export const fetchMenuItems = createAsyncThunk(
  'menu/fetchItems',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await menuAPI.getAll(params);
      return data.items;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu');
    }
  }
);

export const toggleItemAvailability = createAsyncThunk(
  'menu/toggleAvailability',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await menuAPI.toggleAvailability(id);
      return data.item;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle availability');
    }
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    items: [],
    selectedCategory: null,
    searchQuery: '',
    loading: false,
    error: null,
  },
  reducers: {
    setCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenuItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleItemAvailability.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { setCategory, setSearchQuery } = menuSlice.actions;
export default menuSlice.reducer;
