function translation(x,y,z){
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
}

function rotationX(theta){
    return [1,0,0,0, 0,Math.cos(theta),Math.sin(theta),0, 0,-Math.sin(theta),Math.cos(theta),0, 0,0,0,1];
}

function rotationY(theta){
    return [Math.cos(theta),0,-Math.sin(theta),0, 0,1,0,0, Math.sin(theta),0,Math.cos(theta),0, 0,0,0,1];
}

function rotationZ(theta){
    return [Math.cos(theta),Math.sin(theta),0,0, -Math.sin(theta),Math.cos(theta),0,0, 0,0,1,0, 0,0,0,1];
}

function scale(x,y,z){
    return [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
}

function multiply(matrix1, matrix2){
    let result = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]
        for (let i = 0; i < 4; i++){
            for (let j = 0; j < 4; j++){
                for (let k = 0; k < 4; k++){
                    result[j*4+i] += matrix1[k*4+i]*matrix2[j*4+k];
                }
            }
        }
    return result;
}

function transpose(m){
    let transposed = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
        transposed[i * 4 + j] = m[j * 4 + i];
        }
    }
    return transposed;
}

