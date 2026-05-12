let video;
let faceMesh;
let faces = []; // 存放臉部偵測結果

// 在 preload 中載入模型，確保載入完成才啟動
function preload() {
  // 注意：v1.3.1 中 M 必須大寫
  faceMesh = ml5.faceMesh();
}

function setup() {
  createCanvas(800, 680);

  // 啟動攝影機
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // 開始對 video 進行連續偵測，並將結果傳給 gotFaces 函式
  faceMesh.detectStart(video, gotFaces);
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  background('#e7c6ff'); // 淡紫色背景

  // 繪製上方的文字
  fill(50);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);
  text("414730134 蔡忞序", width / 2, 45);
  textSize(24);
  text("作品為影像辨識_耳環臉譜", width / 2, 90);

  // 計算攝影機影像置中的位置
  let vidW = 640;
  let vidH = 480;
  let vidX = (width - vidW) / 2;
  let vidY = 140;

  push();
  // 將影像放置於文字下方並做鏡像翻轉
  translate(vidX + vidW, vidY);
  scale(-1, 1);
  
  // 畫出影像
  image(video, 0, 0, vidW, vidH);

  // 畫出耳環
  drawEarrings();
  pop();
}

function drawEarrings() {
  // 檢查是否有偵測到臉部
  if (faces.length > 0) {
    let face = faces[0]; // 取得畫面中的第一張臉

    fill(255, 204, 0); // 黃色
    noStroke();
    const earlobeOffset = 18; // 耳環圓圈間距
    const circleRadius = 7;  // 耳環圓圈大小

    // FaceMesh 提供 468 個臉部特徵點。
    // 索引 132 與 361 約略位於左右耳垂/臉頰邊緣的位置
    let rightEar = face.keypoints[132];
    if (rightEar) {
      drawThreeCircles(rightEar.x, rightEar.y, earlobeOffset, circleRadius);
    }

    let leftEar = face.keypoints[361];
    if (leftEar) {
      drawThreeCircles(leftEar.x, leftEar.y, earlobeOffset, circleRadius);
    }
  }
}

// 輔助函式：畫出三個連串的圓圈
function drawThreeCircles(baseX, baseY, offset, radius) {
  let startY = baseY + 10; // 稍微往下移一點，更像耳垂下方
  ellipse(baseX, startY, radius * 2);
  ellipse(baseX, startY + offset, radius * 2);
  ellipse(baseX, startY + offset * 2, radius * 2);
}
