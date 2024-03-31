const fs = require('fs');
const fsProm = require("fs/promises")
const csv = require("csv-parse");
const stream = require('stream/promises');

const numberOfCountriesPerSource = 10;

const sourceCountries = {
	"China": [
		"United States of America",
		"Australia",
		"United Kingdom",
		"Canada",
		"South Korea",
		"China, Hong Kong",
		"Germany",
		"France",
		"Russia",
		"China, Macao"
	],
	"India": [
		"United States of America",
		"Australia",
		"Canada",
		"United Kingdom",
		"Germany",
		"Russia",
		"Ukraine",
		"New Zealand",
		"Kyrgyzstan",
		"Georgia"
	],
	"Vietnam": [
		"Japan",
		"United States of America",
		"Australia",
		"South Korea",
		"Canada",
		"France",
		"United Kingdom",
		"Germany",
		"Finland",
		"Russia"
	],
	"Germany": [
		"Austria",
		"Netherlands",
		"United Kingdom",
		"Switzerland",
		"United States of America",
		"France",
		"Türkiye",
		"Denmark",
		"Hungary",
		"Sweden"
	],
	"Uzbekistan": [
		"Russia",
		"Kyrgyzstan",
		"Kazakhstan",
		"South Korea",
		"Ukraine",
		"Latvia",
		"Türkiye",
		"Japan",
		"Germany",
		"Poland"
	],
	"France": [
		"Belgium",
		"Canada",
		"United Kingdom",
		"Switzerland",
		"Spain",
		"Germany",
		"United States of America",
		"Romania",
		"Italy",
		"Portugal"
	],
	"United States of America": [
		"United Kingdom",
		"Mexico",
		"Canada",
		"Germany",
		"Argentina",
		"France",
		"Australia",
		"Japan",
		"Grenada",
		"Ireland"
	]
	,

	"Syrian Arab Republic": [
		"Türkiye",
		"Germany",
		"Saudi Arabia",
		"Jordan",
		"Russia",
		"France",
		"Qatar",
		"Malaysia",
		"Iran",
		"Romania"
	]
	,

	"Kazakhstan": [
		"Russia",
		"Kyrgyzstan",
		"Türkiye",
		"Czechia",
		"United States of America",
		"United Kingdom",
		"Germany",
		"Poland",
		"South Korea",
		"Canada"
	]
	,

	"South Korea": [
		"United States of America",
		"Australia",
		"Canada",
		"Germany",
		"United Kingdom",
		"France",
		"China, Hong Kong",
		"New Zealand",
		"Hungary",
		"Russia"
	]
	,

	"Nepal": [
		"Australia",
		"Japan",
		"India",
		"United States of America",
		"South Korea",
		"Cyprus",
		"Germany",
		"Finland",
		"United Kingdom",
		"New Zealand"
	]
	,

	"Brazil": [
		"Argentina",
		"Portugal",
		"United States of America",
		"Australia",
		"Canada",
		"Germany",
		"France",
		"Spain",
		"United Kingdom",
		"Italy"
	]
	,
	"Ukraine": [
		"Poland",
		"Russia",
		"Germany",
		"Czechia",
		"Slovakia",
		"Italy",
		"Austria",
		"United States of America",
		"Canada",
		"Hungary"
	],
	"Italy": [
		"United Kingdom",
		"Austria",
		"Germany",
		"France",
		"Spain",
		"Switzerland",
		"United States of America",
		"Netherlands",
		"Romania",
		"Australia"
	],
	"Nigeria": [
		"United Kingdom",
		"United States of America",
		"Canada",
		"Ghana",
		"Malaysia",
		"Ukraine",
		"South Africa",
		"Germany",
		"Benin",
		"Türkiye"
	],
	"Saudi Arabia": [
		"United States of America",
		"United Kingdom",
		"Australia",
		"Canada",
		"Bahrain",
		"Malaysia",
		"Jordan",
		"Ireland",
		"Poland",
		"Qatar"
	],
	"Malaysia": [
		"Australia",
		"United Kingdom",
		"United States of America",
		"Japan",
		"New Zealand",
		"Egypt",
		"Ireland",
		"Russia",
		"Germany",
		"India"
	]
}

const result = { }

async function processLineByLine() {

	async function processFile() {
		const lines = [];
		const parser = fs.createReadStream("raw_filled.csv")
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

	Object.keys(sourceCountries).forEach(sourceCountry => {
		const destinations = sourceCountries[sourceCountry];

		result[sourceCountry] = { };

		destinations.forEach(destination => {
			const years = lines.filter(e => e[0] === sourceCountry && e[1] === destination);
			console.log(years);

			result[sourceCountry][destination] = { }
			
			years.forEach(year => {
				result[sourceCountry][destination][year[2]] = Math.ceil(year[3]);
			})
		});		
	});

	fsProm.writeFile("./source_destination_pair.json", JSON.stringify(result));
	console.log(result);
}

processLineByLine();