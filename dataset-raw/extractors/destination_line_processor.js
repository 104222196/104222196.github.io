const fs = require('fs');
const fsProm = require("fs/promises")
const csv = require("csv-parse");
const stream = require('stream/promises');

const destinations = {
    "Poland": [
        "Ukraine",
        "Belarus",
        "India",
        "Norway",
        "Germany",
        "Turkey",
        "China",
        "Russia",
        "Sweden",
        "Kazakhstan"
    ],
    "United States of America": [
        "China",
        "India",
        "South Korea",
        "Saudi Arabia",
        "Canada",
        "Vietnam",
        "Mexico",
        "Brazil",
        "Japan",
        "Nepal"
    ],
    "Malaysia": [
        "China",
        "Bangladesh",
        "Indonesia",
        "Nigeria",
        "Yemen",
        "Pakistan",
        "India",
        "Sri Lanka",
        "Egypt",
        "Iraq"
    ],
    "Australia": [
        "China",
        "India",
        "Nepal",
        "Vietnam",
        "Malaysia",
        "Indonesia",
        "Pakistan",
        "Sri Lanka",
        "Hong Kong",
        "South Korea"
    ],
    "Japan": [
        "Vietnam",
        "Nepal",
        "Indonesia",
        "Sri Lanka",
        "Thailand",
        "Myanmar",
        "Malaysia",
        "Bangladesh",
        "United States",
        "Mongolia"
    ],
    "Austria": [
        "Germany",
        "Italy",
        "Bosnia and Herzegovina",
        "Hungary",
        "Turkey",
        "Serbia",
        "Russia",
        "Ukraine",
        "Bulgaria",
        "Iran"
    ],
    "Russia": [
        "Kazakhstan",
        "Uzbekistan",
        "Turkmenistan",
        "China",
        "Tajikistan",
        "Ukraine",
        "India",
        "Belarus",
        "Azerbaijan",
        "Kyrgyzstan"
    ],
    "United Kingdom": [
        "China",
        "India",
        "United States",
        "Hong Kong",
        "Italy",
        "Malaysia",
        "Nigeria",
        "France",
        "Germany",
        "Spain"
    ],
    "Italy": [
        "China",
        "Albania",
        "Romania",
        "Iran",
        "India",
        "Turkey",
        "Russia",
        "Cameroon",
        "France",
        "Germany"
    ],
    "Netherlands": [
        "Germany",
        "China",
        "Italy",
        "Belgium",
        "Greece",
        "Bulgaria",
        "Spain",
        "France",
        "Romania",
        "India"
    ],
    "Saudi Arabia": [
        "Yemen",
        "Syrian Arab Republic",
        "Palestine",
        "Egypt",
        "Jordan",
        "Pakistan",
        "Sudan",
        "Indonesia",
        "India",
        "Nigeria"
    ],
    "South Korea": [
        "China",
        "Vietnam",
        "Uzbekistan",
        "Mongolia",
        "Japan",
        "Nepal",
        "Pakistan",
        "Indonesia",
        "United States",
        "Bangladesh"
    ],
    "France": [
        "Morocco",
        "China",
        "Algeria",
        "Senegal",
        "Tunisia",
        "Italy",
        "Côte d'Ivoire",
        "Lebanon",
        "Cameroon",
        "Spain"
    ],
    "Canada": [
        "China",
        "India",
        "France",
        "United States",
        "Nigeria",
        "South Korea",
        "Vietnam",
        "Iran",
        "Brazil",
        "Bangladesh"
    ],
    "Türkiye": [
        "Syrian Arab Republic",
        "Azerbaijan",
        "Turkmenistan",
        "Iraq",
        "Iran",
        "Afghanistan",
        "Somalia",
        "Germany",
        "Yemen",
        "Egypt"
    ],
    "Argentina": [
        "Brazil",
        "Peru",
        "Colombia",
        "Plurinational State of Bolivia",
        "Paraguay",
        "Bolivarian Republic of Venezuela",
        "Chile",
        "Ecuador",
        "United States",
        "Uruguay"
    ],
    "Spain": [
        "France",
        "Italy",
        "Ecuador",
        "Colombia",
        "Mexico",
        "Peru",
        "China",
        "Morocco",
        "Chile",
        "Bolivarian Republic of Venezuela"
    ],
    "Germany": [
        "China",
        "India",
        "Austria",
        "Syrian Arab Republic",
        "Russia",
        "Turkey",
        "Italy",
        "France",
        "Cameroon",
        "Iran"
    ]
}

const result = { }

async function processLineByLine() {

	async function processFile() {
		const lines = [];
		const parser = fs.createReadStream("destinations_raw.csv")
			.pipe(csv.parse({}));

		parser.on("readable", () => {
			let line;
			while ((line = parser.read()) !== null) {
				lines.push(line);
			}
		});

		await stream.finished(parser);
		return lines;
	}

	// Lines from raw.csv
	const lines = await processFile();
	// Header row
	lines.shift();

	Object.keys(destinations).forEach(destination => {
		const origins = destinations[destination];

		result[destination] = { };

		origins.forEach(origin => {
			const years = lines.filter(e => e[0] === origin && e[1] === destination);
			console.log(years);

			result[destination][origin] = { }
			
			years.forEach(year => {
				result[destination][origin][year[2]] = Math.ceil(year[3]);
			})
		});		
	});

	fsProm.writeFile("./destination_line_data.json", JSON.stringify(result));
	console.log(result);
}

processLineByLine();