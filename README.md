# web-scraper-NodeJS

## Description
The Web Scraper of FilmWeb Movie Rankings is a Node.js application that scrapes movie data from the FilmWeb website and saves the results in a CSV file. Application retrieves information about the TOP 10 movies of the current year from four different VOD platforms, such as **Netflix**, **HBO Max**, **Canal+ Online** and **Disney+**.

## Getting Started

### Requirements

- Node.js
- npm

### Installation

1. Clone the repository:
```
$ git clone https://github.com/paulinaszywala/web-scraper-NodeJS.git
```
2. Navigate to the project directory:
```
$ cd web-scraper-NodeJS
```
3. Install the dependencies:
```
$ npm install
```
### Executing program
Start the application using this command:
```
$ npm run start
```
The application will make an HTTP request to retrieve the movie data from FilmWeb. Scraped movie data will be saved to a CSV file named **'web-scraper-results.csv'**. Once it's completed, a message informing the user that the data has been successfully written to the CSV file will be logged.


### Testing
To run unit tests for the application, use the following command:
```
npm test
```
The tests cover following scenarios:
- checking if the initial page HTTP request is made with the correct URL.
- veryfing if the CSV writer is created with the correct configuration.
- handling errors during the scraping process.

 tests.js file path: `__tests__/tests.js `

 ### Dependencies
 The following dependencies are used in the application:
 - **express**
 - **cheerio**
 - **axios**
 - **csv-writer**

### Acknowledgments
Inspiration, code snippets:
- https://stackoverflow.com/
- https://www.youtube.com/
- https://www.w3schools.com/
