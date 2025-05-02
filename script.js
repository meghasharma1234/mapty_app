'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const resetButton = document.querySelector('.reset');

class Workout {
    date;
    id;
    coords;
    constructor(distance, duration, type){
        this.distance = distance
        this.duration = duration
        this.date = new Date();
        this.type = type;
        this.id = new Date(this.date).getTime().toString().slice(3)
    }

    // get id(){
    //     return this.#id;
    // }

    set description(desc){
        this.desc = desc;
    }

    get description(){
        if (this.desc){
            return this.desc
        }
        return this.type.slice(0,1).toUpperCase() + this.type.slice(1) + " on " + months[new Date(this.date).getMonth()] + " " + new Date(this.date).getDate();
    }

}

class Running extends Workout {
    constructor(distance, duration, cadence){
        super(distance, duration, "running")
        this.cadence = cadence;
    }
}

class Cycling extends Workout {
    constructor(distance, duration, elevGain){
        super(distance, duration, "cycling")
        this.elevGain = elevGain;
    }

}

const validate = function(...params) {
    params.forEach((param)=>{
        if (!param || typeof(param)!=="number") return false
    })
    return true
}

let map;

const App = class {
    workouts = [];

    constructor(){
        navigator.geolocation.getCurrentPosition(this.getPosSuccess.bind(this), function(){
            console.log("Sorry some error occured")
        });
        
        form.addEventListener('submit', this.createWorkoutFromForm.bind(this));
        inputType.addEventListener('change', function(e){
            inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
            inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
        })
        containerWorkouts.addEventListener('click', this._onListClick.bind(this));
        resetButton.addEventListener('click', this.resetApp)
    }

    resetApp = function(){
        localStorage.removeItem('workouts');
        location.reload();
    }

    _renderItemsFromStorage = function(e) {
        this.workouts = [];
        let storageWorkouts = localStorage.getItem('workouts');
        console.log("storageWorkouts = ", storageWorkouts)
        storageWorkouts!=="undefined" && JSON.parse(storageWorkouts).forEach((item)=>{
            this.workouts.push(Object.assign(new Workout(), item));
        })
        this.workouts.forEach((workout)=>this.addWorkoutUI(workout))
    }

    _onListClick = function(e){
        if (!form.classList.contains('hidden')) return;
        let clickedId = e.target.closest('.workout').dataset.id;
        const selectedWorkout = this.workouts.find((workout) => {
            console.log(workout.id, clickedId)
            return workout.id === clickedId
        })
        map.setView(selectedWorkout.coords, 13, {animation: true})
    }

    _renderMarker = function(workout){
        L.marker(workout.coords).addTo(map)
            .bindPopup(L.popup({
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            }).setContent(`${workout.description}`))
            .openPopup();
    }

    _clearForm = function(){
        inputDistance.value = '';
        inputDuration.value = '';
        inputCadence.value = '';
        inputElevation.value = '';
    }

    _hideForm = function(){
        form.classList.add('hidden')
    }

    _addWorkoutToListUI = function(workout){
        let workoutType = workout.type;
        const html = `<li class="workout workout--${workoutType}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workoutType === "running" ? "🏃‍♂️" : "🚴🏻"}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
          </div>
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workoutType==="running"? workout.pace : workout.speed}</span>
            <span class="workout__unit">${workoutType==="running"? "min/km" : "km/min"}</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workoutType==="running"? workout.cadence : workout.elevGain}</span>
            <span class="workout__unit">${workoutType==="running"? "spm" : "mpm"}</span>
          </div>
        </li>`
        form.insertAdjacentHTML('afterend', html)
    }

    _brieflyHideForm = function(){
        form.style.display = "none";
        setTimeout(()=>{
            form.style.display = 'grid';
        }, 1000)
    }

    addWorkoutUI = function(workout){
        this.workouts.push(workout);
        this._addWorkoutToListUI(workout);
        this._renderMarker(workout);
    }

    createWorkoutFromForm = function(e) {
        // console.log(e)
        e.preventDefault()

        this._brieflyHideForm()
        const distance = +inputDistance.value
        const duration = +inputDuration.value
        const workoutType = inputType.value
        let workout;
        
        if (workoutType === "running"){
            const cadence = +inputCadence.value
            if (!validate(distance, duration, cadence)) throw new Error("validation failed, check your inputs");
            workout = new Running(distance, duration, cadence)
            workout.pace = (duration/distance).toFixed(1);
        } else {
            const elevation = +inputElevation.value
            if (!validate(distance, duration, elevation)) throw new Error("validation failed, check your inputs");
            workout = new Cycling(distance, duration, elevation)
            workout.speed = (distance/duration).toFixed(1);
        }
        workout.coords = this.coords;
        this.addWorkoutUI(workout)
        this._clearForm();
        this._hideForm();
        console.log("going to set workouts = ", this.workouts)
        localStorage.setItem('workouts', JSON.stringify(this.workouts))
    }

    onMapClick = (e) => {
        const {lat, lng} = e.latlng;
        const coords = [lat, lng]
        this.coords = coords;
        form.classList.remove('hidden');
        inputDistance.focus()
    }

    getPosSuccess = function (e) {
        let {latitude, longitude} = e.coords;
        map = L.map('map').setView([latitude, longitude], 13);
    
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        map.on('click', this.onMapClick);
        this._renderItemsFromStorage()
    } 

}

const app = new App()
