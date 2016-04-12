/**
 * Functions to visualize numerical genomic data.
 */
define(["jquery", "d3.min", "vega"], function($, d3, vega) {

    /**
     * Draw a line chart with one or more data sources.
     */
    var drawLineChart = function(dataList, options) {
        options = options || {};

        // Load chart definition, update, and display.
        $.getJSON("./chart_defs/base.json", function(vizSpec) {
            $.getJSON("./chart_defs/line_marks.json", function(marksSpec) {

                // Set chart attributes from options.
                if (options.ydomain) {
                    vizSpec.scales[1].domain = options.ydomain;
                }

                // Draw each dataset.
                var yMax = 0;
                for (var i = 0; i < dataList.length; i++) {
                    var dataset = dataList[i],
                        name = dataset.name,
                        data = dataset.data,
                        color = dataset.color,
                        dataMarksSpec = $.extend(true, {}, marksSpec);

                    // Convert features to datapoints. Each data point may be for a single
                    // base or multiple bases.
                    var converted_data = $.map(data, function(interval) {
                        if (interval.min === interval.max) {
                            return {
                                chrompos: interval.min,
                                score: interval.score
                            };
                        }
                        else {
                            return [
                                {
                                    chrompos: interval.min,
                                    score: interval.score
                                },
                                {
                                    chrompos: interval.max,
                                    score: interval.score
                                }
                            ];
                        }
                    });


                    // Compute 90% quantile and set y max to that if its larger.
                    dataSetMax = d3.quantile($.map(data, function(d) { return d.score; }), 0.95);
                    if (dataSetMax > yMax) {
                        yMax = dataSetMax;
                    }

                    dataMarksSpec.from.data = name;
                    dataMarksSpec.properties.update.stroke.value = color;
                    vizSpec.marks.push(dataMarksSpec);
                    vizSpec.data.push({
                        "name": name,
                        "values": converted_data
                    });
                }

                // Set yMax, multiplying by 1.5 to put maximum in middle of chart.
                vizSpec.scales[1].domain = [0, yMax * 1.5];
                vega.parse.spec(vizSpec, function(chart) {
                    chart({el:"#vis"}).update();
                });
            });


        });
    };

    return {
        drawLineChart: drawLineChart
    };
});
