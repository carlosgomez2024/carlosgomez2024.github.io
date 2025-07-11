const lienzo = document.getElementById("lienzo");
const gl = lienzo.getContext("webgl");
if (!gl) {
  console.error("WebGL no disponible");
}

// Ajusta el tamaño del lienzo a la ventana
function ajustarTamanio() {
  lienzo.width = window.innerWidth;
  lienzo.height = window.innerHeight;
  gl.viewport(0, 0, lienzo.width, lienzo.height);
}
window.addEventListener("resize", ajustarTamanio);
ajustarTamanio();

// Vertex shader (no cambiar nombres internos)
const shaderVertice = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0., 1.);
  }
`;

// Fragment shader (nombres internos en inglés por WebGL)
const shaderFragmento = `
  precision highp float;
  uniform float time;
  uniform vec2 resolution;
  #define POINT_COUNT 8
  vec2 getHeartPosition(float t) {
    return vec2(
      16.0 * pow(sin(t), 3.0),
      -(13.0 * cos(t) - 5.0 * cos(2.0 * t) - 2.0 * cos(3.0 * t) - cos(4.0 * t))
    );
  }
  float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C) {
    vec2 a = B - A, b = A - 2.0 * B + C, c = 2.0 * a, d = A - pos;
    float kk = 1.0 / dot(b, b), kx = kk * dot(a, b);
    float ky = kk * (2.0 * dot(a, a) + dot(d, b)) / 3.0;
    float kz = kk * dot(d, a);
    float p = ky - kx * kx;
    float p3 = p * p * p, q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
    float h = q * q + 4.0 * p3;
    float res = 1e5;
    if (h >= 0.0) {
      float s = sign(q) * pow(abs(q), 1.0 / 3.0);
      float tval = s - kx;
      tval = clamp(tval, 0.0, 1.0);
      vec2 qos = d + (c + b * tval) * tval;
      res = length(qos);
    } else {
      float z = sqrt(-p), v = acos(q / (p * z * 2.0)) / 3.0;
      vec3 t = vec3(
        cos(v * 2.0),
        -sqrt(3.0) * sin(v) - cos(v),
        sqrt(3.0) * sin(v) - cos(v)
      ) * z - kx;
      t = clamp(t, 0.0, 1.0);
      for (int i = 0; i < 3; i++) {
        vec2 qos = d + (c + b * t[i]) * t[i];
        res = min(res, length(qos));
      }
    }
    return res;
  }
  float getSegment(float t, vec2 pos, float offset, float scale) {
    float len = 0.25;
    float speed = -0.5;
    float dist = 1e5;
    vec2 prev = getHeartPosition(offset);
    for (int i = 1; i < POINT_COUNT; i++) {
      vec2 curr = getHeartPosition(offset + float(i) * len + fract(speed * t) * 6.2831);
      vec2 cen = (prev + curr) / 2.0;
      dist = min(dist, sdBezier(pos, scale * (cen), scale * prev, scale * curr));
      prev = curr;
    }
    return max(0.0, dist);
  }
  float glow(int i, float d) {
    float radius = 0.008, intensity = 1.3;
    return pow(radius / d, intensity);
  }
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 pos = vec2(0.5) - uv;
    pos.y /= (resolution.x / resolution.y);
    pos.y += 0.02;
    float t = time;
    vec3 col = vec3(0.0);
    for (int i = 0; i < 2; i++) {
      float off = float(i) * 3.4;
      float d = getSegment(t, pos, off, 0.000015 * resolution.y);
      float g = glow(i, d);
      col += 10.0 * smoothstep(0.003, 0.001, d) * vec3(1.0);
      col += g * (i == 0 ? vec3(1.0, 0.05, 0.3) : vec3(0.1, 0.4, 1.0));
    }
    col = 1.0 - exp(-col);
    col = pow(col, vec3(0.4545));
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Compilar y enlazar shaders
function compilarShader(src, tipo) {
  const shader = gl.createShader(tipo);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

const programa = gl.createProgram();
gl.attachShader(programa, compilarShader(shaderVertice, gl.VERTEX_SHADER));
gl.attachShader(programa, compilarShader(shaderFragmento, gl.FRAGMENT_SHADER));
gl.linkProgram(programa);
gl.useProgram(programa);

// Crear buffer para el fondo
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, 1, -1, -1, 1, 1, 1, -1
]), gl.STATIC_DRAW);

const ubicacionPosicion = gl.getAttribLocation(programa, "position");
gl.enableVertexAttribArray(ubicacionPosicion);
gl.vertexAttribPointer(ubicacionPosicion, 2, gl.FLOAT, false, 0, 0);

const ubicacionTiempo = gl.getUniformLocation(programa, "time");
const ubicacionResolucion = gl.getUniformLocation(programa, "resolution");
let anterior = Date.now(), tiempo = 0;

// Animación principal
function dibujar() {
  const ahora = Date.now();
  tiempo += (ahora - anterior) / 1000;
  anterior = ahora;
  gl.uniform1f(ubicacionTiempo, tiempo);
  gl.uniform2f(ubicacionResolucion, lienzo.width, lienzo.height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(dibujar);
}
dibujar();
