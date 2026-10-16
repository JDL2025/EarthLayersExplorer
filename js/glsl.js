// Shared shader code for Earth Explorer.
// Simplex noise by Ashima Arts / Stefan Gustavson (MIT license).
export const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// ---------------------------------------------------------------------
// Inside of the Earth: used on the cut faces AND on the peel spheres.
// Colors depend on distance from the center (r), so every view matches.
// ---------------------------------------------------------------------
export const INTERIOR_VERT = /* glsl */`
uniform mat4 uFaceToEarth;
varying vec3 vE; varying vec2 vF; varying vec3 vNv;
void main(){
  vec4 e = uFaceToEarth * vec4(position, 1.0);
  vE = e.xyz; vF = position.xy;
  vNv = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const INTERIOR_FRAG = /* glsl */`
uniform float uCrust, uLitho, uAstheno, uCmb, uIcb;
uniform float uAdv, uHi, uDim, uTime, uConv, uConvK, uSort, uInner, uMagma, uLit, uAlpha, uLines, uRadius, uPulse;
varying vec3 vE; varying vec2 vF; varying vec3 vNv;
${NOISE}
float lineAt(float r, float b, float w){ return 1.0 - smoothstep(0.0, w, abs(r - b)); }
void main(){
  vec3 p = vE;
  float r = uRadius > 0.0 ? uRadius : length(p);
  float ang = atan(vF.y, vF.x);
  float fw = max(fwidth(length(p)), 0.0008);
  float icb = uIcb * uInner;
  float id; vec3 col;
  if (r > uCrust) {                       // CRUST
    id = 1.0;
    float t = (r - uCrust) / max(1.0 - uCrust, 1e-4);
    col = mix(vec3(0.43,0.32,0.23), vec3(0.66,0.50,0.35), t);
    float g = snoise(p * 70.0) * 0.5 + 0.5;
    col *= 0.84 + 0.3 * g;
  } else if (r > uCmb) {                  // MANTLE
    id = 2.0;
    float t = (r - uCmb) / (uCrust - uCmb);
    col = mix(vec3(0.93,0.42,0.16), vec3(0.70,0.22,0.13), t);
    float b = snoise(p * 6.0 + vec3(0.0, 0.0, uTime * 0.02));
    float b2 = snoise(p * 22.0);
    col *= 0.92 + 0.12 * b + 0.06 * b2;
  } else if (r > icb) {                   // OUTER CORE (liquid)
    id = 3.0;
    float t = (r - icb) / max(uCmb - icb, 1e-4);
    col = mix(vec3(1.0,0.78,0.27), vec3(0.98,0.58,0.16), t);
    float s = snoise(vec3(p.xy * 7.0 + vec2(sin(uTime*0.15), cos(uTime*0.12)), uTime * 0.18 + p.z * 4.0));
    col *= 0.93 + 0.12 * s;
  } else {                                // INNER CORE (solid)
    id = 4.0;
    float t = r / max(uIcb, 1e-4);
    col = mix(vec3(1.0,0.99,0.90), vec3(1.0,0.86,0.47), t);
    float f = abs(snoise(p * 16.0));
    col *= 0.96 + 0.08 * f;
  }

  // Young Earth: a mixed-up planet before iron sank to the middle
  if (uSort < 0.999) {
    float n = snoise(p * 13.0);
    vec3 mixed = mix(vec3(0.62,0.20,0.10), vec3(0.62,0.62,0.66), step(0.38, n));
    mixed *= 0.85 + 0.3 * (snoise(p * 40.0) * 0.5 + 0.5);
    float s = smoothstep(-0.25, 0.25, (uSort * 2.0 - 1.0) * 1.4 + 0.35 * snoise(p * 4.0));
    col = mix(mixed, col, s);
  }
  // Young Earth: glowing ocean of melted rock near the top
  if (uMagma > 0.001) {
    float n = snoise(p * 9.0 + vec3(0.0, uTime * 0.05, 0.0)) * 0.5 + 0.5;
    vec3 lava = mix(vec3(0.95,0.25,0.05), vec3(1.0,0.75,0.2), n);
    col = mix(col, lava, uMagma * smoothstep(uCrust - 0.12, uCrust - 0.02, r));
  }

  // Mantle convection: hot rock rising, cooler rock sinking
  if (uConv > 0.001 && id == 2.0) {
    float t = (r - uCmb) / (uCrust - uCmb);
    float fr = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.88, t);
    float c = cos(uConvK * ang);
    float up = pow(max(c, 0.0), 10.0), dn = pow(max(-c, 0.0), 10.0);
    col = mix(col, vec3(1.0,0.80,0.36), 0.55 * up * fr * uConv);
    col = mix(col, vec3(0.36,0.22,0.42), 0.55 * dn * fr * uConv);
  }

  // Boundary lines between the main layers
  float w = fw * 1.4 * uLines;
  float lines = max(max(lineAt(r, uCrust, w), lineAt(r, uCmb, w)), lineAt(r, icb, w) * step(0.02, icb));
  col *= 1.0 - 0.45 * lines;

  // Advanced layers: lithosphere (stiff) and asthenosphere (soft)
  if (uAdv > 0.001) {
    if (r > uLitho) col = mix(col, col * vec3(0.78, 0.92, 1.12) + vec3(0.03, 0.05, 0.08), 0.4 * uAdv);
    if (r < uLitho && r > uAstheno) {
      float wv = 0.5 + 0.5 * sin(ang * 90.0 - uTime * 0.7 + r * 300.0);
      col = mix(col, col * 1.15 + vec3(0.07, 0.03, 0.0), 0.45 * uAdv * wv);
    }
    float dash = step(0.45, fract(ang * 28.0));
    float wl = fw * 2.0;
    col = mix(col, vec3(0.62, 0.86, 1.0), lineAt(r, uLitho, wl) * dash * uAdv);
    col = mix(col, vec3(1.0, 0.72, 0.56), lineAt(r, uAstheno, wl) * dash * uAdv);
  }

  // Highlight the layer that is open on a card
  if (uHi > 0.5) {
    bool sel = abs(id - uHi) < 0.5
      || (uHi > 4.5 && uHi < 5.5 && r > uLitho)
      || (uHi > 5.5 && r < uLitho && r > uAstheno);
    if (sel) col *= 1.1;
    else col = mix(col, vec3(dot(col, vec3(0.3333))) * 0.5, 0.5 * uDim);
  }

  // Shading for the round peel spheres
  if (uLit > 0.0) {
    vec3 n = normalize(vNv);
    float lam = max(dot(n, normalize(vec3(-0.45, 0.55, 0.75))), 0.0);
    col *= mix(1.0, 0.5 + 0.65 * lam, uLit);
    float rim = pow(1.0 - max(n.z, 0.0), 2.5);
    col += rim * 0.18 * col;
    if (!gl_FrontFacing) col *= 0.55;
  }
  gl_FragColor = vec4(col, uAlpha);
}`;

// ---------------------------------------------------------------------
// Outside of the Earth (NASA Blue Marble picture), with the cut.
// uMode: 0 whole, 1 cutaway wedge, 2 keep back half, 3 keep front half
// ---------------------------------------------------------------------
export const SURFACE_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vE; varying vec3 vNv;
void main(){
  vUv = uv; vE = position; vNv = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
export const SURFACE_FRAG = /* glsl */`
uniform sampler2D uMap;
uniform int uMode; uniform vec3 uN1; uniform vec3 uN2;
uniform float uAlpha, uTime, uMolten, uDark, uOcean, uToday, uBack;
varying vec2 vUv; varying vec3 vE; varying vec3 vNv;
${NOISE}
void main(){
  if (uMode == 1 && dot(vE, uN1) > 0.0 && dot(vE, uN2) > 0.0) discard;
  if (uMode == 2 && dot(vE, uN1) > 0.0) discard;
  if (uMode == 3 && dot(vE, uN1) <= 0.0) discard;
  vec3 n = normalize(vNv);
  float lam = max(dot(n, normalize(vec3(-0.45, 0.55, 0.75))), 0.0);
  vec3 day = texture2D(uMap, vUv).rgb;
  vec3 col = day;
  if (uToday < 0.999) {
    vec3 p = normalize(vE);
    float a = snoise(p * 5.0 + vec3(0.0, 0.0, uTime * 0.04));
    float b = snoise(p * 18.0 - vec3(uTime * 0.03));
    vec3 molten = mix(vec3(0.75, 0.13, 0.03), vec3(1.0, 0.72, 0.22), smoothstep(-0.4, 0.8, a + 0.4 * b));
    float crack = 1.0 - smoothstep(0.0, 0.08, abs(b));
    vec3 crust = mix(vec3(0.16, 0.13, 0.12), vec3(0.30, 0.25, 0.22), a * 0.5 + 0.5);
    crust = mix(crust, vec3(1.0, 0.45, 0.1), crack * 0.55 * (1.0 - uOcean));
    vec3 sea = mix(vec3(0.05, 0.20, 0.38), vec3(0.10, 0.32, 0.52), b * 0.5 + 0.5);
    vec3 land = mix(crust, sea, uOcean * smoothstep(-0.25, 0.05, -a + 0.3));
    vec3 young = mix(molten, land, uDark);
    col = mix(young, day, uToday);
  }
  float glow = (1.0 - uToday) * (1.0 - uDark) * 0.55;
  col *= mix(0.62 + 0.5 * lam, 1.0, glow);
  if (uBack > 0.5 && !gl_FrontFacing) col = vec3(0.30, 0.24, 0.19) * (0.6 + 0.4 * lam);
  gl_FragColor = vec4(col, uAlpha);
}`;

// soft blue glow around the planet
export const ATMO_VERT = /* glsl */`
varying vec3 vNv; varying vec3 vE;
void main(){ vNv = normalize(normalMatrix * normal); vE = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const ATMO_FRAG = /* glsl */`
uniform float uStrength; uniform vec3 uColor;
uniform int uMode; uniform vec3 uN1; uniform vec3 uN2;
varying vec3 vNv; varying vec3 vE;
void main(){
  float i = pow(clamp(0.78 - dot(normalize(vNv), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.0);
  gl_FragColor = vec4(uColor * i * uStrength, 1.0);
}`;

// glowing dots (stars, particles, earthquake pins)
export const DOTS_VERT = /* glsl */`
attribute vec3 color; attribute float size;
uniform float uScale; varying vec3 vC; varying float vA;
attribute float alpha;
void main(){
  vC = color; vA = alpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * uScale;
  gl_Position = projectionMatrix * mv;
}`;
export const DOTS_FRAG = /* glsl */`
uniform float uOpacity; uniform float uSoft;
varying vec3 vC; varying float vA;
void main(){
  vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0;
  if (r > 1.0) discard;
  float a = mix(1.0 - smoothstep(0.75, 1.0, r), pow(1.0 - r, 1.6), uSoft);
  gl_FragColor = vec4(vC, a * vA * uOpacity);
}`;

// thick lines that stay the same width on screen (drawn flat in a plane)
export const LINE_VERT = /* glsl */`
attribute vec2 dir; attribute float side; attribute float along; attribute vec3 color;
uniform float uWidth; uniform float uWorldPerPx; uniform float uHead; uniform float uTail;
varying vec3 vC; varying float vAlong; varying float vSide;
void main(){
  vC = color; vAlong = along; vSide = side;
  vec2 nrm = vec2(-dir.y, dir.x);
  vec3 pos = position + vec3(nrm * side * uWidth * 0.5 * uWorldPerPx, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;
export const LINE_FRAG = /* glsl */`
uniform float uOpacity; uniform float uHead; uniform float uTail; uniform float uDash; uniform float uTime;
varying vec3 vC; varying float vAlong; varying float vSide;
void main(){
  if (vAlong > uHead || vAlong < uTail) discard;
  if (uDash > 0.0 && fract(vAlong * uDash - uTime) > 0.55) discard;
  float edge = 1.0 - smoothstep(0.6, 1.0, abs(vSide));
  float fade = uTail > -0.5 ? smoothstep(uTail, uTail + 0.08, vAlong) : 1.0;
  gl_FragColor = vec4(vC, uOpacity * (0.35 + 0.65 * edge) * fade);
}`;
