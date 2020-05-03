
// Variables
var cityLat = 0;
var cityLon = 0;
var cityName = ''; 
var countryCode = '';
var tempInK = 0;
var humidity = 0;
var windSpeed = 0;
var uvIndex = 0;
var iconName = '';
var iconURL= 'https://openweathermap.org/img/wn/';
var weatherIcon = '';
var weatherInfoRequestPrefix = 'https://api.openweathermap.org/data/2.5/';
var fiveDayRequestPrefix = 'https://api.openweathermap.org/data/2.5/forecast?q=';
var uviQuery = 'uvi?'
// apiKey = 58f9fc500cc28eb571f882b8b44c222b
const apiKey = "&appid=" + config.OW_API_KEY;
var searchHistory = {};

  // Clears localStorage
$(document).ready(() => {
  renderSearchHistory();
})

const renderSearchHistory = () => {
  var searchHx = JSON.parse(localStorage.getItem('searchHistory'));
  if(searchHx) {
    arrayLength = searchHx.length;
    for(var i = 0; i < arrayLength; ++i) {
      $(`#row${i}`).html(`<td><button class="recent btn btn-link p-0 text-muted">${searchHx[i].searchString}</button></td>`);
    }
  }
}

$( "table" ).on( "click", "button.recent", function() {
  event.preventDefault();
  getWeatherInformation($(this).text());
});

var initializeLocalStorage = (() => {
  localStorage.setItem('searchHistory', '[]');
});

$('#city-search').click(() => {
  event.preventDefault();
  var citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
  getWeatherInformation(citySearchString);
})

$('input').keypress(event => {
  if (event.which == 13) {
    event.preventDefault();
    var citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
    getWeatherInformation(citySearchString);
  }
})

var getWeatherInformation = (citySearchString => {
  var cityQuery = 'weather?q=' + citySearchString;
  $.ajax({
    url: weatherInfoRequestPrefix + cityQuery + apiKey,
    method: "GET",
    error: (err => {
      alert("Please enter a City Name")
      return;
    })
  })
  .then((response) => {
    cityLat = response.coord.lat;
    cityLon = response.coord.lon;
    cityName = response.name;
    countryCode = response.sys.country;
    tempInK = response.main.temp;
    humidity = response.main.humidity;
    windSpeed = response.wind.speed;
    iconName = response.weather[0].icon;
  })
  .then(() => {
    return $.ajax({
      url: weatherInfoRequestPrefix + uviQuery + apiKey + '&lat=' + cityLat + '&lon=' + cityLon,
      method: "GET"
    })
    .then(response => {
      uvIndex = response.value;
    })
    .then(() => {
      showValuesOnPage();
    })
  })

  $.ajax({
    url: fiveDayRequestPrefix + citySearchString + apiKey,
    method: "GET"
  })
  .then(response => {
    return setFiveDayData(response);
  })
})

var validatedSearchString = (city => {
  var search = city.split(',');
  if(search.length > 1){
    var first = search[0].length;
    var second = search[1].length;
    if(first === 0 || second === 0) {
      return first > second ? search[0] : search[1];
    }
    return search[0] + ',' + search[1];
  } else {
    return city;
  }
})

var dateString = (unixTime => {
  return moment(unixTime).format('MM/DD/YYYY');
})

var showValuesOnPage = (() => {
  var searchString = cityName + ', ' + countryCode;
  $('#city-name').text(searchString + ' (' + dateString(Date.now()) + ')');
  addToSearchHistory(searchString, Date.now());
  renderSearchHistory();
  $('#weather-icon').attr('src', iconURL + iconName + '.png')
  $('#temp-data').text('Temperature: ' + 
    (tempInK - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
    ((tempInK - 273.15) * 9/5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
  $('#hum-data').text('Humidity: ' + humidity + '%');
  $('#wind-data').text('Wind Speed: ' + windSpeed + ' MPH');
  $('#uvi-data').text('UV Index: ' + uvIndex);
});

var setFiveDayData = (response => {
  var dataArray = response.list;
  var size = dataArray.length;
  var dayNumber = 1;
  for(var i = 0; i < size; i+=8) {
    $(`#five-day-${dayNumber}`).find('h6').text(dateString(dataArray[i].dt * 1000));
    $(`#five-day-${dayNumber}`).find('.weather-icon').attr('src', iconURL + dataArray[i].weather[0].icon + '.png');
    $(`#five-day-${dayNumber}`).find('.temp-5').text('Temperature: ' + 
      (dataArray[i].main.temp - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
      ((dataArray[i].main.temp - 273.15) * 9/5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
    $(`#five-day-${dayNumber}`).find('.hum-5').text('Humidity: ' + dataArray[i].main.humidity + '%');
    ++ dayNumber;
  }
})

// Conversion from object to array
var saveToLocalStorage = (searchHx => {
  return localStorage.setItem('searchHistory', JSON.stringify(searchHx));
});

const addToSearchHistory = (searchString, timeStamp) => {
  var obj = {
    "searchString": searchString,
    "timeStamp": timeStamp
  }
  var searchHx = JSON.parse(localStorage.getItem('searchHistory'));
  if(!searchHx) {
    searchHx = [];
  }

  var len = searchHx.length;
  var inArray = false;
  for(var i = 0; i < len; ++i) {
    if(searchHx[i].searchString === obj.searchString) {
      searchHx[i].timeStamp = obj.timeStamp;
      inArray = true;
    }
  }

  if(inArray === false) {
    searchHx.push(obj);
  }

  searchHx.sort((b, a) => {
    return a.timeStamp - b.timeStamp;
  });

  while(searchHx.length > 10) {
    var popResult = searchHx.pop();
  }

  saveToLocalStorage(searchHx);
}
