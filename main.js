// initialize width and height
var width = Math.max(960, window.innerWidth),
height = Math.max(500, window.innerHeight);

// initialize pi and tau for later computation.
var pi = Math.PI;
tau = 2 * pi;


// initialize projection centered at [0,0]
var projection = d3.geoMercator()
    .scale(1 / tau)
    .translate([0, 0]);

// initialize geopath to generate path, and set its projection attributed to the projection setting
var path = d3.geoPath()
    .projection(projection);

// initialize tile size from width to height
var tile = d3.tile() 
    .size([width, height]);

// enable zoom and set paramaters
// use .on to listen for zoom.
var zoom = d3.zoom()
    .scaleExtent([
        1 << 11,
        1 << 24
    ])
    .on('zoom', zoomed);

//set circle selection of 0 to 10.
var radius = d3.scaleSqrt().range([0, 10]);

// initialize svg
var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

//initialize raster and vector
var raster = svg.append('g');
var vector = svg.selectAll('path');

// load data
d3.json('data/earthquakes_4326_cali.geojson', function(error, geojson) {
    if (error) throw error; //if error throw fit

    // set domain of radius
    radius.domain([0, d3.max(geojson.features, function(d) { return d.properties.mag; })]);

    //set radius for magnitude.
    path.pointRadius(function(d) {
        return radius(d.properties.mag);
    });


    // bind data
    vector = vector.data(geojson.features)
                    .enter().append('path')
                    .attr('d', path)
                    .on('mouseover', function(d) { console.log(d); });

    //set projection to CA center estimate
    var center = projection([-119.66, 37.414])

    //establish zoom operations
    svg.call(zoom)
        .call(
            zoom.transform,
            d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(1 << 14)
                .translate(-center[0], -center[1])
        );
});


function zoomed() { //On zoomed
    var transform = d3.event.transform;
    //apply transform
    var tiles = tile
        .scale(transform.k)
        .translate([transform.x, transform.y])
        (); //use tiles


    // update scale
    projection
        .scale(transform.k / tau)
        .translate([transform.x, transform.y]);

    // draw each vector
    vector.attr('d', path);

    // update elements
    var image = raster
        .attr('transform', stringify(tiles.scale, tiles.translate))
        .selectAll('image')
        .data(tiles, function(d) { return d; });

    // remove old elements
    image.exit().remove();

    // load images from map
    image.enter().append('image')
        .attr('xlink:href', function(d) {
            return 'http://' + 'abc'[d[1] % 3] + '.basemaps.cartocdn.com/rastertiles/voyager/' +
                d[2] + "/" + d[0] + "/" + d[1] + ".png";
        })
        .attr('x', function(d) { return d[0] * 256; })
        .attr('y', function(d) { return d[1] * 256; })
        .attr('width', 256)
        .attr('height', 256);
}

// turn scale into string.
function stringify(scale, translate) {
    var k = scale / 256, //initialize k
        r = scale % 1 ? Number : Math.round; //initialize r.

        //set translation string.
    return `translate(${r(translate[0] * scale)}, ${r(translate[1] * scale)}) scale(${k})`;
}
