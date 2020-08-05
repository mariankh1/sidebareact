//Make the video element draggagle:
const DRONE_1 = 1;
const DRONE_2 = 2;
var videoFrame = document.getElementById("mydiv");

if (videoFrame)
{
    dragElement(videoFrame);
}

mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VvcmdlMjMyMyIsImEiOiJja2MwZmxjbGYxajF4MnJsZ2pzbjhjdHc2In0.znh7LExrIEsKBB7SWYJ3hg';
const {MapboxLayer, PointCloudLayer, LineLayer} = deck;

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    pitch: 60,
    zoom: 17.5,
    center: [ 33.4151176797,35.1452954125]
    // center: [51.51, -0.11]
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

/*/Shows the coordinates of the mouse pointer
map.on('mousemove', function(e) {
    document.getElementById('sidebarStyle').innerHTML =
        "Longitude: " + e.lngLat.lat.toFixed(8) + '<br />' +
        "Latitude: " + e.lngLat.lng.toFixed(8) + '<br />' +
        "Zoom: " + map.getZoom().toFixed(2)
});
*/
var popup = new mapboxgl.Popup({closeOnClick: false})
    .setLngLat([33.4151176797, 35.1452954125])
    .setHTML('<h3>Drone Test</h3>')
    .addTo(map)
    .remove(); //TODO: Right now tooltip is removed. Remember to re-display it by removing this line

var el = document.createElement('div');
el.className = 'marker';

var marker = new mapboxgl
    .Marker(el)
    .setLngLat([33.4151176797, 35.1452954125])
    .addTo(map)

//Layer that displays the whole trajectory of the drone with circles in 2D
var wholeTripCircleLayer =
    {
        id: 'wholeTripCircleLayer',
        type: 'circle',
        source: {
            type: 'geojson',
            data: './pythonLocUpdate_Script\\aidersDatasetTestRTK.geojson'
        },
        paint: {
            'circle-radius': {
                'base': 1.75,
                'stops': [
                    [12, 2], // make circles larger as the user zooms from z12 to z22
                    [22, 180]
                ]
            },
            'circle-color': '#2DC4B2',
            // 'circle-color':
            // [
            // 'interpolate',
            // ['linear'],
            // ['number', ['get', 'batttery']],
            // 73, '#2DC4B2', //Apply this colour if casualty is "0" and so on..
            // 82, '#3BB3C3',
            // 84, '#669EC4',
            // 87, '#8B88B6',
            // 93, '#A2719B'
            // ],
            'circle-opacity': 0.14
        },

    }

//following url contains only one feature which is updated every ~100ms
// var url = 'http://localhost:63340/Drone_Live/pythonLocUpdate_Script/aiders.geojson'; //Works as well
var drone1URL = 'pythonLocUpdate_Script/aiders.geojson';
var drone2URL = 'pythonLocUpdate_Script/aiders2.geojson';

//This object is required to display the yellow trail of the drone
var droneTrailObject =
    {
        "name": "NewFeatureType",
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry":
                    {
                        "type": "LineString",
                        "coordinates": []
                    },
                "properties": {}
            }
        ]
    };

//Data needed to show the 2D trail of the drone
var twoDtrailLayerData =
    {
        "id": "trailLayerStyle",
        "type": "line",
        "source": "trajectory",
        "paint":
            {
                "line-color": "yellow",
                "line-opacity": 0.75,
                "line-width": 5
            }
    };

//Mapbox layer that adds height to the buildings
var threeDlayer =
    {
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#827f7f',
            'fill-extrusion-height': ["get", "height"]
        }
    };


//Point cloud layer that is taken from deck gl and is in json format. Still not correctly displayed
var pointCloudLayer = new MapboxLayer(
    {
        id: 'deckgl-PointCloudLayer',
        type: PointCloudLayer,
        data: 'models\\ballPointCloud.json',
        getPosition: d => d.position,
        getColor: d => d.color,
        sizeUnits: 'meters',
        pointSize: 0.75,
        opacity: 1
    }
);

var scatterPlotData = [];

//3D scatter plot layer from Deck GL to show the trail of the drone in 3D
const scatterPlotLayer = new MapboxLayer({
    id: 'my-scatterplot',
    type: ScatterplotLayer,
    data: [],
    getPosition: d => d.position,
    getRadius: d => d.size,
    getColor: d => d.color
});

var duckInitialPosition = [ 33.4151176797,35.1452954125];
var destination, line;
var duck;

//3D layer model that visualizes a duck
var duckLayer =
    {
        id: 'duck_layer',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, mbxContext) {

            window.tb = new Threebox(
                map,
                mbxContext,
                { defaultLights: true }
            );

            var options = {
                obj: 'https://s3-eu-west-1.amazonaws.com/fetchcfd/original/file-1592658408798.glb',
                type: 'gltf',
               scale: 40,
                units: 'meters',
                rotation: { x: 90, y: 0, z: 0 } //default rotation
            }

            tb.loadObj(options, function (model) {
                duck = model.setCoords(duckInitialPosition);
                tb.add(duck);
            })


        },
        render: function (gl, matrix) {
            tb.update();
        }
    };

var soldierInitialPosition = [ 33.4151176797,35.1452954125]

//3D layer model that visualizes a soldier
var soldierLayer =
    {
        id: 'soldier_layer',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, mbxContext) {

            window.tb = new Threebox(
                map,
                mbxContext,
                { defaultLights: true }
            );

            var options = {
                obj: 'https://s3-eu-west-1.amazonaws.com/fetchcfd/original/file-1592658408798.glb',
                type: 'gltf',
                scale: 40,
                units: 'meters',
                rotation: { x: 90, y: 0, z: 0 } //default rotation
            }

            tb.loadObj(options, function (model) {
                soldier = model.setCoords(soldierInitialPosition);
                tb.add(soldier);
            })


        },
        render: function (gl, matrix) {
            tb.update();
        }
    };

/*3D layer that shows the trajectory of the drone in the form of line*/
const drone1LineLayer = new MapboxLayer({
    id: 'drone1Line',
    type: LineLayer,
    data: [],
    fp64: false,
    widthScale: 5,
    getWidth: 90,
    opacity: 0.1,
    widthUnit: 'meters',
    strokeWidth: 6,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.dest,
    getColor: d => d.color
});
const drone2LineLayer = new MapboxLayer({
    id: 'drone2Line',
    type: LineLayer,
    data: [],
    fp64: false,
    widthScale: 2,
    getWidth: 10,
    opacity: 0.8,
    widthUnit: 'meters',
    strokeWidth: 6,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.dest,
    getColor: d => d.color
});


var blue = 0.0, red = 0.0, green = 0.0;

var drone1 =
    {
        currentCoordinate: undefined,
        previousCoordinate: undefined,
        currentBatteryLevel: undefined
    };
var drone2 =
    {
        currentCoordinate: undefined,
        previousCoordinate: undefined,
        currentBatteryLevel: undefined
    };
map.on('style.load', function ()
{
    var i = 0;
    var updateInterval = 100; //milliseconds
    var droneTimer = setInterval(droneUpdate, updateInterval)

    var drone1LineData = [];
    var drone2LineData = [];
    function droneUpdate()
    {

        //GET DATA FROM DRONE 1
        $.getJSON(drone1URL, function (geojson)
        {
            if (drone1.currentCoordinate!= null)
            {
                drone1.previousCoordinate = drone1.currentCoordinate;
            }
            drone1.currentCoordinate = geojson.geometry.coordinates;

            var currentBatteryLevel = geojson.properties.batttery
            var currentFeature = geojson;

            var currentScatterLayerData =
                {
                    position: drone1.currentCoordinate,
                    size: 5,
                    color: getColor(currentBatteryLevel, red, green, blue)
                };

            var currentLineLayerData =
                {
                    source: drone1.previousCoordinate,
                    dest: drone1.currentCoordinate,
                    // color: getColor(currentBatteryLevel,red,green, blue)
                    color: [23, 184, 190]
                };

            drone1LineData =  updateLineLayer(currentLineLayerData, i, drone1LineData, DRONE_1)
            updateScatterPlotLayer(currentScatterLayerData);
            updateTooltip(currentBatteryLevel)

            map.getSource('trajectory').setData(droneTrailObject);
            popup.setLngLat(drone1.currentCoordinate);
            marker.setLngLat(drone1.currentCoordinate);
            soldier.setCoords([drone1.currentCoordinate[0], drone1.currentCoordinate[1], drone1.currentCoordinate[2]]);

            if (i === 100) //Random point to stop
            {
                clearMap(twoDtrailLayerData, marker, droneTimer, wholeTripCircleLayer)
            }
            i++;
        });


        // GET DATA FROM DRONE 2
        $.getJSON(drone2URL, function (geojson)
        {
            if (drone2.currentCoordinate!= null)
            {
                drone2.previousCoordinate = drone2.currentCoordinate;
            }
                drone2.currentCoordinate = geojson.geometry.coordinates;

                var currentLineDataDrone2 =
                    {
                        source: [drone2.previousCoordinate[0], drone2.previousCoordinate[1] + 0.002, drone2.previousCoordinate[2]],
                        dest: [drone2.currentCoordinate[0], drone2.currentCoordinate[1] + 0.002, drone2.currentCoordinate[2]],
                        // color: getColor(currentBatteryLevel,red,green, blue)
                        color: [23, 184, 190]
                    };

                drone2.currentCoordinate = geojson.geometry.coordinates;
                duck.setCoords([drone2.currentCoordinate[0], drone2.currentCoordinate[1] + 0.002, drone2.currentCoordinate[2]])

                drone2LineData = updateLineLayer(currentLineDataDrone2, i, drone2LineData, DRONE_2);
                console.log(drone2LineData)
        });

    }

    map.addSource('trajectory', {type: 'geojson', data: droneTrailObject}); //Just to show the trajectory in 2D
    map.addLayer(twoDtrailLayerData);
    map.addLayer(wholeTripCircleLayer)
    map.addLayer(threeDlayer, 'waterway-label')
    map.addLayer(soldierLayer);
    map.addLayer(drone1LineLayer);
    map.addLayer(drone2LineLayer);
    // map.addLayer(pointCloudLayer, 'waterway-label')
    // map.addLayer(scatterPlotLayer, 'waterway-label');
    // map.addLayer(antena3Dmodel, 'waterway-label');
    map.addLayer(duckLayer);
});

/* Clears all the layers from the map*/
function clearMap(droneTrailLayer, marker, droneTimer, wholeTripCircleLayer)
{
    clearInterval(droneTimer)
    map.removeLayer(droneTrailLayer.id)
    map.removeLayer(wholeTripCircleLayer.id)
}

/* Makes the video element draggable */
function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        /* if present, the header is where you move the DIV from:*/
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        /* otherwise, move the DIV from anywhere inside the DIV:*/
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

/*Updates the Scatter Plot Layer*/
function updateScatterPlotLayer(currentScatterLayerData)
{
    scatterPlotData = scatterPlotData.concat(currentScatterLayerData)
    scatterPlotLayer.setProps(
        {
            data: scatterPlotData
        }
    );
}

/*Updates lineLayer Data*/
function updateLineLayer(currentLineLayerData, iteration, droneData, whichDrone)
{
    if (iteration > 0)
    {
        if (whichDrone === DRONE_1)
        {
            droneData = droneData.concat(currentLineLayerData)
            drone1LineLayer.setProps(
                {
                    data: droneData
                }
            );
        }
        else if (whichDrone === DRONE_2)
        {
            droneData = droneData.concat(currentLineLayerData)
            drone2LineLayer.setProps(
                {
                    data: droneData
                }
            );
        }
    }

    return droneData;
}

/*Updates the text on the tooltip based on the battery level*/
function updateTooltip(currentBatteryLevel)
{
    if (currentBatteryLevel > 80)
    {
        popup.setHTML('<h2>Drone Testing</h2><h3 style="color: #228e05">Battery over 80!</h3>');
    }
    else
    {
        popup.setHTML('<h2>Drone Testing</h2><h3 style="color: red">Battery under 80!</h3>');
    }
}

/*Returns a color based on the drone's current battery level*/
function getColor(currentBatteryLevel, red,blue,green)
{
    var scaledValue = currentBatteryLevel / 100;
    if(scaledValue <= 0.5)
    {
        red = (scaledValue * 2) * 255.0;
        green = 255.0;
        blue = 0;
    }else
    {
        red = 255.0;
        green = 255.0 + 255.0 - ((scaledValue  * 2)* 255);
        blue = 0;
    }
    return [red, green, blue]
}