import axios from 'axios';

// En producción (cuando construyamos el .exe) esta URL puede cambiar o servirse en el mismo puerto
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});
