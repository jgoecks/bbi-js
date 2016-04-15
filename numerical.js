/**
 * Functions to visualize numerical genomic data.
 */
define(["jquery", "d3.min", "vega"], function($, d3, vega) {

    /**
     * Draw a line chart with one or more data sources.
     */
    var drawLineChart = function(dataList, options) {
        options = options || {};

        // Set up chart-specific operations.
        var marksTemplate = "",
            marksFunc,
            dataConversionFunc;
        if (options.type === "line") {
            marksTemplate = "./chart_defs/line_marks.json";
            marksFunc = function(marksSpec, color) {
                marksSpec.properties.update.stroke.value = color;
            };
            dataConversionFunc = convertForLineOrFill;
        }
        else if (options.type === "fill") {
            marksTemplate = "./chart_defs/fill_marks.json";
            marksFunc = function(marksSpec, color) {
                marksSpec.properties.update.fill.value = color;
            };
            dataConversionFunc = convertForLineOrFill;
        }
        else if (options.type === "intensity") {
            marksTemplate = "./chart_defs/intensity_marks.json";
            marksFunc = function() {};
            dataConversionFunc = convertForIntensity;
        }


        // Load chart definition, update, and display.
        $.getJSON("./chart_defs/base.json", function(vizSpec) {
            $.getJSON(marksTemplate, function(marksSpec) {

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
                    converted_data = dataConversionFunc(data);

                    // Compute 90% quantile and set y max to that if its larger.
                    dataSetMax = d3.quantile($.map(data, function(d) { return d.score; }), 0.95);
                    if (dataSetMax > yMax) {
                        yMax = dataSetMax;
                    }

                    dataMarksSpec.from.data = name;
                    marksFunc(dataMarksSpec, color);
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

    /**
     * Convert data for line/fill display.
     */
    var convertForLineOrFill = function(data) {
        return $.map(data, function(interval) {
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
    };

    /**
     * Convert bigwig data for intensity display.
     */
    var convertForIntensity = function(data) {
        return $.map(data, function(interval) {
            if (interval.min === interval.max) {
                return {
                    chrompos: interval.min,
                    span: 1,
                    score: interval.score
                };
            }
            else {
                return {
                    chrompos: interval.min,
                    span: interval.max - interval.min,
                    score: interval.score
                };
            }
        });
    };

    return {
        drawLineChart: drawLineChart
    };
});
