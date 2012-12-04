var max = [], min = [];/*, scale = [];*/
for (var t in training_data){
  for (var a in training_data[t]){
    max[a] = Math.max(training_data[t][a], max[a])||training_data[t][a];
    min[a] = Math.min(training_data[t][a], min[a])||training_data[t][a];
  }
}
for (var t in test_data){
  for (var a in training_data[t]){
    max[a] = Math.max(test_data[t][a], max[a])||test_data[t][a];
    min[a] = Math.min(test_data[t][a], min[a])||test_data[t][a];
  }
}
//for (var z in max)
//  scale[z] = min[z]/max[z];

//console.log(scale, min, max);
  
function convertData(data){
  var new_data = [], last = data[0].length-1;
  for (var t in data){
    new_data[t] = {'data':[], 'class':[]};
    for (var a in data[t]){
      if (a == last)//store the class seperately
        new_data[t].class = data[t][a]-1;
      else{
        new_data[t].data.push((data[t][a]-min[a])/(max[a]-min[a]));
        //for (var i = 0; i<value_labels[a].length; i++){
        //  new_data[t].data.push(data[t][a] == i);
        //}
      }
    }
  }
  console.log(window.URL.createObjectURL(new Blob([JSON.stringify(new_data)])));
  return new_data;
}
training_data = convertData(training_data);
test_data = convertData(test_data);
