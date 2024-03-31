const fs = require('fs');
const fsProm = require("fs/promises")
const csv = require("csv-parse");
const stream = require('stream/promises');

const numberOfCountriesPerSource = 10;

async function processLineByLine() {
	
	async function processFile() {
		const lines = [];
		const parser = fs.createReadStream("raw.csv")
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
	const header = lines.shift();

	// Fill in the blank fields based on the values of the fields above.
	let previousLine = [];
	
	lines.forEach(line => {
		if (line[0] === "") line[0] = previousLine[0];
		if (line[1] === "") line[1] = previousLine[1];
		previousLine = line;
	});

	// Merge entries by source and destination.
	const countries = { };

	lines.forEach(line => {
		const [source, destination, _, students] = line;
		if (countries[source] === undefined) countries[source] = { };
		countries[source][destination] = countries[source][destination] || 0;
		if (!isNaN(students)) countries[source][destination] += +students;
	});

	// Get top 10 destinations for each source country.
	const resultLines = [];
	Object.keys(countries).forEach(sourceCountry => {
		const sortedDestinations = Object.entries(countries[sourceCountry])
										.sort((a, b) => b[1] - a[1])
										.slice(0, numberOfCountriesPerSource);
		sortedDestinations.forEach(dest => resultLines.push([sourceCountry, ...dest]));
	});

	// Write to file
	let content = "source,destination,students\n";

	resultLines.forEach(
		line => content += `"${line[0]}","${line[1]}",${Math.ceil(line[2])}\n`
	);

	fsProm.writeFile("./final.csv", content);
}

processLineByLine();