/* eslint-disable @typescript-eslint/no-explicit-any */
/**
import { c32address, c32addressDecode } from 'c32check';
import { StacksTestnet, StacksMainnet, StacksMocknet } from '@stacks/network';
import { AppConfig, UserSession, showConnect, getStacksProvider, type StacksProvider } from '@stacks/connect';
import { sessionStore } from '$stores/stores';
import { fetchStacksInfo, fetchExchangeRates, getPoxInfo, getTokenBalances } from './stacks_api';
import { getConfig, getSession } from '$stores/store_helpers';
import type { AddressObject, ExchangeRate, SbtcUserSettingI } from '@mijoco/stx_helpers/dist/sbtc';
import type { PoxInfo, StacksInfo } from '@mijoco/stx_helpers/dist/pox';

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig }); // we will use this export from other files
let provider:StacksProvider;

export const webWalletNeeded = false;
export const minimumDeposit = 10000
export const revealPayment = 10001

export function getStacksNetwork() {
	const network = getConfig().VITE_NETWORK;
	let stxNetwork:StacksMainnet|StacksTestnet;
	if (network === 'devnet') stxNetwork = new StacksMocknet();
	else if (network === 'testnet') stxNetwork = new StacksTestnet();
	else if (network === 'mainnet') stxNetwork = new StacksMainnet();
	else stxNetwork = new StacksMocknet();
	return stxNetwork;
}

export function decodeStacksAddress(stxAddress:string) {
	if (!stxAddress) throw new Error('Needs a stacks address');
	const decoded = c32addressDecode(stxAddress)
	return decoded
}
  
export function encodeStacksAddress (network:string, b160Address:string) {
	let version = 26
	if (network === 'mainnet') version = 22
	const address = c32address(version, b160Address) // 22 for mainnet
	return address
}

function getProvider() {
	if (!provider) provider = getStacksProvider()
	const prod = (provider.getProductInfo) ? provider.getProductInfo() : undefined;
	if (!prod) throw new Error('Provider not found')
	return prod
}

export function isXverse() {
	//const prov1 = (window as any).LeatherProvider //getProvider()
	//const prov2 = (window as any).XverseProvider //getProvider()
	const xverse = getProvider().name.toLowerCase().indexOf('xverse') > -1
	return xverse
}

export function isHiro() {
	return getProvider().name.toLowerCase().indexOf('hiro') > -1
}

export function isAsigna() {
	return getProvider().name.toLowerCase().indexOf('asigna') > -1
}

export function isLeather() {
	return getProvider().name.toLowerCase().indexOf('leather') > -1
}

export function appDetails() {
	return {
		name: 'stxeco-launcher',
		icon: (window) ? window.location.origin + '/img/stx_eco_logo_icon_white.png' : '/img/stx_eco_logo_icon_white.png',
	}
}

export function makeFlash(el1:HTMLElement|null) {
	let count = 0;
	if (!el1) return;
	el1.classList.add("flasherize-button");
    const ticker = setInterval(function () {
		count++;
		if ((count % 2) === 0) {
			el1.classList.add("flasherize-button");
		}
		else {
			el1.classList.remove("flasherize-button");
		}
		if (count === 2) {
			el1.classList.remove("flasherize-button");
			clearInterval(ticker)
		}
	  }, 2000)
}

export function isLegal(routeId:string):boolean {
	try {
		if (userSession.isUserSignedIn()) return true;
		if (routeId.startsWith('http')) {
			if (routeId.indexOf('/deposit') > -1 || routeId.indexOf('/withdraw') > -1 || routeId.indexOf('/admin') > -1 || routeId.indexOf('/transactions') > -1) {
				return false;
			}
		} else if (['/deposit', '/withdraw', '/admin', '/transactions'].includes(routeId)) {
			return false;
		}
		return true;
	} catch (err) {
		return false
	}
}

export function loggedIn():boolean {
	try {
		return userSession.isUserSignedIn()
	} catch (err) {
		return false
	}
}

export function getStacksAddress() {
	if (loggedIn()) {
		const userData = userSession.loadUserData();
		const stxAddress = (getConfig().VITE_NETWORK === 'testnet' || getConfig().VITE_NETWORK === 'devnet') ? userData.profile.stxAddress.testnet : userData.profile.stxAddress.mainnet;
		return stxAddress
	}
	return
}

export async function loginStacks(callback:any) {
	try {
		const provider = getProvider()
		console.log('provider: ', provider)
		if (!userSession.isUserSignedIn()) {
			showConnect({
				userSession,
				appDetails: appDetails(),
				onFinish: async (e:unknown) => {
					console.log(e)
					await callback(true);
					window.location.reload()
				},
				onCancel: () => {
					callback(false);
				},
			});
		} else {
			callback(true);
		}
	} catch (e) {
		if (window) window.location.href = "https://wallet.hiro.so/wallet/install-web";
		callback(false);
	}
}

export function loginStacksFromHeader(document:any) {
	const el = document.getElementById("connect-wallet")
	if (el) return document.getElementById("connect-wallet").click();
	else return false;
}

export function logUserOut() {
	return userSession.signUserOut();
}

const FORMAT = /[ `!@#$%^&*()_+=[\]{};':"\\|,<>/?~]/;

export function verifyStacksPricipal(stacksAddress?:string) {
	if (!stacksAddress) {
	  throw new Error('Address not found');
	} else if (FORMAT.test(stacksAddress)) {
	  throw new Error('please remove white space / special characters');
	}
	try {
	  const decoded = decodeStacksAddress(stacksAddress.split('.')[0]);
	  if ((getConfig().VITE_NETWORK === 'testnet' || getConfig().VITE_NETWORK === 'devnet') && decoded[0] !== 26) {
		throw new Error('Please enter a valid stacks blockchain testnet address');
	  }
	  if (getConfig().VITE_NETWORK === 'mainnet' && decoded[0] !== 22) {
		throw new Error('Please enter a valid stacks blockchain mainnet address');
	  }
	  return stacksAddress;
	  } catch (err:any) {
		  throw new Error('Invalid stacks principal - please enter a valid ' + getConfig().VITE_NETWORK + ' account or contract principal.');
	  }
}

export function verifyAmount(amount:number, balance:number) {
	if (!amount || amount === 0) {
		throw new Error('No amount entered');
	}
	if (amount >= balance) {
		throw new Error('Amount is greater than your balance');
	}
  	//if (amount < minimumDeposit) {
	//	throw new Error('Amount must be at least 0.0001 or 10,000 satoshis');
	//  }
}
export function verifySBTCAmount(amount:number, balance:number, fee:number) {
	if (!amount || amount === 0) {
		throw new Error('No amount entered');
	}
	if (amount > (balance - fee)) {
		throw new Error('No more then balance (less fee of ' + fee + ')');
	}
}
  
export async function initApplication(userSettings?:SbtcUserSettingI) {
	try {
		const stacksInfo = await fetchStacksInfo() || {} as StacksInfo;
		const poxInfo = await getPoxInfo()
		const exchangeRates = await fetchExchangeRates();
		const settings = userSettings || defaultSettings()
		const rateNow = exchangeRates?.find((o:any) => o.currency === 'USD') || {currency: 'USD'} as ExchangeRate;
		settings.currency = {
			myFiatCurrency: rateNow || defaultExchangeRate(),
			cryptoFirst: true,
			denomination: 'USD'
		}
		let balances:any;
		const ss = getSession()
		if (loggedIn() && ss.keySets[getConfig().VITE_NETWORK].stxAddress ) {
			balances = await getTokenBalances(ss.keySets[getConfig().VITE_NETWORK].stxAddress)
		}
	
		sessionStore.update((conf) => {
			conf.stacksInfo = stacksInfo
			conf.poxInfo = poxInfo
			conf.balances = balances
			conf.loggedIn = userSession.isUserSignedIn();
			if (!conf.keySets || !conf.keySets[getConfig().VITE_NETWORK]) {
				if (getConfig().VITE_NETWORK === 'testnet') {
					conf.keySets = { 'testnet': {} as AddressObject };
				} else if (getConfig().VITE_NETWORK === 'regtest') {
					conf.keySets = { 'regtest': {} as AddressObject };
				} else {
					conf.keySets = { 'mainnet': {} as AddressObject };
				}
			}
			conf.exchangeRates = exchangeRates || [] as Array<ExchangeRate>;
			conf.userSettings = settings
			return conf;
		});
	} catch (err:any) {
		sessionStore.update((conf) => {
			conf.stacksInfo = {} as StacksInfo
			conf.poxInfo = {} as PoxInfo
			conf.loggedIn = userSession.isUserSignedIn();
			if (!conf.keySets || !conf.keySets[getConfig().VITE_NETWORK]) {
				if (getConfig().VITE_NETWORK === 'testnet'|| getConfig().VITE_NETWORK === 'regtest') {
					conf.keySets = { 'testnet': {} as AddressObject };
				} else {
					conf.keySets = { 'mainnet': {} as AddressObject };
				}
			}
			conf.exchangeRates = [] as Array<ExchangeRate>;
			conf.userSettings = {} as SbtcUserSettingI
			return conf;
		});
	}
}

function defaultSettings():SbtcUserSettingI {
	return {
		debugMode: false,
		executiveTeamMember: false,
		currency: {
		  cryptoFirst: true,
		  myFiatCurrency: defaultExchangeRate(),
		  denomination: 'USD',
		}
	}
}

function defaultExchangeRate():ExchangeRate {
	return {
		_id: '',
		currency: 'USD',
		fifteen: 0,
		last: 0,
		buy: 0,
		sell: 0,
		symbol: 'USD',
		name: 'BTCUSD'			  
	}
  }
   */