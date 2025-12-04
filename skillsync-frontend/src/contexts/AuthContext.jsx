import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const data = await API.auth.me();
        setUser(data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await API.auth.login({ email, password });
      
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        toast.success('Login successful!');
        
        // Redirect based on user type
        if (data.user.user_type === 'client') {
          navigate('/dashboard');
        } else {
          navigate('/find-work');
        }
        
        return { success: true, user: data.user };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed');
      return { success: false, error: error.response?.data?.detail };
    }
  };

  const register = async (userData) => {
    try {
      const data = await API.auth.register(userData);
      
      if (data.id) { // Registration returns user object, not token
        // Auto-login after registration
        const loginData = await API.auth.login({ 
          email: userData.email, 
          password: userData.password 
        });
        
        if (loginData.access_token) {
          localStorage.setItem('token', loginData.access_token);
          localStorage.setItem('user', JSON.stringify(data));
          setUser(data);
          
          toast.success('Registration successful!');
          
          // Redirect based on user type
          if (data.user_type === 'client') {
            navigate('/dashboard');
          } else {
            navigate('/complete-profile');
          }
          
          return { success: true, user: data };
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
      return { success: false, error: error.response?.data?.detail };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    toast.success('Logged out successfully!');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};