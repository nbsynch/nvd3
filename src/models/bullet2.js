

// Chart design based on the recommendations of Stephen Few. Implementation
// based on the work of Clint Ivy, Jamie Love, and Jason Davies.
// http://projects.instantcognition.com/protovis/bulletchart/

nv.models.bullet2 = function () {
    "use strict";
    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = { top: 0, right: 0, bottom: 0, left: 0 }
      , orient = 'left' // TODO top & bottom
      , reverse = false
      , ranges = function (d) { return d.ranges }
      , rangeColors = function (d) { return d.rangeColors }
      , markers = function (d) { return d.markers }
      , measures = function (d) { return d.measures }
      , rangeLabels = function (d) { return d.rangeLabels ? d.rangeLabels : [] }
      , markerLabels = function (d) { return d.markerLabels ? d.markerLabels : [] }
      , measureLabels = function (d) { return d.measureLabels ? d.measureLabels : [] }
      , forceX = [0] // List of numbers to Force into the X scale (ie. 0, or a max / min, etc.)
      , width = 380
      , height = 30
      , tickFormat = null
      , color = '#000'// nv.utils.getColor(['#1f77b4'])
      , dispatch = d3.dispatch('elementMouseover', 'elementMouseout')
    ;

    //============================================================


    function chart(selection) {
        selection.each(function (d, i) {
            var availableWidth = width - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom,
                container = d3.select(this);

            var rangez = ranges.call(this, d, i).slice().sort(d3.descending),
                markerz = markers.call(this, d, i).slice().sort(d3.descending),
                measurez = measures.call(this, d, i).slice().sort(d3.descending),
                rangeLabelz = rangeLabels.call(this, d, i).slice(),
                markerLabelz = markerLabels.call(this, d, i).slice(),
                measureLabelz = measureLabels.call(this, d, i).slice(),
                tickFormatz = tickFormat;


            //------------------------------------------------------------
            // Setup Scales

            //// Compute the new x-scale.
            //var x1 = d3.scale.linear()
            //    .dodomain(d3.extent(d3.merge([forceX, rangez])))
            //    .range(reverse ? [availableWidth, 0] : [0, availableWidth]);

            //// Retrieve the old x-scale, if this is an update.
            //var x0 = this.__chart__ || d3.scale.linear()
            //    .dodomain([0, Infinity])
            //    .range(x1.range());


            //////////////////////////////////////
            ////////////////////////////////////

            // Compute the new x-scale.
            var x1 = d3.scale.linear()
                .dodomain([Math.min(rangez[rangez.length - 1]), Math.max(rangez[0])])  // TODO: need to allow forceX and forceY, and xDomain, yDomain
                .range(reverse ? [availableWidth, 0] : [0, availableWidth]);

            // Retrieve the old x-scale, if this is an update.
            var x0 = this.__chart__ || d3.scale.linear()
                .dodomain([0, Infinity])
                .range(x1.range());

            /////////////////////////////
            ////////////////////////////



            // Stash the new scale.
            this.__chart__ = x1;


            var rangeMin = d3.min(rangez), //rangez[2]
                rangeMax = d3.max(rangez), //rangez[0]
                rangeAvg = rangez[1];

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Setup containers and skeleton of chart

            var wrap = container.selectAll('g.nv-wrap.nv-bullet').data([d]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-bullet');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            //gEnter.append('rect').attr('class', 'nv-range nv-rangeMax');
            //gEnter.append('rect').attr('class', 'nv-range nv-rangeAvg');
            //gEnter.append('rect').attr('class', 'nv-range nv-rangeMin');

            for (var i = 0; i < ranges.call(this, d, i).length; i++) {
                gEnter.append('rect').attr('class', 'nv-range nv-range-'+i);
            }


            gEnter.append('rect').attr('class', 'nv-measure');
            gEnter.append('path').attr('class', 'nv-markerTriangle');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            //------------------------------------------------------------



            var w0 = function (d) { return Math.abs(x0(d) - x0(0)) }, // TODO: could optimize by precalculating x0(0) and x1(0)
                w1 = function (d) { return Math.abs(x1(d) - x1(0)) };
            var xp0 = function (d) { return d < 0 ? x0(d) : x0(0) },
                xp1 = function (d) { return d < 0 ? x1(d) : x1(0) };


       
            for (var i = 1; i < ranges.call(this, d, i).length; i++) {
                var start = ranges.call(this, d, i)[i-1];
                var end = ranges.call(this, d, i)[i];
                g.select('rect.nv-range-' + i)
                    .attr('height', availableHeight)
                    .attr('width', x1(end)- x1(start))
                    .attr('x', x1(start))
                    .style('fill', rangeColors.call(this, d, i)[i-1])
                    .datum(ranges.call(this, d, i)[i]);

                start += ranges.call(this, d, i)[i];
            }


            /*
            .attr('width', rangeMax <= 0 ?
                               x1(rangeAvg) - x1(rangeMin)
                             : x1(rangeMax) - x1(rangeAvg))
            .attr('x', rangeMax <= 0 ?
                           x1(rangeMin)
                         : x1(rangeAvg))
                        */

            g.select('rect.nv-measure')
                .style('fill', color)
                .attr('height', availableHeight / 3)
                .attr('y', availableHeight / 3)
                .attr('width', measurez[0] > rangeMax ? x1(rangeMax) : x1(measurez[0]))
                .attr('x', x1(rangeMin))
                .on('mouseover', function () {
                    dispatch.elementMouseover({
                        value: tickFormat(measurez[0]),
                        label: measureLabelz[0] || 'Current',
                        pos: [x1(0), availableHeight / 2]
                    })
                })
                .on('mouseout', function () {
                    dispatch.elementMouseout({
                        value: tickFormat(measurez[0]),
                        label: measureLabelz[0] || 'Current'
                    })
                })

            var h3 = availableHeight / 6;
            if (markerz[0]) {
                var markerX = (markerz[0] > rangeMax ? x1(rangeMax) : x1(markerz[0]));

                g.selectAll('path.nv-markerTriangle')
                    .attr('transform', function (d) { return 'translate(' + markerX  + ',' + (availableHeight / 2) + ')' })
                    .attr('d', 'M0,' + h3 + 'L' + h3 + ',' + (-h3) + ' ' + (-h3) + ',' + (-h3) + 'Z')
                    .on('mouseover', function () {
                        dispatch.elementMouseover({
                            value: tickFormat(markerz[0]),
                            label: markerLabelz[0] || 'Marker',
                            pos: [markerX, availableHeight / 2]
                        })
                    })
                    .on('mouseout', function () {
                        dispatch.elementMouseout({
                            value: tickFormat(markerz[0]),
                            label: markerLabelz[0] || 'Marker'
                        })
                    });
            } else {
                g.selectAll('path.nv-markerTriangle').remove();
            }

            wrap.selectAll('.nv-range')
                .on('mouseover', function (d, i) {
                    var label = rangeLabelz[i] || (!i ? "Maximum" : i == 1 ? "Mean" : "Minimum");


                    

                    dispatch.elementMouseover({
                        value: tickFormat(d),
                        label: label,
                        pos: [x1(d), availableHeight / 2]
                    })
                })
                .on('mouseout', function (d, i) {
                    var label = rangeLabelz[i] || (!i ? "Maximum" : i == 1 ? "Mean" : "Minimum");

                    dispatch.elementMouseout({
                        value: tickFormat(d),
                        label: label
                    })
                })

        });

        // d3.timer.flush();  // Not needed?

        return chart;
    }


    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;

    chart.options = nv.utils.optionsFunc.bind(chart);

    // left, right, top, bottom
    chart.orient = function (_) {
        if (!arguments.length) return orient;
        orient = _;
        reverse = orient == 'right' || orient == 'bottom';
        return chart;
    };

    // ranges (bad, satisfactory, good)
    chart.ranges = function (_) {
        if (!arguments.length) return ranges;
        ranges = _;
        return chart;
    };

    // markers (previous, goal)
    chart.markers = function (_) {
        if (!arguments.length) return markers;
        markers = _;
        return chart;
    };

    // measures (actual, forecast)
    chart.measures = function (_) {
        if (!arguments.length) return measures;
        measures = _;
        return chart;
    };

    chart.forceX = function (_) {
        if (!arguments.length) return forceX;
        forceX = _;
        return chart;
    };

    chart.width = function (_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function (_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.margin = function (_) {
        if (!arguments.length) return margin;
        margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
        margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
        margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
        margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
        return chart;
    };

    chart.tickFormat = function (_) {
        if (!arguments.length) return tickFormat;
        tickFormat = _;
        return chart;
    };

    chart.color = function (_) {
        if (!arguments.length) return color;
        color = nv.utils.getColor(_);
        return chart;
    };

    //============================================================


    return chart;
};




// Chart design based on the recommendations of Stephen Few. Implementation
// based on the work of Clint Ivy, Jamie Love, and Jason Davies.
// http://projects.instantcognition.com/protovis/bulletchart/
nv.models.bulletChart2 = function () {
    "use strict";
    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var bullet = nv.models.bullet2()
    ;

    var orient = 'left' // TODO top & bottom
      , reverse = false
      , margin = { top: 5, right: 40, bottom: 20, left: 120 }
      , ranges = function (d) { return d.ranges }
      , markers = function (d) { return d.markers }
      , measures = function (d) { return d.measures }
      , width = null
      , height = 55
      , tickFormat = null
      , tooltips = true
      , tooltip = function (key, x, y, e, graph) {
          return '<h3>' + x + '</h3>' +
                 '<p>' + y + '</p>'
      }
      , noData = 'No Data Available.'
      , dispatch = d3.dispatch('tooltipShow', 'tooltipHide')
      , maxTickSize = 100
    ;

    //============================================================


    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function (e, offsetElement) {
        var left = e.pos[0] + (offsetElement.offsetLeft || 0) + margin.left,
            top = e.pos[1] + (offsetElement.offsetTop || 0) + margin.top,
            content = tooltip(e.key, e.label, e.value, e, chart);

        nv.tooltip.show([left, top], content, e.value < 0 ? 'e' : 'w', null, offsetElement);
    };

    //============================================================



    function chart(selection) {
        selection.each(function (d, i) {
            var container = d3.select(this);
            var rangez = ranges.call(this, d, i).slice().sort(d3.descending);

            var availableWidth = (width || parseInt(container.style('width')) || 960)
                                   - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom,
                that = this;


            chart.update = function () { chart(selection) };
            chart.container = this;

            //------------------------------------------------------------
            // Display No Data message if there's nothing to show.

            if (!d || !ranges.call(this, d, i)) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                  .attr('class', 'nvd3 nv-noData')
                  .attr('dy', '-.7em')
                  .style('text-anchor', 'middle');

                noDataText
                  .attr('x', margin.left + availableWidth / 2)
                  .attr('y', 18 + margin.top + availableHeight / 2)
                  .text(function (d) { return d });

                return chart;
            } else {
                container.selectAll('.nv-noData').remove();
            }

            //------------------------------------------------------------



            var rangez = ranges.call(this, d, i).slice().sort(d3.descending),
                markerz = markers.call(this, d, i).slice().sort(d3.descending),
                measurez = measures.call(this, d, i).slice().sort(d3.descending);


            //------------------------------------------------------------
            // Setup containers and skeleton of chart

            var wrap = container.selectAll('g.nv-wrap.nv-bulletChart').data([d]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-bulletChart');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-bulletWrap');
            gEnter.append('g').attr('class', 'nv-titles');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            //------------------------------------------------------------


            // Compute the new x-scale.
            var x1 = d3.scale.linear()
                .dodomain([Math.min(rangez[rangez.length-1]), Math.max(rangez[0])])  // TODO: need to allow forceX and forceY, and xDomain, yDomain
                .range(reverse ? [availableWidth, 0] : [0, availableWidth]);

            // Retrieve the old x-scale, if this is an update.
            var x0 = this.__chart__ || d3.scale.linear()
                .dodomain([0, Infinity])
                .range(x1.range());

            // Stash the new scale.
            this.__chart__ = x1;

            /*
            // Derive width-scales from the x-scales.
            var w0 = bulletWidth(x0),
                w1 = bulletWidth(x1);
      
            function bulletWidth(x) {
              var x0 = x(0);
              return function(d) {
                return Math.abs(x(d) - x(0));
              };
            }
      
            function bulletTranslate(x) {
              return function(d) {
                return 'translate(' + x(d) + ',0)';
              };
            }
            */

            var w0 = function (d) { return Math.abs(x0(d) - x0(0)) }, // TODO: could optimize by precalculating x0(0) and x1(0)
                w1 = function (d) { return Math.abs(x1(d) - x1(0)) };


            var title = gEnter.select('.nv-titles').append('g')
                .attr('text-anchor', 'end')
                .attr('transform', 'translate(-6,' + (height - margin.top - margin.bottom) / 2 + ')');
            title.append('text')
                .attr('class', 'nv-title')
                .text(function (d) { return d.title; });

            title.append('text')
                .attr('class', 'nv-subtitle')
                .attr('dy', '1em')
                .text(function (d) { return d.subtitle; });



            bullet
              .width(availableWidth)
              .height(availableHeight)

            var bulletWrap = g.select('.nv-bulletWrap');

            d3.transition(bulletWrap).call(bullet);



            

            // Compute the tick format.
            var format = tickFormat || x1.tickFormat(availableWidth / 100);

            // Update the tick groups.
            var tick = g.selectAll('g.nv-tick')
                .data(x1.ticks(availableWidth / maxTickSize), function (d) {
                    return this.textContent || format(d);
                });

            // Initialize the ticks with the old scale, x0.
            var tickEnter = tick.enter().append('g')
                .attr('class', 'nv-tick')
                .attr('transform', function (d) { return 'translate(' + x0(d) + ',0)' })
                .style('opacity', 1e-6);

            tickEnter.append('line')
                .attr('stroke', '#000')
                .attr('y1', availableHeight)
                .attr('y2', availableHeight * 7 / 6);

            tickEnter.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '1em')
                .attr('y', availableHeight * 7 / 6)
                .text(format);


            // Transition the updating ticks to the new scale, x1.
            var tickUpdate = d3.transition(tick)
                .attr('transform', function (d) { return 'translate(' + x1(d) + ',0)' })
                .style('opacity', 1);

            tickUpdate.select('line')
                .attr('y1', availableHeight)
                .attr('y2', availableHeight * 7 / 6);

            tickUpdate.select('text')
                .attr('y', availableHeight * 7 / 6);

            // Transition the exiting ticks to the new scale, x1.
            d3.transition(tick.exit())
                .attr('transform', function (d) { return 'translate(' + x1(d) + ',0)' })
                .style('opacity', 1e-6)
                .remove();


            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            dispatch.on('tooltipShow', function (e) {
                e.key = d.title;
                if (tooltips) showTooltip(e, that.parentNode);
            });

            //============================================================

        });

        d3.timer.flush();

        return chart;
    }


    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    bullet.dispatch.on('elementMouseover.tooltip', function (e) {
        dispatch.tooltipShow(e);
    });

    bullet.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================


    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.bullet = bullet;

    d3.rebind(chart, bullet, 'color');

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart.MaxTickSize = function (x) {
        if (!arguments.length) return maxTickSize;
        maxTickSize = x;
        return chart;
    }


    // left, right, top, bottom
    chart.orient = function (x) {
        if (!arguments.length) return orient;
        orient = x;
        reverse = orient == 'right' || orient == 'bottom';
        return chart;
    };

    // ranges (bad, satisfactory, good)
    chart.ranges = function (x) {
        if (!arguments.length) return ranges;
        ranges = x;
        return chart;
    };

    // markers (previous, goal)
    chart.markers = function (x) {
        if (!arguments.length) return markers;
        markers = x;
        return chart;
    };

    // measures (actual, forecast)
    chart.measures = function (x) {
        if (!arguments.length) return measures;
        measures = x;
        return chart;
    };

    chart.width = function (x) {
        if (!arguments.length) return width;
        width = x;
        return chart;
    };

    chart.height = function (x) {
        if (!arguments.length) return height;
        height = x;
        return chart;
    };

    chart.margin = function (_) {
        if (!arguments.length) return margin;
        margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
        margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
        margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
        margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
        return chart;
    };

    chart.tickFormat = function (x) {
        if (!arguments.length) return tickFormat;
        tickFormat = x;
        bullet.tickFormat(x);
        return chart;
    };

    chart.tooltips = function (_) {
        if (!arguments.length) return tooltips;
        tooltips = _;
        return chart;
    };

    chart.tooltipContent = function (_) {
        if (!arguments.length) return tooltip;
        tooltip = _;
        return chart;
    };

    chart.noData = function (_) {
        if (!arguments.length) return noData;
        noData = _;
        return chart;
    };

    //============================================================


    return chart;
};


