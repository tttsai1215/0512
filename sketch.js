let capture;
let facemesh;
let predictions = [];

function setup() {
  // 產生全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏原本的 HTML 影片元素，只保留畫布內的影像

  // 初始化 ml5.js 的 Facemesh 模型
  facemesh = ml5.facemesh(capture, () => {
    console.log('Facemesh 模型載入完成！');
  });
  facemesh.on('predict', results => {
    predictions = results;
  });
}

function draw() {
  // 設定背景顏色
  background('#e7c6ff');
  
  // 繪製置中上方的文字
  fill(50);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);
  text("414730134 蔡忞序", width / 2, 50);
  textSize(24);
  text("作品為影像辨識_耳環臉譜", width / 2, 90);

  // 將影像顯示在畫布正中間，並設定寬高為畫布的 50%，同時進行左右顛倒
  push();
  translate(width / 2, height / 2); // 將原點移至畫布中心
  scale(-1, 1);                     // 左右翻轉 X 軸
  imageMode(CENTER);                // 以中心點為基準來繪製影像
  image(capture, 0, 0, width * 0.5, height * 0.5);

  // 如果模型有辨識到臉部，則開始繪製耳環
  if (predictions.length > 0) {
    let keypoints = predictions[0].scaledMesh;
    
    // 取出臉部兩側靠近耳垂的特徵點 (左側為 132，右側為 361)
    let leftEar = keypoints[132];
    let rightEar = keypoints[361];
    
    // 繪製左右耳環
    drawEarring(leftEar[0], leftEar[1]);
    drawEarring(rightEar[0], rightEar[1]);
  }
  pop();
}

function drawEarring(px, py) {
  // 取得畫布上影像的實際顯示寬高
  let w = width * 0.5;
  let h = height * 0.5;
  
  // 因為使用了 imageMode(CENTER) 將影像置中
  // 且影像大小被縮放為 50%，所以我們需要將攝影機原始座標 (px, py)
  // 等比例映射 (map) 到畫布上的繪圖區間 (左上角為 -w/2, -h/2 到 右下角 w/2, h/2)
  let mx = map(px, 0, capture.width, -w / 2, w / 2);
  let my = map(py, 0, capture.height, -h / 2, h / 2);
  
  // 設定耳環樣式為黃色無邊框
  fill(255, 255, 0); 
  noStroke();
  
  let circleSize = 10; // 圓圈大小
  let spacing = 15;    // 圓圈之間的間距
  
  // 從耳垂位置往下畫 3 個圓圈，模擬耳環
  for (let i = 1; i <= 3; i++) {
    // mx 保持不變，my 根據迴圈往下遞增位置
    circle(mx, my + (i * spacing), circleSize);
  }
}
