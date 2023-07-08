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
const vodPlatforms = []

// Sending a HTTP request via axios package
axios(url)
    .then(response => {     // If the promise is resolved -> code of the callback function will be executed

        // Saving received response as an HTML
        const html = response.data
        // Passing through the HTML with cheerios package
        const $ = cheerio.load(html)

        // Scraping VOD platforms - only those containing Netflix, HBO Max, Canal+ Online or Disney+ in their titles
       $('.rankingProvider__item', html).each(function () {

           const vodTitle = $(this).find('a').attr('title')

           if(vodTitle &&
              vodTitle.includes("Netflix") ||
              vodTitle.includes("HBO Max") ||
              vodTitle.includes("Canal+ Online") ||
              vodTitle.includes("Disney+")
           )
           {
               const vodHref = $(this).find('a').attr('href')
               const vodURL = `${baseURL}${vodHref}`
               // Merged URL is pushed to the array of VOD Platforms
               vodPlatforms.push(vodURL)
           }
       })
        console.log(vodPlatforms)

    // Sending HTTP requests to individual VOD URL
    const requests = vodPlatforms.map(vodURL => axios(vodURL))

    // Wait for the first request to be completed, send next requests when the vodPlatforms array is already filled with data
    Promise.all(requests)
        .then(responses => {

         responses.forEach(response => {

                const html = response.data
                const $ = cheerio.load(html)

                // Array of movies
                const movies = []

                // Scraping movies from VOD platforms
                $('.rankingType', html).each(function () {
                    if (movies.length >= 10) {
                        // Exit the loop after collecting all 10 movies
                        return false
                    }
                    const title = $(this).find('.rankingType__title').text()
                    const rating = $(this).find('.rankingType__rate--value').text()

                    movies.push({
                        title,
                        rating
                    })
                })

                console.log(movies)
            })
            })
        .catch(err => console.log(err))
    }).catch(err => console.log(err))    //if the promise is rejected -> callback function is executed with the error information


app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
//callback function - if this is working it says on which port the server is running


