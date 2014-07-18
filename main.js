var map;
var lyrQuery;
var lyrSites;
var selectFeature;
var fidQuery = 1;
var activeQuery = {};
var proj3857 = new OpenLayers.Projection("EPSG:3857");
var proj4326 = new OpenLayers.Projection("EPSG:4326");
var graph;
var x_axis;
var y0_axis;
var y1_axis;
var hoverDetail;
var palette = new Rickshaw.Color.Palette();

var var2sabgom = {
   'Temperature' : 'temp'
  ,'Salinity'    : 'salt'
};
var var2ncsos = {
   'Temperature' : 'water_temperature'
  ,'Salinity'    : 'salinity'
};

function init() {
  $("#variable").buttonset();
  $('#variable input[type=radio]').change(function(){
    var v = $(this).attr('id');
    var features = [];
    _.each(lyrQuery.features,function(o) {
      var c = o.geometry.getCentroid();
      var c4326 = c.clone().transform(proj3857,proj4326);
      if (Math.floor(o.attributes.id) == o.attributes.id) {
        features.push([c,c4326,v]);
      }
    });
    palette = new Rickshaw.Color.Palette();
    lyrQuery.removeAllFeatures();
    fidQuery = 1;
    updateGraph();
    _.each(features,function(o) {
      query({x : o[0].x,y : o[0].y},{lon : o[1].x,lat : o[1].y,v : o[2]});
    });
  });
  $("#refresh").button().click(function() {
    var features = [];
    _.each(lyrQuery.features,function(o) {
      var c = o.geometry.getCentroid();
      var c4326 = c.clone().transform(proj3857,proj4326);
      if (Math.floor(o.attributes.id) == o.attributes.id) {
        features.push([c,c4326,o.attributes.var]);
      }
    });
    palette = new Rickshaw.Color.Palette();
    lyrQuery.removeAllFeatures();
    fidQuery = 1;
    updateGraph();
    _.each(features,function(o) {
      query({x : o[0].x,y : o[0].y},{lon : o[1].x,lat : o[1].y,v : o[2]});
    });
  });
  $("#clearAll").button().click(function() {
    $('#rh').hide();
    $('#lh').animate({left : $('#lh').parent().width() / 2 - $('#lh').width() / 2},function() {
      map.updateSize();
    });
    palette = new Rickshaw.Color.Palette();
    lyrQuery.removeAllFeatures();
    fidQuery = 1;
    updateGraph();
  });

  var style = new OpenLayers.Style(
    OpenLayers.Util.applyDefaults({
       label             : '${getLabel}'
      ,labelAlign        : 'cm'
      ,fontFamily        : 'Arial, Helvetica, sans-serif'
      ,fontSize          : 11
      ,pointRadius       : '${getPointRadius}' // 8
      ,strokeColor       : '${color}'
      ,strokeOpacity     : 0.8
      ,fillColor         : '#ffffff'
      ,fillOpacity       : '${getFillOpacity}' // 0.8
    })
    ,{
      context : {
        getLabel : function(f) {
          return Math.floor(f.attributes.id) == f.attributes.id ? f.attributes.id : '';
        }
        ,getFillOpacity : function(f) {
          return Math.floor(f.attributes.id) == f.attributes.id ? 0.8 : 0;
        }
        ,getPointRadius : function(f) {
          return Math.floor(f.attributes.id) == f.attributes.id ? 8 : 12;
        }
      }
    }
  );
  lyrQuery = new OpenLayers.Layer.Vector(
     'Query points'
    ,{styleMap : new OpenLayers.StyleMap({
       'default' : style
      ,'select'  : style
    })}
  );

  lyrSites = new OpenLayers.Layer.Vector(
    'Sites'
  );

  map = new OpenLayers.Map('map',{
    layers  : [
      new OpenLayers.Layer.XYZ(
         'ESRI Ocean'
        ,'http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/${z}/${y}/${x}.jpg'
        ,{
           sphericalMercator : true
          ,isBaseLayer       : true
          ,wrapDateLine      : true
        }
      )
      ,new OpenLayers.Layer.Vector('SABGOM',{
         strategies : [new OpenLayers.Strategy.Fixed()]
        ,protocol   : new OpenLayers.Protocol.HTTP({
           url    : 'data/sabgom.kml'
          ,format : new OpenLayers.Format.KML()
        })
        ,styleMap   : new OpenLayers.StyleMap({
          'default' : new OpenLayers.Style(
            OpenLayers.Util.applyDefaults({
               fillOpacity   : 0
              ,strokeWidth   : 1
              ,strokeColor   : '#0000ff'
              ,strokeOpacity : 1
            })
          )
        })
      })
      ,lyrSites
      ,lyrQuery
    ]
    ,center : new OpenLayers.LonLat(-83,28).transform(proj4326,proj3857)
    ,zoom   : 5
  });

  selectFeature = new OpenLayers.Control.SelectFeature(lyrQuery,{
     autoActivate : true
    ,eventListeners : {
      featurehighlighted : function(e) {
        var features = _.filter(lyrQuery.features,function(o){
          return o.geometry.equals(e.feature.geometry);
        });
        popup({
           ctr  : new OpenLayers.LonLat(e.feature.geometry.x,e.feature.geometry.y) 
          ,fids : _.pluck(features,'id')
          ,id   : Math.floor(e.feature.attributes.id)
        });
      }
    }
  });
  map.addControl(selectFeature);

  map.events.register('click',this,function(e) {
    if ($(e.target).attr('class') != 'olPopupCloseBox') {
      var lonLat = map.getLonLatFromPixel(e.xy);
      var lonLat4326 = lonLat.clone().transform(proj3857,proj4326);
      var i = 0;
      query({x : lonLat.lon,y : lonLat.lat},{
         lon : lonLat4326.lon
        ,lat : lonLat4326.lat
        ,v   : $("input:radio[name='variable']:checked").attr('id')
      });
    }
  });

  $('#date-slider').dateRangeSlider({
    bounds : {
       min : new Date(2011,0,1)
      ,max : new Date(Date.now())
    }
    ,defaultValues : {
       min : new Date(2011,4,1)
      ,max : new Date(2012,0,1)
    }
  });

  setTimeout(function() {
    var pt4326 = new OpenLayers.LonLat(-82.91999816894531,27.16900062561035);
    var pt = pt4326.clone().transform(proj4326,proj3857);
    query({x : pt.lon,y : pt.lat},{
       lon : pt4326.lon
      ,lat : pt4326.lat
      ,v   : 'Salinity'
    },0.5);
  },2000);

  getSites();
}

function query(center,data) {
  if (!$('#rh').is(':visible')) {
    $('#lh').animate({left : 0},function() {
      map.updateSize();
      $('#rh').show();
    });
  }

  var fids = [];
  for (var i = 0; i < 1; i += 0.5) {
    fids.push(fidQuery + i);
    var f = new OpenLayers.Feature.Vector(
      new OpenLayers.Geometry.Point(center.x,center.y)
    );
    f.attributes.id = fids[fids.length - 1];;
    f.attributes.color = palette.color();
    lyrQuery.addFeatures([f]);
    activeQuery[fids[fids.length - 1]] = true;
  }
  fidQuery++;

  var size = _.size(activeQuery);
  $("#refresh").prop('disabled',true);
  $("#clearAll").prop('disabled',true);
  $('#status').html('Processing ' + size + ' ' + (size > 1 ? 'queries' : 'query') + ' <img src="img/progressDots.gif">');

  var minT = $('#date-slider').dateRangeSlider('min').format('yyyy-mm-dd"T"HH:00:00"Z"');
  var maxT = $('#date-slider').dateRangeSlider('max').format('yyyy-mm-dd"T"HH:00:00"Z"');

  OpenLayers.Request.issue({
     url      : './getSabgom.php?z=' + '-0.986111111111111' + '&lon=' + data.lon + '&lat=' + data.lat + '&minT=' + minT + '&maxT=' + maxT + '&fid=' + fids[0] + '&var=' + var2sabgom[data.v]
    ,callback : OpenLayers.Function.bind(processData,null,fids[0],data.v,'SABGOM Model')
  });

  _.each(lyrSites.features,function(o) {
    OpenLayers.Request.issue({
       url      : './getNcSOS.php?' + o.attributes.getObs + '&eventTime=' + minT + '/' + maxT + '&observedProperty=' + var2ncsos[data.v]
      ,callback : OpenLayers.Function.bind(processData,null,fids[1],data.v,o.attributes.id)
    });
  });
}

function processData(fid,v,name,r) {
  var json = new OpenLayers.Format.JSON().read(r.responseText);
  var f = _.find(lyrQuery.features,function(o){return o.attributes.id == fid});
  if (f) {
    f.attributes.var  = v;
    f.attributes.data = json.data;
    f.attributes.min  = json.min;
    f.attributes.max  = json.max;
    f.attributes.u    = !_.isEmpty(json.u) ? ' (' + json.u + ')' : '';
    f.attributes.name = name;
  }
  delete activeQuery[fid];
  if (_.size(activeQuery) == 0) {
    $('#status').html('&nbsp;');
    $("#refresh").prop('disabled',false);
    $("#clearAll").prop('disabled',false);
  }
  else {
    var size = _.size(activeQuery);
    $('#status').html('Processing ' + size + ' ' + (size > 1 ? 'queries' : 'query') + ' <img src="img/progressDots.gif">');
  }
  updateGraph();
}

function updateGraph() {
  $('#y0_axis').empty();
  $('#y1_axis').empty();
  $('#chart').empty();
  delete y0_axis;
  delete y1_axis;
  delete graph;
  delete hoverDetail;
  var ranges = {
     Temperature : [false,false]
    ,Salinity    : [false,false]
  };
  _.each(_.sortBy(lyrQuery.features,function(o){return -1 * o.attributes.id}),function(f) {
    if (f.attributes.var) {
      ranges[f.attributes.var][0] = !ranges[f.attributes.var][0] || f.attributes.min < ranges[f.attributes.var][0] ? f.attributes.min : ranges[f.attributes.var][0];
      ranges[f.attributes.var][1] = !ranges[f.attributes.var][1] || f.attributes.max > ranges[f.attributes.var][1] ? f.attributes.max : ranges[f.attributes.var][1];
    }
  });
  var scales = {
     Temperature : ranges['Temperature'] ? d3.scale.linear().domain([ranges['Temperature'][0],ranges['Temperature'][1]]) : false
    ,Salinity    : ranges['Salinity'] ? d3.scale.linear().domain([ranges['Salinity'][0],ranges['Salinity'][1]]) : false
  };
  var series = [];
  _.each(_.sortBy(lyrQuery.features,function(o){return -1 * o.attributes.id}),function(f) {
    if (f.attributes.data) {
      series.push({
         name  : 'Query #' + Math.floor(f.attributes.id) + ' ' + f.attributes.var + f.attributes.u + ' from ' + f.attributes.name
        ,data  : f.attributes.data
        ,color : f.attributes.color
        ,scale : scales[f.attributes.var]
      });
    }
  });
  if (series.length > 0) {
    graph = new Rickshaw.Graph({
       element  : document.getElementById("chart")
      ,renderer : 'line'
      ,series   : series
    });
    var x_axes = new Rickshaw.Graph.Axis.Time({graph : graph});
    y0_axis = new Rickshaw.Graph.Axis.Y.Scaled({
       graph       : graph
      ,orientation : 'left'
      ,tickFormat  : Rickshaw.Fixtures.Number.formatKMBT
      ,element     : document.getElementById('y0_axis')
      ,scale       : scales['Temperature']
    });
    y1_axis = new Rickshaw.Graph.Axis.Y.Scaled({
       graph       : graph
      ,orientation : 'right'
      ,tickFormat  : Rickshaw.Fixtures.Number.formatKMBT
      ,element     : document.getElementById('y1_axis')
      ,scale       : scales['Salinity']
    });
    graph.render();
    hoverDetail = new Rickshaw.Graph.HoverDetail({
       graph      : graph
      ,xFormatter : function(x) {
        return new Date(x * 1000).toString();
      }
    });
  }
}

function popup(d) {
  if (map.popup) {
    map.removePopup(map.popup);
    map.popup.destroy();
    map.popup = null;
  }
  map.popup = new OpenLayers.Popup.FramedCloud(
     'popup'
    ,d.ctr
    ,null
    ,'<a href="#" id="removeFeatures" data-fids="' + d.fids.join(',') + '">Remove query #' + d.id + '</a>'
    ,null
    ,true
    ,function() {
      map.removePopup(map.popup);
      map.popup.destroy();
      map.popup = false;
    }
  );
  map.addPopup(map.popup,true);
  $('#removeFeatures').click(function() {
    var features = [];
    _.each($(this).data('fids').split(','),function(o) {
      features.push(lyrQuery.getFeatureById(o)); 
    });
    lyrQuery.removeFeatures(features);
    updateGraph();
    setTimeout(function() {
      map.removePopup(map.popup);
      map.popup.destroy();
      map.popup = null;
    },100);
  });
}

function getSites() {
  var json = [
    {
       id     : 'usf.c10.mcat'
      ,lon    : -82.91999816894531
      ,lat    : 27.16900062561035
      ,getObs : 'http://tds.secoora.org/thredds/sos/usf.c10.mcat.nc?request=GetObservation&service=SOS&version=1.0.0&responseFormat=text/xml;schema%3D"om/1.0.0"&offering=urn:ioos:network:org.secoora:all&procedure=urn:ioos:network:org.secoora:all'
      ,properties : ['salinity'] 
    }
  ];

  var features = [];
  _.each(json,function(o) {
    var f = new OpenLayers.Feature.Vector(
      new OpenLayers.Geometry.Point(o.lon,o.lat).transform(proj4326,proj3857)
    );
    f.attributes = o;
    features.push(f);
  });

  lyrSites.addFeatures(features);
}
