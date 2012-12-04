var camera, scene, renderer;
var geometry, material, mesh;
var mouseX = 0, mouseY = 0, windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;

document.addEventListener( 'mousemove', onDocumentMouseMove, false );
window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
}

function onDocumentMouseMove(event) {
  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}

NN.prototype.init_graphics = function(){
  this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
  this.camera.position.z = 1000;
  
  this.scene = new THREE.Scene();
  //RENDERER
  this.renderer = new THREE.CanvasRenderer();
  //this.renderer = new THREE.WebGLRenderer();//( { antialias: true, clearColor: 0x333333, clearAlpha: 1, alpha: false } );
    
  //this.renderer.setClearColor( scene.fog.color, 1 );
  this.renderer.setSize(window.innerWidth, window.innerHeight-5);
  document.body.appendChild( this.renderer.domElement );
  
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  var _this = this;
  window.addEventListener( 'resize', function(){
    _this.camera.aspect = window.innerWidth / window.innerHeight;
    _this.camera.updateProjectionMatrix();
    _this.renderer.setSize( window.innerWidth, window.innerHeight-5 );
  }, false);
  window.addEventListener('mousewheel', function(e){
    if (e.wheelDelta > 0)
      _this.camera.position.z -= 50;
    else
      _this.camera.position.z += 50;
    _this.camera.updateProjectionMatrix();
  }, false);
  this.animate();
}

NN.prototype.animate = function(){
  // note: three.js includes requestAnimationFrame shim
  var _this = this;
  requestAnimationFrame( function(){_this.animate()} );//weird workaround for an error...
  //console.log(this.layer);
  if (this.layer && this.layer.animate)
    this.layer.animate(this.scene);
  this.camera.position.x += ( mouseX - this.camera.position.x ) * .05;
  this.camera.position.y += ( - mouseY + 200 - this.camera.position.y ) * .05;
  this.camera.lookAt( this.scene.position );
  this.renderer.render(this.scene, this.camera);
}

NN.prototype.redrawGraphics = function(){
  this.clearGraphics();
  this.layer.redrawGraphics(this.scene, 0);
  this.renderer.render(this.scene, this.camera);
}

NN.prototype.clearGraphics = function(){
  this.scene.__objects = [];
  this.scene.__webglObjects = [];
  this.scene.children = [];
}

Layer.prototype.redrawGraphics = function(scene, layer_number){
  var xpos = layer_number*750 - 375, yheight = 125, yshift = (this.nodes.length*yheight)/2;
  for (var n in this.nodes){
    var ypos = yheight*n-yshift;
    this.nodes[n].mesh.position.x = xpos;//500*(Math.random()-0.5);
    this.nodes[n].mesh.position.y = ypos;
    scene.add(this.nodes[n].mesh);
    if (this.prev){//draw lines backwards
      this.nodes[n].lines = [];
      var yshift2 = (this.prev.nodes.length*yheight)/2
      for (var j in this.prev.nodes){
        var xpos2 = xpos-750, ypos2 = yheight*j-yshift2, line_width = 4*this.prev.nodes[j].weights[n]+1;
        var pts = [];
				pts.push(new THREE.Vector2(xpos, ypos));
        pts.push(new THREE.Vector2(xpos, ypos+line_width));
        pts.push(new THREE.Vector2(xpos2, ypos2+line_width));
        pts.push(new THREE.Vector2(xpos2, ypos2));
				var shape = new THREE.Shape(pts);
        var geometry = new THREE.ShapeGeometry(shape, {amount:line_width});
        //var obj = new THREE.Object3D();
        //see: http://mrdoob.github.com/three.js/examples/webgl_geometry_shapes.html
        var msh = THREE.SceneUtils.createMultiMaterialObject( geometry, [new THREE.MeshBasicMaterial( { color: 0x555555 } ) ] );
        //obj.add(msh);
        this.nodes[n].lines.push(msh);
        //console.log(msh);
        scene.add(msh);
      }
    }
    if (!this.next){//must be the output layer
      this.nodes[n].mesh.material.color = this.nodes[n].calculateColor(n);
    }
  }
  if (this.next)
    this.next.redrawGraphics(scene, layer_number+1);
}

Layer.prototype.animate = function(scene){
  if (this.next)
    this.next.animate(scene);
  else{
    for (var n in this.nodes){
      this.nodes[n].mesh.material.color = this.nodes[n].calculateColor(n);
      this.nodes[n].brighten /= 1.04;
      for (var l in this.nodes[n].lines){
        //console.log(this.nodes[n].threshold);
        var output = 1;//Math.maintainRange(this.nodes[n].threshold-this.output[n]);
        this.nodes[n].lines[l].children[0].material.color.r = Math.maintainRange(.467 + this.nodes[n].mesh.material.color.r*output*this.nodes[n].brighten);
        this.nodes[n].lines[l].children[0].material.color.g = Math.maintainRange(.467 + this.nodes[n].mesh.material.color.g*output*this.nodes[n].brighten);
        this.nodes[n].lines[l].children[0].material.color.b = Math.maintainRange(.467 + this.nodes[n].mesh.material.color.b*output*this.nodes[n].brighten);
        if (l == 0){
          //console.log(this.nodes[n].lines[l].children[0].material.color.r);
        }
      }
        //console.log(this.nodes[n].lines[l].children[0].material.color);
    }
  }
}

Node.prototype.calculateColor = function(n){
  var colors = [0xff0000, 0x00ff00, 0x0000ff, 0xFFFF00, 0x00FFFF, 0xFF00FF],
      color = new THREE.Color(colors[n%6]);
  //var rnd = Math.randSeed((n+123)*this.threshold*255).toString(), //hash used to create colors
  //    r = (Number(rnd.substring(0,3))%250+5)/255,
  //    g = (Number(rnd.substring(3,6))%250+5)/255,
  //    b = (Number(rnd.substring(3,9))%250+5)/255,
  //    color = new THREE.Color().setRGB(r, g, b);
  color.r += Math.maintainRange(color.r+this.brighten);
  color.g += Math.maintainRange(color.g+this.brighten);
  color.b += Math.maintainRange(color.b+this.brighten);
  return this.color = color;
}


Node.prototype.makeMesh = function(){
  this.color = 0x777777;
  this.brighten = 0;
  geometry = new THREE.SphereGeometry(this.threshold*40+10, 15, 15);//( radius, segmentsWidth, segmentsHeight, phiStart, phiLength, thetaStart, thetaLength );
  material = new THREE.MeshBasicMaterial( { color: this.color  } );
  this.mesh = new THREE.Mesh( geometry, material );
}
