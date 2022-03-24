#!/usr/bin/env node

//Settings
port = 3000;

var task;
var active = false;
var cron_string = "";
var cookie_broken = false;

var express = require('express');
var app = express();
var cron = require('node-cron');
var upload = require("express-fileupload");

const fs = require('fs');
const { exit } = require('process');
const puppeteer = require('puppeteer');

slack_url = 'https://app.slack.com/client/T0299NE0J/C0299NE0U';

cron_path = process.cwd() + '/cron_string.txt'
cookie_path = process.cwd() + '/cookies.json';
screenshot_path = process.cwd() + '/public/slack_screen.png';

app.use( upload({ createParentPath: true }) );

app.use(express.static('public'));

app.get('/active/status', function(req, res){
	res.send(active);
});

app.get('/getcron/', function(req, res) {
	res.send(cron_string);
});

app.get('/setcron/:cron', function(req, res){
	if(cron.validate(req.params.cron)) {
		cron_string = req.params.cron;
		fs.writeFileSync(cron_path, cron_string);
		if(task.destroy) task.destroy();
		task = cron.schedule(cron_string, async () => {
			if(active) {
				await openSlack();
			}
		});
		res.send('👍');
	} else {
		res.send('💀');
	}
});

app.get('/active/:switch', function(req, res){
	if(req.params.switch == 'true' || req.params.switch == 'false'){
		active = (req.params.switch == 'true');
		res.send(active);
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
			}
		});
	}

});

app.listen(port);
console.log('Slack puppet started at http://localhost:' + port);

//current cron: 0,20,40 9-20 * * 1-5
try {
	cron_string = fs.readFileSync(cron_path, 'utf8');
} catch(e) {
	console.log("No cron file found: " + e);
}

if(cron.validate(cron_string)) {
	console.log("Cron file found, running: " + cron_string);
	task = cron.schedule(cron_string, async () => {
		if(active) {
			await openSlack();
		}
	});
}

async function openSlack() {
	console.log('Opening Slack...');

	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	if(fs.existsSync(cookie_path)) {
		const cookie_string = fs.readFileSync(cookie_path, 'utf8');
		const cookie_json = JSON.parse(cookie_string);
		await page.setCookie(...cookie_json);
	}

	await page.goto(slack_url);

	try {
		await page.waitForSelector('.p-ia__sidebar_header__team_name_text');
		console.log('found selector');
		await delay(5000);
		await page.screenshot({ path: screenshot_path });
	} catch(e) {
		//Don't deactivate, send notification instead

		//active = false;
		cookie_broken = true;
		console.log("Cookie login failed TODO: send notif");
		console.log(e);
	}

	await browser.close();
}

function delay(time) {
	return new Promise(function(resolve) { 
		setTimeout(resolve, time)
	});
}