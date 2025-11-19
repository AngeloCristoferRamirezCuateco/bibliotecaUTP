import { AuthService } from '../services/authService';
import { store } from '../store';
import { loginStart, loginSuccess, loginFailure, logout } from '../store/slices/authSlice';

export class AuthViewModel {
  static async login(matricula: string, contrasena: string) {
    try {
      store.dispatch(loginStart());
      const user = await AuthService.login(matricula, contrasena);
      store.dispatch(loginSuccess(user));
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      store.dispatch(loginFailure(errorMessage));
      throw error;
    }
  }

  static async logout() {
    try {
      await AuthService.logout();
      store.dispatch(logout());
    } catch (error) {
      console.error('Error durante logout:', error);
    }
  }

  static getAuthState() {
    return store.getState().auth;
  }
}