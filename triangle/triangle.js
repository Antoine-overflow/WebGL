const btn = document.querySelector('#btn');        
const radioButtons = document.querySelectorAll('input[name="triangle"]');
btn.addEventListener("click", () => {
    let triangle;
    for (const radioButton of radioButtons) {
        if (radioButton.checked) {
            triangle = radioButton.value;
            console.log(triangle);
            if(triangle=="multi_color"){
                res = multiColorTriangle();
                
            }else{
                res = singleColorTriangle();
            }
            gl.drawArrays(res[0], res[1], res[2]);
        }
    }
});

const canvas = document.querySelector('canvas');
/** @type {WebGLRenderingContext} */
const gl = canvas.getContext('webgl'); // instead of '2d'

function multiColorTriangle(){
    // 2D points: 3 * (x, y) coordinates 
    // (sqrt(3) / 2 - 0.5) * 640 / 480 == 0.4880338..
    let vertices = new Float32Array([-0.75,  -0.5,
        0.75,  -0.5,
        0., 0.49]);
    // create Vertex Buffer Object (VBO) id
    let vertexBuffer = gl.createBuffer(); 

    // set current VBO (WebGL is a state machine!)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // UPLOAD vertexBuffer VBO to GPU,
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); 

    // ** NEW **

    // RGB colors: 3 * (r, g, b, a) values
    let colors = new Float32Array([   1., 0., 0., 1.,
        0., 1., 0., 1.,
        0., 0., 1., 1.]);  
        // create Vertex Buffer Object (VBO) id
    let colorBuffer = gl.createBuffer(); 

    // set current VBO (WebGL is a state machine!)
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // UPLOAD colorBuffer VBO to GPU,
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW); 

    let vs_source = `
        attribute vec2 a_position; // IN, from buffer: 2D point
        attribute vec3 a_color; // IN, from buffer: RGB color

        varying vec3 v_color; // OUT, to fragment shader

        void main() {
            v_color = a_color; // color passthrough, sent to fragment shader
            
            gl_Position = vec4(a_position, 0.0, 1.0); // used by the fragment shader
        }`;

    let fs_source = `
        precision mediump float; // float accuracy: lowp, mediump, highp

        varying vec3 v_color; // IN, INTERPOLATED color from vertex shader
                            
        void main() {
            gl_FragColor = vec4(v_color, 1.); // final framebuffer color: RGBA
        }`;

    function buildShader(gl, shaderSource, shaderType) {
        let shader = gl.createShader(shaderType); // Create the shader object
        gl.shaderSource(shader, shaderSource); // Load the shader source
        gl.compileShader(shader); // Compile the shader
        return shader;
    }

    function createProgram(gl, shaders) {
        let program = gl.createProgram();
        shaders.forEach(function(shader) {
            gl.attachShader(program, shader);
        });
        gl.linkProgram(program);
        return program;
    }

    // load and compile the shaders
    let vs = buildShader(gl, vs_source, gl.VERTEX_SHADER);
    let fs = buildShader(gl, fs_source, gl.FRAGMENT_SHADER);

    // Create program on the GPU!
    let program = createProgram(gl, [vs, fs]);

    // Retrieve 'a_color' shader ATTRIBUTE variable as an id
    let a_colorLoc = gl.getAttribLocation(program, 'a_color');	

    // Retrieve 'a_position' shader ATTRIBUTE variable as an id
    let a_positionLoc = gl.getAttribLocation(program, 'a_position');

    gl.clearColor(0., 0., 0., 1.); 
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program); // Set current program

    {
        // Turn the attribute on
        gl.enableVertexAttribArray(a_positionLoc); 
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // set current vbo
        // Tell the attribute how to get data out of positionBuffer
        // (ARRAY_BUFFER)
        let size = 2; // 2 components per iteration
        let type = gl.FLOAT; // the data is 32bit floats
        let normalize = false; // don't normalize the data
        // stride: 0 = move forward size * sizeof(type) each iteration
        // to get the next position
        let stride = 0;        
        let offset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(a_positionLoc, size, type, normalize, stride, offset);
    }

    {
        // Tell WebGL how to take data from the VBO
        // and supply it to the attribute in the shader.
        gl.enableVertexAttribArray(a_colorLoc); // Turn the attribute on
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        // Tell the color attribute how to get data out of colorBuffer (ARRAY_BUFFER)
        let size = 4; // NOTE: 4 components per iteration
        let type = gl.FLOAT; // the data is 32bit floats
        let normalize = false; // don't normalize the data
        // stride: 0 = move forward size * sizeof(type) each iteration
        // to get the next position
        let stride = 0;        
        let offset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer( a_colorLoc, size, type, normalize, stride, offset);
    }

    // primitiveType == gl.TRIANGLES:
    // each time our vertex shader is run 3 times,
    // WebGL will draw a triangle
    // based on the 3 values we set gl_Position to (see shader)
    let primitiveType = gl.TRIANGLES;

    // Start index of the first vertex
    // Must be a valid multiple of the size of the given type.
    let startIndex = 0;

    // Execute our vertex shader 3 times,
    // using 2 elements from the array (see size 2 above)
    // setting a_position.x and a_position.y
    let count = 3;
    return [primitiveType,startIndex,count];
}

function singleColorTriangle(){
    let vertices = new Float32Array([
        0.5,  0.5,
        -0.5,  0.5,
        -0.5, -0.5]); // 2D points: 3 * (x, y) coordinates

    let vbo = gl.createBuffer(); // create Vertex Buffer Object (VBO) id
    // Set current VBO: bind 'vbo' to the ARRAY_BUFFER bind point,
    //  a global variable internal to WebGL (state machine!)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo); 
    // UPLOAD current VBO to GPU, where it will be processed by the shaders
    // NOTE: STATIC_DRAW: hint for WebGL: our data won't change
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); 

    function checkShaders(gl, vs, fs, program) {
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) 
            console.error(gl.getShaderInfoLog(vs));
        
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) 
            console.error(gl.getShaderInfoLog(fs));
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) 
            console.error(gl.getProgramInfoLog(program));
    };

    let vs_source = `
    attribute vec2 a_position; // IN, from buffer: 2D point
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0); // a_position.x, a_position.y, 0, 1, used by the fragment shader
    }`;

    let fs_source = `
    precision mediump float; // float accuracy: lowp, mediump, highp
    uniform vec4 u_color; // UNIFORM == CONSTANT for entire shader program
                
    void main() {
        gl_FragColor = u_color; // final framebuffer color: RGBA
    }`;
        
    function buildShader(gl, shaderSource, shaderType) {
        let shader = gl.createShader(shaderType); // Create the shader object
        gl.shaderSource(shader, shaderSource); // Load the shader source
        gl.compileShader(shader); // Compile the shader
        return shader;
    }

    function createProgram(gl, shaders) {
        let program = gl.createProgram();
        shaders.forEach(function(shader) {
            gl.attachShader(program, shader);
        });
        gl.linkProgram(program);
        return program;
    }

    // load and compile the shaders
    let vs = buildShader(gl, vs_source, gl.VERTEX_SHADER);
    let fs = buildShader(gl, fs_source, gl.FRAGMENT_SHADER);

    // Create program on the GPU!
    let program = createProgram(gl, [vs, fs]);

    // Retrieve 'u_color' shader UNIFORM variable as an id
    let u_colorLoc = gl.getUniformLocation(program, 'u_color');	

    // Retrieve 'a_position' shader ATTRIBUTE variable as an id
    let a_positionLoc = gl.getAttribLocation(program, 'a_position');

    gl.clearColor(0., 0., 0., 1.); // Set current clear color (black)
    gl.clear(gl.COLOR_BUFFER_BIT); // Clear the canvas to current color

    gl.useProgram(program); // Set current program (pair of shaders)

    // Set the color (constant triangle color, see shader)
    gl.uniform4fv(u_colorLoc, [1.0, 0.0, 0.0, 1.0]);
    // Tell WebGL how to take data from the VBO
    // and supply it to the attribute in the shader.
    gl.enableVertexAttribArray(a_positionLoc); // Turn the attribute on
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo); // set current vbo
    // Tell the attribute how to get data out of positionBuffer
    // (ARRAY_BUFFER)
    let size = 2; // 2 components per iteration
    let type = gl.FLOAT; // the data is 32bit floats
    let normalize = false; // don't normalize the data
    // stride: 0 = move forward size * sizeof(type) each iteration
    // to get the next position
    let stride = 0;        
    let offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(a_positionLoc, size, type, normalize, stride, offset);

    // primitiveType == gl.TRIANGLES:
    // each time our vertex shader is run 3 times,
    // WebGL will draw a triangle
    // based on the 3 values we set gl_Position to (see shader)
    let primitiveType = gl.TRIANGLES;

    // Start index of the first vertex
    // Must be a valid multiple of the size of the given type.
    let startIndex = 0;

    // Execute our vertex shader 3 times,
    // using 2 elements from the array (see size 2 above)
    // setting a_position.x and a_position.y
    let count = 3;
    return [primitiveType, startIndex, count];
}
