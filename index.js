const PORT = 8000
// Packages
const express = require('express')
const cheerio = require('cheerio')
const axios = require('axios')

const app = express()

// Base url of the webpage for scraping
const baseURL = 'https://www.filmweb.pl'

// Url of the 'initial' page HTTP request is sent to
const url = `${baseURL}/ranking/vod/film`

// Array of VOD platforms
const listOfPlatforms = []

// Sending a HTTP request via axios package

axios(url)
    .then(response => {
        // If the promise is resolved -> code of the callback function will be executed

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
                const vodURL = `${baseURL}${vodHref}/2023`

                // Merged URL is pushed to the array of VOD Platforms
                listOfPlatforms.push(vodURL)
            }
        })
        console.log(listOfPlatforms)

        // Sending HTTP requests to individual VOD URL
        const requests = listOfPlatforms.map(vodURL => axios(vodURL))

        // Wait for the first request to be completed, send next requests when the vodPlatforms array is already filled with data
        Promise.all(requests)
            .then(responses => {
                // Final rankings of movies with duplicates removed & sorted by rating in descending order
                const vodPlatforms = {
                    netflix: [],
                    hbo_max: [],
                    canal_plus_manual: [],
                    disney: [],
                }

                responses.forEach(response => {
                    const html = response.data
                    const $ = cheerio.load(html)

                    // Array to store all scraped movies
                    const allMovies = []

                    // Scraping movies from VOD platforms
                    $('.rankingType', html).each(function () {
                        const title = $(this).find('.rankingType__title').text()

                        // String to float conversion (ex.: '8,5' -> '8.5') so they're comparable value
                        const stringRating = $(this)
                            .find('.rankingType__rate--value')
                            .text()
                        const normalizedStringRating = stringRating.replace(',', '.')
                        const rating = parseFloat(normalizedStringRating)

                        allMovies.push({
                            title,
                            rating,
                        })
                    })

                    // Adding movies to the specific VOD platform's ranking
                    const platform = response.config.url
                        .replace(baseURL, '')
                        .replace('/ranking/vod/', '')
                        .replace('/film/2023', '')

                    vodPlatforms[platform] = allMovies
                })

                // Removing duplicates from the specific platform's list
                // Iterate over each platform from vodPlatforms
                for (const platform in vodPlatforms) {
                    // Retrieve the list of movies of the current platform
                    const listOfMovies = vodPlatforms[platform]

                    // Make sure only top 10 movies are kept by removing extra ones
                    listOfMovies.splice(10)

                    // Check if a movie already exists on other platform's list
                    // If yes, only the higher-rated one stays on the list
                    listOfMovies.forEach(movie => {
                        for (const otherPlatform in vodPlatforms) {
                            // Make sure it's a different platform
                            if (otherPlatform !== platform) {
                                // Retrieve the list of movies of the other platform
                                const otherMovies = vodPlatforms[otherPlatform]
                                // Find a movie with a matching title
                                const existingMovie = otherMovies.find(
                                    m => m.title === movie.title
                                )

                                // Compare their ratings
                                if (existingMovie && existingMovie.rating < movie.rating) {
                                    // Remove a movie with lower rating
                                    otherMovies.splice(otherMovies.indexOf(existingMovie), 1)
                                    // Add a movie from the current platform's list with the same title
                                    const replacementMovie = listOfMovies.find(
                                        m => m.title === movie.title
                                    )
                                    if (replacementMovie) {
                                        otherMovies.push(replacementMovie)
                                    }
                                }
                            }
                        }
                    })

                    // Add movies from the same platform if the list has less than 10 movies
                    while (listOfMovies.length < 10) {
                        const remainingMovies = listOfMovies.length - 1 // Number of missing movies
                        const additionalMovies = vodPlatforms[platform].slice(
                            10,
                            10 + remainingMovies
                        )
                        listOfMovies.push(...additionalMovies)

                        // Exit the loop if there's no more additional movies available
                        if (additionalMovies.length === 0) {
                            break
                        }
                    }

                    // Limit the list to less than 10 if necessary
                    if (listOfMovies.length > 10) {
                        listOfMovies.splice(10)
                    }

                    // Sorting the list of movies in descending order
                    listOfMovies.sort((a, b) => b.rating - a.rating)
                }

                console.log(vodPlatforms)
            }).catch(err => console.log(err))
    }).catch(err => console.log(err)) //if the promise is rejected -> callback function is executed with the error information

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
//callback function - if this is working it says on which port the server is running