/* jshint multistr:true */
// import is a reserved word but it doesn't apply to properties
osmly.import = (function() {
    var imp = {live: false};

    imp.go = function(){
        if (!imp.live) {
            imp.live = true;
            setInterface();
            bind();
            next();
        } else {
            unbind();
            unsetInterface();
            imp.live = false;
        }
    };

    function bind() {
        // bottom-right buttons
        $('#josm').on('click', josm);
        $('#reset').on('click', reset);
        $('#osmlink').on('click', function(){
            window.open(osmly.osmlink);
        });
        $('#osmtiles').on('click', osmly.map.toggleOSM);
        // botton-left buttons
        $('#skip').on('click', skip);
        $('#problem').on('change', problem);
        $('#submit').on('click', submit);
        $('#add-new-tag').on('click', addTag);
        $('#tags').on('click', '.minus', function(){
            if ($('#tags tr').length > 1) this.parentNode.remove();
        });
    }

    function unbind() {
        $('#skip, #problem, #submit').off();
        $('#josm, #reset, #osmlink, #osmtiles').off();
        $('#add-new-tag, #tags').off();
    }

    function setInterface() {
        $('body').append('\
            <div id="tags">\
                <table>\
                    <tbody></tbody>\
                </table>\
                <span class="k" id="add-new-tag" alt="Add a new tag">+</span>\
            </div>\
        ');

        $('body').append('\
            <div id="action-block">\
                <li id="hold-problem" style="margin-left: 0;">\
                    <select name="problem" id="problem">\
                        <option value="problem" disabled selected>Problem</option>\
                        <option value="no_park_here">no park here</option>\
                        <option value="already_mapped">already mapped</option>\
                        <option value="poor_imagery">poor imagery</option>\
                        <option value="too_difficult">too difficult</option>\
                    </select>\
                </li>\
                <li id="skip">Skip</li>\
                <li id="submit">Submit</li>\
            </div>\
        ');

        $('body').append('\
            <ul id="bottom-right">\
                <li id="reset">reset</li>\
                <li id="josm">edit in JOSM</li>\
                <li id="osmtiles">see OSM map</li>\
                <li id="osmlink" style="border-bottom: none;">open at osm.org</li>\
            </ul>\
        ');

        $('body').append('\
            <div id="flash">\
                <div style="position: relative">\
                    <i class="foundicon-remove hidden display"></i>\
                    <i class="foundicon-right-arrow hidden display"></i>\
                    <i class="foundicon-up-arrow hidden display"></i>\
                </div>\
            </div>\
        ');
    }

    function unsetInterface() {
        $('#tags, #action-block, #bottom-right, #flash').remove();
        osmly.map.closePopup();
        if (osmly.map.featureLayer) osmly.map.removeLayer(osmly.map.featureLayer);
        osmly.map.removeContext();
    }

    function displayItem() {
        osmly.map.featureLayer.addTo(osmly.map);
        osmly.map.showContext();

        $('#notify').hide();
        $('#hold-problem, #submit, #bottom-right, #action-block').fadeIn(250);
        setTimeout(bind, 250);
            // might needs to throttle this more significantly

        if (imp.isEditable) {
            $('#tags').fadeIn(250);
        } else {
            $('#hold-problem, #submit').fadeOut(250);
            $('#reusable-modal .modal-content').html(
                '<h3>This feature is too complex. <a>Edit it in JOSM?</a></h3>');
            // put an 'Edit in JOSM' button right there
                // when clicked close the modal and let the other modal open
            // literally bind, $('#josm').click()
            CSSModal.open('reusable-modal');
        }
    }

    function populateTags() {
        var properties = imp.data.properties;
        for (var tag in properties) {
            if (properties[tag] !== null && properties[tag] !== 'null') {
                $('#tags tbody').append(
                    '<tr>' +
                    '<td class="k" spellcheck="false" contenteditable="true">' +
                    tag + '</td>' +
                    '<td class="v" spellcheck="false" contenteditable="true">' +
                    properties[tag] + '</td>' +
                    '<td class="minus">-</td>' +
                    '</tr>');
            }
        }
    }

    function hideItem(callback) {
        $('#bottom-right, #action-block, #tags').fadeOut(250, function(){
            if (callback) callback();
        });
        osmly.map.closePopup();
        if (osmly.map.featureLayer) osmly.map.removeLayer(osmly.map.featureLayer);
        osmly.map.removeContext();
    }

    function skip() {
        hideItem();
        $('#tags tr').remove();
        leftToRight($('.foundicon-right-arrow'));
        next();
    }

    function submit() {
        hideItem();

        if (osmly.auth.authenticated() && token('user')) {
            osmly.connect.updateItem('submit');
            osmly.connect.openChangeset(submitToOSM);
        } else {
            $('#tags tr').remove();
            next();
        }
        bigUp($('.foundicon-up-arrow'));
    }

    function problem() {
        hideItem();

        if (osmly.auth.authenticated() && token('user')) {
            osmly.connect.updateItem('problem', {
                problem: $('#problem').val()
            });
        }
        $('.foundicon-remove').show(function(){
            setTimeout(function(){
                $('.foundicon-remove').fadeOut(250);
            }, 250);
        });
        $('#problem').val('problem');
        $('#tags tr').remove();
        next();
    }

    function josm() {
        $('#reset').trigger('click');
        osmly.connect.editInJosm(imp.id);
    }

    function reset() {
        $('#tags tr').remove();
        hideItem(displayItem);
        osmly.map.setFeature(imp.data, imp.isEditable);
        populateTags();
    }

    function changeset() {
        osmly.settings.changesetTags['comment'] = $('#changeset-form').text();
        osmly.connect.updateComment(function(){
            CSSModal.close();
            $('#notify').hide();
        });
    }

    function addTag() {
        $('#tags tbody').append('\
            <tr>\
            <td class="k" spellcheck="false" contenteditable="true"></td>\
            <td class="v" spellcheck="false" contenteditable="true"></td>\
            <td class="minus">-</td>\
            </tr>\
        ');
    }

    function next() {
        unbind();
        osmly.map.removeOSM();
        osmly.ui.notify('getting next item');

        $.ajax({
            url: osmly.settings.db,
            dataType: 'json',
            success: function(data) {
                nextPrep(data);
            }
        });
    }

    function nextPrep(data) {
        imp.data = data;
        imp.id = imp.data.properties.id;
        imp.bbox = imp.data.properties.bounds;
        imp.isEditable = isEditable(imp.data.geometry);
        osmly.map.setFeature(imp.data, imp.isEditable);
        imp.prepTags();

        if (imp.isEditable) {
            osmly.map.context(imp.bbox, 0.001, function() {
                populateTags();
                displayItem();
            });
        } else {
            populateTags();
            displayItem();
        }
    }

    function isEditable(geo) {
        // checks if the feature has holes, leaflet can't edit them
        if (geo.type == 'Polygon' && geo.coordinates.length > 1) return false;

        if (geo.type == 'MultiPolygon') {
            for (var a = 0, b = geo.coordinates.length; a < b; a += 1) {
                if (geo.coordinates[a].length > 1) return false;
            }
        }
        return true;
    }

    imp.prepTags = function(tags) {
        // this needs to be used for editInJosm in .connect
        // bound to data.properties right now
        renameProperties();
        usePropertiesAsTag();
        appendTags();
    };

    function renameProperties() {
        // converts the feature key, doesn't remove old one
        // ex. NAME -> name, CAT2 -> leisure
        for (var prop in osmly.settings.renameProperty) {
            var change = osmly.settings.renameProperty[prop];
            imp.data.properties[change] = imp.data.properties[prop];
        }
    }

    function usePropertiesAsTag() {
        // filters properties to be used as tags
        for (var prop in imp.data.properties) {
            if (osmly.settings.usePropertyAsTag.indexOf(prop) === -1) {
                imp.data.properties[prop] = null;
            }
        }
    }

    function appendTags() {
        for (var append in osmly.settings.appendTag) {
            imp.data.properties[append] = osmly.settings.appendTag[append];
        }
    }

    imp.tags = function(){
        var tgs = byId('tags'),
            trs = tgs.getElementsByTagName('tr'),
            tags = {};

        for (var a=0; a < trs.length; a++) {
            // 0 = key, 1 = value, 2 = minus
            var tds = trs[a].getElementsByTagName('td');
            if (tds[0].innerHTML !== '' && tds[1].innerHTML !== '') {
                tags[tds[0].innerHTML] = tds[1].innerHTML;
            }
        }

        return tags;
    };

    function submitToOSM() {
        var id = token('changeset_id');
        $('#changeset').fadeIn();
        byId('changeset-link').innerHTML = '<a href="' + osmly.settings.writeApi +
        '/browse/changeset/' + id + '" target="_blank">Details on osm.org »</a>';

        var geojson = osmly.import.layer.toGeoJSON();
        geojson['features'][0]['properties'] = osmly.import.tags();
            // this is sketchy but works for single items
        var osmChange = toOsmChange(geojson, token('changeset_id'));

        osmly.ui.notify('uploading to OSM');

        osmly.auth.xhr({
            method: 'POST',
            path: '/api/0.6/changeset/' + id + '/upload',
            content: osmChange,
            options: {header: {'Content-Type': 'text/xml'}}
        }, postOSM);
    }

    function postOSM(err, res) {
        if (res && !err) {
            // do some kind of special green checkmark
            // can we double notify?
        } else {
            console.log(err);
            // :/
        }
        $('#tags tr').remove();
        next();
    }

    return imp;
}());
