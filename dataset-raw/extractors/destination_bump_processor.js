const fs = require('fs');
const fsProm = require("fs/promises")
const csv = require("csv-parse");
const stream = require('stream/promises');

const countriesPerYear = 15;

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
	const header = lines.shift();

	// Merge entries destination and year
	const countries = { };

	lines.forEach(line => {
		const [_, destination, year, students] = line;
		if (countries[destination] === undefined) countries[destination] = { };
		countries[destination][year] ||= 0;
		if (!isNaN(students)) countries[destination][year] += +students;
	});

    const countriesAsRows = Object.entries(countries).flatMap(entry => {
        return Object.entries(entry[1]).map(yearData => [entry[0], yearData[0], yearData[1]])
    });

	// Get top 10 destinations for each source country.
    const years = ["2017", "2018", "2019", "2020", "2021"];
	const resultLines = [];
	years.forEach(year => {
        resultLines.push(...countriesAsRows.filter(row => row[1] == year).sort((a, b) => b[2] - a[2]).slice(0, countriesPerYear));
    })

	// Write to file
	let content = "country,year,students\n";

	resultLines.forEach(
		line => content += `"${line[0]}","${line[1]}",${Math.ceil(line[2])}\n`
	);

	fsProm.writeFile("./top_15_destinations.csv", content);
}

processLineByLine();