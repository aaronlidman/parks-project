/* jshint multistr:true */
osmly.qa = (function () {
    var qa = {live: false},
        data = {};

    qa.go = function(){
        setInterface();
        next();
    };

    qa.stop = function() {
        reset();
        unsetInterface();
    };

    function setInterface() {
        byId('qa').innerHTML = 'Leave QA';
        byId('qa').style.backgroundColor = 'black';
        byId('qa').style.color = 'white';
        $('#qa').one('click', osmly.mode.import);

        var body = byTag('body')[0],
            qablock = createId('div', 'qa-block');
        body.appendChild(qablock);

        var report = createId('div', 'report');
        qablock.appendChild(report);

        var layerz = createId('div', 'toggleLayers');
        qablock.appendChild(layerz);
        layerz.innerHTML = '[w] see original feature';

        var skip = createId('div', 'qa-skip');
        qablock.appendChild(skip);
        skip.innerHTML = '[s] skip';

        var confirmz = createId('div', 'confirm');
        qablock.appendChild(confirmz);
        confirmz.innerHTML = 'confirm';

        $('body').append('\
            <ul id="bottom-right">\
                <li id="osmtiles">see OSM map</li>\
                <li id="osmlink" style="border-bottom: none;">open at osm.org</li>\
            </ul>\
        ');
    }

    function bind() {
        $('#toggleLayers').on('click', toggleLayers);
        $('#qa-skip').one('click', next);
        $('#confirm').on('click', confirm);
        $('#osmlink').on('click', function(){
            window.open(osmly.osmlink);
        });
        $('#osmtiles').on('click', function(){
            osmly.map.toggleLayer(osmly.map.osmTiles);
        });

        $('body').on('keydown', function(k){
            if (k.keyCode === 87) toggleLayers(); //w
            if (k.keyCode === 83) next(); //s
        });
    }

    function unbind() {
        $('#toggleLayers, #qa-skip, #confirm').off();
        $('body').off('keydown');
        $('#osmlink, #osmtiles').off();
    }

    function unsetInterface() {
        var qa = byId('qa');
        qa.innerHTML = 'QA';
        qa.style.backgroundColor = 'white';
        qa.style.color = 'black';
        $('#qa').one('click', osmly.mode.qa);

        $('#qa-block, #bottom-right').remove();
    }

    function request(callback) {
        $.ajax({
            url: osmly.settings.db + '&qa',
            cache: false,
            dataType: 'json',
            success: function(item){
                if (!item) return none();
                data = {
                    id: item[0],
                    geo: JSON.parse(item[1]),
                    problem: item[2],
                    submit: item[3],
                    user: item[4],
                    time: item[5],
                };

                if (data.geo.properties.name) data.name = data.geo.properties.name;
                if (callback) callback();
            }
        });
    }

    function fillReport() {
        var table = createE('table'),
            report = byId('report');
        if (report.getElementsByTagName('table').length) {
            report.removeChild(report.childNodes[0]);
        }
        var tbody = createE('tbody');

        // columns = 'id, geo, problem, submit, user, time'
        for (var item in data) {
            var tr = createE('tr');
            if (item == 'id') tr.innerHTML = '<td>id</td><td>' + data.id + '</td>';
            if (item == 'user') tr.innerHTML = '<td>who</td><td>' + data.user + '</td>';
            if (item == 'time') tr.innerHTML = '<td>when</td><td class="timeago" title="' + data.time + '">' + data.time + '</td>';
            if (item == 'problem' && data.problem !== '') tr.innerHTML = '<td>problem</td><td class="k">' + data.problem + '</td>';
            if (item == 'submit' && data.submit != 1){
                tr.innerHTML = '<td>via</td><td>' + data.submit + '</td>';
            }
            if (item == 'name') tr.innerHTML = '<td>name</td><td>' + data.name + '</td>';
            if (tr.innerHTML !== '') tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        report.appendChild(table);
        timeAgo();
    }

    function next() {
        reset();
        request(function(){
            fillReport();
            setGeometry();
            setContext();
        });
    }

    function none() {
        $('#reusable-modal .modal-content').html('<h3>Nothing to check right now</h3>');
        CSSModal.open('reusable-modal');
    }

    function reset() {
        unbind();
        if (osmly.map.hasLayer(osmly.map.contextLayer)) osmly.map.removeLayer(osmly.map.contextLayer);
        if (osmly.map.hasLayer(osmly.map.featureLayer)) osmly.map.removeLayer(osmly.map.featureLayer);
        byId('toggleLayers').innerHTML = '[w] see original feature';
        $('#qa-block, #bottom-right').hide();
    }

    function setContext() {
        var bounds = data.geo.properties.bounds;

        osmly.map.fitBounds([
            [bounds[1], bounds[0]],
            [bounds[3], bounds[2]]
        ]);

        osmly.map.context(bounds, 0.002, show);

    }

    function show() {
        osmly.map.removeLayer(osmly.map.featureLayer);
        $('#qa-block, #bottom-right').fadeIn(250);
        $('#notify').hide();
        bind();
    }

    function setGeometry() {
        osmly.map.setFeature(data.geo, false, true);
    }

    function confirm() {
        osmly.connect.updateItem('confirm', false, false, data.id);
        next();
    }

    function toggleLayers() {
        if (osmly.map.hasLayer(osmly.map.featureLayer)) {
            byId('toggleLayers').innerHTML = '[w] see original feature';
            osmly.map.removeLayer(osmly.map.featureLayer);
            osmly.map.addLayer(osmly.map.contextLayer);
        } else {
            byId('toggleLayers').innerHTML = '[w] see OSM data';
            osmly.map.removeLayer(osmly.map.contextLayer);
            osmly.map.addLayer(osmly.map.featureLayer);
        }
    }

    return qa;
}());
