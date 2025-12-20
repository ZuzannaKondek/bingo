import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, User } from '@/types'
import type { RootState } from '../index'

const initialState: AuthState = {
	user: null,
	accessToken: localStorage.getItem('accessToken'),
	isAuthenticated: false,
	isLoading: false,
}

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
			state.user = action.payload.user
			state.accessToken = action.payload.accessToken
			state.isAuthenticated = true
			localStorage.setItem('accessToken', action.payload.accessToken)
		},
		logout: (state) => {
			state.user = null
			state.accessToken = null
			state.isAuthenticated = false
			localStorage.removeItem('accessToken')
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload
		},
	},
})

export const { setCredentials, logout, setLoading } = authSlice.actions

export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAuthLoading = (state: RootState) => state.auth.isLoading

export default authSlice.reducer

