"use strict";
const path = require('path');
require('dotenv').config({ path: path.dirname(process.mainModule.paths[0]) + '/.env' });

exports.bServeAsHub = false;
exports.bLight = true;

exports.bNoPassphrase = true;

exports.discord_token = process.env.discord_token;
exports.discord_channels = [process.env.channel];
exports.testnet = !!process.env.testnet;
exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';

exports.explorer_base_url = process.env.testnet ? 'https://testnetexplorer.obyte.org/#' : 'https://explorer.obyte.org/#';
exports.oswap_base_url = process.env.testnet ? 'https://city.obyte.org/governance' : 'https://city.obyte.org/governance';

exports.governance_base_AAs = process.env.testnet ? [
  'P5SP4B25G3XNX27MXWZBZUPZ5QXSAW7K', // testnet
] : [
  'JGGFM55N6626QBQWAYBHMBN6A76TVPK5' // mainnet
];

exports.token_registry_AA_address = process.env.TOKEN_REGISTRY_AA_ADDRESS;

console.log('finished server conf');