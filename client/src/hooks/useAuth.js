import { useContext } from 'react';
import { AuthContext } from '../context/AuthContextBase';

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return { user: null, token: null, login: () => {}, logout: () => {}, loading: true };
  }
  return ctx;
};

export default useAuth;
