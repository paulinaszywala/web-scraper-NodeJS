const PORT = 8000
// Packages
const express = require('express')
const cheerio = require('cheerio')
const axios = require('axios')
const createCsvWriter = require('csv-writer').createObjectCsvWriter

const app = express()

// Base URL of the webpage for scraping
const baseURL = 'https://www.filmweb.pl'

// URL of the 'initial' page HTTP request is sent to
const url = `${baseURL}/ranking/vod/film`

// Array of VOD platforms
const vodPlatformURLs = []

// Actual year
const actualYear = new Date().getFullYear()

const scrapedMovies = async () => {
    try {
        // Sending an HTTP request via axios package
        // scrapedMovies function is waiting for the HTTP request to given url to be completed and for the response from the server
        const response = await axios(url)

        // Saving received response as an HTML
        const html = response.data

        // Passing through the HTML with cheerios package
        const $ = cheerio.load(html)

        // Scraping VOD platforms - only those containing Netflix, HBO Max, Canal+ Online or Disney+ in their titles
        $('.rankingProvider__item', html).each(function () {
            const vodTitle = $(this).find('a').attr('title')

            if (
                (vodTitle && vodTitle.includes('Netflix')) ||
                vodTitle.includes('HBO Max') ||
                vodTitle.includes('Canal+ Online') ||
                vodTitle.includes('Disney+')
            ) {
                const vodHref = $(this).find('a').attr('href')
                const vodURL = `${baseURL}${vodHref}/${actualYear}`

                // Merged URL is pushed to the array of VOD Platforms
                vodPlatformURLs.push(vodURL)
            }
        })

        // Sending HTTP requests to individual VOD URLs
        const requests = vodPlatformURLs.map(vodURL => axios(vodURL))

        // Wait for all requests to be completed, send next requests when the vodPlatformURLs array is already filled with data
        const responses = await Promise.all(requests)

        // Array of all movies scraped
        let allMovies = []

        const allMoviesPromises = responses.map(async response => {
            const html = response.data
            const $ = cheerio.load(html)

            // Scraping movies from VOD platforms
            const movies = $('.rankingType', html)
                .slice(0, 10) // Limit to max. 10 movies per one platform
                .map(function () {
                    const title = $(this).find('.rankingType__title').text()

                    const platform = response.config.url
                        .replace(baseURL, '')
                        .replace('/ranking/vod/', '')
                        .replace(`/film/${actualYear}`, '')

                    // String to float conversion (ex.: '8,5' -> '8.5') so they're comparable value
                    const stringRating = $(this).find('.rankingType__rate--value').text()
                    const normalizedStringRating = stringRating.replace(',', '.')
                    const rating = parseFloat(normalizedStringRating)

                    return {
                        title,
                        platform,
                        rating,
                    }
                })
                .get()

            allMovies = allMovies.concat(movies)
        })

        // Waiting for all movie scraping promises to be completed
        await Promise.all(allMoviesPromises)

        // Merging separate arrays (each for one VOD platform) into one array
        const mergedMovies = [].concat(...allMovies)

        // Removing duplicates from the final list of movies
        // listMovie stores an 'unique' not duplicated movie
        // currentMovie is currently processed movie
        const listOfMovies = mergedMovies.reduce((listMovie, currentMovie) => {
            // Find a movie with a matching title (in order to detect duplicates)
            const i = listMovie.findIndex(m => m.title === currentMovie.title)
            // if the movie is not a duplicate add it to the final list
            if (i === -1) {
                listMovie.push(currentMovie)
            } else {
                // Compare their ratings
                if (currentMovie.rating > listMovie[i].rating) {
                    // Keep the higher rating for this title
                    listMovie[i].rating = currentMovie.rating
                }
            }
            return listMovie // Final list of movies
        }, [])

        // Sorting the list of movies by rating in descending order
        listOfMovies.sort((a, b) => b.rating - a.rating)

        // Saving data to CSV file
        const csvWriter = createCsvWriter({
            path: 'web-scraper-results.csv',
            header: [
                { id: 'title', title: 'Title' },
                { id: 'platform', title: 'VOD service name' },
                { id: 'rating', title: 'Rating' },
            ],
        })

        // Replace the platform names with some display names
        const vodPlatformDisplayNames = {
            netflix: 'Netflix',
            hbo_max: 'HBO MAX',
            canal_plus_manual: 'Canal+',
            disney: 'Disney+',
        }

        const records = listOfMovies.map(movie => ({
            title: movie.title,
            platform: vodPlatformDisplayNames[movie.platform] || movie.platform, // Default name
            rating: movie.rating,
        }))

        // Waiting for CSV file to be filled with records, then logs a message to informing about the success/error
        await csvWriter.writeRecords(records)
        console.log('Data successfully written to CSV file')
    } catch (error) {
        console.log('An error occurred: ', error)
    }
}

//callback function - if this is working it says on which port the server is running
app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`)
    scrapedMovies()
})

module.exports = scrapedMovies