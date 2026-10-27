import { configureStore, createSlice } from '@reduxjs/toolkit';
const authSlice = createSlice({
  name: 'auth', initialState: { user: JSON.parse(localStorage.getItem('imovies_user') || 'null') },
  reducers: {
    setAuth(state, action) { state.user = action.payload.user; localStorage.setItem('imovies_user', JSON.stringify(action.payload.user)); localStorage.setItem('imovies_token', action.payload.token); },
    logout(state) { state.user = null; localStorage.removeItem('imovies_user'); localStorage.removeItem('imovies_token'); }
  }
});
export const { setAuth, logout } = authSlice.actions;
export const store = configureStore({ reducer: { auth: authSlice.reducer } });
