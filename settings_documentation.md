types and uses of osmly.settings properties

### title (required)
- string
- very basic description of what needs to be done
- eg. 'Outline the park', 'Locate the library'

### justMap
- bool
- prevents any UI from loading, probably only useful on the osmly index
- default: `false`

### featuresApi (required)
- string
- the url to the root feature server
    - db, id, action queries get appended as needed
- probably going to simplify and include as part of 'db'
- eg. `'http://127.0.0.1:5000/?'`

### db (required)
- string
- simply the db name on the feature server
- gets appended to featuresApi for making various requests
- eg. `'parks-5'`

### writeApi
- string
- the OSM API endpoint to use
- http://wiki.openstreetmap.org/wiki/API_v0.6
- default: `'http://api06.dev.openstreetmap.org'`
    - dev server

### oauth_secret
- string
- oauth_secret registered on OSM
- default: `'Mon0UoBHaO3qvfgwWrMkf4QAPM0O4lITd3JRK4ff'`
    - just my test application on the dev server

### consumerKey
- string
- consumerKey registered on OSM with oauth_secret
- default: `'yx996mtweTxLsaxWNc96R7vpfZHKQdoI9hzJRFwg'`
    - just my test application on the dev server

### readApi
- string
- the server endpoint from which to read OSM data
- http://wiki.openstreetmap.org/wiki/Xapi#Implementations
- also compatible with the regular OSM API
    - 'http://api.openstreetmap.org/api/0.6/map?'
- default: `'http://www.overpass-api.de/api/xapi?map?'`

### context (required)
- object
- keys and values to items that provide relevant context to the features being edited
- for example: if schools are being edited, a context of other schools should be included. `{amenity: ['school']}`
but other key/values should also be included for items that are often near schools that might be mistaken or be nearby schools. Things like colleges, universities, libraries, parks. It depends, go nuts.
    - our final object might look something like this:
    ```
    {
        amenity: ['school', 'library', 'college', 'university'],
        leisure: ['park']
    }
    ```
- default: `{}`
    - everything, which is overwhelming, don't do it

### div
- string
- the div to put the map on
- default: `'map'`

### origin
- array
- coordinates to center the map on load
- default: `[0,0]`

### zoom
- integer
- zoom level for the map on load
- default: `2`

### demo
- bool
- allows anyone to see what editing on osmly is like without logging in
- no significant requests go through, nothing can be uploaded, marked as done, edited in JOSM, etc...
- basically read-only
- default: `false`

### changesetTags
- object
- tags to use for changesets
- will probably add an additional tag to track particular imports
    - eg. 'osmly:import': 'la-parks'
- default: `{'created_by': 'osmly', 'osmly:version': '0', 'imagery_used': 'Bing'}`

### renameProperty
- object
- renames a property from the original data to a usable key for OSM
- eg. `{wackyCompany_internal_id_awesome_ftw: 'XYZimport:id'}`

### usePropertyAsTag (required)
- array
- properties in the original data to use as tags which get uploaded to OSM
    - anything not specified will be ignored
- this assumes you have all tags named correctly
    - for quick fixes/adjustments use renameProperty
    - for serious changes you should fix your source data in something like QGIS
- eg. `['name', 'leisure', 'source']`

### appendTag
- object
- tag to add to every object uploaded
- useful for a 'source' tag or something like it which must be applied to everything
- or if you're data is already of a common type and just missing the necessary OSM tag
    - for example: you have just parks for a particular county but no leisure=park tag, this can add it to everything
- eg. `{leisure: 'park', source: 'TIGER 2027'}`

### featureStyle
- object
- how to feature is styled on the map when being edited
- maps directly to leaflet, full options here: http://leafletjs.com/reference.html#path-options
- default:
        ```{
            color: '#00FF00',
            weight: 3,
            opacity: 1,
            clickable: false
        }```

### contextStyle
- object
- how features from OSM (as defined in the 'context' setting) are styled along side the feature
- maps directly to leaflet, full options here: http://leafletjs.com/reference.html#path-options
- default:
        ```{
            color: '#FFFF00',
            fillOpacity: 0.3,
            weight: 3,
            opacity: 1
        }```