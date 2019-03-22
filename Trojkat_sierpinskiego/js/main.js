"use strict";

var canvas;
var gl;
var points = [];
var subdivision = 1;
var alpha = 0.0;
var deformation =0.0
var bufferId;

var scale_def = 1.0;
var scale_par = 1.0;

var slider_step;
var slider_theta;

function initShaders( gl, vertexShaderId, fragmentShaderId )
{
    var vertShdr;
    var fragShdr;

    var vertElem = document.getElementById( vertexShaderId );
    if ( !vertElem ) {
        alert( "Unable to load vertex shader " + vertexShaderId );
        return -1;
    }
    else {
        vertShdr = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vertShdr, vertElem.text );
        gl.compileShader( vertShdr );
        if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS) ) {
            var msg = "Vertex shader failed to compile.  The error log is:"
                + "<pre>" + gl.getShaderInfoLog( vertShdr ) + "</pre>";
            alert( msg );
            return -1;
        }
    }

    var fragElem = document.getElementById( fragmentShaderId );
    if ( !fragElem ) {
        alert( "Unable to load vertex shader " + fragmentShaderId );
        return -1;
    }
    else {
        fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
        gl.shaderSource( fragShdr, fragElem.text );
        gl.compileShader( fragShdr );
        if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS) ) {
            var msg = "Fragment shader failed to compile.  The error log is:"
                + "<pre>" + gl.getShaderInfoLog( fragShdr ) + "</pre>";
            alert( msg );
            return -1;
        }
    }

    var program = gl.createProgram();
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {
        var msg = "Shader program failed to link.  The error log is:"
            + "<pre>" + gl.getProgramInfoLog( program ) + "</pre>";
        alert( msg );
        return -1;
    }

    return program;
}

function init()
{
    canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl)
    {
        alert("WebGL niedostepny!");
    }
    
    //
    // Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    
    // Load shaders and initialize attribute buffers
    
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    // Load the data into the GPU
    
    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 128 * Math.pow(3, 6), gl.STATIC_DRAW );
    
    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    slider_step = document.getElementById("slider_step");
    slider_theta = document.getElementById("slider_theta");

    slider_step.onchange = function() {
        subdivision = event.srcElement.value;
        render();
    };
    slider_theta.onchange = function() {
        alpha = event.srcElement.value;
        render();
    }

    slider_def.onchange= function(){
      deformation =event.srcElement.value;
      render();
    }

    slider_scale_def.onchange= function(){
        scale_def =event.srcElement.value;
        render();
    }

    slider_scale.onchange= function(){
        scale_par =event.srcElement.value;
        render();
    }


    render();
}

function triangle(a, b, c)
{
    points.push(a, b, c);
}

function deform(a, b, c)
{
    a[0] += deformation*Math.random();
    a[1] += deformation*Math.random();

    b[0] += deformation*Math.random();
    b[1] += deformation*Math.random();

    c[0] += deformation*Math.random();
    c[1] += deformation*Math.random();
}

function rotateZ(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);

    var mv0 = c*m[0]-s*m[1];
    var mv1 = c*m[1]+s*mv0;

    return[mv0, mv1];
}

function fractal(a, b, c, N)
{
    // rotate according distance from origin
    a = rotateZ(a, alpha);
    b = rotateZ(b, alpha);
    c = rotateZ(c, alpha);

    // check for end of recursion
    if (N == 0)
    {
        deform(a,b,c);

        a = scale(scale_par,a);
        b = scale(scale_par,b);
        c = scale(scale_par,c);

        triangle(a, b, c);
    }
    else
    {
        // bisect the sides
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        var ab = scale(scale_def, ab);
        var ac = scale(scale_def, ac);
        var bc = scale(scale_def, bc);
        
        // three new triangles
        fractal(a, ab, ac, N - 1);
        fractal(c, ac, bc, N - 1);
        fractal(b, bc, ab, N - 1);
    }
}

function render()
{
    var vertices = [vec2(-0.7, -0.7), vec2(0, 0.7), vec2(0.7, -0.7)];
    points = [];
    fractal(vertices[0], vertices[1], vertices[2], subdivision);
    
    /* 
        When replacing the entire data store, consider using 
        glBufferSubData rather than completely recreating the 
        data store with glBufferData. This avoids the cost of 
        reallocating the data store
        .
    */
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
    points = [];
}

window.onload = init;