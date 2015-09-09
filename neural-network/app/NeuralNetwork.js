angular.module('app')

.factory("NeuralNetwork", function(){

	var dataLength,
		inTitles,
		outTitles,

		inLength,
		outLength,
		neuronLength,

	    inData = [],
	    outData = [],

	    maxIn = [],
	    minIn = [],
	    maxOut = [],
	    minOut = [],

		inTestData = [],
		outTestData = [],


	    w = [], // input of a neuron
	    v = [], // output of a neuron
	    b = [],   // bias of neuron
	    a = [],   // bias of output 
	    learningSpeed,

		testErrors;


	function init(csvData, config) {

		config = config || {};

		var outColIndexes = config.outColIndexes || [11],
			inColIndexes  = config.inColIndexes || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			ratioTrainVsTest = config.ratioTrainVsTest || 2,
			learningSpeed = config.learningSpeed || 0.03,
			neuronLength  = config.neuronLength;


		var rawLines = csvData.split('\n');
		var titlesLine = rawLines.shift();
		var titles = titlesLine.split(',');


		// set inTitles and outTitles
		outTitles = [];
		inTitles = [];
		outColIndexes.forEach(function (i) {
			outTitles = outTitles.concat(titles[i]);
		});
		inColIndexes.forEach(function (i) {
			inTitles = inTitles.concat(titles[i]);
		});


		// set length
		inLength = inTitles.length;
		outLength = outTitles.length;

		neuronLength = neuronLength || Math.round((inLength + outLength) / 2);


		// set inData and outData, inTestData, outTestData
		rawLines.forEach(function (rawLine) {

			var dataLine = rawLine.split(',');

			var inDataLine = [];
			var outDataLine = [];

			outColIndexes.forEach(function (i) {
				outDataLine = outDataLine.concat(dataLine[i]);
			});
			inColIndexes.forEach(function (i) {
				inDataLine = inDataLine.concat(dataLine[i]);
			});

			inDataLine = inDataLine.map(Number);
			outDataLine = outDataLine.map(Number);

			if (Math.random() > 1 / (1 + ratioTrainVsTest)) {
				inData.push(inDataLine);
				outData.push(outDataLine);
			} else {
				inTestData.push(inDataLine);
				outTestData.push(outDataLine);
			}
		});

		dataLength = inData.length;

		setMaxMin();
		normalize();
		initNeuron();

		console.log("Init BP network successfully.");
	}

	function setMaxMin(){
	    var i, j;

	    for (i = 0; i < inLength; i++) {

	        minIn[i] = maxIn[i] = inData[0][i];

	        for(j = 0; j < dataLength; j++) { 

	            maxIn[i] = maxIn[i] > inData[j][i] ? maxIn[i] : inData[j][i];
	            minIn[i] = minIn[i] < inData[j][i] ? minIn[i] : inData[j][i];
	        }
	    }

	    for (i = 0; i < outLength; i++) {

	        minOut[i] = maxOut[i]=outData[0][i];

	        for (j = 0; j<dataLength; j++) {
	            maxOut[i] = maxOut[i] > outData[j][i] ? maxOut[i] : outData[j][i];
	            minOut[i] = minOut[i] < outData[j][i] ? minOut[i] : outData[j][i];
	        }
	    }
	}

	function normalize(){
	    var i, j;

	    for (i = 0; i < inLength; i++) {
	        for(j = 0; j < dataLength; j++) {
	            inData[j][i] = (inData[j][i] - minIn[i]) / (maxIn[i] - minIn[i]);
	        }
	    }
	            

	    for (i = 0; i < outLength; i++)
	        for(j = 0; j < dataLength; j++)
	            outData[j][i] = (outData[j][i] - minOut[i]) / (maxOut[i] - minOut[i]);
	}

	function initNeuron() {

	    var i, j;

	    for (i = 0; i < neuronLength; i++) {

	        w[i] = [];
	        
	        b[i] = Math.random() * 2 - 1;

	        for (j = 0; j < inLength; j++){ 

	            w[i][j] = Math.random() * 2 - 1;
	        }
	    }


	    for (j = 0; j < outLength; j++){ 

	        v[j] = [];

	        a[j] = Math.random() * 2 - 1;

	        for (i = 0; i < neuronLength; i++) {

	            v[j][i] = Math.random() * 2 - 1;
	        }
	    }
	}

	function sigmoid (x) {
		return 1 / (1 + Math.pow(2.7182818284, -x));
	}

	function compute(input){

	    var i,
	        j,
	        sum,
	        interOutput = [],
	        finalOutput = [];

	    for (i = 0; i < neuronLength; i++){

	        sum = b[i];

	        for (j = 0; j < inLength; j++){

	            sum += w[i][j] * input[j];
	        }

	        interOutput[i] = sigmoid(sum);
	    }

	    for (i = 0; i < outLength; i++){

	        sum = a[i];

	        for (j = 0; j < neuronLength; j++) {

	            sum += v[i][j] * interOutput[j];
	        }

	        finalOutput[i] = sum;
	    }   

	    return {
	        interOutput : interOutput,
	        finalOutput : finalOutput
	    }

	}

	function backUpdate(lineIndex, output){
	    var i, 
	        j, 
	        t,  // a sum used in calculation
	        dv,
	        dw,
	        da,
	        db;

	    var interOutput = output.interOutput,
	        finalOutput = output.finalOutput;

	    for (j = 0; j < outLength; j++) {

	        da = learningSpeed * (finalOutput[j] - outData[lineIndex][j]);
	        a[j] -= da;
	        
	        for (i = 0; i < neuronLength; i++) {        

	            dv = learningSpeed * (finalOutput[j] - outData[lineIndex][j]) * interOutput[i];

	            v[j][i] -= dv; 
	        }
	    }

	    for (i = 0; i < neuronLength; i++) {

	        t = 0;

	        for (j = 0; j < outLength; j++) {

	            t += (finalOutput[j]- outData[lineIndex][j]) * v[j][i];
	        }

	        db = learningSpeed * t * interOutput[i] * (1 - interOutput[i]);
	        b[i] -= db;

	        for (j = 0; j < inLength; j++){

	            dw = learningSpeed * t * interOutput[i] * (1 - interOutput[i]) * inData[lineIndex][j];

	            w[i][j] -= dw; 
	        }
	    }
	}

	function trainNetwork(){

		var c = 0,
			i = dataLength;

	    return function next(){

			while (i < dataLength) {

				backUpdate(i, compute(inData[i]));
				i++;
	    	}

	    	console.log("Training : " + c + " cycle finished");

			c++;
			i = 0;

			testAccuracy();

            return getNeuronNetwork();
	    }
	}

	function getNeuronNetwork() {

		var inputNodes = inTitles.map(function(v){
			return {
				name : v
			}
		});

		var interNodes = b.map(function(v){
			return { bias : v }
		});

		var outputNodes = outTitles.map(function(v, i){
			return  {
				name : v,
				bias : a[i]
			}
		});

		return {
			inputNodes: inputNodes,
			interNodes: interNodes,
			outputNodes: outputNodes,
			w: w,
			v: v,
			testErrors: testErrors
		}
	}

	function predict(originalInput){
		var i,
			input = [];

		for (i = 0; i < inLength; i++){
			input[i] = (originalInput[i] - minIn[i]) / (maxIn[i] - minIn[i]);
		}

		var output = compute(input).finalOutput;

		for (i = 0; i < outLength; i++) {
			output[i] = output[i] * ( maxOut[i] - minOut[i] ) + minOut[i];
		}

		return output;
	}

	function testAccuracy(){

		// create array with 0
		var sumErrs = outTitles.map(function() { return 0 });

		for (var i = 0, l = inTestData.length; i < l; i++) {
			var predictOut = predict((inTestData[i]));

			for (var j = 0, m = outLength; j < m; j++) {
				sumErrs[j] += Math.abs(predictOut[j] - outTestData[i][j]) / outTestData[i][j];
			}
		}

		testErrors = sumErrs.map(function(e) { return e /inTestData.length });

		console.log("Test Average Err (%): " + testErrors );
	}

	return {
		init : init,
		trainNetwork : trainNetwork,
		predict : predict
	}

});