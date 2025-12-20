import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import type { AuthState, User } from '@/types'
import type { RootState } from '../index'
import { api } from '@/services/api'

const initialState: AuthState = {
	user: null,
	accessToken: localStorage.getItem('accessToken'),
	isAuthenticated: false,
	isLoading: false,
}

// Async thunk to fetch current user
export const fetchCurrentUser = createAsyncThunk(
	'auth/fetchCurrentUser',
	async (_, { rejectWithValue }) => {
		try {
			const response = await api.get('/api/auth/me')
			return response.data.user
		} catch (error: any) {
			// If token is invalid, clear it
			if (error.response?.status === 401 || error.response?.status === 422) {
				localStorage.removeItem('accessToken')
			}
			return rejectWithValue(error.response?.data?.error || 'Failed to fetch user')
		}
	}
)

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
		setUser: (state, action: PayloadAction<User | null>) => {
			state.user = action.payload
			state.isAuthenticated = !!action.payload
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCurrentUser.pending, (state) => {
				state.isLoading = true
			})
			.addCase(fetchCurrentUser.fulfilled, (state, action) => {
				state.user = action.payload
				state.isAuthenticated = true
				state.isLoading = false
			})
			.addCase(fetchCurrentUser.rejected, (state) => {
				state.user = null
				state.isAuthenticated = false
				state.isLoading = false
			})
	},
})

export const { setCredentials, logout, setLoading, setUser } = authSlice.actions

export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAuthLoading = (state: RootState) => state.auth.isLoading

export default authSlice.reducer

