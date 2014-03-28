/**
 * A Pie Chart draws a percentage data set, in a circular display.
 */
function PieChart(options){
    options = nv.utils.extend({}, options, {
        margin: {top: 30, right: 20, bottom: 20, left: 20},
        chartClass: 'pieChart',
        wrapClass: 'pieChartWrap'
    });

    Chart.call(this, options);
    this.pie = this.getPie();
    this.pie.showLabels(true);
}

nv.utils.create(PieChart, Chart, {});

PieChart.prototype.getPie = function(){
    return nv.models.pie();
};

/**
 * @override Layer::draw
 */
PieChart.prototype.draw = function(data){
    this.pie
      .width(this.available.width)
      .height(this.available.height);

    var pieChartWrap = this.g.select('.nv-pieChartWrap').datum(data);
    d3.transition(pieChartWrap).call(this.pie);
};

/**
 * Set up listeners for dispatches fired on the underlying
 * pie graph.
 *
 * @override PieChart::onDispatches
 */
PieChart.prototype.attachEvents = function(){
    Chart.prototype.attachEvents.call(this);

    this.pie.dispatch.on('elementMouseout.tooltip', function(e) {
      this.dispatch.tooltipHide(e);
    }.bind(this));

    this.pie.dispatch.on('elementMouseover.tooltip', function(e) {
      e.pos = [e.pos[0] +  this.margin().left, e.pos[1] + this.margin().top];
      this.dispatch.tooltipShow(e);
    }.bind(this));
};

/**
 * Set the underlying color, on both the chart, and the composites.
 */
PieChart.prototype.color = function(_){
    if (!arguments.length) return this.color;
    this.options.color = nv.utils.getColor(_);
    this.legend.color(this.options.color);
    this.pie.color(this.options.color);
    return this;
};

/**
 * Calculate where to show the tooltip on a pie chart.
 */
PieChart.prototype.showTooltip = function(e, offsetElement) {
    var tooltipLabel = this.pie.description()(e.point) || this.pie.x()(e.point);
    var left = e.pos[0] + ( (offsetElement && offsetElement.offsetLeft) || 0 ),
        top = e.pos[1] + ( (offsetElement && offsetElement.offsetTop) || 0),
        y = this.pie.valueFormat()(this.pie.y()(e.point)),
        content = this.tooltip()(tooltipLabel, y);

    nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
};

/**
 * The PieChart model retuns a function wrapping an instance of a PieChart.
 */
nv.models.pieChart = function() {
  "use strict";

  var pieChart = new PieChart();

  function chart(selection) {
    pieChart.render(selection);
    return chart;
  }

  chart.legend = pieChart.legend;
  chart.dispatch = pieChart.dispatch;
  chart.pie = pieChart.pie;

  d3.rebind(chart, pieChart.pie, 'valueFormat', 'values', 'x', 'y', 'description', 'id', 'showLabels', 'donutLabelsOutside', 'pieLabelsOutside', 'labelType', 'donut', 'donutRatio', 'labelThreshold');
  chart.options = nv.utils.optionsFunc.bind(chart);

  nv.utils.rebindp(chart, pieChart, PieChart.prototype, 'margin', 'width', 'height', 'color', 'tooltips', 'tooltipContent', 'showLegend', 'duration', 'noData', 'state');

  return chart;
};