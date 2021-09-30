status_url = 'http://localhost:3000/active/status';
set_status_url = 'http://localhost:3000/active/';
image = "slack_screen.png";

currently_active = false;

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

	currently_active = (active == 'true');

	setSwitch();	
})()

function setSwitch() {
	if(currently_active == true) {
		document.getElementById("active-switch").setAttribute("checked", "checked");
	} else {
		document.getElementById("active-switch").removeAttribute("checked");
	}
}