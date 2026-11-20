import axios, { AxiosError, AxiosResponse } from "axios";
import { useAuth } from "@/store/auth";
import type { EngineStats, RiskLevel, ScanDetails, ScanResult, ScanType } from "./types";

/**
 * Por defecto se conecta al backend real.
 * Para volver al modo demo (sin servidor) agrega en .env.local:  NEXT_PUBLIC_USE_MOCK=true
 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://phishcatchback-production.up.railway.app/api/v1",
});

// El análisis consulta VirusTotal (con sondeo) y Google: puede tardar. Sin límite de 120 s.
const SCAN_TIMEOUT = 120_000;

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
    if (error.code === "ECONNABORTED") return "El análisis tardó demasiado. Inténtalo de nuevo.";
    if (!error.response) return "No se pudo conectar con el servidor. Revisa tu conexión o inténtalo en unos minutos.";
    const detail = error.response.data?.detail;
    if (typeof detail === "string") return detail;
    // 422 de FastAPI: detail es una lista de errores de validación
    if (Array.isArray(detail)) return "Los datos enviados no son válidos. Revisa e inténtalo de nuevo.";
    if (error.response.status === 413) return "El archivo excede el tamaño máximo de 10 MB.";
  }
  return fallback;
}

/* ------------------------------------------------------------------ */
/*  Normalización de respuestas del backend                            */
/* ------------------------------------------------------------------ */

const KNOWN_RISK: RiskLevel[] = ["safe", "suspicious", "malicious"];

/** scan_type "file" -> "email"; risk_level desconocido (error / unknown / pending) -> "error" */
function normalize(r: ScanResult): ScanResult {
  return {
    ...r,
    scan_type: ((r.scan_type as string) === "file" ? "email" : r.scan_type) as ScanType,
    risk_level: KNOWN_RISK.includes(r.risk_level) ? r.risk_level : "error",
  };
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
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function seedHistory(): ScanResult[] {
  return [
    { id: 1, target: "https://secure-paypal-verify.xyz/login", scan_type: "url", risk_level: "malicious", created_at: ago(25) },
    { id: 2, target: "factura-octubre.eml", scan_type: "email", risk_level: "suspicious", created_at: ago(60 * 5) },
    { id: 3, target: "https://www.wikipedia.org", scan_type: "url", risk_level: "safe", created_at: ago(60 * 30) },
    { id: 4, target: "https://bit.ly/3xYz9Qk", scan_type: "url", risk_level: "suspicious", created_at: ago(60 * 24 * 9) },
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

const MOCK_STATS: Record<RiskLevel, EngineStats> = {
  malicious: { malicious: 8, suspicious: 3, harmless: 61, undetected: 18 },
  suspicious: { malicious: 0, suspicious: 4, harmless: 58, undetected: 28 },
  safe: { malicious: 0, suspicious: 0, harmless: 72, undetected: 18 },
  error: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 },
};

// Google Safe Browsing con el mismo formato que el backend
const mockGoogle = (risk: RiskLevel): ScanDetails["google"] =>
  risk === "malicious"
    ? { risk_level: "malicious", threat_types: ["SOCIAL_ENGINEERING"], details: { matches: [{ threatType: "SOCIAL_ENGINEERING" }] } }
    : { risk_level: "safe", details: { status: "clean", matches: [] } };

const mockUrlDetails = (risk: RiskLevel): ScanDetails => ({
  virustotal: { risk_level: risk, stats: MOCK_STATS[risk] },
  google: mockGoogle(risk),
});

const MOCK_EMAIL: Record<RiskLevel, ScanDetails> = {
  malicious: {
    metadata: { from: "PayPal Soporte <soporte@paypal.com>", to: "usuario@correo.com", subject: "Urgente: verifica tu cuenta en las próximas 24 horas", date: "Wed, 28 Oct 2026 09:14:00 -0600", return_path: "<mailer@srv-4821.xyz>" },
    security_headers: { spf: "fail", dkim: "fail", dmarc: "fail" },
    urls_found: 3, urls_scanned: 3,
    urls_details: [
      { url: "https://paypal-secure-login.xyz/verify?id=48213", risk_level: "malicious", details: mockUrlDetails("malicious") },
      { url: "https://bit.ly/3xYz9Qk", risk_level: "suspicious", details: mockUrlDetails("suspicious") },
      { url: "https://www.paypal.com/help", risk_level: "safe", details: mockUrlDetails("safe") },
    ],
  },
  suspicious: {
    metadata: { from: "Ofertas Tienda <promo@promos-ofertas.top>", to: "usuario@correo.com", subject: "Solo hoy: 70% de descuento en toda la tienda", date: "Wed, 28 Oct 2026 09:14:00 -0600", return_path: "<promo@promos-ofertas.top>" },
    security_headers: { spf: "none", dkim: "pass", dmarc: "none" },
    urls_found: 3, urls_scanned: 3,
    urls_details: [
      { url: "http://tracking.promos-ofertas.top/click?ref=a81", risk_level: "suspicious", details: mockUrlDetails("suspicious") },
      { url: "https://www.tienda.com/ofertas", risk_level: "safe", details: mockUrlDetails("safe") },
      { url: "https://bit.ly/4abCdEf", risk_level: "suspicious", details: mockUrlDetails("suspicious") },
    ],
  },
  safe: {
    metadata: { from: "Banco Ejemplo <avisos@bancoejemplo.com>", to: "usuario@correo.com", subject: "Tu estado de cuenta de octubre ya está disponible", date: "Wed, 28 Oct 2026 09:14:00 -0600", return_path: "<avisos@bancoejemplo.com>" },
    security_headers: { spf: "pass", dkim: "pass", dmarc: "pass" },
    urls_found: 2, urls_scanned: 2,
    urls_details: [
      { url: "https://www.bancoejemplo.com/estado-cuenta", risk_level: "safe", details: mockUrlDetails("safe") },
      { url: "https://www.bancoejemplo.com/ayuda", risk_level: "safe", details: mockUrlDetails("safe") },
    ],
  },
  error: { urls_details: [] },
};

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
    return saveToHistory({ target: url, scan_type: "url", risk_level: risk, details: mockUrlDetails(risk) });
  }
  const { data } = await api.post<ScanResult>("/scan/url", { url }, { timeout: SCAN_TIMEOUT });
  return normalize(data);
}

export async function scanEmail(file: File) {
  if (USE_MOCK) {
    await sleep(2000);
    const risk = judgeFile(file.name);
    return saveToHistory({ target: file.name, scan_type: "email", risk_level: risk, details: MOCK_EMAIL[risk] });
  }
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ScanResult>("/scan/email", form, { timeout: SCAN_TIMEOUT });
  return normalize(data);
}

export async function getHistory() {
  if (USE_MOCK) {
    await sleep(600);
    return getMockHistory();
  }
  // OJO: con barra final. Sin ella FastAPI responde 307 y detrás del proxy de Railway
  // la redirección puede apuntar a http:// y el navegador la bloquea.
  const { data } = await api.get<ScanResult[]>("/history/", { params: { limit: 100 } });
  return data.map(normalize);
}
