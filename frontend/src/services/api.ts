import axios from 'axios'

// Use relative URL in browser to leverage Vite proxy, or fallback to env variable
const API_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
})

// Request interceptor to add auth token and ensure Content-Type is set
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('accessToken')
		console.log('API Request:', config.method?.toUpperCase(), config.url, 'Token:', token ? 'Present' : 'Missing')
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
			console.log('Authorization header set:', config.headers.Authorization.substring(0, 30) + '...')
		}
		// Ensure Content-Type is always set for POST/PUT/PATCH requests
		if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
			config.headers['Content-Type'] = 'application/json'
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

