# bbi-js
Prototype for javascript reading BigWig files

To see:
- `sh run.sh`
- Visit http://localhost:8000

Basic usage to read a bigwig file using JavaScript:

```
require(['bigwig'], function(bigwig) {
	var bbURI = './miapaca2_rnaseq.bigwig';
	$.when(bigwig.makeBwg(bbURI)).then(function(bb, err) {
		$('body').append("<h3>Information about " + bbURI + "</h3>");
		$('body').append("Version: " + bb.version + "<br>");
		$('body').append("Number of Zoom Levels: " + bb.numZoomLevels + "<br>");

	    $.when(bb.readWigData(1, 0, 249250620)).then(function(data) {
			$('body').append("Length: "+ data.length +"<br>");
        	$('body').append("readWigData: ");
	        $('body').append($.map(data, function(obj){return JSON.stringify(obj.score)}).join(' '));
    	    $('body').append("<br>");
		});
});
```
