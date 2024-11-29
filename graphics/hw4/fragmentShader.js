let fragmentShader = `
      
precision mediump float;
uniform mat4 uA[` + NQ + `], uB[` + NQ + `], uC[` + NQ + `];
uniform float uTime, uFL;
uniform vec3  uCursor;
varying vec3  vPos;

vec3 bgColor = vec3(1.,.5,1.);


// The function then produces a pair of values for t to indicate where the ray enters and exits the object
vec2 rayQ(vec3 V, vec3 W, mat4 Q){
    vec2 result = vec2(-1.,-1.);
    vec4 V1 = vec4(V.x, V.y, V.z, 1.);
    vec4 W1 = vec4(W.x, W.y, W.z, 0.);
    float A = dot((W1*Q), W1);
    float B = dot((V1*Q), W1)+dot((W1*Q),V1);
    float C = dot((V1* Q), V1);
    //compute discrimenent
    float disc = B * B - 4. * A * C;
    if (disc >= 0.){
        result.x = (-1.*B+sqrt(disc)) / (2.*A);
        result.y = (-1.*B-sqrt(disc)) / (2.*A);
    }

    return result;
}

//compute normal
vec3 NormalQP(mat4 Q, vec3 P){
    float a = Q[0].x;
    float b = Q[1].y;
    float c = Q[2].z;
    float d = Q[2].y;
    float e = Q[2].x;
    float f = Q[1].x;
    float g = Q[3].x;
    float h = Q[3].y;
    float i = Q[3].z;
    float j = Q[3].w;

    vec3 N = normalize(vec3( 2.*a*P.x + e*P.z + f*P.y + g,
                              2.*b*P.y + d*P.z + f*P.x + h,
                              2.*c*P.z + d*P.y + e*P.x + i ) );
    return N;
}

//background helper
vec2 rotate(vec2 pos, float angle) {
  float cosAngle = cos(angle);
  float sinAngle = sin(angle);
  return vec2(
        cosAngle * pos.x - sinAngle * pos.y,
        sinAngle * pos.x + cosAngle * pos.y
  );
}

   // INSTRUCTOR HINTS
// create a function that calls the above function in order to ray trace to an object defined as an intersection of three quartics
// return the needed info in the form of a 3x3 matrix. This lets me pack into the return value not only the t values for ray entry and exit, but also the associated surface point P and the surface normal N.
// In my implementation, I structure the returned matrix R as follows:
//    R[0].x -- t value at entry into the object
//    R[0].y -- t value at exit out of the object
//    R[1]    -- Surface point P
//    R[2]    -- Surface normal N
// That argument "inOut" at the end is a flag to indicate whether I should return the P and N values for the entering root or the exiting root.
//inOut = 0 --> entry point, inOut = 1 --> exit point


mat3 rayQ3(vec3 V, vec3 W, mat4 A, mat4 B, mat4 C, int inOut) {
    mat3 R = mat3(-1.,-1.,-1.,  -1.,-1.,-1., -1.,-1.,-1.);

    //init vec3s to hold the t values
    vec3 tmin = vec3(-1.,-1.,-1.);
    vec3 tmax = vec3(-1.,-1.,-1.);


    // find which t is t in and out for A, see if they actually exist
    vec2 A_ts = rayQ(V, W, A);
    tmin[0] = min(A_ts.x, A_ts.y);
    tmax[0] = max(A_ts.x, A_ts.y);
    //if(tmin[0]<0. && tmax[0]<0.)
        //return R;

    // find which t is t in and out for B, see if they actually exist
    vec2 B_ts = rayQ(V, W, B);
    tmin[1] = min(B_ts.x, B_ts.y);
    tmax[1] = max(B_ts.x, B_ts.y);
    //if(tmin[1]<0. && tmax[1]<0.)
       // return R;

    // find which t is t in and out for C, see if they actually exist
    vec2 C_ts = rayQ(V, W, C);
    tmin[2] = min(C_ts.x, C_ts.y);
    tmax[2] = max(C_ts.x, C_ts.y);
    //if(tmin[2]<0. && tmax[2]<0.)
        //return R;

    float tIn = max(tmin[0], max(tmin[1], tmin[2]));
    float tOut = min(tmax[0], min(tmax[1], tmax[2]));

    // check if they actually intersect
    if (tIn < tOut){
        R[0].x = tIn;
        R[0].y = tOut;
        vec3 P;
        vec3 N;
        // inOut = 0 then entry point
        mat4 S;
        if (inOut == 0){
            // find which surface to get the normal of
            if(tIn == tmin[0]) S = A;
            if(tIn == tmin[1]) S = B;
            if(tIn == tmin[2]) S = C;

            // get position
            P = V + W * tIn;
        }
        //exit point P and N
        else{
            // find which surface to get the normal of
            if(tOut == tmax[0]) S = A;
            if(tOut == tmax[1]) S = B;
            if(tOut == tmax[2]) S = C;

            P = V + W * tOut;
        }
        N = NormalQP(S, P);
       
        R[1] = P;
        R[2] = N;
    }
    return R;
}

vec3 refractRay(vec3 W, vec3 N, float n) {
    float cosTheta1 = dot(-W, N);
    float sin2Theta2 = n * n * (1.0 - cosTheta1 * cosTheta1);
    if (sin2Theta2 > 1.0) {
        return vec3(0.0);
    }
    float cosTheta2 = sqrt(1.0 - sin2Theta2);
    vec3 refractedRay = n * W + (n * cosTheta1 - cosTheta2) * N;
    return refractedRay;
}

void main(void) {

    // SET BACKGROUND COLOR
    vec2 centeredPos = vPos.xy - 0.5;
    vec2 rotatedPos = rotate(centeredPos, uTime);
    rotatedPos += 0.5;
    vec3 colorA = vec3(0.149,0.141,0.912);
    vec3 colorB = vec3(1.000,0.833,0.224);
    vec3 color =  mix(colorA, colorB, .5*sin(abs(uTime)) + .5 * rotatedPos.y);

    // FORM THE RAY FOR THIS PIXEL

    vec3 V = vec3(0.);
    vec3 W = normalize(vec3(vPos.xy,-1));

    vec3 L = normalize(vec3(1.));

    vec3 material, highlight;
    float power;

    // change this to make it fun
  
    highlight = 1.2 * material;
    power = 8.;
    mat3 materials = mat3(1., 0.85, 0.3,
                      0.2, 0.2, 1., 
                      0.98, 0.2, 0.78);
    

    float tMin = 1000.;
    for (int i = 0 ; i < ` + NQ + ` ; i++){
        material = materials[i];
        mat3 Result = rayQ3(V, W,  uA[i], uB[i], uC[i], 0);
        float t = Result[0].x;
        if(t >0. && t < tMin){
            mat4 Q = uA[i];
            tMin = t;
            vec3 P = Result[1];
            vec3 N = Result[2];

            color = .2 * material;
            vec3 d = material * max(0., dot(N,L));
            vec3 E = vec3(0.,0.,1.);
            vec3 R = W - 2. * N * dot(N, W);
            vec3 s = highlight * pow(max(0., dot(R, L)), power);

            //figure out if object is in the shadow of other objects and check for reflection
            //Reflection and refraction implementation
            bool inShadow = false;
            for (int j = 0 ; j < ` + NQ + ` ; j++){
                if (j != i) {
                    mat3 Res2 = rayQ3(P, L,   uA[j], uB[j], uC[j], 0);
                    if (Res2[0].x > 0. || Res2[0].y > 0.)
                    inShadow = true;
                    else{
                        mat3 Reflection = rayQ3(P+0.001*R, R,  uA[j], uB[j], uC[j], 0);
                        if(Reflection[0].x > 0.){
                            vec3 reflectionColor = materials[j]*0.1;
                            color += reflectionColor;

                        vec3 refractedRay = refractRay(W, N, 1.1);
                        //intesecting with ourselves
                        mat3 Refraction = rayQ3(P+0.001*refractedRay, refractedRay,  uA[i], uB[i], uC[i], 0);
                        if(Refraction[0].x > 0. || Refraction[0].y > 0.){
                            vec3 refractionColor = materials[i]*0.7;
                            color += refractionColor;
                        }
                        }
                    }
                }   
            }
            if(! inShadow){
                color += d + s;
            }
            
            
        }
    }

    gl_FragColor = vec4(sqrt(color), .5);
}
`;