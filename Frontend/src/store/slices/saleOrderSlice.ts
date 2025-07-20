import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SaleOrder } from "@/types/saleOrder";

interface SaleOrderState {
  saleOrders: SaleOrder[];
  loading: boolean;
}

const initialState: SaleOrderState = {
  saleOrders: [],
  loading: false,
};

const saleOrderSlice = createSlice({
  name: "saleOrder",
  initialState,
  reducers: {
    fetchSaleOrdersStart(state) {
      state.loading = true;
    },
    fetchSaleOrdersSuccess(state, action: PayloadAction<SaleOrder[]>) {
      state.saleOrders = action.payload;
      state.loading = false;
    },
    fetchSaleOrdersFailure(state) {
      state.loading = false;
    },
  },
});

export const {
  fetchSaleOrdersStart,
  fetchSaleOrdersSuccess,
  fetchSaleOrdersFailure,
} = saleOrderSlice.actions;
export default saleOrderSlice.reducer;
