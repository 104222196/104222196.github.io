const fs = require('fs');
const fsProm = require("fs/promises")
const csv = require("csv-parse");
const stream = require('stream/promises');

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
	lines.shift();
	// Header row

	// Fill in the blank fields based on the values of the fields above.
	let previousLine = [];
	
	lines.forEach(line => {
		if (line[0] === "") line[0] = previousLine[0];
		if (line[1] === "") line[1] = previousLine[1];
		previousLine = line;
	});

	// Write to file
	let content = "source,destination,time,students\n";

	lines.forEach(
		line => content += `"${line[0]}","${line[1]}",${line[2]},${line[3]}\n`
	);

	fsProm.writeFile("./raw_filled.csv", content);
}

processLineByLine();