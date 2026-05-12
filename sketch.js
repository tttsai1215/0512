let video;
let faceMesh;
let faces = []; // 存放臉部偵測結果
let earringImg; // 存放耳環圖片

// 在 preload 中載入模型，確保載入完成才啟動
function preload() {
  // 注意：v1.3.1 中 M 必須大寫
  faceMesh = ml5.faceMesh();
  // 載入自訂的耳環圖片
  earringImg = loadImage('pic/acc/acc1_ring.png');
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

  // 確保攝影機有抓到畫面
  if (video.width > 0) {
    let vW = video.width;
    let vH = video.height;

    // 計算縮放比例，改為 max 以填滿整個螢幕 (Cover 效果)
    let scaleFactor = max(width / vW, height / vH);
    
    // 計算置中的 X 與 Y 座標
    let vidW = vW * scaleFactor;
    let vidH = vH * scaleFactor;
    let vidX = (width - vidW) / 2;
    let vidY = (height - vidH) / 2;

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

  // 繪製上方的文字 (移至影像上方繪製，避免被全螢幕影像遮擋)
  fill(255); // 為了在影像上更明顯，改為白色
  stroke(0); // 加上黑邊
  strokeWeight(3);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("414730134 蔡忞序", width / 2, 45);
  textSize(24);
  text("作品為影像辨識_耳環臉譜", width / 2, 90);
}

function drawEarrings() {
  // 檢查是否有偵測到臉部
  if (faces.length > 0) {
    let face = faces[0]; // 取得畫面中的第一張臉

    // FaceMesh 提供的特徵點中：
    // 10 是額頭最高點，152 是下巴最底點
    // 234 和 454 是臉部最左和最右側邊緣（最靠近耳朵的位置）
    let faceTop = face.keypoints[10];
    let faceBottom = face.keypoints[152];
    let rightSide = face.keypoints[234];
    let leftSide = face.keypoints[454];

    if (faceTop && faceBottom && rightSide && leftSide) {
      // 計算臉部實際高度，用來動態調整比例，解決不同設備解析度下的位置偏移問題
      let faceHeight = dist(faceTop.x, faceTop.y, faceBottom.x, faceBottom.y);
      
      // 計算臉部的垂直向量 (額頭往下巴的方向)
      let faceDownX = (faceBottom.x - faceTop.x) / faceHeight;
      let faceDownY = (faceBottom.y - faceTop.y) / faceHeight;

      // 計算耳垂位置：從耳朵邊緣點順著臉部方向往下推移約 12% 臉高
      let dropDistance = faceHeight * 0.12; 
      
      // 繪製右耳環 (在畫面上看起來會在左側)
      let rightEarlobeX = rightSide.x + faceDownX * dropDistance;
      let rightEarlobeY = rightSide.y + faceDownY * dropDistance;
      drawEarringImage(rightEarlobeX, rightEarlobeY, faceHeight);

      // 繪製左耳環 (在畫面上看起來會在右側)
      let leftEarlobeX = leftSide.x + faceDownX * dropDistance;
      let leftEarlobeY = leftSide.y + faceDownY * dropDistance;
      drawEarringImage(leftEarlobeX, leftEarlobeY, faceHeight);
    }
  }
}

// 輔助函式：畫出耳環圖片
function drawEarringImage(x, y, faceHeight) {
  // 確保圖片已經載入完成
  if (earringImg.width > 0) {
    // 設定耳環寬度為臉部高度的 15% (可根據您圖片的實際視覺大小微調數字 0.15)
    let eW = faceHeight * 0.15; 
    // 依據圖片原始比例計算對應的縮放高度
    let eH = eW * (earringImg.height / earringImg.width); 
    
    imageMode(CENTER);
    // 將圖片稍微往下偏移高度的一半，讓圖片的頂部可以剛好連接到耳垂
    image(earringImg, x, y + eH / 2, eW, eH); 
    imageMode(CORNER); // 畫完後恢復預設的繪圖模式
  }
}


// 當視窗大小改變 (如手機旋轉) 時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
