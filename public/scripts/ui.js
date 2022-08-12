let activeStationsList;
let activeStations = [];
let searchResultsList;
let searchResults = [];
let searchInput;
let editStationsButton;

let readyFunction = function() {
	activeStationsList = document.querySelector('.active-stations');
	activeStations = activeStationsList.querySelectorAll('.stations-list__item');
	searchResultsList = document.querySelector('.search-results>.stations-list');
	searchResults = searchResultsList.querySelectorAll('.stations-list__item');
	searchInput = document.querySelector('.search-bar>input[type="text"]');
	editStationsButton = document.querySelector('.edit-stations');

	for (let activeStation of activeStations) {
		if (!activeStation.classList.contains('stations-list__item--active')) {
			activeStation.parentNode.removeChild(activeStation);
		}
	}

	clearSearchResults();

	searchInput.addEventListener('input', (e) => {
		let searchTerm = searchInput.value.toLowerCase();
		clearSearchResults();

		for (let station of searchResults) {
			let stopName = station.querySelector('h3').innerText.toLowerCase();
			if (stopName.includes(searchTerm)) {
				let stopId = station.getAttribute('stop-id');
				let correspondingActiveItem;
				for (let station of activeStations) {
					if (station.getAttribute('stop-id') === stopId) {
						correspondingActiveItem = station;
					}
				}
				if (correspondingActiveItem.parentNode !== activeStationsList) {
					searchResultsList.appendChild(station);
				}
			}
		}
	});

	editStationsButton.addEventListener('click', (e) => {
		let main = document.querySelector('main');
		let modeString = `add-stations-mode`;
		let buttonImage = editStationsButton.querySelector('img');

		if (main.classList.contains(modeString)) {
			main.classList.remove(modeString);
			buttonImage.setAttribute('src', '../img/search.svg');
			searchInput.value = '';
			editStationsButton.querySelector('p').innerText = "Edit stations"
			clearSearchResults();
		} else {
			main.classList.add(modeString);
			editStationsButton.querySelector('p').innerText = "Done"
			buttonImage.setAttribute('src', '../img/check.svg');
			searchInput.focus();
		}
	});
}

function clearSearchResults() {
	searchResultsList.innerHTML = '';
}

if (document.readyState != 'loading') {
	readyFunction();
}
else {
	document.addEventListener('DOMContentLoaded', readyFunction)
}