import axios from 'axios';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';


//API to get now playing movies from TMDB API
export const getNowPlayingMovies = async(req, res) =>{
    try {
        const now = new Date();
        const dateAfter14days = new Date(now.getTime() + 14*24*60*60*1000);
        const dateBefore14days = new Date(now.getTime() - 14*24*60*60*1000);
        const {data} = await axios.get(`https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&primary_release_date.gte=${dateBefore14days.toISOString().split('T')[0]}&primary_release_date.lte=${dateAfter14days.toISOString().split('T')[0]}&sort_by=popularity.desc&with_original_language=hi`, {
            headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`}
        });

        const movies = data.results;
        if (movies.length === 0) {

        }
        res.json({success: true, movies: movies});
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})

    }
}

//API to add new show to database

export const addShow = async (req, res) =>{
    try {
        const {movieId, showsInput, showPrice} = req.body;
        let movie = await Movie.findById(movieId);
        if(!movie){
            //Fetch movie  details and credits from TMBD API
            const [movieDetailsRes, movieCreditsRes] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`}
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                    headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`}
                })
            ]);
            const movieApiData = movieDetailsRes.data;
            const movieCreditsData = movieCreditsRes.data;
            const movieDetails = {
                _id: movieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path: movieApiData.backdrop_path,
                genres: movieApiData.genres,
                casts: movieCreditsData.cast,
                release_date: movieApiData.release_date,
                original_language: movieApiData.original_language,
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime
            }
            //Add movie to database
            movie = await Movie.create(movieDetails);
        }
        const showsToCreate = [];
        showsInput.forEach(show => {
            const date = show.date;
            show.time.forEach(time => {
                showsToCreate.push({
                    movie: movieId,
                    showDateTime: new Date(`${date}T${time}`),
                    showPrice,
                    occupiedSeats: {}
                });
            });
        })

        if (showsToCreate.length > 0) {
          await Show.insertMany(showsToCreate);
        }
        res.json({success: true, message: 'Shows added successfully'});
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

//API to get all shows from database

export const getShows = async (req, res) =>{
    try {
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({showDateTime: 1});

        // Filter unique movies
        const uniqueMovies = new Set (shows.map(show => show.movie));
        res.json({success: true, shows: Array.from(uniqueMovies)});
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }

}

// API to get single show from the database

export const getShow = async (req, res) =>{
    try {
        const {movieId} = req.params;
        const shows = await Show.find({movie: movieId, showDateTime: {$gte: new Date()}});
        const movie = await Movie.findById(movieId);
        const dateTime = {};
        shows.forEach(show => {
            const date = show.showDateTime.toISOString().split('T')[0];
            if(!dateTime[date]){
                dateTime[date] = [];
            }
            dateTime[date].push({
                showId: show._id,
                time: show.showDateTime
        });
        res.json({success: true, movie, dateTime});
    });
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }

}
