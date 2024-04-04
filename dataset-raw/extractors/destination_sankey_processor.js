const fs = require('fs');
const fsProm = require("fs/promises")
const csv = require("csv-parse");
const stream = require('stream/promises');

const countriesPerDestination = 10;

const includedDestinations = [
    "United States of America",
    "United Kingdom",
    "Australia",
    "France",
    "Germany",
    "Russia",
    "Canada",
    "Türkiye",
    "Malaysia",
    "Italy",
    "Argentina",
    "Saudi Arabia",
    "Netherlands",
    "Austria",
    "Japan",
    "South Korea",
    "Spain",
    "Poland"
];

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
	// Remove header row
	lines.shift();

	// Merge entries destination and year
	const countries = { };

	lines.forEach(line => {
		const [origin, destination, _, students] = line;

		if (!includedDestinations.includes(destination) || origin === "unknown countries") return;

		if (countries[destination] === undefined) countries[destination] = { };
		countries[destination][origin] ||= 0;

		if (!isNaN(students)) countries[destination][origin] += +students;
	});

	console.log(countries)

	const resultLines = [];
	Object.keys(countries).forEach(destination => {
		const topOrigins = Object.entries(countries[destination]).sort((a, b) => b[1] - a[1]).slice(0, countriesPerDestination);
		topOrigins.forEach(origin => resultLines.push([destination, ...origin]));
	});

	console.log(resultLines);

	// Write to file
	let content = "destination,origin,students\n";

	resultLines.forEach(
		line => content += `"${line[0]}","${line[1]}",${Math.ceil(line[2])}\n`
	);

	fsProm.writeFile("./top_10_origins_per_destination.csv", content);
}

processLineByLine();