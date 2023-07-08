#!/usr/bin/env node

//Settings
port = 3000;

var task;
var active = true;
var cookie_broken = false;

var express = require('express');
var app = express();
var cron = require('node-cron');
var upload = require("express-fileupload");
const axios = require('axios');

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exit } = require('process');
const puppeteer = require('puppeteer');

slack_url = 'https://app.slack.com/client/T0299NE0J/C0299NE0U';

const filePath = path.join(process.cwd() + "/public", 'log.txt');
const maxLines = 200; // Maximum number of lines the log file should hold

cookie_path = process.cwd() + '/cookies.json';
screenshot_path = process.cwd() + '/public/slack_screen.png';

app.use( upload({ createParentPath: true }) );

app.use(express.static('public'));

app.get('/active/status', function(req, res){
	res.send(active);
});

app.get('/active/:switch', function(req, res){
	if(req.params.switch == 'true' || req.params.switch == 'false'){
		active = (req.params.switch == 'true');
		res.send(active);
		log(new Date().toLocaleString() + " - Slack puppet " + (active ? "enabled" : "disabled"));
	} else {
		res.send('💀');
	}
});

app.get('/test', async function(req, res){
	await openSlack();
	res.send("<img src='slack_screen.png' />");
});

app.post("/cfile", async (req, res) => {

	if(!req.files) {
		res.send({
			status: false,
			message: 'No file uploaded'
		});
	} else {
		file = req.files.cookies.data.toString('utf8');
		//console.log(file);
		fs.writeFile(cookie_path, file, (err) => {
			if (err) {
				console.log(err);
				res.send('💀');
			} else {
				cookie_broken = false;
				res.send('👍');
				console.log("Cookies saved\n");
				log(new Date().toLocaleString() + " - Cookies saved");
			}
		});
	}

});

app.listen(port);
console.log('Slack puppet started at http://localhost:' + port);
log(new Date().toLocaleString() + " - Slack puppet started");
axios.post('https://ntfy.sh/fall_problems', 'slackbot started 😀')

//0,20,40 9-20 * * 1-5

//Current: */5 8-17 * * 1-5

task = cron.schedule('*/10 * * * *', async () => {
	if(active) {
		await openSlack();
	}
});

async function openSlack() {
	console.log('Opening Slack...');

	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	if(fs.existsSync(cookie_path)) {
		const cookie_string = await fs.readFileSync(cookie_path, 'utf8');
		const cookie_json = JSON.parse(cookie_string);
		await page.setCookie(...cookie_json);
	}

	await page.goto(slack_url);

	try {
		//Wait for the page to load
		await page.waitForSelector('.p-ia__sidebar_header__team_name_text');
		console.log('found selector');
		await delay(3000);

		//Click my personal name and write a check-in post
		/*
		await page.focus('[data-qa="channel_sidebar_name_thomas-mardis"]');
		await delay(1000);
		await page.click('[data-qa="channel_sidebar_name_thomas-mardis"]');
		await delay(1000);
		await page.waitForSelector('aria-label="Message to Thomas Mardis"');
		await page.type("input", "Checking in: " + new Date().toLocaleString(), { delay: 100 });
		await page.keyboard.press('Enter');
		await delay(2000);
		*/

		//Get proof
		await page.screenshot({ path: screenshot_path });
		log(new Date().toLocaleString() + " - Slack check-in");
	} catch(e) {
		//active = false;
		// = true;
		console.log("Cookie login failed TODO: send notif");
		console.log(e);
		log(new Date().toLocaleString() + " - Slack login failed: " + e);
		axios.post('https://ntfy.sh/fall_problems', '❌ Slack check-in failed ❌')
	}

	await browser.close();
}

function delay(time) {
	return new Promise(function(resolve) {
		setTimeout(resolve, time)
	});
}

function log(message) {
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) {
			console.error("Couldn't read the log file:", err);
			return;
		}

		let lines = data.split(os.EOL);
		lines.push(message); // Add the new log message

		// Limit the number of lines
		if (lines.length > maxLines) {
			lines = lines.slice(lines.length - maxLines);
		}

		// Write the data back to the file
		fs.writeFile(filePath, lines.join(os.EOL), err => {
			if (err) console.error("Couldn't write to the log file:", err);
		});
	});
}