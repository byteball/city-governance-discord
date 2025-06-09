const Discord = require('discord.js');
const conf = require('ocore/conf.js');

var discordClient = null;

async function initDiscord() {
	if (!conf.discord_token)
		throw Error("discord_token missing in conf");
	if (!conf.discord_channels || !conf.discord_channels.length)
		throw Error("channels missing in conf");
	discordClient = new Discord.Client();
	discordClient.on('ready', () => {
		console.log(`Logged in Discord as ${discordClient.user.tag}!`);
	});
	discordClient.on('error', (error) => {
		console.error(`Discord error: ${error}`);
	});
	await discordClient.login(conf.discord_token);
	setBotActivity();
};
initDiscord();

const defaultSymbol = 'tokens';

function setBotActivity(prefix) {
	prefix = prefix ? (prefix + " ") : "";
	discordClient.user.setActivity(prefix + "governance AAs", { type: "WATCHING" });
}

function announceEvent(aa_name, symbol, decimals, url, event, fullExplorerURL) {
	if (!fullExplorerURL) {
		fullExplorerURL = conf.explorer_base_url + event.trigger_unit;
	}

	const msg = new Discord.MessageEmbed().setColor('#0099ff');
	let description = '[View on interface](' + url + ')\n\n' + event.trigger_address;

	function addLeaderValues() {
		msg.addFields(
			{ name: "Leader value", value: event.leader_value, inline: true },
			{ name: "Support", value: applyDecimals(event.leader_support, decimals) + ' ' + (symbol || defaultSymbol), inline: true },
			{ name: '\u200B', value: '\u200B', inline: true }
		)
	}

	switch (event.type) {
		case "added_support":
			msg.setTitle('Support added in ' + aa_name)
				.setDescription(description + ' adds ' + applyDecimals(event.added_support, decimals) + ' ' + (symbol || defaultSymbol) + ' in support of value `' + event.value + '` of parameter `' + event.name + '`'
				)
				.addFields(
					{ name: "Value", value: event.value, inline: true },
					{ name: "Support", value: applyDecimals(event.support, decimals) + ' ' + (symbol || defaultSymbol), inline: true },
					{ name: '\u200B', value: '\u200B', inline: true }
				)
			addLeaderValues();
			break;
		case "removed_support":
			msg.setTitle('Support removed in ' + aa_name)
				.setDescription(description + ' removes its vote on parameter `' + event.name + '`')
			addLeaderValues();
			break;
		case "commit":
			msg.setTitle('New value committed in ' + aa_name)
				.setDescription(description + ' has committed value `' + event.value + '` for parameter `' + event.name + "`")
				.addFields(
					{ name: "Parameter", value: event.name, inline: true },
					{ name: "Value", value: event.value, inline: true },
					{ name: '\u200B', value: '\u200B', inline: true }
				)
			break;
		case "deposit":
			msg.setTitle('Balance added to ' + aa_name)
				.setDescription(description + ' has added `' + applyDecimals(event.amount, decimals) + ' ' + (symbol || defaultSymbol) + '` to their governance balance')
			break;
		case "withdraw":
			msg.setTitle('Balance withdrawn from ' + aa_name)
				.setDescription(description + ' has withdrawn `' + applyDecimals(event.amount, decimals) + ' ' + (symbol || defaultSymbol) + '` from their balance')
			break;
	}
	msg.addFields({ name: 'Trigger unit', value: '[' + event.trigger_unit + '](' + fullExplorerURL + ')' });
	sendToDiscord(msg);
}

function sendToDiscord(to_be_sent) {
	if (!discordClient)
		return console.log("discord client not initialized");
	if (process.env.mute)
		return console.log("client muted");
	conf.discord_channels.forEach(function (channelId) {
		discordClient.channels.fetch(channelId).then(function (channel) {
			channel.send(to_be_sent);
		});
	});
}

function applyDecimals(amount, decimals) {
	if (!amount)
		return 0;
	return amount / (10 ** decimals);
}

exports.setBotActivity = setBotActivity;
exports.announceEvent = announceEvent;