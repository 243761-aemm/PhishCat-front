import axios, { AxiosError, AxiosResponse } from "axios";
import { useAuth } from "@/store/auth";
import type { RiskLevel, ScanResult } from "./types";

/**
 * MODO DEMO: simula el backend en el navegador (sin servidor).
 * Para conectar el backend real, agrega en .env.local:
 *   NEXT_PUBLIC_USE_MOCK=false
 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
});

// Inyecta el JWT en cada petición privada
api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sesión expirada: limpia el estado y redirige a /login
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const isLoginCall = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginCall) {
      useAuth.getState().logout();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown, fallback = "Algo salió mal. Inténtalo de nuevo."): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "No se pudo conectar con el servidor.";
    const detail = error.response.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

/* ------------------------------------------------------------------ */
/*  MOCK (datos de demostración)                                       */
/* ------------------------------------------------------------------ */

const DEMO_USER = { email: "demo@phishcatch.com", password: "demo1234" };
const USERS_KEY = "phishcatch-mock-users";
const historyKey = (email: string) => `phishcatch-mock-history:${email}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mockError(status: number, detail: string): AxiosError {
  return new AxiosError("Mock error", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data: { detail },
  } as AxiosResponse);
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

const getUsers = () => readJson<Record<string, string>>(USERS_KEY, {});

function ago(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function seedHistory(): ScanResult[] {
  return [
    { id: 1, target: "https://secure-paypal-verify.xyz/login", scan_type: "url", risk_level: "malicious", details: "Dominio reportado en VirusTotal", created_at: ago(25) },
    { id: 2, target: "factura-octubre.eml", scan_type: "email", risk_level: "suspicious", details: "Sin registros de seguridad en el correo", created_at: ago(60 * 5) },
    { id: 3, target: "https://www.wikipedia.org", scan_type: "url", risk_level: "safe", details: "URL limpia en motores de búsqueda", created_at: ago(60 * 30) },
    { id: 4, target: "https://bit.ly/3xYz9Qk", scan_type: "url", risk_level: "suspicious", details: "Enlace acortado que oculta el destino", created_at: ago(60 * 24 * 9) },
  ];
}

function getMockHistory(): ScanResult[] {
  const email = useAuth.getState().email ?? "";
  const stored = readJson<ScanResult[] | null>(historyKey(email), null);
  if (stored) return stored;
  // El usuario demo arranca con ejemplos; las cuentas nuevas arrancan vacías
  const initial = email === DEMO_USER.email ? seedHistory() : [];
  writeJson(historyKey(email), initial);
  return initial;
}

function saveToHistory(result: ScanResult): ScanResult {
  const email = useAuth.getState().email ?? "";
  const entry = { ...result, id: Date.now(), created_at: new Date().toISOString() };
  writeJson(historyKey(email), [entry, ...getMockHistory()]);
  return entry;
}

const MOCK_DETAILS: Record<RiskLevel, string[]> = {
  malicious: ["Dominio reportado en VirusTotal", "Enlace de suplantación bancaria", "Registrado hace menos de 24 horas"],
  suspicious: ["Dominio creado hace menos de 24 horas", "Sin registros de seguridad en el correo", "El destino final no coincide con el texto del enlace"],
  safe: ["URL limpia en motores de búsqueda", "Certificado HTTPS válido", "Firmas del correo válidas"],
};

function judgeUrl(url: string): RiskLevel {
  const u = url.toLowerCase();
  if (/(phish|paypal|banco|verify|secure-|login|\.ru|\.zip)/.test(u)) return "malicious";
  if (u.startsWith("http://") || /(bit\.ly|tinyurl|\.xyz|\.top)/.test(u)) return "suspicious";
  return "safe";
}

function judgeFile(name: string): RiskLevel {
  const n = name.toLowerCase();
  if (/(malicioso|phish|fraude)/.test(n)) return "malicious";
  if (/(sospechoso|factura|urgente)/.test(n)) return "suspicious";
  if (/(seguro|ok|limpio)/.test(n)) return "safe";
  const order: RiskLevel[] = ["safe", "suspicious", "malicious"];
  return order[name.length % 3];
}

/* ------------------------------------------------------------------ */
/*  Servicios                                                          */
/* ------------------------------------------------------------------ */

export async function loginRequest(email: string, password: string) {
  if (USE_MOCK) {
    await sleep(900);
    const users = { [DEMO_USER.email]: DEMO_USER.password, ...getUsers() };
    if (users[email] !== password) throw mockError(401, "Credenciales incorrectas");
    return { access_token: "mock-token", token_type: "bearer" };
  }
  const body = new URLSearchParams({ username: email, password });
  const { data } = await api.post<{ access_token: string; token_type: string }>("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function registerRequest(email: string, password: string) {
  if (USE_MOCK) {
    await sleep(900);
    const users = getUsers();
    if (email === DEMO_USER.email || users[email]) throw mockError(400, "Este correo ya está registrado");
    writeJson(USERS_KEY, { ...users, [email]: password });
    return;
  }
  await api.post("/auth/register", { email, password });
}

export async function scanUrl(url: string) {
  if (USE_MOCK) {
    await sleep(2000);
    const risk = judgeUrl(url);
    return saveToHistory({ target: url, scan_type: "url", risk_level: risk, details: MOCK_DETAILS[risk] });
  }
  const { data } = await api.post<ScanResult>("/scan/url", { url });
  return data;
}

export async function scanEmail(file: File) {
  if (USE_MOCK) {
    await sleep(2000);
    const risk = judgeFile(file.name);
    return saveToHistory({ target: file.name, scan_type: "email", risk_level: risk, details: MOCK_DETAILS[risk] });
  }
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ScanResult>("/scan/email", form);
  return data;
}

export async function getHistory() {
  if (USE_MOCK) {
    await sleep(600);
    return getMockHistory();
  }
  const { data } = await api.get<ScanResult[]>("/history");
  return data;
}