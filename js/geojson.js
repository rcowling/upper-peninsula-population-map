/* Map of GeoJSON data for Lab 1 */

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('mapid', {
        center: [46.237889, -87.323389],
        zoom: 8        
    });

    //add OSM base tilelayer
    var OpenTopoMap = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
    
    map.addControl(new customControl());
    
    //create a pane so that the markers show up above the county boundaries
    map.createPane('markers');
    map.getPane('markers').style.zIndex = 650;
    
    //call getData function    
    getData(map);     
    getBoundary(map);
    
                    
};    
    
    
// build an attributes array from the data ** pop must be changed to new data field values
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Pop") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function createPopup(properties, attribute, layer, radius){
    //add city to popup content string
    var popupContent = "<p><b>County:</b> " + properties.County + "</p>";

    //add formatted attribute to panel content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Population in " + year + ":</b> " + properties[attribute] + " million</p>";

    //replace the layer popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius)
    });
};

function Popup(properties, attribute, layer, radius){
    this.properties = properties;
    this.attribute = attribute;
    this.layer = layer;
    this.year = attribute.split("_")[1];
    this.population = this.properties[attribute];
    this.content = "<p><b>County:</b> " + this.properties.County + "</p><p><b>Population in " + this.year + ":</b> " + this.population + " million</p>";

    this.bindToLayer = function(){
        this.layer.bindPopup(this.content, {
            offset: new L.Point(0,-radius)
        });
    };
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
      var attribute = attributes[0];
    
    console.log(attribute);

    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        pane: 'markers'
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    //create new popup
    var popup = new Popup(feature.properties, attribute, layer, options.radius);
    
    //change the content
    popup.content;

    //add popup to circle marker
    popup.bindToLayer();


    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = .025;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;
            
           
 
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            
            //create a new popup
            var popup = new Popup(props, attribute, layer, radius);
            
            //change the content
            popup.content;

            //add popup to circle marker
            popup.bindToLayer();             
           
        };
        });
             //update the legend
            updateLegend(map, attribute);
    };


//Create new sequence controls
function createSequenceControls(map, attributes){
       var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

             //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');
            
             //add skip buttons
            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');
            
             //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });
            
            return container;
        }
       });
           map.addControl(new SequenceControl()); 
    //create range input element (slider)
    //$('#panel').append('<input class="range-slider" type="range">');
   //create buttons for the slider
    //$('#panel').append('<button class="skip" id="reverse">Reverse</button>');
    //$('#panel').append('<button class="skip" id="forward">Skip</button>');
    //replace button content with images
    $('#reverse').html('<img src="img/reverse.png">');
    $('#forward').html('<img src="img/forward.png">');
    
    //Step 5: click listener for buttons
    $('.skip').click(function(){
         //get the old index value
        var index = $('.range-slider').val();

        //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 10 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 10 : index;
        };
        
        //update slider
        $('.range-slider').val(index);
          
        updatePropSymbols(map, attributes[index]);
     
    });
    
    
    //input listener for slider
    $('.range-slider').on('input', function(){
        var index = $(this).val();
        updatePropSymbols(map, attributes[index]);
    });
    
    //set slider attributes
    $('.range-slider').attr({
        max: 10,
        min: 0,
        value: 0,
        step: 1
    });   
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

//Update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[1];
    var content = "Population in " + year;

    //replace legend content
    $('#temporal-legend').html(content);
    
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
    
    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //assign the cy and r attributes
        $('#'+key).attr({
            cy: 59 - radius,
            r: radius
        });
        
         //Step 4: add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100);
    };
};

//Example 2.7 line 1...function to create the legend
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
           // create the control container with a particular class name
           var container = L.DomUtil.create('div', 'legend-control-container');

           //add temporal legend div to container
           $(container).append('<div id="temporal-legend">')

           //Example 3.5 line 15...Step 1: start attribute legend svg string
           var svg = '<svg id="attribute-legend" width="160px" height="60px">';

            var circles = {
            max: 20,
            mean: 40,
            min: 60
        };
            
         //loop to add each circle and text to svg string
        for (var circle in circles){
            //circle string
            svg += '<circle class="legend-circle" id="' + circle + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';

            //text string
            svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
        };
            
          //Step 2: loop to add each circle and text to svg string
          for (var i=0; i<circles.length; i++){
          //circle string
          svg += '<circle class="legend-circle" id="' + circles[i] + 
          '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';
          //text string
          svg += '<text id="' + circles[i] + '-text" x="65" y="60"></text>';      
    };

        //close svg string
        svg += "</svg>";

        //add attribute legend svg to container
        $(container).append(svg);

        return container;
        }
    });

    map.addControl(new LegendControl());

    updateLegend(map, attributes[0]);
};



function getBoundary(map){ 
        //create a new tile layer for the layers panel
        var OpenTopoMap2 = L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	   maxZoom: 17,
	   attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });
    
        //add data for the county boundaries
        var county_boundary = new L.geoJson();
    
               
        //county_boundary.addTo(map);
        
        
        var cities = new L.geoJson();
        cities.addTo(map);
            
        var baseMaps = {
            "Topographic": OpenTopoMap2
        }
    
        var overlayMaps = {
            "County Boundaries": county_boundary
        } 
        
        //add the layer control to the map
        lcontrol = L.control.layers(baseMaps, overlayMaps).addTo(map);
        
        lcontrol.removeLayer(OpenTopoMap2); 
    
        
        
        //get the data for the county boundaries
        $.ajax({
        dataType: "json",
        url: "data/upcounties.geojson",
        success: function(data) {
            $(data.features).each(function(key, data) {
                county_boundary.addData(data);
                county_boundary.setStyle({color: "black", fillOpacity: 0});
            });
        }
        }).error(function() {});
    
        //get data for cities
        $.ajax({
        dataType: "json",
        url: "data/micities.geojson",
        success: function(data) {
            $(data.features).each(function(key, data) {
                cities.addData(data);
            });
        }
        }).error(function() {});
                        
    };

//Function to retrieve the data and place it on the map
//Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/micounties.geojson", {
        dataType: "json",
        success: function(response){
            
            //create an attributes array
            var attributes = processData(response);
            
            //call functions to create proportional symbols and sequence controls
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            createLegend(map, attributes);
                
         
        }
    });


};

//Add a button for a custom control
var customControl =  L.Control.extend({

  options: {
    position: 'topleft'
  },

  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

    container.style.backgroundColor = 'white';     
    container.style.backgroundImage = "url(/img/info2.png)";
    container.style.backgroundSize = "30px 30px";
    container.style.width = '30px';
    container.style.height = '30px';

    
       container.onclick = function(){
        //add a popup info window when the container is clicked        
        var win =  L.control.window(map,{title:'Population Decline in the Upper Peninsula!',maxWidth:400,modal: true})
                .content("The Upper Peninsula has experienced significant population decline, although this has not been true for every county. In some counties of the Upper Peninsula the population has declined more than others. The six westernmost counties having accounted for the largest decrease, from a 1920 population of 153,674 to a population in 2010 of just 82,668. This interactive map explores the Upper Peninsula's changing population from 1910-2010.")
                .show()
    
    }

    return container;
  }
});

$(document).ready(createMap);

        


