# Weather Data for Web Maps 
##### *Part 1: Using Mapbox and Open source tools to map atmospheric water* 
By [Damon Burgett](https://www.mapbox.com/about/team/#damon-burgett), Geographer, Mapbox and Jeff Chen, Chief Data Scientist, US Department of Commerce.

*As part of the [Commerce Data Usability Project](https://www.commerce.gov/datausability/),  Mapbox in collaboration with the [Commerce Data Service](https://www.commerce.gov/dataservice/) has created a two part tutorial that will guide you though processing and visualizating precipitable water data from NOAA.  If you have question, feel free to reach out to the Commerce Data Service at data@doc.gov or Mapbox at help@mapbox.com.*


#### Atmospheric Rivers (AR) are narrow regions in the atmosphere that that transport water across the world.

Like waterways on the ground, ARs are wide ranging in size, with the ability to hold vast amounts of water. The effects of these rivers suspended in the air may be beneficial or detrimental. When ARs slow and stall, vulnerable areas are at risk of heavy, damaging rainfalls and floods. Alternatively, the more common, weaker ARs bring much needed rain to resupply water reserves.

How do we know when moisture is moving our way? Among the many meteorological indicators that are collected and modeled by the National Oceanic + Atmospheric Administration (NOAA) is Precipitable Water (Pwat), which is the amount of water that can be extracted from the entire overlying atmosphere over a particular location on the surface of the Earth. Pwat is typically measured in inches, millimeters or kg/m^2^. It is a key measure of the available “fuel” for the storms in the atmosphere and an estimate for how much rain or snow could be produced from those storms. Thus, when Pwat values are high, the atmosphere is laden with moisture and has the potential to create storms with large amounts of precipitation whereas low values indicate the atmosphere is relatively dry and it is unlikely to produce significant amounts of rainfall or snowfall.

![image](https://cloud.githubusercontent.com/assets/5084513/12313587/ac86d808-ba1d-11e5-9405-e1597f9db8a6.png)

Beyond its utility, I find Pwat to be a very striking weather variable. The complex swirling and eddying patterns bring alive atmospheric processes, and are a beautiful liquid analog to the more esoteric variable that they describe. Combining these data with reference information - coastlines, political borders, and terrain - helps to paint a clearer picture of earth surface and atmospheric interactions on our planet.

It’s helpful to keep in mind that Pwat alone does not indicate to what extent certain atmospheric processes, such as thunderstorms, will be able to extract the water from the atmosphere, but it is a measure of the potential for such precipitation through those processes. Nonetheless, it’s a critical measure collected by satellite instruments and used for producing NOAA’s weather forecasts.

## Getting Started

This tutorial is the first in a two part series that will guide you through the steps to visualize [NOAA NOMADS](http://nomads.ncep.noaa.gov) data. Part 1 covers processing and visualization of Pwat data from the [0.25 degree Global Forecast System (GFS)](http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl). As atmospheric rivers are dynamic, Part 2 will discuss how to produce a video-based animated map of this data that enables discovery of complex temporal patterns.

To get started quickly, the code for this tutorial can be found at the following [Github repo]([INSERT LINK]) ([INSERT LINK]).

### Step 1: Preliminaries


#### Libraries and Utilities
We'll be using the following tools to wrangle the weather model output files:

   - **[GDAL](http://www.gdal.org/)**: Translator library for raster and vector geospatial data formats;
   - **[rasterio](https://github.com/mapbox/rasterio)**: Clean and fast and geospatial raster I/O for Python programmers who use Numpy;
   - **[gribdoctor](https://github.com/mapbox/grib-doctor)**: Utilities for handling quirks of General Regularly-distributed Information in Binary form (grib) files in GIS applications. Grib data is a concise data format commonly used in meteorology to store historical and forecast weather data which can looked at using software applications.
   - **[Mapbox Studio](https://www.mapbox.com/mapbox-studio/)**: A map design platform for vector-based web maps.

You should be able to find install instructions for all of these on their respective web pages.

### Step 2: Get the data

The [NOAA NOMADS](http://nomads.ncep.noaa.gov) website provides access to a myriad array of weather prediction data. We'll be working with precipitable water (PWAT) data from the [0.25 degree Global Forecast System (GFS)](http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl). There is a lot of data in the system, so we'll guide you through how to find the URL that will enable you to download the right data.

As can be seen in this file list on the NOMADS site, there are multiple prediction times for each dataset corresponding to when the model has run, each of which allows access to a number of variables for a large number of atmospheric levels at various intervals from when the model has run. To start, let's select the first file in the list.

![image](https://github.com/CommerceDataService/tutorial_mapbox_part1/blob/master/img/screencap1.png?raw=true)

For each file, a wizard page allows users to select the appropriate conditions. We'll need to check off 'PWAT' in the section labeled 'Select the variables desired', the subregion as well as the handy checkbox at the bottom that creates a URL for "web programming" - we'll be using a URL constructed from this.


![image](https://github.com/CommerceDataService/tutorial_mapbox_part1/blob/master/img/screencap2.png?raw=true)

For precipitable water (PWAT) at all levels, we have the following url - note that the url will change with the date, so make sure to construct your own:

```
http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t12z.pgrb2.0p25.f000&all_lev=on&var_PWAT=on&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&dir=%2Fgfs.2016011212
```

Let's download this file to our working directory as "raw.grib2" using `wget`. Alternatively, you can directly download from the NOMADS web interface.

```
wget http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t12z.pgrb2.0p25.f000&all_lev=on&var_PWAT=on&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&dir=%2Fgfs.2016011212 -O raw.grib2
```

You should now have a one band `grib2` depicting PWAT for the date and time that you selected. Open this in a desktop GIS system such as [QGIS](http://www.qgis.org/) and you should see the following:
![image](https://cloud.githubusercontent.com/assets/5084513/12276750/5fc8b3ca-b92c-11e5-8332-9460e5655074.png)

### Part 3: Geoprocessing

#### Converting to global grib using `gribdoctor`

A quirk of these grib files are their extent: a global, equirectangular raster with an origin of -(cellsize / 2), all the way around the world, crossing the antimeridian, to 360 - (cellsize / 2). To more easily process the gribs, we created [gribdoctor](https://github.com/mapbox/grib-doctor) - a project that is still under development - which (a) upsamples the data by a factor of 2, (b) splits at the antimeridian, and (c) splices the data onto the other side to make a -180 to 180 extent dataset. This is crucial to be able to work with the Mapbox stack. Here is the command:

```
gribdoctor smoosh -dev -uw <input>.grib2 <output>.tif
```

- `gribdoctor smoosh` is the command + subcommand used to perform this operation; 
- `-dev -uw` are input options for `gribdoctor` indicating we want to utilize `-dev` functionality to automatically detect if it is the right spatial reference, and `-uw` to "unwrap" the raster to an -180/180 extent;

For our data:

```
gribdoctor smoosh -dev -uw raw.grib2 unwrap.tif
```
After running `gribdoctor`, you should see a files that looks like the following (open in a GIS or other `GeoTIFF` viewer):

![image](https://cloud.githubusercontent.com/assets/5084513/12286506/6bae416c-b979-11e5-8eeb-31fa137ca8b1.png)

Notice how the extent in the x-dimension is now -180 to 180, which will work in Mapbox web maps.

#### Warp to Web Mercator

Mapbox Studio utilizes the web mercator projection. In order to integrate the PWAT imagery with street and terrain data, we will need to warp our input data into this projection. Here is the command in `parallel`:

```
gdalwarp -t_srs EPSG:3857 -r BILINEAR <input>.tif <output>.tif
```

- `gdalwarp` is the command used; 
- `-t_srs EPSG:3857` is the [EPSG code for web mercator](http://spatialreference.org/ref/sr-org/7483/);
- `-r BILINEAR` specifies to use bilinear resampling in this operation. Because these data are of a continuous nature, we want to use this method. The default, nearest neighbor, will leave artifacts in the output data.

Running on our data:

```
gdalwarp -t_srs EPSG:3857 -r BILINEAR unwrap.tif mercator.tif
```
We should see the input data projected to the web mercator projection:

![image](https://cloud.githubusercontent.com/assets/5084513/12313499/cd5c8de4-ba1c-11e5-8ddc-dc884dd94291.png)

#### Colorize PWAT

Right now, our tif contains cell values that correspond to units of precipitable water units (kg/m^2^). In order to utilize this on a web map, we need to convert these values into color values (RGB). We'll do this using a tool designed for creating [hypsometric tints](https://en.wikipedia.org/wiki/Hypsometric_tints), [`gdaldem color-relief`](http://www.gdal.org/gdaldem.html). This tool takes a color ramp file that maps input data values to red, green, and blue color values. Here's the ramp that I used:

```
10.0 47 31 45
18.0 63 48 68
26.0 76 68 94
34.0 85 90 120
42.0 90 113 146
50.0 91 137 171
58.0 87 163 194
66.0 79 189 214
74.0 70 216 231
82.0 64 244 244
```

The first column is the data (PWAT) value, and the second, third, and fourth are the red, green, and blue values that this should be mapped to. Anything in-between is interpolated. You can generate your own color ramp - I like http://tristen.ca/hcl-picker/#/hlc/6/1/21313E/EFEE69 (you'll have to convert from color hex code) or http://colorbrewer2.org/.

Save this ramp to a text file `color-ramp.txt`. Here is the command:

```
gdaldem color-relief <input>.tif <color ramp>.txt <output>.tif
```

Running on our data:

```
gdaldem color-relief mercator.tif color-ramp.txt color.tif
```

Now, you should have a color `tif` of your input data:

![image](https://cloud.githubusercontent.com/assets/5084513/12313587/ac86d808-ba1d-11e5-9405-e1597f9db8a6.png)

### Part 4: Upload and incorporate into a Map

We'll be using [Mapbox Studio](https://www.mapbox.com/mapbox-studio/) to upload and integrate our colorized PWAT data with basemap data. If at any point you become lost, refer back to the ["Getting Started with Mapbox Studio" Guide](https://www.mapbox.com/help/getting-started-mapbox-studio-1/). You'll need to make an account to use Studio.

#### Upload the colorized PWAT tif

We need to upload our colorized PWAT data to a Mapbox Studio dataset in order to integrate it into a style. In the data tab, click the "New dataset" button to upload - detailed instructions here: https://www.mapbox.com/help/getting-started-mapbox-studio-1/#upload-a-dataset

![image](https://cloud.githubusercontent.com/assets/5084513/12629107/2dd80f7a-c4fb-11e5-94d4-f1106b8fbf78.png)

#### Integrate into a map style

After the upload is finished processing we can add this dataset to a style. For the color scheme I chose above, the "dark" template is a good starting point. In the Styles tab, click "New style", and select the Dark template:

![image](https://cloud.githubusercontent.com/assets/5084513/12629165/7d13d696-c4fb-11e5-8576-f8eeb5dbb295.png)

Detailed instructions here: https://www.mapbox.com/help/getting-started-mapbox-studio-1/#create-a-new-style

Now, let's add our dataset to this new style. Click on Add new layer, --> Select a dataset, then navigate to and click on your uploaded data.

![image](https://cloud.githubusercontent.com/assets/5084513/12629362/720815a4-c4fc-11e5-8649-f28c060239f3.png)

Clicking "Create" layer will then add this dataset as the top layer in your style. It should be added as the uppermost layer.

#### Stylize the map

This is the fun part! Let's first move this layer below labels, borders, but above water, terrain and landcover. Click and drag to the desired position. You'll now see labels, borders, and other features as you zoom into the map.

Now, let's make this layer slightly transparent and allow the water areas to slightly show through. Click on the layer, then change the opacity to ~ 0.5. You can also slightly bump the brightness to help the layer pop.

![image](https://cloud.githubusercontent.com/assets/5084513/12630131/c61ca2ba-c4ff-11e5-9671-45bffd80d0e2.png)

If you are satisfied with your style, you are done! Click publish, and your map is ready to be shared. Alternatively, keep tweaking the style - every element in the map from labels, to landcover, to the terrain style can be manipulated.

#### Sharing your map

From the Home tab of Mapbox Studio, click on your published map.

![image](https://cloud.githubusercontent.com/assets/5084513/12630295/a4940858-c500-11e5-8461-de7d118e54f3.png)

To share, copy the share link in the bottom left of the page. Here's a live map: https://api.mapbox.com/styles/v1/dnomadb/cijqefqgn005h90lxxe5dygmn.html?title=true&access_token=pk.eyJ1IjoiZG5vbWFkYiIsImEiOiJEak5aTXdZIn0.UtQIRl-MzHHZk6TIAHSWww#1.22/21.6/23.5

In part one of this tutorial, we’ve taken a raw grib2 file from the NOAA NOMADS site, and transformed the data into a striking map showing atmospheric rivers across the world. The basics in opening, manipulating, and using the data can be applied broadly across potential applications.  Stay tuned for Part 2 of the tutorial where we’ll manipulate this data into an animated, interactive map. For a preview, check out: https://www.mapbox.com/blog/animated-atmospheric-water/ 