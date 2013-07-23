osmly.ui = (function() {
    var ui = {},
        settings = osmly.settings;

    ui.initialize = function() {
        if (osmly.settings.demo) {
            if (osmly.settings.demo) $('#login').text('Demonstration »');

            $('#login').fadeIn(500);
        } else {
            if (auth.authenticated()) {
                setUserDetails();
                osmly.item.next();
            } else {
                console.log('idk');
            }
        }

        bind();
    };

    function bind() {
        $('#login').click(function() {
            ui.notify('');

            if (osmly.settings.demo) {
                $('#login').fadeOut(500);
                osmly.item.next();
            } else {
                $('#login').fadeOut(500);
                getDetails();
                osmly.item.next();
            }
        });

        $('#instruction').click(function() {
            $('#instruction-modal').reveal({
                 animation: 'fade',
                 animationspeed: 100,
                 closeonbackgroundclick: true,
                 dismissmodalclass: 'close-reveal-modal'
            });
        });

        $('#changeset').click(function(e) {
            e.preventDefault();
            $('#changeset-modal').reveal({
                 animation: 'fade',
                 animationspeed: 100,
                 closeonbackgroundclick: true,
                 dismissmodalclass: 'close-reveal-modal'
            });
        });

        $('#update-change').click(function() {
            osmly.settings.changesetTags.push(['comment', $('#changeset-form').text()]);
            updateChangeset(token('changeset_id'), function() {
                $('#changeset-modal').trigger('reveal:close');
                $('#notify').fadeOut(250);
            });
        });

        $('#josm').click(function() {
            $('#reset').click();

            var id = osmly.item.id,
                geojson = osmly.item.layer.toGeoJSON(),
                osmChange = osmly.item.toOsm(geojson),
                request = osmly.settings.featuresApi + 'db=' + osmly.settings.db + '&id=' + id + '&action=osc',
                bbox = osmly.item.bbox;

            $.ajax({
                type: 'POST',
                url: request,
                crossDomain: true,
                data: {osc: osmChange}
            }).done(function() {
                // there's no way to both load data from the api and import a file
                // so we do them seperately with two requests

                $.ajax('http://127.0.0.1:8111/load_and_zoom?left=' + bbox[0] +
                    '&right=' + bbox[2] + '&top=' + bbox[3] + '&bottom=' + bbox[1]
                ).done(function() {
                    $.ajax('http://127.0.0.1:8111/import?url=' + request)
                    .done(function() {
                        $('#reusable-modal span').text('Opened in JOSM');
                        $('#reusable-modal').reveal({
                             animation: 'fade',
                             animationspeed: 100,
                             closeonbackgroundclick: true,
                             dismissmodalclass: 'close-reveal-modal'
                        });
                        // fade this out after some seconds (idk 10-15?)
                        // then show an action dialog, to determine what was done with that feature
                    });
                }).fail(function() {
                    $('#reusable-modal span').text('JOSM doesn\'t seem to be running. Make sure you start it first.');
                    $('#reusable-modal').reveal({
                         animation: 'fade',
                         animationspeed: 100,
                         closeonbackgroundclick: true,
                         dismissmodalclass: 'close-reveal-modal'
                    });
                });
            });

        });

        $('#osmlink').click(function() {
            window.open(osmly.osmlink);
        });

    }

    ui.notify = function(string) {
        if (string !== '') string = '<span>' + string + '</span>';
        string = '<img src="static/images/loader.gif" />' + string;

        $('#notify')
            .html(string)
            .show();

        // don't forget to hide #notify later
        // $('#notify').fadeOut(250);
    };

    ui.setupItem = function(properties) {
        // bindings and populating fields for a new item
        populateTags(properties);

        $('#submit').click(function() {
            submit(event.target.id);
        });

        $('#skip').click(function(){
            skip();
        });

        $('#problem').change(function() {
            submit($('#problem').val());
        });

        $('.k, .v').keypress(function() {
            equalizeTags();
        });

        $('.minus').click(function() {
            if ($('#tags li').length > 1) {
                $(this).parent().remove();
                equalizeTags();
            }
        });

        $('#add-new-tag').click(function() {
            // what a freakin mess, what have I done
            $('#tags ul').append(
                '<li>' +
                '<span class="k" spellcheck="false" contenteditable="true"></span>' +
                '<span class="v" spellcheck="false" contenteditable="true"></span>' +
                '<span class="minus">-</span>' +
                '</li>');

            equalizeTags();

            $('.k, .v').keypress(function() {
                equalizeTags();
            });

            $('.minus').click(function() {
                if ($('#tags li').length > 1) {
                    $(this).parent().remove();
                    equalizeTags();
                }
            });
        });

        $('#reset').click(function() {
            teardown();
            osmly.item.setItemLayer(osmly.item.data);
            ui.setupItem(osmly.item.data.properties);
            ui.displayItem(true);
            // true, just implying if they can click it, it was editable to begin with
        });
    };

    ui.displayItem = function(isEditable) {
        osmly.item.layer.addTo(osmly.map);

        if (osmly.item.contextLayer) {
            osmly.item.contextLayer.addTo(osmly.map);
            osmly.item.contextLayer.bringToFront();
        }

        $('#notify, #login').fadeOut(250);
        $('#top-right, #bottom-right, #action-block').fadeIn(250);

        if (isEditable) {
            $('#tags').fadeIn(250);
            equalizeTags();

        } else {
            $('#problem, #submit').hide();
            $('#reusable-modal span').html(
                'This feature is too complex. <a>Edit it in JOSM?</a>');
            // put an 'Edit in JOSM' button right there, when clicked close the modal and let the other modal open
            // literally bind, $('#josm').click()
                $('#reusable-modal').reveal({
                     animation: 'fade',
                     animationspeed: 200,
                     closeonbackgroundclick: true,
                     dismissmodalclass: 'close-reveal-modal'
                });
        }
    };

    function populateTags(properties) {
        for (var tag in properties) {
            if (properties[tag] !== null &&
                properties[tag] !== 'null') {
                $('#tags ul').append(
                    '<li>' +
                    '<span class="k" spellcheck="false" contenteditable="true">' +
                    tag + '</span>' +
                    '<span class="v" spellcheck="false" contenteditable="true">' +
                    properties[tag] + '</span>' +
                    '<span class="minus">-</span>' +
                    '</li>');
            }
        }
    }

    function equalizeTags() {
        // doesn't work until the selectors are visibile?
        // janky & inefficient, need to look into how the plugin works
        $('ul').equalize({
            children: '.k',
            equalize: 'width',
            reset: true});
        $('.k').width( $('.k').width() + 12);

        $('ul').equalize({
            children: '.v',
            equalize: 'width',
            reset: true});
        $('.v').width( $('.v').width() + 12);
    }

    function teardown() {
        $('#action-block, #tags, #bottom-right').hide();
        $('#problem, #skip, #submit, .minus, #add-new-tag, #reset').unbind();
        $('.k, .v').unbind();
        $('#problem').val('problem'); // resets problem menu
        $("#problem, #submit").removeAttr('style');
        $('#tags li').remove();

        osmly.map.closePopup();
        osmly.map.removeLayer(osmly.item.layer);

        if (osmly.item.contextLayer) osmly.map.removeLayer(osmly.item.contextLayer);
    }

    function skip() {
        teardown();
        $('#flash-skip')
            .show()
            .fadeOut(750);
        osmly.item.next();
    }

    function submit(result) {
        teardown();

        if (osmly.settings.demo) {
            console.log(osmly.item.layer.toGeoJSON());
            if (result === 'submit') {
                var geojson = osmly.item.layer.toGeoJSON();
                // console.log(toOsm(geojson));
                // console.log(toOsmChange(geojson));
            }
            osmly.item.next();
        } else {
            osmly.connect.updateItem(result);
            if (result === 'submit') {
                osmly.connect.openChangeset(osmly.token('changeset_id'), submitToOSM);
            } else {
                osmly.item.next();
            }
        }

        if (result !== 'submit') result = 'problem';

        $('#flash-' + result)
            .show()
            .fadeOut(750);
    }

    function setUserDetails() {
        $('#user')
            .html('<a href="' + osmly.settings.writeApi + '/user/' +
                osmly.token('user') + '" target="_blank">' +
                osmly.token('user') + '</a>')
            .fadeIn(500);
    }

    return ui;
}());