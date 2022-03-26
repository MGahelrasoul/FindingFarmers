const addressSearch = document.getElementById('address-search')
let inputAddress, map, geocoder
let loop = 0
let latLng = { lat: 38.907, lng: -77.0369 }
let markersArr = [], infoArr = []

addressSearch.addEventListener('keyup', event => {
    inputAddress = event.target.value
})
addressSearch.addEventListener('keydown', event => {
    if(event.keyCode === 13) { // Needs to be changed to event.code - look into IE browser compatibility
        searchLocation(inputAddress)
    }
})


function initMap() {
    geocoder = new google.maps.Geocoder()
    map = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(latLng),
        zoom: 10,
        disableDefaultUI: true
    })
    geoLocator()
}

function searchLocation(inputAddress) {
    geocoder.geocode({'address': inputAddress}, (results, status) => {
        if (status == 'OK') {
            latLng = {
                lat: results[0].geometry.viewport.ab.i, //Variable name changed from Za to ab
                lng: results[0].geometry.viewport.Va.i
            }
            loop = 0
            map.setCenter(latLng);
            getResults(latLng.lat, latLng.lng)
        } else if (status == 'OVER_QUERY_LIMIT') {
            console.log(status + ' - will attempt again shortly')
            setTimeout(() => {
                searchLocation(inputAddress)
            }, 5500)
        } else {
            console.log('Geocode was not successful for the following reason: ' + status)
        }
    })
}

function geoLocator() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            latLng = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(latLng);
            var marker = new google.maps.Marker({
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#3992ff",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2
                  },
                position: new google.maps.LatLng(latLng)
            })

            getResults(latLng.lat, latLng.lng)
        }, function() {
            console.log("Error: The Geolocation service failed.")
            getResults(latLng.lat, latLng.lng)
        });
    } else {
        // Browser doesn't support Geolocation
        console.log("Error: Your browser doesn't support geolocation.")
        getResults(latLng.lat, latLng.lng)
    }
}

function getResults(lat, lng) {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        // submit a get request to the restful service zipSearch or locSearch.
        // url: "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + zip,
        url: "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + lat + "&lng=" + lng,
        dataType: 'jsonp',
        success: function(data) {
            removeMarkers()
            searchResultsHandler(data)
        }
    })
}
function getDetails(id, name) {
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        // submit a get request to the restful service mktDetail.
        url: "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + id,
        dataType: 'jsonp',
        success: function(data) {
            detailResultHandler(data, name)
        }
    });
}

function searchResultsHandler(searchResults) {
    setTimeout(() => {
        //Remove numbers and .s' from default market name
        var finalName = searchResults.results[loop].marketname.replace(/\d+/g, "")
        finalName = finalName.replace(".", "")

        getDetails(searchResults.results[loop].id, finalName)
        if (++loop < searchResults.results.length) {
                searchResultsHandler(searchResults);
        }
    }, 100)
}
function detailResultHandler(detailResults, name) {
    geocoder.geocode({"address": detailResults.marketdetails.Address}, (results, status) => {
        if (status == "OK") {
            //Create marker and add to markers Array
            var marker = new google.maps.Marker({
                map: map,
                animation: google.maps.Animation.BOUNCE,
                position: results[0].geometry.location
            })
            markersArr.push(marker)
            // Stop bounce animation after .5s
            setTimeout(() => {
                marker.setAnimation(null);
            }, 500)

            //Create info window and add to info Array
            var infowindow = new google.maps.InfoWindow({
                content: name + `<br/>` + detailResults.marketdetails.Address
            });
            infoArr.push(infowindow)

            //add listeners
            marker.addListener('mouseover', () => {
                infowindow.open(map, marker);
            });
	        marker.addListener('click', () => {
                for (let i = 0; i < infoArr.length; i++) {
                    infoArr[i].close()
                }
                infowindow.open(map, marker);
            });

            marker.addListener('mouseout', () => {
                infowindow.close(map, marker);
            });

        } else if (status == "OVER_QUERY_LIMIT") {
            console.log(status)
            setTimeout(() => {
                detailResultHandler(detailResults, name)
            }, 500)
        } else {
            console.log('Geocode was not successful for the following reason: ' + status);
        }
    })
}

function removeMarkers() {
    // Remove markers
    for (let i = 0; i < markersArr.length; i++) {
        markersArr[i].setMap(null)
    }
    markersArr = []
    // Remove info cards
    for (let i = 0; i < infoArr.length; i++) {
        infoArr[i] = null
    }
    infoArr = []
}
