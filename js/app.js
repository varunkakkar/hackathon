

var API_BASE_URL = "http://localhost/12th-plan/api/public/";

getURLHashParameter = function(name) {

    return decodeURI((RegExp('[#|&]' + name + '=' + '(.+?)(&|$)').exec(location.hash)||[null])[1]
    );
};

function redrawAllDependentGraphs(mainData)
{
  console.log(mainData);
  agriRedraw(mainData.agriculture);
  healthRedraw(mainData.health);
  waterRedraw(mainData.water);
  energyRedraw(mainData.energy);
  urbanRedraw(mainData.urban);

}

var votes = {
  renderVotes: function (likes, dislikes) {
    $(".vote-button[data-value='1'] .count").html(likes);
    $(".vote-button[data-value='0'] .count").html(dislikes);
  },

  load_votes: function (entry_id) {
    $.ajax({
        type : "GET",
        url  : API_BASE_URL + "votes/get/" + entry_id,
        dataType   : "json",
        statusCode : {
            200: function(data) {
              votes.renderVotes(data.likes, data.dislikes);
            },
            404: function() {

            }
        }
    });
  },

  init: function () {
    $(".vote-button").click(function () {
      var entry_id = getURLHashParameter("id");
      var $that = $(this);

      if (entry_id != "undefined") {
        $.ajax({
            type : "POST",
            url  : API_BASE_URL + "votes/vote",
            data : {
                email    : $("input.vote-email").val(),
                entry_id : entry_id,
                like     : $that.data('value')
            },
            dataType   : "json",
            statusCode : {
                201: function(data) {
                  votes.renderVotes(data.likes, data.dislikes);
                },
                400: function(data) {
                    alert("Please provide email. You can only vote once!");
                }
            }
        });
      }
    });
  }
};

$(document).ready(votes.init);

(function () {

  var sliders = {
    original_data: {
      "macro"       : 15,
      "agriculture" : 20,
      "health"      : 10,
      "water"       : 15,
      "energy"      : 20,
      "urban"       : 20
    },

    sdata: {},

    renderSliders: function (data) {
      var x, selector;

      for (x in data) {
        if (data.hasOwnProperty(x)) {
          $(".main-sliders .slider[data-name='" + x + "']").slider({
            orientation : "vertical",
            range       : "min",
            min         : 0,
            max         : 100,
            value       : data[x],
            slide      : function (e, ui) {
              sliders.changeState($(e.target), ui.value);
            }
          });

          $(".slabels .slabel[data-name='" + x + "']").html('&#8377;'+Math.floor(data[x]*total));
        }
      }

    },

    renderData: function (data) {
      var x, selector;

      for (x in data) {
        if (data.hasOwnProperty(x)) {
          $(".main-sliders .slider[data-name='" + x + "']").slider("value", data[x]);

          $(".slabels .slabel[data-name='" + x + "']").html('&#8377;'+Math.floor(data[x]*total));
        }
      }
      redrawAllDependentGraphs(data);
    },

    get_newdata: function (oldData, key, newValue) {
      var ratios = {}, newdata = {}, x, total = 0, difference = 0, remaining = 0;

      for (x in oldData) {
        if (oldData.hasOwnProperty(x)) {
          total = total + oldData[x];
        }
      }

      difference = total - newValue;
      remaining = total - oldData[key];

      for (x in oldData) {
        if (oldData.hasOwnProperty(x) && x != key) {
          ratios[x] = remaining > 0 ? oldData[x] / remaining : 0;
        }
      }

      for (x in oldData) {
        if (oldData.hasOwnProperty(x) && x != key) {
          newdata[x] = ratios[x] * difference;
        }
      }
      newdata[key] = newValue;

      return newdata;
    },

    changeState: function ($obj, newValue) {
      var key = $obj.data('name');
      var newData = sliders.get_newdata(sliders.sdata, key, newValue);
      sliders.renderData(newData);
      sliders.sdata = newData;
      /*
      if (key=='agriculture') {
        agriRedraw(newValue);
      }

      if (key=='health') {
        healthRedraw(newValue);
      }

      if (key=='water') {
        waterRedraw(newValue);
      }

      if (key=='energy') {
        energyRedraw(newValue);
      }

      if (key=='urban') {
        urbanRedraw(newValue);
      }*/
    },

    init: function () {
      sliders.sdata = sliders.original_data;
      sliders.renderSliders(sliders.sdata);

      // bind reset
      $("#reset-main-graph").click(function () {
        sliders.renderData(sliders.original_data);
        sliders.sdata = sliders.original_data;
      });

      window.get_slider_data_for_publishing = function () {
        return sliders.sdata;
      };


      // if id given load data
      var entry_id = getURLHashParameter('id');

      if (entry_id != "undefined") {
        $.ajax({
            type       : "GET",
            url        : API_BASE_URL + "entries/get/" + entry_id,
            dataType   : "json",
            statusCode : {
                200: function(entry) {
                    var ndata = eval("(" + entry.data + ")");

                    var x;

                    for (x in ndata) {
                      if (ndata.hasOwnProperty(x)) {
                        ndata[x] = parseFloat(ndata[x]);
                      }
                    }

                    sliders.sdata = ndata;

                    sliders.renderData(ndata);

                    $(".userdata .name").html(entry.name + " [" + entry.email + "] ");
                    $(".userdata .time").html(entry.created_at);
                    $(".userdata .description").html(entry.description);
                },
                404: function() {
                    // entry not found
                }
            }
        });

        votes.load_votes(entry_id);
      } else {
        $(".userdata").hide();
      }

    }
  };

  $(document).ready(sliders.init);

}());


(function () {

  var _abc = {
    submit: function () {
      $.ajax({
          type : "POST",
          url  : API_BASE_URL + "entries/add",
          data : {
              email       : $(".publish-form form input[name='email']").val(),
              name        : $(".publish-form form input[name='name']").val(),
              description : $(".publish-form form textarea[name='description']").val(),
              data        : get_slider_data_for_publishing()
          },
          dataType   : "json",
          statusCode : {
              201: function(data) {
                  var entry_id = data.id;

                  window.location = window.location.pathname + "#id=" + entry_id;

                  $(".publish-form").modal("hide");
              },
              400: function(data) {
                  // some validation error
                  // data is an array of error messages
                  alert("Please enter all required fields");
              }
          }
      });
    },

    init: function () {
      $(".publish-form").modal({
        show: false
      });

      $(".publish-button").click(function () {
        $(".publish-form").modal("show");
      });

      $(".publish-form form").submit(function () {
        _abc.submit();
      });
    }
  };

  $(document).ready(_abc.init);

}());

$(document).ready(agriDraw);
$(document).ready(healthDraw);
$(document).ready(waterDraw);
$(document).ready(energyDraw);
$(document).ready(urbanDraw);
$(document).ready(ruralDraw);
$(document).ready(environmentDraw);
$(document).ready(educationDraw);

// Grouped Bar Charts
samples = ["11th Plan", "12th Plan Proposed", "Your Allocation"];
sample_data = [["87", "92"], ["93", "92"], ["92", "85"]];

var total = 31762.54;
agri_sectors = [{name:"Department of Agriculture and Cooperation", code:'DAC', ratio:40.9793784889786},
{name:"Department of Agricultural Research and Education", code:'DARC', ratio:14.6453994199842},
{name:"Department of Animal Husbandry, Dairying, and Fisheries", code:'DADF', ratio:8.12652598035282},
{name:"Rashtriya Krishi Vikas Yojana", code:'RKVJ', ratio:36.2486961106844}];

agriculture = [['38003','9989','4970','22426'],['71500','25553','14179','63246'],['71500','25553','14179','63246']];
water = [['37.28297632469','10.4509582863585','47.7339346110485','4.53213077790304'],['157338.634047351','44104.2980834273','201442.932130778','19126.1357384442'],['157338.634047351','44104.2980834273','201442.932130778','19126.1357384442']];

var agriVis, healthVis, waterVis, energyVis;
var n = 4, // number of samples
m = 3; // number of series
var w = 500,
h = 300,
x = d3.scale.linear().domain([0, 100000]).range([0, h]),
y0 = d3.scale.ordinal().domain(d3.range(n)).rangeBands([0, w], .2),
y1 = d3.scale.ordinal().domain(d3.range(m)).rangeBands([0, y0.rangeBand()]),
colors = ["#a4d199", "#65b252", "#437936"];

function agriDraw() {

  agriVis = d3.select("#agriculture_chart")
  .append("svg:svg")
  .append("svg:g")
  .attr("transform", "translate(50,25)");

  var g = agriVis.selectAll("g")
  .data(agriculture)
  .enter().append("svg:g")
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("sample", function(d, i) {return samples[i]})
  .attr("transform", function(d, i) { return "translate(" + y1(i) + ",0)"; });

  var rect = g.selectAll("rect");

  rect
  .data(function(agriculture){return agriculture;})
  .enter().append("svg:rect")
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("width", y1.rangeBand())
  .attr("height", x)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return h - x(d); });

  agriVis.selectAll("rect").each(function(d,i) {$(this).tipsy({gravity: 's', title: function(){
    div = d3.select(this);
    parent_svgg = d3.select(div.node().parentNode);
    return parent_svgg.attr('sample')+': '+String($(this).attr('value'));
  }})});

  var text = agriVis.selectAll("text")
  .data(d3.range(n))
  .enter().append("svg:text")
  .attr("class", "group")
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("x", y0.rangeBand() / 2)
  .attr("y", h+6)
  .attr("dy", ".71em")
  .attr("text-anchor", "middle")
  .text(function(d, i) { return agri_sectors[i].code });
}

function agriRedraw(newValue) {

  new_data = [];
  for(var i=0; i<agri_sectors.length; i++){
    new_data.push(newValue * total * (agri_sectors[i].ratio/100));
  }

  newAgridata = agriculture;
  newAgridata.pop();
  newAgridata.push(new_data);
  console.log(new_data);
  var g = agriVis.selectAll("g");
  g.data(newAgridata)
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("transform", function(d, i) { return "translate(" + y1(i) + ",0)"; });

  g.selectAll("rect")
  .data(function(newAgridata){return newAgridata;})
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("width", y1.rangeBand())
  .attr("height", x)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return h - x(d); });

}

healthSectors = [{name: 'Department of Health and Family Welfare', code: 'DHFW', ratio:89.5116293022419},
                {name: 'AYUSH', code:'AYUSH', ratio:3.34779913205208},
                {name: 'Department of Health Research', code:'DHR', ratio:3.34279943203408},
                {name: 'AIDS Control', code: 'AC', ratio:3.79777213367198}];

health = [['83407','2994','1870','1305'],['268551','10044','10029','11394'],['268551','10044','10029','11394']];

function healthDraw() {

  healthVis = d3.select("#health_chart")
  .append("svg:svg")
  .append("svg:g")
  .attr("transform", "translate(50,25)");

  var g = healthVis.selectAll("g")
  .data(health)
  .enter().append("svg:g")
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("sample", function(d, i) {return samples[i]})
  .attr("transform", function(d, i) { return "translate(" + y1(i) + ",0)"; });

  var rect = g.selectAll("rect");

  rect
  .data(function(health){return health;})
  .enter().append("svg:rect")
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("width", y1.rangeBand())
  .attr("height", x)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return h - x(d); });

  healthVis.selectAll("rect").each(function(d,i) {$(this).tipsy({gravity: 's', title: function(){
    div = d3.select(this);
    parent_svgg = d3.select(div.node().parentNode);
    return parent_svgg.attr('sample')+': '+String($(this).attr('value'));
  }})});

  var text = healthVis.selectAll("text")
  .data(d3.range(n))
  .enter().append("svg:text")
  .attr("class", "group")
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("x", y0.rangeBand() / 2)
  .attr("y", h+6)
  .attr("dy", ".71em")
  .attr("text-anchor", "middle")
  .text(function(d, i) { return healthSectors[i].code });

}

function healthRedraw(newValue) {
  new_data = [];
  for(var i=0; i<healthSectors.length; i++){
    new_data.push(newValue * total * (healthSectors[i].ratio/100));
  }

  newHealthData = health;
  newHealthData.pop();
  newHealthData.push(new_data);
  console.log(new_data);
  var g = healthVis.selectAll("g");
  g.data(newHealthData)
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("transform", function(d, i) { return "translate(" + y1(i) + ",0)"; });

  g.selectAll("rect")
  .data(function(newHealthData){return newHealthData;})
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("width", y1.rangeBand())
  .attr("height", x)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return h - x(d); });

}

waterSectors = [{name:'Major and Medium Irrigation',code:'MMI', ratio:37.28297632469},
                {name:'MI and CAD', code:'MI & CAD', ratio:10.4509582863585},
                {name:'Total Irrigation', code:'TI', ratio:47.7339346110485},
                {name:'Flood Control', code:'FC', ratio:4.53213077790304}];


function waterDraw() {
  waterx = d3.scale.linear().domain([0, 300000]).range([0, h]),

  waterVis = d3.select("#water_chart")
  .append("svg:svg")
  .append("svg:g")
  .attr("transform", "translate(50,25)");

  var g = waterVis.selectAll("g")
  .data(water)
  .enter().append("svg:g")
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("sample", function(d, i) {return samples[i]})
  .attr("transform", function(d, i) { return "translate(" + y1(i) + ",0)"; });

  var rect = g.selectAll("rect");

  rect
  .data(function(water){return water;})
  .enter().append("svg:rect")
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("width", y1.rangeBand())
  .attr("height", waterx)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return h - waterx(d); });

  waterVis.selectAll("rect").each(function(d,i) {$(this).tipsy({gravity: 's', title: function(){
    div = d3.select(this);
    parent_svgg = d3.select(div.node().parentNode);
    return parent_svgg.attr('sample')+': '+String($(this).attr('value'));
  }})});

  var text = waterVis.selectAll("text")
  .data(d3.range(n))
  .enter().append("svg:text")
  .attr("class", "group")
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("x", y0.rangeBand() / 2)
  .attr("y", h+6)
  .attr("dy", ".71em")
  .attr("text-anchor", "middle")
  .text(function(d, i) { return waterSectors[i].code });

}

function waterRedraw(newValue) {
  new_data = [];
  for(var i=0; i<waterSectors.length; i++){
    new_data.push(newValue * total * (waterSectors[i].ratio/100));
  }

  newWaterData = water;
  newWaterData.pop();
  newWaterData.push(new_data);
  console.log(new_data);
  var g = waterVis.selectAll("g");
  g.data(newWaterData)
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("transform", function(d, i) { return "translate(" + y1(i) + ",0)"; });

  g.selectAll("rect")
  .data(function(newWaterData){return newWaterData;})
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("width", y1.rangeBand())
  .attr("height", x)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return h - x(d); });

}

energy = [['30451.91','1500','197','4000','22980'],['54279','4617','5147','19113','41615'],['54279','4617','5147','19113','41615']];
energySectors = [{name:'Ministry of Power', code:'MoP', ratio:43.502897307868},
                {name:'Ministry of Coal', code:'MoC', ratio:3.70037909450113},
                {name:'Ministry of Petroleum and Natural Gas', code:'MoPNG',ratio:4.12515728815189},
                {name:'Ministry of Renewable Sources of Energy', code:'MoRSE', ratio:15.3184634249946},
                {name:'Department of Atomic Energy', code:'DoAE', ratio:33.3531028844844}]

var energyVis;
var energyn = 5;// number of samples
var energyh = 300,
energyw =500,
energyx = d3.scale.linear().domain([0, 55000]).range([0, energyh]),
energyy0 = d3.scale.ordinal().domain(d3.range(energyn)).rangeBands([0, energyw], .2),
energyy1 = d3.scale.ordinal().domain(d3.range(m)).rangeBands([0, energyy0.rangeBand()]);
function energyDraw() {

  energyVis = d3.select("#energy_chart")
  .append("svg:svg")
  .append("svg:g")
  .attr("transform", "translate(50,25)");

  var g = energyVis.selectAll("g")
  .data(energy)
  .enter().append("svg:g")
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("sample", function(d, i) {return samples[i]})
  .attr("transform", function(d, i) { return "translate(" + energyy1(i) + ",0)"; });

  var rect = g.selectAll("rect");

  rect
  .data(function(energy){return energy;})
  .enter().append("svg:rect")
  .attr("transform", function(d, i) { return "translate(" + energyy0(i) + ",0)"; })
  .attr("width", energyy1.rangeBand())
  .attr("height", energyx)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return energyh - energyx(d); });

  energyVis.selectAll("rect").each(function(d,i) {$(this).tipsy({gravity: 's', title: function(){
    div = d3.select(this);
    parent_svgg = d3.select(div.node().parentNode);
    return parent_svgg.attr('sample')+': '+String($(this).attr('value'));
  }})});

  var text = energyVis.selectAll("text")
  .data(d3.range(energyn))
  .enter().append("svg:text")
  .attr("class", "group")
  .attr("transform", function(d, i) { return "translate(" + energyy0(i) + ",0)"; })
  .attr("x", energyy0.rangeBand() / 2)
  .attr("y", energyh+6)
  .attr("dy", ".71em")
  .attr("text-anchor", "middle")
  .text(function(d, i) { return energySectors[i].code });

}

function energyRedraw(newValue) {
  new_data = [];
  for(var i=0; i<energySectors.length; i++){
    new_data.push(newValue * total * (energySectors[i].ratio/100));
  }

  newenergyData = energy;
  newenergyData.pop();
  newenergyData.push(new_data);
  console.log(new_data);
  var g = energyVis.selectAll("g");
  g.data(newenergyData)
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("transform", function(d, i) { return "translate(" + energyy1(i) + ",0)"; });

  g.selectAll("rect")
  .data(function(newenergyData){return newenergyData;})
  .attr("transform", function(d, i) { return "translate(" + energyy0(i) + ",0)"; })
  .attr("width", energyy1.rangeBand())
  .attr("height", energyx)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return energyh - energyx(d); });

}
var urbanVis;
urban = [['43132.5','23185','12210','3687'],['66246','35671','54311','7850'],['66246','35671','54311','7850']];
urbanSectors = [{name:'Ministry of Urban Development - JNNURM Funds', code: 'MoUD JNNURM', ratio:40.374699837882},
              {name:'Ministry of Housing and Urban Poverty Alleviation - JNNURM Funds', code:'MoHUPA JNNURM', ratio:21.7402698716464},
              {name:'Ministry of Urban Development - Other Funds',code:'MoUD Others', ratio:33.1007203890832},
              {name:'Ministry of Housing and Urban Poverty Alleviation - Other Funds', code:'MoHUPA Others', ratio:4.78430990138836}];


function urbanDraw() {
  urbanx = d3.scale.linear().domain([0, 80000]).range([0, h]),

  urbanVis = d3.select("#urban_chart")
  .append("svg:svg")
  .append("svg:g")
  .attr("transform", "translate(50,25)");

  var g = urbanVis.selectAll("g")
  .data(urban)
  .enter().append("svg:g")
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("sample", function(d, i) {return samples[i]})
  .attr("transform", function(d, i) { return "translate(" + y1(i) + ",0)"; });

  var rect = g.selectAll("rect");

  rect
  .data(function(urban){return urban;})
  .enter().append("svg:rect")
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("width", y1.rangeBand())
  .attr("height", urbanx)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return h - urbanx(d); });

  urbanVis.selectAll("rect").each(function(d,i) {$(this).tipsy({gravity: 's', title: function(){
    div = d3.select(this);
    parent_svgg = d3.select(div.node().parentNode);
    return parent_svgg.attr('sample')+': '+String($(this).attr('value'));
  }})});

  var text = urbanVis.selectAll("text")
  .data(d3.range(n))
  .enter().append("svg:text")
  .attr("class", "group")
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("x", y0.rangeBand() / 2)
  .attr("y", h+6)
  .attr("dy", ".71em")
  .attr("text-anchor", "middle")
  .text(function(d, i) { return urbanSectors[i].code });

}

function urbanRedraw(newValue) {
  new_data = [];
  for(var i=0; i<urbanSectors.length; i++){
    new_data.push(newValue * total * (urbanSectors[i].ratio/100));
  }

  newurbanData = urban;
  newurbanData.pop();
  newurbanData.push(new_data);
  console.log(new_data);
  var g = urbanVis.selectAll("g");
  g.data(newurbanData)
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("transform", function(d, i) { return "translate(" + y1(i) + ",0)"; });

  g.selectAll("rect")
  .data(function(newurbanData){return newurbanData;})
  .attr("transform", function(d, i) { return "translate(" + y0(i) + ",0)"; })
  .attr("width", y1.rangeBand())
  .attr("height", x)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return h - x(d); });

}


rural = [['100000','26882.21','43251.07','20691.77','1397'],['165500','59585','124013','29006','65157'],['165500','59585','124013','29006','65157']];
ruralSectors = [{name: 'Mahatma Gandhi National Rural Employment Guarantee Act',code:'MHNREGA', ratio:37.3369188807497},
                {name: 'Indira Awas Yojana', code:'IWY', ratio:13.4424188006615},
                {name: "Prime Minister's Gram Sadak Yojana", code: 'PMGSY', ratio:27.9774218801113},
                {name: 'National Rural Livelihood Mission', code:'NRLM', ratio:6.5437744353778},
                {name: 'Other', code:'Other', ratio:14.6994660030998}];

var ruralVis;
var ruraln = 5;// number of samples
var ruralh = 300,
ruralw =500,
ruralx = d3.scale.linear().domain([0, 200000]).range([0, ruralh]),
ruraly0 = d3.scale.ordinal().domain(d3.range(ruraln)).rangeBands([0, ruralw], .2),
ruraly1 = d3.scale.ordinal().domain(d3.range(m)).rangeBands([0, ruraly0.rangeBand()]);
function ruralDraw() {

  ruralVis = d3.select("#rural_chart")
  .append("svg:svg")
  .append("svg:g")
  .attr("transform", "translate(50,25)");

  var g = ruralVis.selectAll("g")
  .data(rural)
  .enter().append("svg:g")
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("sample", function(d, i) {return samples[i]})
  .attr("transform", function(d, i) { return "translate(" + ruraly1(i) + ",0)"; });

  var rect = g.selectAll("rect");

  rect
  .data(function(rural){return rural;})
  .enter().append("svg:rect")
  .attr("transform", function(d, i) { return "translate(" + ruraly0(i) + ",0)"; })
  .attr("width", ruraly1.rangeBand())
  .attr("height", ruralx)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return ruralh - ruralx(d); });

  ruralVis.selectAll("rect").each(function(d,i) {$(this).tipsy({gravity: 's', title: function(){
    div = d3.select(this);
    parent_svgg = d3.select(div.node().parentNode);
    return parent_svgg.attr('sample')+': '+String($(this).attr('value'));
  }})});

  var text = ruralVis.selectAll("text")
  .data(d3.range(ruraln))
  .enter().append("svg:text")
  .attr("class", "group")
  .attr("transform", function(d, i) { return "translate(" + ruraly0(i) + ",0)"; })
  .attr("x", ruraly0.rangeBand() / 2)
  .attr("y", ruralh+6)
  .attr("dy", ".71em")
  .attr("text-anchor", "middle")
  .text(function(d, i) { return ruralSectors[i].code });

}

function ruralRedraw(newValue) {
  new_data = [];
  for(var i=0; i<ruralSectors.length; i++){
    new_data.push(newValue * total * (ruralSectors[i].ratio/100));
  }

  newruralData = rural;
  newruralData.pop();
  newruralData.push(new_data);
  console.log(new_data);
  var g = ruralVis.selectAll("g");
  g.data(newruralData)
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("transform", function(d, i) { return "translate(" + ruraly1(i) + ",0)"; });

  g.selectAll("rect")
  .data(function(newruralData){return newruralData;})
  .attr("transform", function(d, i) { return "translate(" + ruraly0(i) + ",0)"; })
  .attr("width", ruraly1.rangeBand())
  .attr("height", ruralx)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return ruralh - ruralx(d); });

}

environment = [[119,1826.47,2611.44,2760.75,1913.34],[230.742173112339,3541.54333549995,5063.6079038024,5353.12146571336,3709.98512187195],[230.742173112339,3541.54333549995,5063.6079038024,5353.12146571336,3709.98512187195]];
environmentSectors = [{name: 'Animal Welfare', code:'AW', ratio:1.28913443830571},
                      {name: 'National Afforestation and Eco Development Board', code: 'NAEDB', ratio:19.7862636767414},
                      {name: 'Forests and Wildlife', code: 'F & W', ratio:28.2898927526812},
                      {name: 'National River Conservation Plan', code:'NRCP', ratio:29.9073773155671},
                      {name: 'Environment', code:'Environment', ratio:20.7273318167046}];
var environmentVis;
var environmentn = 5;// number of samples
var environmenth = 300,
environmentw =500,
environmentx = d3.scale.linear().domain([0, 7000]).range([0, environmenth]),
environmenty0 = d3.scale.ordinal().domain(d3.range(environmentn)).rangeBands([0, environmentw], .2),
environmenty1 = d3.scale.ordinal().domain(d3.range(m)).rangeBands([0, environmenty0.rangeBand()]);
function environmentDraw() {

  environmentVis = d3.select("#environment_chart")
  .append("svg:svg")
  .append("svg:g")
  .attr("transform", "translate(50,25)");

  var g = environmentVis.selectAll("g")
  .data(environment)
  .enter().append("svg:g")
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("sample", function(d, i) {return samples[i]})
  .attr("transform", function(d, i) { return "translate(" + environmenty1(i) + ",0)"; });

  var rect = g.selectAll("rect");

  rect
  .data(function(environment){return environment;})
  .enter().append("svg:rect")
  .attr("transform", function(d, i) { return "translate(" + environmenty0(i) + ",0)"; })
  .attr("width", environmenty1.rangeBand())
  .attr("height", environmentx)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return environmenth - environmentx(d); });

  environmentVis.selectAll("rect").each(function(d,i) {$(this).tipsy({gravity: 's', title: function(){
    div = d3.select(this);
    parent_svgg = d3.select(div.node().parentNode);
    return parent_svgg.attr('sample')+': '+String($(this).attr('value'));
  }})});

  var text = environmentVis.selectAll("text")
  .data(d3.range(environmentn))
  .enter().append("svg:text")
  .attr("class", "group")
  .attr("transform", function(d, i) { return "translate(" + environmenty0(i) + ",0)"; })
  .attr("x", environmenty0.rangeBand() / 2)
  .attr("y", environmenth+6)
  .attr("dy", ".71em")
  .attr("text-anchor", "middle")
  .text(function(d, i) { return environmentSectors[i].code });

}

function environmentRedraw(newValue) {
  new_data = [];
  for(var i=0; i<environmentSectors.length; i++){
    new_data.push(newValue * total * (environmentSectors[i].ratio/100));
  }

  newenvironmentData = environment;
  newenvironmentData.pop();
  newenvironmentData.push(new_data);
  console.log(new_data);
  var g = environmentVis.selectAll("g");
  g.data(newenvironmentData)
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("transform", function(d, i) { return "translate(" + environmenty1(i) + ",0)"; });

  g.selectAll("rect")
  .data(function(newenvironmentData){return newenvironmentData;})
  .attr("transform", function(d, i) { return "translate(" + environmenty0(i) + ",0)"; })
  .attr("width", environmenty1.rangeBand())
  .attr("height", environmentx)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return environmenth - environmentx(d); });

}

education = [[71000,55390,48000,84942.79,2499.6],[192726,60147,90155,110700,13223],[192726,60147,90155,110700,13223]];
educationSectors = [{name:'Sarva Siksha Abhiyan', code:'SSA', ratio:41.2732813507199},
                    {name:'Senior and Secondary Education', code:'SSE', ratio:12.8807947728991},
                    {name:'Mid-Day Meal Scheme', code:'MMS', ratio:'19.3071649916158'},
                    {name:'Department of Higher Education', code:'DHE', ratio:23.7069842445995},
                    {name:'Ministry of Labour and Employment',code:'MLE', ratio:2.83177464016567}];

var educationVis;
var educationn = 5;// number of samples
var educationh = 300,
educationw =500,
educationx = d3.scale.linear().domain([0, 200000]).range([0, educationh]),
educationy0 = d3.scale.ordinal().domain(d3.range(educationn)).rangeBands([0, educationw], .2),
educationy1 = d3.scale.ordinal().domain(d3.range(m)).rangeBands([0, educationy0.rangeBand()]);
function educationDraw() {

  educationVis = d3.select("#education_chart")
  .append("svg:svg")
  .append("svg:g")
  .attr("transform", "translate(50,25)");

  var g = educationVis.selectAll("g")
  .data(education)
  .enter().append("svg:g")
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("sample", function(d, i) {return samples[i]})
  .attr("transform", function(d, i) { return "translate(" + educationy1(i) + ",0)"; });

  var rect = g.selectAll("rect");

  rect
  .data(function(education){return education;})
  .enter().append("svg:rect")
  .attr("transform", function(d, i) { return "translate(" + educationy0(i) + ",0)"; })
  .attr("width", educationy1.rangeBand())
  .attr("height", educationx)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return educationh - educationx(d); });

  educationVis.selectAll("rect").each(function(d,i) {$(this).tipsy({gravity: 's', title: function(){
    div = d3.select(this);
    parent_svgg = d3.select(div.node().parentNode);
    return parent_svgg.attr('sample')+': '+String($(this).attr('value'));
  }})});

  var text = educationVis.selectAll("text")
  .data(d3.range(educationn))
  .enter().append("svg:text")
  .attr("class", "group")
  .attr("transform", function(d, i) { return "translate(" + educationy0(i) + ",0)"; })
  .attr("x", educationy0.rangeBand() / 2)
  .attr("y", educationh+6)
  .attr("dy", ".71em")
  .attr("text-anchor", "middle")
  .text(function(d, i) { return educationSectors[i].code });

}

function educationRedraw(newValue) {
  new_data = [];
  for(var i=0; i<educationSectors.length; i++){
    new_data.push(newValue * total * (educationSectors[i].ratio/100));
  }

  neweducationData = education;
  neweducationData.pop();
  neweducationData.push(new_data);
  console.log(new_data);
  var g = educationVis.selectAll("g");
  g.data(neweducationData)
  .attr("fill", function(d, i) { return colors[i]; })
  .attr("transform", function(d, i) { return "translate(" + educationy1(i) + ",0)"; });

  g.selectAll("rect")
  .data(function(neweducationData){return neweducationData;})
  .attr("transform", function(d, i) { return "translate(" + educationy0(i) + ",0)"; })
  .attr("width", educationy1.rangeBand())
  .attr("height", educationx)
  .attr("value", function(d, i) {return d;})
  .transition()
  .delay(50)
  .attr("y", function(d) { return educationh - educationx(d); });

}
