const DAG = require('aabot/dag.js');
const conf = require('ocore/conf.js');
const network = require('ocore/network.js');
const eventBus = require('ocore/event_bus.js');
const lightWallet = require('ocore/light_wallet.js');
const walletGeneral = require('ocore/wallet_general.js');
const governanceEvents = require('./lib/governance_events.js');
const governanceDiscord = require('./lib/governance_discord.js');

const getSymbolByAsset = require('./utils/getSymbolByAsset');
const getDecimalsByAsset = require('./utils/getDecimalsByAsset');

const ignoreOldResponses = true; // if true, old responses will be ignored

var assocGovernanceAAs = {};
var assocPoolAAs = {};

lightWallet.setLightVendorHost(conf.hub);

eventBus.once('connected', function (ws) {
    network.initWitnessesIfNecessary(ws, start);
});


async function start() {
    await discoverGovernanceAas();
    eventBus.on('connected', function (ws) {
        conf.governance_base_AAs
            .forEach((address) => {
                network.addLightWatchedAa(address, null, console.log);
            });
    });
    lightWallet.refreshLightClientHistory();
    setInterval(discoverGovernanceAas, 24 * 3600 * 1000); // everyday check
}


eventBus.on('aa_response', async function (objResponse) {

    if (objResponse.response.error)
        return console.log('ignored response with error: ' + objResponse.response.error);
    if (ignoreOldResponses && ((Math.ceil(Date.now() / 1000) - objResponse.timestamp) / 60 / 60 > 24))
        return console.log('ignored old response' + objResponse);
    if (assocGovernanceAAs[objResponse.aa_address]) {
        const governance_aa = assocGovernanceAAs[objResponse.aa_address];
        const main_aa = assocPoolAAs[governance_aa.main_aa];

        const event = await governanceEvents.treatResponseFromGovernanceAA(objResponse, main_aa.asset, governance_aa.main_aa);
        governanceDiscord.announceEvent("Obyte City", main_aa.symbol, main_aa.decimals, `https://city.obyte.org`, event);
    } else {
        console.log('ignored response from unknown AA: ' + objResponse.aa_address);
    }
});

async function discoverGovernanceAas() {
    const aas = await DAG.getAAsByBaseAAs(conf.governance_base_AAs);
    await Promise.all(aas.map(indexAndWatchGovernanceAA));
}

async function indexAndWatchGovernanceAA(governanceAA) {
    return new Promise(async function (resolve) {
        const governanceParams = governanceAA.definition[1].params;
        const mainAAAddress = governanceParams.city_aa;

        await indexAllPoolAaParams(mainAAAddress);

        assocGovernanceAAs[governanceAA.address] = {
            main_aa: mainAAAddress
        }

        walletGeneral.addWatchedAddress(governanceAA.address, resolve);
    });
}

async function indexAllPoolAaParams(mainAAAddress) {
    const constants = await DAG.readAAStateVar(mainAAAddress, "constants");

    const asset = constants && constants.asset;
    const governance_aa = constants && constants.governance_aa;

    if (!asset || !governance_aa) return null;

    const decimals = await getDecimalsByAsset(asset);
    const symbol = await getSymbolByAsset(asset);

    assocPoolAAs[mainAAAddress] = {
        aa_address: mainAAAddress,
        governance_aa: governance_aa,
        asset,
        decimals,
        symbol
    }
}

function handleJustsaying(ws, subject, body) {
    switch (subject) {
        case 'light/have_updates':
            lightWallet.refreshLightClientHistory();
            break;
    }
}

eventBus.on("message_for_light", handleJustsaying);

process.on('unhandledRejection', up => { throw up });