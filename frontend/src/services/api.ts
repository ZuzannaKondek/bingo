import axios from 'axios'

// Use relative URL in browser to leverage Vite proxy, or fallback to env variable
const API_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
})

// Request interceptor to add auth token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('accessToken')
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}
		return config
	},
	(error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			// Token expired - try to refresh or logout
			localStorage.removeItem('accessToken')
			window.location.href = '/login'
		}
		return Promise.reject(error)
	}
)

