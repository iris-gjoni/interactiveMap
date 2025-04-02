// Initialize the map, centered on the UK
var map = L.map('map').setView([55, -3], 5);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Define styles for regions and shapes
var defaultStyle = {
    fillColor: 'transparent',
    fillOpacity: 0,
    color: 'black',
    weight: 1
};

var selectedStyle = {
    fillColor: 'blue',
    fillOpacity: 0.5,
    color: 'red',
    weight: 2
};

// Initialize a Set to track selected boundaries
var selectedBoundaries = new Set();

// Create a map from boundary names to their layers
var boundaryLayers = {};

// Load GeoJSON data for UK regions
fetch('/static/National_Character_Areas_England.geojson')
    .then(response => response.json())
    .then(data => {
        var geojsonLayer = L.geoJSON(data, {
            style: defaultStyle,  // Initial style for all regions
            onEachFeature: function(feature, layer) {
                var name = feature.properties.JCANAME;
                boundaryLayers[name] = layer;
                layer.selected = false;
                layer.on('click', function() {
                    var isSelected = layer.selected;
                    var action = isSelected ? "deselect" : "select";
                    var confirmMessage = "Do you want to " + action + " " + name + "?";
                    if (confirm(confirmMessage)) {
                        if (isSelected) {
                            layer.setStyle(defaultStyle);
                            layer.selected = false;
                            selectedBoundaries.delete(name);
                        } else {
                            layer.setStyle(selectedStyle);
                            layer.selected = true;
                            selectedBoundaries.add(name);
                        }
                        // Save the selected boundaries to the server
                        fetch('/save_selected_boundaries', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(Array.from(selectedBoundaries))
                        }).then(response => response.json())
                          .then(data => {
                              if (data.status !== 'success') {
                                  console.error('Failed to save selected boundaries');
                              }
                          });
                    }
                });
            }
        }).addTo(map);

        // After loading the GeoJSON, load the selected boundaries from the server
        fetch('/get_selected_boundaries')
            .then(response => response.json())
            .then(selectedNames => {
                selectedNames.forEach(name => {
                    if (boundaryLayers[name]) {
                        boundaryLayers[name].setStyle(selectedStyle);
                        boundaryLayers[name].selected = true;
                        selectedBoundaries.add(name);
                    }
                });
            });
    });

// Create a feature group for user-drawn shapes
var drawnItems = new L.FeatureGroup().addTo(map);

// Add drawing controls
var drawControl = new L.Control.Draw({
    draw: {
        polygon: {
            shapeOptions: selectedStyle  // Style for drawn polygons
        },
        polyline: {
            shapeOptions: selectedStyle  // Style for drawn lines
        },
        rectangle: false,  // Disable unwanted shapes
        circle: false,
        marker: false
    },
    edit: {
        featureGroup: drawnItems  // Allow editing of drawn shapes
    }
}).addTo(map);

// Handle newly drawn shapes
map.on('draw:created', function(e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);  // Add drawn shape to the feature group
});

document.getElementById('show-lists').addEventListener('click', function() {
    // Convert the Set of selected boundaries to an array and join into a comma-separated string
    var selectedArray = Array.from(selectedBoundaries);
    var selectedParam = encodeURIComponent(selectedArray.join(','));
    // Open a new window with the selected boundaries passed as a query parameter
    window.open('/boundaries_list?selected=' + selectedParam, '_blank');
});