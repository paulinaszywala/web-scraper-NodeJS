const axios = require('axios')
const scrapedMovies = require('../app.js')
const { createObjectCsvWriter } = require('csv-writer')

jest.mock('axios')
jest.mock('csv-writer')

describe('scrapedMovies', () => {

    beforeEach(() => {
        axios.mockReset()
    })

    test('should make initial page HTTP request with the correct URL', async () => {
        // Mocking the Axios HTTP request in order to simulate a successful server response
        axios.mockResolvedValueOnce({ data: '<html lang="pl"><h1>Najlepsze filmy online</h1></html>' })

        // Calling the scrapedMovies function
        await scrapedMovies()

        // Asserting that the initial page HTTP request was made with the URL we expect
        expect(axios).toHaveBeenCalledWith('https://www.filmweb.pl/ranking/vod/film')
    })


    test('should create CSV writer with the correct configuration', async () => {
        // Mocking the HTTP request for the initial page
        const initialPageResponse = {
            data: '<html lang="pl"><h1>Najlepsze filmy online</h1></html>',
        }

        // Mocking response data for the VOD platforms
        const vodPlatformResponses = [
            { data: '<html lang="pl"><h1>Najlepsze filmy online dostępne na Netflix</h1></html>' },      // Response for Netflix
            { data: '<html lang="pl"><h1>Najlepsze filmy online dostępne na HBO MAX</h1></html>' },      // Response for HBO Max
            { data: '<html lang="pl"><h1>Najlepsze filmy online dostępne na Canal+</h1></html>' },       // Response for Canal+
            { data: '<html lang="pl"><h1>Najlepsze filmy online dostępne na Disney+</h1></html>' },      // Response for Disney+
        ]

        // Mocking axios HTTP requests
        axios.mockResolvedValueOnce(initialPageResponse)
        vodPlatformResponses.forEach(response => {
            axios.mockResolvedValue(response)
        })

        // Mocking CSV writer instance and the implementation of the writeRecords method
        const csvWriterMock = {
            writeRecords: jest.fn().mockResolvedValueOnce(),
        }
        createObjectCsvWriter.mockReturnValue(csvWriterMock)

        // Calling the scrapedMovies function
        await scrapedMovies()

        // Asserting that the CSV writer was created with the configuration we expect
        expect(createObjectCsvWriter).toHaveBeenCalledWith({
            path: 'web-scraper-results.csv',
            header: [
                { id: 'title', title: 'Title' },
                { id: 'platform', title: 'VOD service name' },
                { id: 'rating', title: 'Rating' },
            ],
        })
    })


    test('should handle errors', async () => {
        // Mocking the HTTP request to throw an error
        axios.mockRejectedValueOnce(new Error('HTTP request error'))

        // Mocking console.log function to redirect the output to mock function
        const consoleLogMock = jest.fn()
        global.console.log = consoleLogMock

        // Calling the scrapedMovies function
        await scrapedMovies()

        // Asserting that the expected error was logged
        expect(consoleLogMock).toHaveBeenCalledWith('An error occurred: ', expect.any(Error))
    })

})
