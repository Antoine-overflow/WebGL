const canvas = document.querySelector('canvas');
/** @type {WebGLRenderingContext} */
const gl = canvas.getContext('webgl'); // instead of '2d'
gl.clearColor(1., 1., 0., 1.); // RGBA: opaque red
gl.clear(gl.COLOR_BUFFER_BIT); // uses current color (state machine)

// vertex shader
const vs_source = `
void main() {
    gl_Position = vec4(0., 0., 0., 1.);  // center
    gl_PointSize = 120.0;
}`;

// fragment shader
const fs_source = `
precision mediump float;

void main() {
    gl_FragColor = vec4(0., 1., 0., 1.);  // green
}`;

function buildShader(gl, shaderSource, shaderType) {
    const shader = gl.createShader(shaderType); // Create the shader object
    gl.shaderSource(shader, shaderSource); // Load the shader source
    gl.compileShader(shader); // Compile the shader
    return shader;
}

function createProgram(gl, shaders) {
    const program = gl.createProgram();
    shaders.forEach(function(shader) {
        gl.attachShader(program, shader);
    });
    gl.linkProgram(program);
    return program;
}

// load and compile the shaders
const vs = buildShader(gl, vs_source, gl.VERTEX_SHADER);
const fs = buildShader(gl, fs_source, gl.FRAGMENT_SHADER);

// Create program on the GPU!
const program = createProgram(gl, [vs, fs]);

// Set current program (WebGL is a state machine!)
gl.useProgram(program);

// Draw 1 big point, see shaders 
const offset = 0;
const count = 1;
gl.drawArrays(gl.POINTS, offset, count);