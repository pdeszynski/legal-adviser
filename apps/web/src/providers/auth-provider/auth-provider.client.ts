'use client';

import type { AuthProvider } from '@refinedev/core';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:3000';

export const authProviderClient: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email, // Backend expects 'username'
          password,
        }),
      });

      if (!response.ok) {
        // Prepare error message
        const error = await response.json();
        return {
          success: false,
          error: {
            message: error.message || 'Invalid credentials',
            name: 'LoginError',
          },
        };
      }

      const data = await response.json();

      if (data.access_token) {
        Cookies.set(
          'auth',
          JSON.stringify({
            ...data,
            // Mock role for now until backend profile endpoint is ready
            roles: ['admin'],
            name: email,
          }),
          {
            expires: 30, // 30 days
            path: '/',
          },
        );

        return {
          success: true,
          redirectTo: '/documents',
        };
      }

      return {
        success: false,
        error: {
          name: 'LoginError',
          message: 'No token received',
        },
      };
    } catch {
      return {
        success: false,
        error: {
          name: 'NetworkError',
          message: 'Failed to connect to server',
        },
      };
    }
  },
  register: async () => {
    return {
      success: false,
      error: {
        message: 'Registration not implemented yet',
        name: 'NotImplemented',
      },
    };
  },
  forgotPassword: async () => {
    return {
      success: false,
      error: {
        message: 'Forgot password not implemented yet',
        name: 'NotImplemented',
      },
    };
  },
  updatePassword: async () => {
    return {
      success: false,
      error: {
        message: 'Update password not implemented yet',
        name: 'NotImplemented',
      },
    };
  },
  logout: async () => {
    Cookies.remove('auth', { path: '/' });
    return {
      success: true,
      redirectTo: '/login',
    };
  },
  check: async () => {
    const auth = Cookies.get('auth');
    if (auth) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      logout: true,
      redirectTo: '/login',
    };
  },
  getPermissions: async () => {
    const auth = Cookies.get('auth');
    if (auth) {
      const parsedUser = JSON.parse(auth);
      return parsedUser.roles;
    }
    return null;
  },
  getIdentity: async () => {
    const auth = Cookies.get('auth');
    if (auth) {
      const parsedUser = JSON.parse(auth);
      return parsedUser;
    }
    return null;
  },
  onError: async (error) => {
    if (error.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
};
