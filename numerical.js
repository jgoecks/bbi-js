/**
 * Functions to visualize numerical genomic data.
 */
define(["jquery", "d3.min", "vega"], function($, d3, vega) {
    /**
     * Round to one decimal place.
     */
    var roundOneDecimal = function(number) {
        return Math.round(number * 10) / 10;
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
        return $.each(data, function(i, interval) {
            // Use chrompos for now, but could use min in the future.
            interval.chrompos = interval.min;

            // Round score to one decimal place.
            interval.score = roundOneDecimal(interval.score);

            // Add span for length of mark.
            var span = 1;
            if (interval.min !== interval.max) {
                span = interval.max - interval.min;
            }
            interval.span = span;
        });
    };

    /**
     * Attributes for each chart type.
     */
    var chartTypeDicts = {
        "line": {
            vizSpec: "./chart_defs/line_marks.json",
            convertData: convertForLineOrFill,
            fillSpec: function(spec, dataset) {
                spec.properties.update.stroke.value = dataset.color;
            }
        },
        "fill": {
            vizSpec: "./chart_defs/fill_marks.json",
            convertData: convertForLineOrFill,
            fillSpec: function(spec, dataset) {
                spec.properties.update.fill.value = dataset.color;
            }
        },
        "histogram": {
            vizSpec: "./chart_defs/histogram_marks.json",
            convertData: convertForIntensity,
            fillSpec: function(spec, dataset) {
                spec.properties.update.fill.value = dataset.color;
            }
        },
        "intensity": {
            vizSpec: "./chart_defs/histogram_marks.json",
            convertData: convertForIntensity,
            fillSpec: function(spec, dataset) {
                // HACK: convert histogram marks into intensity marks.
                spec.properties.update.fill = {
                    scale: "c",
                    field: "score"
                };
                delete spec.properties.update.y.field;
                spec.properties.update.y.value = d3.max($.map(dataset.data, function(d) { return d.score; }));
            }
        }
    };

    /**
     * Draw a numerical chart with one or more data sources.
     */
    var drawChart = function(dataList, options) {
        options = options || {};

        chartAttrs = chartTypeDicts[options.type];

        // Load chart definition, update, and display.
        $.getJSON(chartAttrs.vizSpec, function(vizSpec) {
            // Get basic marks.
            var marksSpec = vizSpec.marks.shift();

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
                    dataMarksSpec = $.extend(true, {}, marksSpec);

                // Convert features to datapoints. Each data point may be for a single
                // base or multiple bases.
                converted_data = chartAttrs.convertData(data);

                // Compute 90% quantile and set y max to that if its larger.
                dataSetMax = d3.quantile($.map(data, function(d) { return d.score; }), 0.95);
                if (dataSetMax > yMax) {
                    yMax = dataSetMax;
                }

                dataMarksSpec.from.data = name;
                chartAttrs.fillSpec(dataMarksSpec, dataset);
                vizSpec.marks.unshift(dataMarksSpec);
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
    };

    return {
        drawChart: drawChart
    };
});
