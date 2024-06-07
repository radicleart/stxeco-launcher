import { CONFIG } from '$lib/config';
import type { DaoTemplate } from '$types/local_types';

export async function fetchStacksInfo() {
  const path = `${CONFIG.VITE_API_STACKS}/v2/info`;
  const response = await fetch(path);
  const res = await response.json();
  return res;
}

export async function getPoxInfo() {
  const path = `${CONFIG.VITE_API_STACKS}/v2/pox`;
  const response = await fetch(path);
  const res = await response.json();
  return res;
}

export async function fetchExchangeRates() {
  const path = `${CONFIG.VITE_API_STXECO}/bridge-api/v1/btc/tx/rates`;
  try {
    const response = await fetch(path);
    const res = await response.json();
    return res;
  } catch(err) {
    return undefined;
  }
}

export async function launchDao(template:DaoTemplate) {
    const path = `${CONFIG.VITE_API_BACKEND}/dao/v1/launch`;
    const response = await fetch(path, {
      method: 'POST',
      headers:  { 'Content-Type': 'application/json', 'Authorization': '' },
      body: JSON.stringify(template)
    });
  
    if (response.status !== 200) {
      return {
        error: 'Error broadcasting',
        status: response.status
      }
    }
    return await response.json();
  }
  
