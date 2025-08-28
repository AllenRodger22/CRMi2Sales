import { apiClient } from './apiClient';
import { Role, User } from '../types';

interface LoginResponse {
  token: string;
  user: User;
}

export const login = (email: string, password: string) => {
  return apiClient.post<LoginResponse>('/auth/login', { email, password });
};

export const register = (
    { name, email, password, role }: { name: string; email: string; password: string; role: Role }
) => {
    return apiClient.post<{ confirmationSent: boolean }>('/auth/register', { name, email, password, role });
};

export const sendPasswordResetEmail = (email: string) => {
    return apiClient.post('/auth/forgot-password', { email });
};

export const updatePassword = (password: string) => {
    return apiClient.put('/auth/update-password', { password });
};

export const getMe = () => {
    return apiClient.get<User>('/auth/me');
};

// Opcional: se o backend tiver um endpoint de logout para invalidar o token
// export const logout = () => {
//     return apiClient.post('/auth/logout', {});
// };
