<script lang="ts">
	//import '../app.postcss';
	import "../app.css";
	import { initAddresses, initApplication, isLegal, isLoggedIn, logUserOut, loginStacks } from '@mijoco/stx_helpers/dist/account'
	import { configStore, setConfigByUrl } from '$stores/stores_config';
	import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { onMount, onDestroy } from 'svelte';
	import { sessionStore } from '../stores/stores'
	import { COMMS_ERROR, tsToTime } from '$lib/utils.js'
	import { getConfig } from "$stores/store_helpers";
	import { fetchExchangeRates } from "$lib/stacks_api";
	import { getCurrentProposalLink, isExecutiveTeamMember } from "$lib/proposals";
	import { fetchStacksInfo } from "@mijoco/stx_helpers/dist/index";
	import HeaderFromComponents from "$lib/header/HeaderFromComponents.svelte";
	import { Placeholder, StxEcoFooter } from "@mijoco/stx_components";
	import type { SessionStore } from "$types/local_types";
	import type { CurrentProposal, DaoStore } from "@mijoco/stx_helpers/dist/index";
	import { daoStore } from "$stores/stores_dao";

	let loggedIn = isLoggedIn();
	$: storesReady = false
	const unsubscribe1 = sessionStore.subscribe(() => {});
	const unsubscribe2 = daoStore.subscribe(() => {});
	const unsubscribe3 = configStore.subscribe(() => {});
	onDestroy(async () => {
		unsubscribe1()
		unsubscribe2()
		unsubscribe3()
	})

	let componentKey = 0;
	let componentKey1 = 0;

	setConfigByUrl($page.url.searchParams);
  	if (!isLegal(location.href)) {
		goto('/')
	}
	beforeNavigate(async (nav) => {
		if (!nav.to?.route.id || nav.to?.route.id === '') {
			nav.cancel();
			nav.to?.url.searchParams.set('chain', $configStore.VITE_NETWORK)
			if (getConfig().VITE_NETWORK === 'devnet') {
				window.location.replace('http://localhost:8080?chain=devnet')
			}
		}
		if (!isLegal(nav.to?.route.id || '')) {
			nav.cancel();
			await loginEvent()
			return;
		}
		if (!nav.to?.url.searchParams?.has('chain') && $page.url.hostname === 'localhost') {
			nav.to?.url.searchParams.set('chain', $configStore.VITE_NETWORK)
		}
		console.debug('beforeNavigate: ' + nav.to?.route.id + ' : ' + tsToTime(new Date().getTime()))
	})
	afterNavigate((nav) => {
		//componentKey++;
		console.debug('afterNavigate: ' + nav.to?.route.id + ' : ' + tsToTime(new Date().getTime()))
	})
	let inited = false;
	let holdingMessage:string = 'loading data';

	const loginEvent = async (e?:any) => {
		console.log('update for login', e.target)
		await loginStacks(function() {
			console.log('update for login')
			loggedIn = isLoggedIn();
		})
	}

	const logoutEvent = () => {
		logUserOut();
		loggedIn = isLoggedIn();
	}

	const networkSwitchEvent = async () => {
		await initApp()
		componentKey++;
		componentKey1++;
	}

	const copyEvent = async () => {
		await initApp()
		componentKey++;
		componentKey1++;
	}

	const initApp = async () => {
		await initAddresses(getConfig().VITE_NETWORK, sessionStore);
		const exchangeRates = await fetchExchangeRates();
		await initApplication(getConfig().VITE_STACKS_API, getConfig().VITE_MEMPOOL_API, getConfig().VITE_NETWORK, sessionStore, exchangeRates, getConfig().VITE_SBTC_CONTRACT_ID)

		const emTeamMam = await isExecutiveTeamMember($sessionStore.keySets[getConfig().VITE_NETWORK].stxAddress);
		
		sessionStore.update((conf:SessionStore) => {
			conf.userSettings.executiveTeamMember = emTeamMam?.executiveTeamMember || false
			return conf;
		})
	}

	let timer:any;

	onDestroy(() => {
		clearInterval(timer)
	})

	const startTimer = () => {
		timer = setInterval(async () => {
			const stacksInfo = await fetchStacksInfo(getConfig().VITE_STACKS_API);
			sessionStore.update((conf) => {
				conf.stacksInfo = stacksInfo
				//conf.poxInfo = poxInfo
				return conf;
			});
		}, 120000)
	}

	onMount(async () => {
		try {
			storesReady = true

			await initApp();
			inited = true;

			//await connectToStacks();
			//subscribeBlockUpdates();
			startTimer();
		} catch (err) {
			holdingMessage = COMMS_ERROR
			console.log(err)
		}
	})
</script>

<div class="bg-white min-h-screen relative">
	{#if storesReady}<HeaderFromComponents/>{/if}
	<div class="mx-auto px-6 relative">
		{#if inited}
		{#key componentKey}
			<slot></slot>
		{/key}
		{:else}
		<div class="py-4 mx-auto max-w-7xl md:px-6">
			<div class="flex flex-col w-full my-8">
				<Placeholder message={holdingMessage} link={getCurrentProposalLink()}/>
			</div>
		</div>
		{/if}
	</div>
	<StxEcoFooter />
</div>
