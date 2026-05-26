import { supabase } from './supabase';

const SESSION_KEY = 'congo_session';

export type KycStatus = 'pending' | 'approved' | 'denied' | 'verify_age';

export type SessionUser = {
  id: string;
  phone: string;
  balance_cdf: number;
  kyc_status: KycStatus;
  blocked: boolean;
};

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`congo_${pin}_gaming`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validateCongoPhone(phone: string): boolean {
  const p = phone.replace(/\s+/g, '');
  return /^0(8\d|9\d)\d{7}$/.test(p);
}

export function detectOperator(phone: string): 'Orange' | 'Airtel' | 'Africell' | null {
  const p = phone.replace(/\s/g, '');
  // Orange Money: 084, 085, 086, 087, 088, 089
  if (/^08[4-9]/.test(p)) return 'Orange';
  // Airtel Money: 097, 098, 099
  if (/^09[7-9]/.test(p)) return 'Airtel';
  // Africell: 090, 091, 092, 093
  if (/^09[0-3]/.test(p)) return 'Africell';
  return null;
}

export function saveSession(user: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): SessionUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function registerUser(phone: string, pin: string): Promise<SessionUser> {
  if (!supabase) throw new Error('Supabase non configuré');
  const pin_hash = await hashPin(pin);
  const { data: existing } = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
  if (existing) throw new Error('Numéro déjà inscrit. Connectez-vous.');
  const { data, error } = await supabase
    .from('users')
    .insert({ phone, pin_hash, balance_cdf: 0 })
    .select('id, phone, balance_cdf, kyc_status, blocked')
    .single();
  if (error || !data) throw new Error(error?.message || 'Erreur inscription');
  const user: SessionUser = {
    id: data.id,
    phone: data.phone,
    balance_cdf: Number(data.balance_cdf),
    kyc_status: (data.kyc_status as KycStatus) || 'pending',
    blocked: !!data.blocked,
  };
  saveSession(user);
  return user;
}

export async function loginUser(phone: string, pin: string): Promise<SessionUser> {
  if (!supabase) throw new Error('Supabase non configuré');
  const pin_hash = await hashPin(pin);
  const { data, error } = await supabase
    .from('users')
    .select('id, phone, balance_cdf, pin_hash, kyc_status, blocked')
    .eq('phone', phone)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Numéro non trouvé');
  if (data.pin_hash !== pin_hash) throw new Error('PIN incorrect');
  if (data.blocked) {
    throw new Error('Compte bloqué. Contactez le support.');
  }
  const user: SessionUser = {
    id: data.id,
    phone: data.phone,
    balance_cdf: Number(data.balance_cdf),
    kyc_status: (data.kyc_status as KycStatus) || 'pending',
    blocked: !!data.blocked,
  };
  saveSession(user);
  return user;
}

/**
 * Refresh the current user's KYC status from Supabase. Used by the route
 * guard on app load and after the KYC scan completes.
 */
export async function refreshKycStatus(userId: string): Promise<KycStatus> {
  if (!supabase) return 'pending';
  const { data } = await supabase
    .from('users')
    .select('kyc_status, blocked')
    .eq('id', userId)
    .maybeSingle();
  const kyc_status = ((data?.kyc_status as KycStatus) || 'pending') as KycStatus;
  const blocked = !!data?.blocked;
  const sess = getSession();
  if (sess) saveSession({ ...sess, kyc_status, blocked });
  return kyc_status;
}

export async function refreshBalance(userId: string): Promise<number> {
  if (!supabase) return 0;
  const { data } = await supabase.from('users').select('balance_cdf').eq('id', userId).single();
  const bal = Number(data?.balance_cdf ?? 0);
  const sess = getSession();
  if (sess) saveSession({ ...sess, balance_cdf: bal });
  return bal;
}
