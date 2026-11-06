// Start with Toronto and keep the sound off.
let cityMenu = document.querySelector("#city");
let video = document.querySelector("#weather-video");
let audio = document.querySelector("#ambience");
let soundBtn = document.querySelector("#sound");
let lastScene = "";
let soundOn = false;
let videoPaused = false;
audio.volume = 0.35;

// Only change the video file when the weather scene changes.
function changeScene(scene) {
  document.querySelector("#window-message").style.display = "none";
  if (scene !== lastScene) {
    lastScene = scene;
    video.src = "video/" + scene + ".mp4";
    if (!videoPaused) {
      video.play();
    }
    audio.pause();

    if (scene === "sunny") {
      audio.src = "audio/birds.mp3";
    } else if (scene === "light-rain" || scene === "moderate-rain" || scene === "heavy-rain") {
      audio.src = "audio/rain.mp3";
    }
  }
  updateSound();
}

function updateSound() {
  if (soundOn && (lastScene === "sunny" || lastScene === "light-rain" || lastScene === "moderate-rain" || lastScene === "heavy-rain")) {
    audio.play();
  } else {
    audio.pause();
  }
}

async function getWeather() {
  document.querySelector("#status").textContent = "Fetching weather for your city…";

  // Same API, different coordinates for each city.
  let city = cityMenu.value;
  let cityName = "Toronto";
  let latitude = 43.65;
  let longitude = -79.38;
  if (city === "vancouver") {
    cityName = "Vancouver";
    latitude = 49.28;
    longitude = -123.12;
  }
  else if (city === "montreal") {
    cityName = "Montreal";
    latitude = 45.50;
    longitude = -73.57;
  }
  else if (city === "beijing") {
    cityName = "Beijing";
    latitude = 39.90;
    longitude = 116.41;
  }
  else if (city === "shanghai") {
    cityName = "Shanghai";
    latitude = 31.23;
    longitude = 121.47;
  }
  else if (city === "london") {
    cityName = "London";
    latitude = 51.51;
    longitude = -0.13;
  }
  else if (city === "paris") {
    cityName = "Paris";
    latitude = 48.86;
    longitude = 2.35;
  }
  else if (city === "tokyo") {
    cityName = "Tokyo";
    latitude = 35.68;
    longitude = 139.69;
  }

  let weatherURL = "https://api.open-meteo.com/v1/forecast?latitude=" + latitude
    + "&longitude=" + longitude
    + "&current=temperature_2m,precipitation,weather_code,wind_speed_10m,is_day&timezone=auto";

  try {
    // Fetch the weather, then read the JSON.
    const response = await fetch(weatherURL);
    if (!response.ok) {
      throw new Error("Request failed. Status: " + response.status);
    }
    const data = await response.json();

    if (city !== cityMenu.value) {

      return;

    }
    let temperature = data.current.temperature_2m;
    let rain = data.current.precipitation;
    let wind = data.current.wind_speed_10m;
    let code = data.current.weather_code;

    // Pick a clip using the weather code.
    let scene = "overcast";
    let weatherName = "Overcast";

    if (code === 0) {

      scene = "sunny";

      weatherName = "Sunny";

    }
    else if (code === 1 || code === 2) {
      scene = "cloudy";
      weatherName = "Partly cloudy";
    }
    else if (code === 3) {
      scene = "overcast";
      weatherName = "Overcast";
    }
    else if (code === 45 || code === 48) {
      weatherName = "Fog · overcast scene";
    }
    else if (code === 51 || code === 53 || code === 55 || code === 61 || code === 80) {
      scene = "light-rain";
      weatherName = "Light rain";
    } else if (code === 63 || code === 81) {
      scene = "moderate-rain";
      weatherName = "Moderate rain";
    } else if (code === 65 || code === 82) {
      scene = "heavy-rain";
      weatherName = "Heavy rain";
    } else if (code === 56 || code === 57 || code === 66 || code === 67) {
      scene = "light-rain";
      weatherName = "Freezing rain · rain scene";
    } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      weatherName = "Snow · overcast scene";
    } else if (code >= 95) {
      scene = "heavy-rain";
      weatherName = "Thunderstorm · heavy-rain scene";
    }
    if (data.current.is_day === 0) {
      weatherName = weatherName + " · Night";
    }

    // Use the city’s day/night value to change the wall.
    if (data.current.is_day === 0) {
      document.body.className = scene + " night";
    } else {
      document.body.className = scene + " day";
    }

    // The height comes from the temperature, like the class API example.
    // Shift the scale so temperatures below zero still have a positive height.
    let barHeight = (temperature + 20) * 1.5;
    if (barHeight < 0) { barHeight = 0; }
    if (barHeight > 90) { barHeight = 90; }
    document.querySelector("#temperature-bar").style.height = barHeight + "px";

    // Show the numbers on the page.
    document.querySelector("#temperature").textContent = temperature;
    document.querySelector("#rain").textContent = rain;
    document.querySelector("#weather-name").textContent = weatherName;
    document.querySelector("#place").textContent = cityName;
    document.querySelector("#status").textContent = "";

    // Arrays hold the suggestions. A for loop puts each item on the page.
    let activities = ["Take a gentle walk in the park.", "Try some easy outdoor stretching.", "Enjoy a short bike ride."];
    if (rain > 0 || code >= 51 || wind >= 30 || temperature < 0 || temperature >= 30) {
      activities = ["Try gentle indoor stretching.", "Do a short yoga session at home.", "Enjoy a little dancing indoors."];
    } else if (code === 45 || code === 48) {
      activities = ["Try indoor yoga.", "Stretch gently at home.", "Take a walk inside a nearby recreation centre."];
    } else if (temperature < 10 || data.current.is_day === 0) {
      activities = ["Take a short walk on a well-lit route.", "Warm up with some gentle indoor stretches.", "Try a short indoor dance session."];
    }

    document.querySelector("#exercise").innerHTML = "";
    for (let i = 0; i < activities.length; i++) {
      document.querySelector("#exercise").innerHTML += "<li>" + activities[i] + "</li>";
    }
    changeScene(scene);
  } catch (error) {
    if (city !== cityMenu.value) {

      return;

    }
    console.error("Error:", error);
    document.querySelector("#exercise").innerHTML = "<li>Try gentle indoor stretching while weather data is unavailable.</li>";
    document.querySelector("#temperature-bar").style.height = "0px";
    document.body.className = "day";

    document.querySelector("#weather-name").textContent = "Weather unavailable";
    document.querySelector("#place").textContent = cityName;
    document.querySelector("#temperature").textContent = "—";
    document.querySelector("#rain").textContent = "—";
    document.querySelector("#status").textContent = "Error: " + error.message + ". Please select another city or try again later.";
    video.pause();
    audio.pause();
    lastScene = "";

    document.querySelector("#window-message").style.display = "flex";
    document.querySelector("#window-message").textContent = "Weather unavailable. Please try another city.";
  }
}

// The controls below are just normal button functions.
function toggleSound() {
  if (soundOn) {
    soundOn = false;
    soundBtn.textContent = "♫ Sound on";
  } else {
    soundOn = true;
    soundBtn.textContent = "♫ Sound off";
  }
  updateSound();
}
soundBtn.addEventListener("click", toggleSound);

// Keep the volume between 0 and 1.
let volume = 0.35;
function volumeDown() {
  volume -= 0.1;
  if (volume < 0) {
    volume = 0;
  }
  audio.volume = volume;
}
function volumeUp() {
  volume += 0.1;
  if (volume > 1) {
    volume = 1;
  }
  audio.volume = volume;
}
document.querySelector("#volume-down").addEventListener("click", volumeDown);
document.querySelector("#volume-up").addEventListener("click", volumeUp);
function toggleVideo() {
  if (videoPaused) {
    video.play();
    videoPaused = false;
    document.querySelector("#pause").textContent = "Pause video";
  } else {
    video.pause();
    videoPaused = true;
    document.querySelector("#pause").textContent = "Play video";
  }
}
document.querySelector("#pause").addEventListener("click", toggleVideo);

// Get new weather when a different city is chosen.
cityMenu.addEventListener("change", getWeather);

getWeather();
