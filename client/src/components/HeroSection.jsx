import React from 'react'
import { assets } from '../assets/assets'
import {CalendarIcon, ClockIcon, ArrowRight} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import timeFormat from '../lib/timeFormat'
const HeroSection = () => {
    const navigate = useNavigate();
    const {shows, image_base_url}= useAppContext();
    console.log(shows);
    const show = shows.filter(a=>a._id === import.meta.env.VITE_FRONT_POSTER_ID)
    let showInfo;
    let genres ='';
    if(show.length > 0 ){
        showInfo = show[0];
        showInfo.genres.forEach(element => {
           genres = genres+ element.name +' | '
        });
    }
    
  return (
    <div className='flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen' style={{backgroundImage: showInfo ? `url(${image_base_url}${showInfo.backdrop_path
})` : 'none'}}>
        {/* <img src = {image_base_url + showInfo.poster_path} alt="" className='max-h-11 lg:h-11 mt-20'/> */}
        <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold max-w-110'>{showInfo ? showInfo.title : ''}</h1>
        <div className='flex item-center gap-4 text-gray-300'>
            <span>{genres}</span>
            <div className='flex item-center gap-1'>
                <CalendarIcon className = 'w-4.5 h-4.5'/> {showInfo? showInfo.release_date: ''}
            </div>
            <div className='flex item-center gap-1'>
                <ClockIcon className = 'w-4.5 h-4.5'/> {showInfo ? timeFormat(showInfo.runtime): ''}
            </div>
        </div>
        <p className='max-w-md text-gray-300'>{showInfo  ? showInfo.tagline : ''}</p>
        <button onClick= {()=>navigate('/movies')} className='flex item-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
            Explore Movies
            <ArrowRight className= 'w-5 h-5'/>
        </button>
    </div>
  )
}

export default HeroSection