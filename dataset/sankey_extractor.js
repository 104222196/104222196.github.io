const fs = require("fs/promises");
const data = require("./data.json");

const countries = {
    "CHN": "China",
    "IND": "India",
    "VNM": "Vietnam",
    "DEU": "Germany",
    "UZB": "Uzbekistan",
    "FRA": "France",
    "USA": "United States of America",
    "SYR": "Syrian Arab Republic",
    "KAZ": "Kazakhstan",
    "KOR": "Republic of Korea",
    "NPL": "Nepal",
    "BRA": "Brazil",
    "UKR": "Ukraine",
    "NGA": "Nigeria",
    "SAU": "Saudi Arabia",
}

const numberOfCountriesPerSource = 10;

const destinations = []

Object.keys(countries).forEach(key => {
    const origin = countries[key];
    const destinationCountries = data[key]["destination"];

    let tmp = [];
    
    Object
        .keys(destinationCountries)
        .forEach(destination => tmp.push([origin, destination, destinationCountries[destination]]));

    tmp = tmp.filter(e => !isNaN(e[2])).sort((a, b) => b[2] - a[2]).slice(0, numberOfCountriesPerSource);

    destinations.push(...tmp);
})

console.log(destinations);
console.log(destinations.length);

let stringToWrite = "source,destination,students\n";
destinations.forEach(e => stringToWrite += `"${e[0]}","${e[1]}",${e[2]}\n`);

fs.writeFile("./china_outbound.csv", stringToWrite)
    .catch((e) => console.log(e));