status_url = 'active/status';
current_cron_url = 'getcron/';
set_cron_url = 'setcron/';
set_status_url = 'active/';
image = "slack_screen.png";

currently_active = false;

document.getElementById("cron_set").addEventListener("click", async (e) => {
	const response = await fetch(set_cron_url + document.getElementById("cron_input").value);
	const cron_set = await response.text();

	if(cron_set === '💀') {
		sendAlert("Cron Error", "The new cron was not succesfully set", true);
	} else {
		sendAlert("Cron Success", "The new Cron set successfully", false);
	}
});

document.getElementById("active-button").addEventListener("click", async (e) => {
	const response = await fetch(set_status_url + !currently_active);
	const active = await response.text();

	if(active === '💀') {
		console.log('💀');
	} else {
		currently_active = (active == 'true');
		setSwitch();
	}
});

document.getElementById("file-input").addEventListener("change", function(event) {
	console.log('set new file');
	var input = document.getElementById("file-input")

	var data = new FormData()
	data.append('cookies', input.files[0])

	fetch('/cfile', {
		method: 'POST',
		body: data
	})
});

(async () =>{
	const response = await fetch(status_url);
	const active = await response.text();

	const response2 = await fetch(current_cron_url);
	const cron = await response2.text();

	currently_active = (active == 'true');

	setSwitch();

	document.getElementById("cron_input").value = cron;
})()

function setSwitch() {
	if(currently_active == true) {
		document.getElementById("active-switch").setAttribute("checked", "checked");
	} else {
		document.getElementById("active-switch").removeAttribute("checked");
	}
}

function sendAlert(ptitle, message, success) {
	//I think this function is broken and bugged
	halfmoon.initStickyAlert({
		content: message,
		title: ptitle,
		alertType: (success) ? 'alert-success' : 'alert-danger',
		fillType: "filled",
		hasDismissButton: true,
		timeShown: 5000
	})	
}