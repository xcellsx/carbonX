/**
 * CarbonX API Client
 * A JavaScript module for easy interaction with CarbonX backend API
 * 
 * Usage:
 *   import { CarbonXAPI } from './carbonx-api-client.js';
 *   const api = new CarbonXAPI('http://localhost:8080');
 * 
 * Or in HTML:
 *   <script src="js/carbonx-api-client.js"></script>
 *   <script>
 *     const api = new CarbonXAPI('http://localhost:8080');
 *   </script>
 */

class CarbonXAPI {
    /**
     * Initialize the API client
     * @param {string} baseUrl - Base URL of the backend API (default: http://localhost:8080)
     */
    constructor(baseUrl = 'http://localhost:8080') {
        this.baseUrl = baseUrl;
        this.userEndpoint = `${baseUrl}/api/users`;
    }

    /**
     * Helper method to handle API responses
     * @private
     */
    async _handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw {
                status: response.status,
                message: data.error || 'An error occurred',
                data: data
            };
        }
        
        return data;
    }

    /**
     * Helper method to make API requests
     * @private
     */
    async _request(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            return await this._handleResponse(response);
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw {
                status: 0,
                message: 'Network error or server is not responding',
                data: error
            };
        }
    }

    // ==================== USER MANAGEMENT ====================

    /**
     * Get all users
     * @param {Object} filters - Optional filters {role, active, company}
     * @returns {Promise<Array>} Array of user objects
     * 
     * @example
     * // Get all users
     * const users = await api.users.getAll();
     * 
     * // Get admin users
     * const admins = await api.users.getAll({ role: 'admin' });
     * 
     * // Get active users
     * const activeUsers = await api.users.getAll({ active: true });
     */
    async getAllUsers(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.role) params.append('role', filters.role);
        if (filters.active !== undefined) params.append('active', filters.active);
        if (filters.company) params.append('company', filters.company);
        
        const url = params.toString() 
            ? `${this.userEndpoint}?${params}`
            : this.userEndpoint;
        
        return await this._request(url);
    }

    /**
     * Get a user by ID
     * @param {string} id - User ID
     * @returns {Promise<Object>} User object
     * 
     * @example
     * const user = await api.users.getById('12345');
     */
    async getUserById(id) {
        if (!id) throw new Error('User ID is required');
        return await this._request(`${this.userEndpoint}/${id}`);
    }

    /**
     * Get a user by email
     * @param {string} email - User email
     * @returns {Promise<Object>} User object
     * 
     * @example
     * const user = await api.users.getByEmail('john@example.com');
     */
    async getUserByEmail(email) {
        if (!email) throw new Error('Email is required');
        return await this._request(`${this.userEndpoint}/email/${encodeURIComponent(email)}`);
    }

    /**
     * Get a user by username
     * @param {string} username - Username
     * @returns {Promise<Object>} User object
     * 
     * @example
     * const user = await api.users.getByUsername('johndoe');
     */
    async getUserByUsername(username) {
        if (!username) throw new Error('Username is required');
        return await this._request(`${this.userEndpoint}/username/${encodeURIComponent(username)}`);
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @param {string} userData.username - Username (required)
     * @param {string} userData.email - Email (required)
     * @param {string} userData.password - Password (required)
     * @param {string} userData.firstName - First name (optional)
     * @param {string} userData.lastName - Last name (optional)
     * @param {string} userData.role - User role (optional, default: 'user')
     * @param {string} userData.companyName - Company name (optional)
     * @returns {Promise<Object>} Created user object
     * 
     * @example
     * const newUser = await api.users.create({
     *   username: 'johndoe',
     *   email: 'john@example.com',
     *   password: 'securepass123',
     *   firstName: 'John',
     *   lastName: 'Doe'
     * });
     */
    async createUser(userData) {
        if (!userData.username || !userData.email || !userData.password) {
            throw new Error('Username, email, and password are required');
        }
        
        return await this._request(this.userEndpoint, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    /**
     * Update a user
     * @param {string} id - User ID
     * @param {Object} userData - Updated user data (all fields optional)
     * @returns {Promise<Object>} Updated user object
     * 
     * @example
     * const updated = await api.users.update('12345', {
     *   firstName: 'Jonathan',
     *   lastName: 'Smith'
     * });
     */
    async updateUser(id, userData) {
        if (!id) throw new Error('User ID is required');
        
        return await this._request(`${this.userEndpoint}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    /**
     * Activate a user
     * @param {string} id - User ID
     * @returns {Promise<Object>} Updated user object
     * 
     * @example
     * await api.users.activate('12345');
     */
    async activateUser(id) {
        if (!id) throw new Error('User ID is required');
        
        return await this._request(`${this.userEndpoint}/${id}/activate?active=true`, {
            method: 'PATCH'
        });
    }

    /**
     * Deactivate a user
     * @param {string} id - User ID
     * @returns {Promise<Object>} Updated user object
     * 
     * @example
     * await api.users.deactivate('12345');
     */
    async deactivateUser(id) {
        if (!id) throw new Error('User ID is required');
        
        return await this._request(`${this.userEndpoint}/${id}/activate?active=false`, {
            method: 'PATCH'
        });
    }

    /**
     * Delete a user
     * @param {string} id - User ID
     * @returns {Promise<Object>} Deletion confirmation
     * 
     * @example
     * await api.users.delete('12345');
     */
    async deleteUser(id) {
        if (!id) throw new Error('User ID is required');
        
        return await this._request(`${this.userEndpoint}/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Login a user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login response with user data
     * 
     * @example
     * const response = await api.users.login('john@example.com', 'password123');
     * console.log('Logged in as:', response.user.username);
     */
    async login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        return await this._request(`${this.userEndpoint}/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    // Convenience object for accessing user methods
    get users() {
        return {
            getAll: (filters) => this.getAllUsers(filters),
            getById: (id) => this.getUserById(id),
            getByEmail: (email) => this.getUserByEmail(email),
            getByUsername: (username) => this.getUserByUsername(username),
            create: (userData) => this.createUser(userData),
            update: (id, userData) => this.updateUser(id, userData),
            activate: (id) => this.activateUser(id),
            deactivate: (id) => this.deactivateUser(id),
            delete: (id) => this.deleteUser(id),
            login: (email, password) => this.login(email, password)
        };
    }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CarbonXAPI };
}

// Export for browser global
if (typeof window !== 'undefined') {
    window.CarbonXAPI = CarbonXAPI;
}

