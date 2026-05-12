let video;
let faceMesh;
let faces = []; // 存放臉部偵測結果
let handPose; // ml5 handPose 模型
let hands = []; // 存放手部偵測結果
let earringImgs = []; // 存放五款耳環圖片
let currentEarring = 0; // 目前選中的耳環索引 (0~4)
let modelsLoaded = 0; // 追蹤模型載入狀態

// 在 preload 中只載入圖片，確保載入完成才啟動
function preload() {
  // 載入自訂的 5 款耳環圖片，並加入防呆機制 () => {} 避免找不到檔案時程式卡死
  // 路徑改為直接讀取 pic/ 目錄
  earringImgs[0] = loadImage('pic/acc1_ring.png', () => {}, () => {});
  earringImgs[1] = loadImage('pic/acc2_pearl.png', () => {}, () => {});
  earringImgs[2] = loadImage('pic/acc3_tassel.png', () => {}, () => {});
  earringImgs[3] = loadImage('pic/acc4_jade.png', () => {}, () => {});
  earringImgs[4] = loadImage('pic/acc5_phoenix.png', () => {}, () => {});
}

function setup() {
  // 使用全螢幕畫布，解決手機畫面限制問題
  createCanvas(windowWidth, windowHeight);

  // 啟動攝影機，改回最單純的 VIDEO，避免部分電腦或手機因找不到 specific 的鏡頭而報錯 (NotFoundError)
  video = createCapture(VIDEO);
  video.hide();

  // 將模型載入移到 setup 中，避免 p5.js 的預設 Loading 畫面卡死手機
  faceMesh = ml5.faceMesh({ maxFaces: 1 }, modelReady);
  handPose = ml5.handPose({ maxHands: 1 }, modelReady);
}

// 當任一模型載入完成時呼叫
function modelReady() {
  modelsLoaded++;
  if (modelsLoaded === 2) {
    // 兩個模型都載入完成後，才開始進行影像偵測
    faceMesh.detectStart(video, gotFaces);
    handPose.detectStart(video, gotHands);
  }
}

function gotFaces(results) {
  faces = results;
}

function gotHands(results) {
  hands = results;
}

// 檢查手勢並判斷伸出了幾根手指
function checkHandGesture() {
  if (hands.length > 0) {
    let hand = hands[0];
    let fingers = countFingers(hand);
    
    // 如果偵測到 1~5 根手指，切換到對應的耳環
    if (fingers >= 1 && fingers <= 5) {
      currentEarring = fingers - 1; 
    }
  }
}

// 計算伸出的手指數量
function countFingers(hand) {
  let count = 0;
  let tips = [8, 12, 16, 20];   // 食指、中指、無名指、小指的指尖
  let pips = [6, 10, 14, 18];   // 食指、中指、無名指、小指的第二關節
  let wrist = hand.keypoints[0]; // 手腕

  // 判斷四根手指：如果指尖離手腕的距離，大於第二關節離手腕的距離 (加上一點緩衝)，就視為伸直
  for (let i = 0; i < 4; i++) {
    let tip = hand.keypoints[tips[i]];
    let pip = hand.keypoints[pips[i]];
    if (dist(tip.x, tip.y, wrist.x, wrist.y) > dist(pip.x, pip.y, wrist.x, wrist.y) * 1.2) count++;
  }

  // 判斷大拇指：如果大拇指指尖離小指根部 (17) 的距離大於大拇指關節離小指根部的距離，視為伸直
  let thumbTip = hand.keypoints[4];
  let thumbPip = hand.keypoints[3];
  let pinkyBase = hand.keypoints[17];
  if (dist(thumbTip.x, thumbTip.y, pinkyBase.x, pinkyBase.y) > dist(thumbPip.x, thumbPip.y, pinkyBase.x, pinkyBase.y) * 1.2) count++;

  return count;
}

function draw() {
  background('#e7c6ff'); // 淡紫色背景

  // 若模型尚未載入完成，顯示自訂的載入提示
  if (modelsLoaded < 2) {
    fill(255);
    stroke(0);
    strokeWeight(3);
    textAlign(CENTER, CENTER);
    textSize(28);
    text("AI 模型載入中...\n請稍候 (手機需時較長)", width / 2, height / 2);
    return; // 終止後續的繪製
  }

  // 檢查目前的手勢，並更新選擇的耳環
  checkHandGesture();

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
    // 1 是鼻尖 (用來當作計算往外擴張的基準參考點)
    let nose = face.keypoints[1];
    let faceTop = face.keypoints[10];
    let faceBottom = face.keypoints[152];
    let rightSide = face.keypoints[234];
    let leftSide = face.keypoints[454];

    if (faceTop && faceBottom && rightSide && leftSide && nose) {
      // 計算臉部實際高度，用來動態調整比例，解決不同設備解析度下的位置偏移問題
      let faceHeight = dist(faceTop.x, faceTop.y, faceBottom.x, faceBottom.y);
      
      // 計算臉部的垂直向量 (額頭往下巴的方向)
      let faceDownX = (faceBottom.x - faceTop.x) / faceHeight;
      let faceDownY = (faceBottom.y - faceTop.y) / faceHeight;

      // 計算臉部左右耳「往外」的標準向量 (從鼻子指向兩側邊緣)
      let rightOutDist = dist(nose.x, nose.y, rightSide.x, rightSide.y);
      let rightOutX = (rightSide.x - nose.x) / rightOutDist;
      let rightOutY = (rightSide.y - nose.y) / rightOutDist;
      
      let leftOutDist = dist(nose.x, nose.y, leftSide.x, leftSide.y);
      let leftOutX = (leftSide.x - nose.x) / leftOutDist;
      let leftOutY = (leftSide.y - nose.y) / leftOutDist;

      // --- 調整區區段 ---
      let outRatio = 0.05; // 「往外」移動臉高的 5% 
      let upRatio = 0.04;  // 「往上」移動臉高的 4% (透過減少往下推移的距離來達成)
      
      // 計算最終推移距離
      let dropDistance = faceHeight * (0.13 - upRatio); // 原為往下 13%，扣掉往上的比例
      let outDistance = faceHeight * outRatio;          // 往外推出的比例
      
      // 繪製右耳環 (在畫面上看起來會在左側)，加上往外與往下(減去往上)的向量
      let rightEarlobeX = rightSide.x + (faceDownX * dropDistance) + (rightOutX * outDistance);
      let rightEarlobeY = rightSide.y + (faceDownY * dropDistance) + (rightOutY * outDistance);
      drawEarringImage(rightEarlobeX, rightEarlobeY, faceHeight);

      // 繪製左耳環 (在畫面上看起來會在右側)，加上往外與往下(減去往上)的向量
      let leftEarlobeX = leftSide.x + (faceDownX * dropDistance) + (leftOutX * outDistance);
      let leftEarlobeY = leftSide.y + (faceDownY * dropDistance) + (leftOutY * outDistance);
      drawEarringImage(leftEarlobeX, leftEarlobeY, faceHeight);
    }
  }
}

// 輔助函式：畫出耳環圖片
function drawEarringImage(x, y, faceHeight) {
  let img = earringImgs[currentEarring];
  
  // 確保圖片已經存在且載入完成
  if (img && img.width > 0) {
    // 設定耳環寬度為臉部高度的 15% (可根據您圖片的實際視覺大小微調數字 0.15)
    let eW = faceHeight * 0.15; 
    // 依據圖片原始比例計算對應的縮放高度
    let eH = eW * (img.height / img.width); 
    
    imageMode(CENTER);
    // 將圖片稍微往下偏移高度的一半，讓圖片的頂部可以剛好連接到耳垂
    image(img, x, y + eH / 2, eW, eH); 
    imageMode(CORNER); // 畫完後恢復預設的繪圖模式
  }
}


// 當視窗大小改變 (如手機旋轉) 時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
