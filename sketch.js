let video;
let faceMesh;
let faces = []; // 存放臉部偵測結果

// 在 preload 中載入模型，確保載入完成才啟動
function preload() {
  // 注意：v1.3.1 中 M 必須大寫
  faceMesh = ml5.faceMesh();
}

function setup() {
  // 使用全螢幕畫布，解決手機畫面限制問題
  createCanvas(windowWidth, windowHeight);

  // 啟動攝影機，並設定前置鏡頭為優先 (對手機較友善)
  let constraints = {
    video: { facingMode: "user" },
    audio: false
  };
  video = createCapture(constraints);
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

  // 確保攝影機有抓到畫面
  if (video.width > 0) {
    let vW = video.width;
    let vH = video.height;

    // 計算縮放比例，讓影像能夠符合當前畫布並保留上方文字空間
    let scaleFactor = min(width / vW, (height - 140) / vH) * 0.95;
    
    // 計算置中的 X 與 Y 座標
    let vidW = vW * scaleFactor;
    let vidX = (width - vidW) / 2;
    let vidY = 140;

    push();
    // 移動到畫布正確的 X, Y (因為後續會水平翻轉，X 需加上圖片顯示寬度)
    translate(vidX + vidW, vidY);
    // 水平翻轉
    scale(-1, 1);
    // 依據計算出的比例縮放，這樣特徵點跟影像的比例就會完全吻合
    scale(scaleFactor, scaleFactor);
    
    // 畫出影像 (因為有 scale，這裡的寬高直接用原始的 vW 和 vH 即可)
    image(video, 0, 0, vW, vH);

    // 畫出耳環
    drawEarrings();
    pop();
  }
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

// 當視窗大小改變 (如手機旋轉) 時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
