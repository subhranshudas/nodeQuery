const https = require('https');
const apiBaseUrl = `https://jsonmock.hackerrank.com/api/movies/search/Title?=`;

function httpRequestWrapper(url) {
    return new Promise(function(resolve, reject) { // this is where we promisify
        var req = https.request(url, function(res) {
            // reject on bad status
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            // cumulate data
            var body = [];
            res.on('data', function(chunk) {
                body.push(chunk);
            });
            // resolve on end
            res.on('end', function() {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch(e) {
                    reject(e); // this is where we kinda return our HTTP call result but only on 'end'
                }
                resolve(body); // this is where we kinda return our HTTP call result but only on 'end'
            });
        });
        // reject on request error
        req.on('error', function(err) {
            // This is not a "Second reject", just a different sort of failure
            console.log('something went wrong: \n', err);
            reject(err);
        });
        // IMPORTANT
        req.end();
    });
}

async function promiseAll (promises) {
    return Promise.all(promises)
        .then(results => results)
        .catch(error => {
            console.log('something went wrong in promiseAll: ', error);
        });
}

async function getMovies (query) {
    const moviesApiUrl = `${apiBaseUrl}${query}`;
    return httpRequestWrapper(moviesApiUrl)
        .then(movies => movies);
}

async function getAllMovies (moviesPages) {
    let allMovies = await promiseAll(moviesPages);
    return allMovies
            .map(({data}) => data)
            .reduce((prevList, currList) => {
                return [...prevList, ...currList]
            }, [])
            .map(({Title}) => Title);
}


async function getMoviesTitles (query) {
    let movies = await getMovies(query);
    const totalPages = movies.total_pages;
        
    let moviesPages = [...new Array(totalPages)].map((noop, index) => {
        const moviesPageApiUrl = `${apiBaseUrl}${query}&page=${index + 1}`;
        return httpRequestWrapper(moviesPageApiUrl);
    });

    let moviesList = await getAllMovies(moviesPages)

    return moviesList
       .filter(title => title.toLowerCase().indexOf(query.toLowerCase()) !== -1);
}

getMoviesTitles('spiderman')
    .then(titles => {
        console.log('printing the results: \n\n', titles);
    });


