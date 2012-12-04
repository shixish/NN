//(function($, window, document, undefined){
//  
//})(jQuery, this, this.document);

//sigmoidal function used for activation
function activation(x){
  //console.log('x', x, '1/(1+Math.exp(-x)', 1/(1+Math.exp(-x)));
  return 1/(1+Math.exp(-x));
}

function activation_derivative(x){
  var a = activation(x);
  return a*(1-a);
}

function NN(){
  this.data = null;
  this.learning_rate = .1;
  this.hidden = 0;//how many hidden nodes to use
  this.text_output = null;//points to a node used for output...
  
  this.setData = function(data, preset){
    this.data = data;
    if (preset && preset.length > 0){
      this.loadPreset(preset);
    }else{//don't need this stuff if we have the nodes already.
      this.reset();
    }
    return this;
  }
  
  this.loadPreset = function(preset){
    if (preset && preset.length > 0){
      this.preset = preset;
      this.layer = new Layer().loadPreset(JSON.parse(JSON.stringify(this.preset)));//use JSON trick to clone obj.
      if (this.redrawGraphics) this.redrawGraphics();
    }else{
      console.error('Tried to load empty preset!');
    }
  }
  
  this.reset = function(){
    var inputs = this.data.attr_count, outputs = this.data.classes;
    this.layer = new Layer().init(inputs, inputs);
    if (this.hidden)
      this.layer.makeNext(this.hidden).makeNext(outputs);
    else
      this.layer.makeNext(outputs);
    if (this.redrawGraphics) this.redrawGraphics();
  }
  
  //var normalizeValues = function(values){
  //  var retValues = [];
  //  for (var v in values){
  //    retValues[v] = values[v]/value_labels.length;
  //  }
  //  return retValues;
  //}
  
  this.autotrain = function(trials, upper, lower){
    trials = trials || 500;
    upper = upper || .3;
    lower = lower || .001;
    step = (upper-lower)/4;
    
    var start_time = new Date().getTime();
    
    this.learning_rate = upper;
    this.train(Math.floor(trials/32));
    this.learning_rate = step*.75;
    this.train(Math.floor(trials/16));
    this.learning_rate = step*.5;
    this.train(Math.floor(trials/8));
    this.learning_rate = step*.25;
    this.train(Math.floor(trials/4));
    this.learning_rate = lower;
    this.train(Math.floor(trials/2+trials/32));
    
    var time = (new Date().getTime()-start_time)/1000, minutes = time/60;
    this.println('Auto-Train took: '+minutes+' minutes.');
    return this;
  }
  
  this.train = function(trials, data){
    this.printhr();
    //this.println('Begin training...');
    trials = trials||15;
    data = data||this.data.training;
    for (var t = 0; t<trials; t++){
      for (var i in data){
        var values = data[i].data, classifier = data[i].class;
        this.layer.train(values, classifier);
        this.layer.adjust_weights(values, this.learning_rate);
      }
    }
    this.println('Training complete!');
    if (this.redrawGraphics) this.redrawGraphics();
    return this;
  }
  
  this.pickle = function(){
    var layers = [];
    this.layer.pickle(layers);
    return layers;
  }
  
  this.test = function(data){
    data = data||this.data.testing;
    var correct = 0, incorrect = 0, matrix=[];
    var log = "";
    for (var i in data){
      var values = data[i].data, classifier = data[i].class;
      //if (classifier == 2 || classifier == 3)
      var output_layer = this.layer.test(values, classifier), output = output_layer.output;
      var max = 0, maxi = 0;
      for (var o in output){
        if (output[o] > max){
          max = output[o];
          maxi = o;
        }
      }
      output_layer.nodes[maxi].brighten = Math.maintainRange(output_layer.nodes[maxi].brighten+2, 5);
      if (!matrix[classifier])
        matrix[classifier] = {correct:0, incorrect:0, correct_sum_certainty:0, incorrect_sum_certainty:0};
      
      if (maxi == classifier){
        matrix[classifier].correct++;
        matrix[classifier].correct_sum_certainty += output[maxi];
        correct++;
      }else{
        matrix[classifier].incorrect++;
        matrix[classifier].incorrect_sum_certainty += output[maxi];
        incorrect++;
      }
      log += 'I think the answer is: '+maxi+' (with '+(output[maxi]*100).toFixed(2)+'% certainty), actual answer is ' + classifier + '\n';
      //break;
    }
    this.printhr();
    for (var m in matrix){
      this.println(this.data.class_labels[m] + ' correct: ' + matrix[m].correct + ' (avg. certainty: ' + (matrix[m].correct_sum_certainty/data.length*100).toFixed(2) + '%), incorrect: ' + matrix[m].incorrect + ' (avg. certainty: ' + (matrix[m].incorrect_sum_certainty/data.length*100).toFixed(2) + ')%');
    }
    this.println('Total Accuracy: ' + (correct/data.length*100).toFixed(2));
    var url = window.URL.createObjectURL(new Blob([log]));
    this.println('<a href="'+url+'" target="_blank">View the log</a>');
    return this;
  }
  
  this.printhr = function(){
    if (this.text_output){
      var element = document.createElement('hr');
      //document.body.appendChild(element);
      this.text_output.append(element);
      this.text_output.scrollTop($(document).height());
    }else{
      this.println('---------------------------------------------------');
    }
  }
  
  this.println = function(line){
    if (this.text_output){
      this.text_output.append(line+'<br>');
      this.text_output.scrollTop($(document).height());
    }else{
      console.log(line);
    }
  }
}


function Layer(preset, num_nodes, num_inputs){
  this.nodes = [], this.next = null, this.prev = null;
  
  this.init = function(num_nodes, num_inputs){
    for (var i = 0; i<num_nodes; i++){
      this.nodes.push(new Node(num_inputs));
    }
    return this;
  }
  
  this.loadPreset = function(preset){
    if (preset && preset.length > 0){
      var layer = preset.shift();
      for (var i = 0; i<layer.length; i++){
        this.nodes.push(new Node(layer[i]));
      }
      if (preset.length > 0)
        this.makeNext().loadPreset(preset);
    }else{
      console.error('Tried to load empty preset!');
    }
    return this;
  }
  
  this.output = [];
  this.error = [];
  this.train = function(values, real_class){
    for (var n in this.nodes){
      this.output[n] = activation(this.nodes[n].output(values));
    }
    if (this.next)
      this.next.train(this.output, real_class);
    else{//reached the output layer
      //adjust the error for the output nodes:
      for (var n in this.nodes){
        this.error[n] = activation_derivative(this.output[n])*((n==real_class)-this.output[n]);
        //console.log('real_class-this.output[e]', real_class, this.output[e], real_class-this.output[e]);
      }
      if (this.prev)
        this.prev.adjust_error();
    }
    //errors have all been calculated by this point, we can now adjust the weights
    //console.log('error:', this.error);
    //console.log('calculate weights now: ', this);
    //
  }
  
  this.pickle = function(layers){
    var pkl = [];
    for (var n in this.nodes){
      pkl.push({threshold:this.nodes[n].threshold, weights:this.nodes[n].weights});
    }
    layers.push(pkl);
    if (this.next)
      this.next.pickle(layers);
  }
  
  this.adjust_error = function(){
    //error = the error values for the next layer
    for (var n in this.nodes){
      var sum = 0;
      for (var e in this.next.error)//each of the nodes on the next layer
        //console.log(this.nodes[n].weights[e], this);
        sum += this.next.nodes[e].weights[n] * this.next.error[e];
      //this.error[n] = sum;
      this.error[n] = activation_derivative(this.output[n])*sum;
      
    }
    //console.log(this.output);
    //console.log(this.error);
    if (this.prev)
      this.prev.adjust_error();
    //else{
    //  console.log('reached the first layer');
    //}
  }
  
  this.adjust_weights = function(input, learning_rate){
    for (var n in this.nodes){
      for(var i in this.nodes[n].weights){
        this.nodes[n].weights[i] += learning_rate*this.error[n]*input[i];
      }
      //this.nodes[n].adjust_weights(this.error[n], input);
    }
    if (this.next)
      this.next.adjust_weights(this.output, learning_rate);
  }
  
  this.test = function(input){
    for (var n in this.nodes){
      this.output[n] = activation(this.nodes[n].output(input));
    }
    //console.log(this.output);
    if (this.next)
      return this.next.test(this.output);
    else{
      //console.log('seeing:', this.output, 'real:', real_class);
      return this;
    }
  }
  
  this.makeNext = function(num_nodes){
    this.next = new Layer();
    if (num_nodes)
      this.next.init(num_nodes, this.nodes.length);
    this.next.prev = this;
    return this.next;
  }
}

function Node(input){
  if (input && input.weights != undefined && input.threshold != undefined){
    this.weights = input.weights;
    this.threshold = input.threshold;
  }else{
    this.weights = [];
    for (var i=0; i<input; i++) this.weights.push(Math.random());
    this.threshold = Math.random();      
  }
  
  this.output = function(input){
    var sum = 0;
    for(var i in this.weights){
      sum += input[i]*this.weights[i];
    }
    //this.output = sum;
    return sum;//-this.threshold;
  }
  
  //initializes some graphics stuff see graphics.js
  if (this.makeMesh) this.makeMesh();
  
  //this.adjust_weights = function(error, input){
  //  for(var i in this.weights){
  //    this.weights[i] += learning_rate*error*input[i];
  //  }
  //}
}

Math.easeOutExpo = function (t, b, c, d) {
	return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
};

Math.randSeed = function(n){
    return Math.abs(Number(new Date(n%9999, n%12, n%30, n%24, n%60, n%60, n%1000)));
};

Math.maintainRange = function(value, upper, lower){
  upper = upper||1;
  lower = lower||0;
  if (value > upper)
    return upper;
  else if (value < lower || !value)
    return lower;
  else
    return value;
}