// store/slices/userSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ACCOUNTANT' | 'MANAGER';
}

interface UserState {
  currentUser: User | null;
  mode: 'accountant' | 'manager';
}

const initialState: UserState = {
  currentUser: {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'accountant@company.com',
    role: 'ACCOUNTANT',
  },
  mode: 'accountant',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    setMode: (state, action: PayloadAction<'accountant' | 'manager'>) => {
      state.mode = action.payload;
    },
    toggleMode: (state) => {
      state.mode = state.mode === 'accountant' ? 'manager' : 'accountant';
    },
  },
});

export const { setUser, setMode, toggleMode } = userSlice.actions;
export default userSlice.reducer;