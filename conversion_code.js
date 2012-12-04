var max = [], min = [], sets = [training_data, test_data];
for (var d in sets){
  var data = sets[d];
  for (var t in data){
    for (var a in data[t]){
      if (max[a] == null)
        max[a] = data[t][a];
      else
        max[a] = Math.max(data[t][a], max[a]);
      
      if (min[a] == null)
        min[a] = data[t][a];
      else
        min[a] = Math.min(data[t][a], min[a]);
    }
  }
}

console.log(min, max);
  
function convertData(data){
  var new_data = [], last = data[0].length-1;
  for (var t in data){
    new_data[t] = {'data':[], 'class':[]};
    for (var a in data[t]){
      if (a == last)//store the class seperately
        new_data[t].class = data[t][a];
      else{
        var tmp = (data[t][a]-min[a])/(max[a]-min[a]);
        new_data[t].data.push(tmp);
        //for (var i = 0; i<value_labels[a].length; i++){
        //  new_data[t].data.push(data[t][a] == i);
        //}
      }
    }
  }
  var url = window.URL.createObjectURL(new Blob([JSON.stringify(new_data)]));
  //console.log(window.URL.createObjectURL(new Blob([JSON.stringify(new_data)])));
  network.printhr();
  network.println('<a href="'+url+'" target="_blank">Conversion complete</a>');
  return new_data;
}
training_data = convertData(training_data);
test_data = convertData(test_data);
