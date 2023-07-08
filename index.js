const PORT = 8000
const express = require('express')
const cheerio = require('cheerio')
const axios = require('axios')
// import axios from 'axios';

const app = express()

const url = 'https://www.filmweb.pl/ranking/vod/film'

axios(url)

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
//callback function - if this is working it says on which port the server is running


