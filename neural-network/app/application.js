angular.module('app', [])

.controller("Controller", function($scope, $http, NeuralNetwork){

	var width = 1100,
		height = 500,
		r = 20;


	var inputNodes = [],
		interNodes = [],
		outputNodes = [],
		ws = [],
		vs = [],
		testDataErrors = [];

	var interval;
	var steper; // function to call to execute one cycle of training

	var data;

	$scope.config = {
		learningSpeed : 0.03,
		ratioTrainVsTest : 2,
		neuronLength : 3
	};

	$scope.chargeFile = function(d){
		data = d;
		$scope.columns = d.split('\n')[0].split(',');
		$scope.columnRadios = $scope.columns.map(function() { return 1; });
		$scope.columnRadios[$scope.columnRadios.length - 1] = 2;
		$scope.config.neuronLength = Math.round($scope.columns.length / 2);
	};

	$scope.chargeDefaultFile = function(){
		$http.get('/data.csv')
		.success(function(data){
			$scope.chargeFile(data);
		});
	};

	$scope.init = function(){

		angular.element(document.querySelectorAll("#config-form input")).attr("disabled", true);

		$scope.config.inColIndexes = $scope.columnRadios.reduce(function(pv, cv, i){
			if (cv == 1) pv.push(i);
			return pv;
		}, []);
		$scope.config.outColIndexes = $scope.columnRadios.reduce(function(pv, cv, i){
			if (cv == 2) pv.push(i);
			return pv;
		}, []);
		console.log($scope.config)
		init(data, $scope.config);
	};


	function init(data, config){

		d3.select("#neural-network").selectAll("*").remove();

		NeuralNetwork.init(data, config);
		steper = NeuralNetwork.trainNetwork();

		initMsg = steper();

		inputNodes = initMsg.inputNodes;
		interNodes = initMsg.interNodes;
		outputNodes= initMsg.outputNodes;
		ws = initMsg.w;
		vs = initMsg.v;

		initDiagramme();

		//beginInterval();
		$scope.action = "Start"
	}

	function beginInterval(){
		$scope.action = "Stop";

		interval = setInterval(function(){
			var msg = steper() ;

			inputNodes = msg.inputNodes;
			interNodes = msg.interNodes;
			outputNodes= msg.outputNodes;
			ws = msg.w;
			vs = msg.v;

			testDataErrors.push( msg.testErrors );

			update();

		}, 20) // update speed 20ms
	}

	$scope.toggle = function(){
		if ($scope.action === "Stop"){
			clearInterval(interval);
			$scope.action = "Continue"
		} else {
			beginInterval();
		}
	}

	function update(){

		d3.selectAll(".outputNodesBias")
			.data(outputNodes)
			.text(function(d) { return d.bias.toFixed(4) })

		d3.selectAll('.interNode text')
			.data(interNodes)
			.text(function(d) { return d.bias.toFixed(4) })

		d3.selectAll('.w')
			.data(ws)
			.selectAll('text')
			.data(function(d) { return d } )
		  	.text(function(d) { return d.toFixed(4) } )

		d3.selectAll('.v')
			.data(vs)
			.selectAll('text')
			.data(function(d) { return d } )
		  	.text(function(d) { return d.toFixed(4) } )

		plot.update();
	}


	function initDiagramme(){

		var svg = d3.select("#neural-network").append("svg")
					.attr("width", width)
					.attr("height", height);


		var setParamsForCalcPos = function(height, length, x) {
			var margin   = length > 0 ? height / length / 2 : 0;
			var distance = length > 1 ? (height - (margin * 2)) / (length - 1) : 0;

			return  {
				getX : function () {
					return x;
				},

				getY : function (i) {
					return i * distance + margin;
				}
			}
		};

		var inputNodePos = setParamsForCalcPos(height, inputNodes.length, width * 0.15);
		var interNodePos = setParamsForCalcPos(height, interNodes.length, width * 0.5);
		var outputNodePos = setParamsForCalcPos(height, outputNodes.length, width * 0.85);


		var w = svg.selectAll('.w')
				.data(ws)
			.enter().append("g")
				.attr("class", "w")
				.selectAll('w2')
				.data(function(d) { return d } )
			.enter().append("g")
				.attr("class", "w2")

		w.append("line")
			.attr("x1", function(d) { return inputNodePos.getX() })
			.attr("y1", function(d, i, j) { return inputNodePos.getY(i) })
			.attr("x2", function(d) { return interNodePos.getX() })
			.attr("y2", function(d, i, j) { return interNodePos.getY(j) })

		w.append("text")
			.attr("x", function(d) { return (inputNodePos.getX() + interNodePos.getX())/2})
			.attr("y", function(d, i, j) { return (inputNodePos.getY(i) + interNodePos.getY(j))/2 - 2})
			.text(function(d) { return d.toFixed(4) } )

		var v = svg.selectAll('.v')
				.data(vs)
			.enter().append("g")
				.attr("class", "v")
				.selectAll('.v2')
				.data(function(d) { return d } )
			.enter().append("g")
				.attr("class", "v2");

		v.append("line")
			.attr("x1", function(d) { return interNodePos.getX() })
			.attr("y1", function(d, i, j) { return interNodePos.getY(i) })
			.attr("x2", function(d) { return outputNodePos.getX() })
			.attr("y2", function(d, i, j) { return outputNodePos.getY(j) });

		v.append("text")
			.attr("x", function(d) { return (interNodePos.getX() + outputNodePos.getX())/2})
			.attr("y", function(d, i, j) { return (interNodePos.getY(i) + outputNodePos.getY(j))/2 - 2})
			.text(function(d) { return d.toFixed(4) } );

		var inputNode = 
			svg.selectAll(".inputNode")
			   .data(inputNodes)
			.enter().append("g")
			   .attr("class", "inputNode")
			   .attr("transform", function(d, i) { return "translate(" + inputNodePos.getX() + "," + inputNodePos.getY(i) + ")" });

		inputNode.append("line")
			 	.attr("x1", - width * 0.08);

		inputNode.append("circle")
			   .attr("r", r);

		inputNode.append("text")
			 	.text(function(d) { return d.name })
			 	.attr("x", - width * 0.15)
			 	.attr("y", 2);


		var interNode = 
			svg.selectAll(".interNode")
			   .data(interNodes)
			 .enter().append("g")
			   .attr("class", "interNode")
			   .attr("transform", function(d, i) { return "translate(" + interNodePos.getX() + "," + interNodePos.getY(i) + ")" });

		
		interNode.append("line")
				.attr("y1", -50 )
				.attr("x1", -20 );
		interNode.append("circle")
			   .attr("r", r);
		interNode.append("text")
			 	.text(function(d) { return d.bias.toFixed(4) })
			 	.attr("x", -12)
			 	.attr("y", -35);

		

		var outputNode = 
			svg.selectAll(".outputNode")
			   .data(outputNodes)
			 .enter().append("g")
			   .attr("class", "outputNode")
			   .attr("transform", function(d, i) { return "translate(" + outputNodePos.getX() + "," + outputNodePos.getY(i) + ")" });

		outputNode.append("line")
			.attr("y1", -50 )
			.attr("x1", -20 );
		outputNode.append("text")
			.attr("class", "outputNodesBias")
			.text(function(d) { return d.bias.toFixed(4) })
		 	.attr("x", -12)
		 	.attr("y", -35);

		outputNode.append("line")
			.attr("x2", width * 0.07);

		outputNode.append("text")
		 	.text(function(d) { return d.name })
		 	.attr("x",  width * 0.08)
		 	.attr("y", 2);

		outputNode.append("circle")
			   .attr("r", r)
	}


	var plot = {
		svg : null,
		maxX : null,
		maxY : null,
		scaleX : null,
		scaleY : null
	}

	plot.init = function(maxX, maxY) {

		maxX = this.maxX = maxX || 100; // 300 cycles
		maxY = this.maxY = maxY || 20;  // 20% error

		var margin = {top: 20, right: 20, bottom: 30, left: 40},
    		width = 960 - margin.left - margin.right,
    		height = 500 - margin.top - margin.bottom;

    	var x = this.scaleX = d3.scale.linear()
		    .range([0, width])
		    .domain([0, maxX]);

		var y = this.scaleY = d3.scale.linear()
		    .range([height, 0])
		    .domain([8, maxY]);

		var color = d3.scale.category10();

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left");

		var svg = this.svg = d3.select("#error-plot").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.attr("class", "label")
			.attr("x", width)
			.attr("y", -6)
			.style("text-anchor", "end")
			.text("Train Cycle");

		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("class", "label")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Test Error (%)");
	};

	plot.update = function() {


		if (testDataErrors.length > this.maxX) {

			d3.select("#error-plot").selectAll("*").remove();
			this.init(2 * testDataErrors.length);

		}

		var x = this.scaleX,
			y = this.scaleY;

		this.svg.selectAll(".test-error-dots")
			.data(testDataErrors)
			.enter().append("g")
			.attr("class", "test-error-dots")
			.selectAll("circle")
			.data(function(d) { return d; })
			.enter().append("circle");

		this.svg.selectAll(".test-error-dots")
			.data(testDataErrors)
			.selectAll("circle")
			.data(function(d) { return d; })
			.attr("r", 0.3)
			.attr("cx", function(d, i, j) { return x(j); })
			.attr("cy", function(d) { return y(d * 100); });
	};

	plot.init();

	$scope.predict = function(inputs) {
		inputs = inputs.split(",");
		$scope.results = NeuralNetwork.predict(inputs).map(function(v) { return v.toFixed(4) });
	}

});




angular.module("app").directive('onReadFile', function ($parse) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			var fn = $parse(attrs.onReadFile);

			element.on('change', function(onChangeEvent) {
				var reader = new FileReader();

				reader.onload = function(onLoadEvent) {
					scope.$apply(function() {
						fn(scope, {$fileContent:onLoadEvent.target.result});
					});
				};

				reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
			});
		}
	};
});






