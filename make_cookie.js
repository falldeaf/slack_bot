const fs = require('fs');
const { exit } = require('process');
const puppeteer = require('puppeteer');
const readline = require('readline');

slack_url = 'https://app.slack.com/client/T0299NE0J/C0299NE0U';

(async () => {
	console.log('Opening Slack...');
	const browser = await puppeteer.launch({headless: false});
	const page = await browser.newPage();
	await page.goto(slack_url);

	await askQuestion("Go ahead and log into Slack, then come back here and press enter to save the cookie file");

	console.log("Writing cookies and exiting...");
	const cookies = await page.cookies();
	//console.log(cookies);
	await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));

	await browser.close();
})();

async function askQuestion(query) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise(resolve => rl.question(query, ans => {
		rl.close();
		resolve(ans);
	}))
}