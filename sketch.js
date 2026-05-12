let video;
let facemesh;
let predictions = [];
let handPose; // 手勢辨識模型
let handPredictions = []; // 手勢辨識結果
let isDetecting = false; // 紀錄是否已經開始收到辨識結果
let earringImgs = []; // 儲存多款耳環圖片
let currentEarringIndex = 1; // 記錄目前選擇的耳環款式 (1~5)

function preload() {
  // 載入多款耳環圖片檔案
  earringImgs[1] = loadImage('pic/acc/acc1_ring.png');
  earringImgs[2] = loadImage('pic/acc/acc2_pearl.png');
  earringImgs[3] = loadImage('pic/acc/acc3_tassel.png');
  earringImgs[4] = loadImage('pic/acc/acc4_jade.png');
  earringImgs[5] = loadImage('pic/acc/acc5_phoenix.png');
}

function setup() {
  // 第一步：產生全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 取得攝影機影像並隱藏原本預設的 HTML 影片元素
  // 若發生 NotFoundError，表示找不到攝影機或是瀏覽器權限/連線安全 (https 或 localhost) 的問題
  video = createCapture(VIDEO);
  video.hide();

  // 獨立啟動模型：避免因為攝影機找不到 (NotFoundError) 導致模型永遠不載入
  facemesh = ml5.faceMesh({ maxFaces: 1 }, () => {
    // 當模型載入並準備好後，開始進行臉部辨識
    facemesh.detectStart(video, results => {
      isDetecting = true; // 成功收到回呼，表示模型已經開始運作
      predictions = results;
    });
  });
  
  handPose = ml5.handPose(() => {
    // 開始進行手勢辨識
    handPose.detectStart(video, results => {
      handPredictions = results;
    });
  });
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');
  
  let fingers = 0; // 記錄這回合偵測到的手指數

  push();
  translate(width / 2, height / 2); // 將座標原點移到畫布中央
  scale(-1, 1); // X 軸縮放 -1，達成左右顛倒效果
  imageMode(CENTER); // 設定圖片繪製模式為置中
  image(video, 0, 0, width * 0.5, height * 0.5); // 畫出影像，寬高為畫布的 50%

  // 判斷手勢並切換耳環
  if (handPredictions.length > 0) {
    fingers = countFingers(handPredictions[0]);
    if (fingers >= 1 && fingers <= 5) {
      currentEarringIndex = fingers;
    }

    // 【除錯輔助】繪製手部骨架，確認 AI 有成功抓到您的手
    let hand = handPredictions[0];
    for (let i = 0; i < hand.keypoints.length; i++) {
      let kp = hand.keypoints[i];
      let kx = map(kp.x, 0, video.width, -width * 0.25, width * 0.25);
      let ky = map(kp.y, 0, video.height, -height * 0.25, height * 0.25);
      fill(0, 255, 0);
      noStroke();
      circle(kx, ky, 8);
    }
  }

  // 繪製耳環
  if (predictions.length > 0 && video.width > 0) {
    // 新版 ml5.js 資料結構中，臉部特徵點陣列名稱變更為 keypoints
    let keypoints = predictions[0].keypoints;
    
    // MediaPipe Facemesh 中，177 與 401 大約是左右耳垂的位置
    let rightEarlobe = keypoints[177];
    let leftEarlobe = keypoints[401];
    
    drawEarring(rightEarlobe);
    drawEarring(leftEarlobe);
  }
  pop();

  // 在視窗上方加上文字 (放在 pop() 之後避免文字被左右鏡像翻轉)
  fill(0); // 設定文字顏色為黑色
  textSize(32); // 設定文字大小
  textAlign(CENTER, TOP); // 對齊畫布中央上方
  // 將偵測到的手指數量顯示在畫面上，方便測試
  text("414730373 | 偵測手指: " + fingers + " | 款式: " + currentEarringIndex, width / 2, 20);

  // 在畫面下方顯示載入進度條或提示文字
  if (!isDetecting) {
    // 如果還沒收到辨識結果，顯示等待進度條
    fill(0);
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("正在初始化攝影機與模型...", width / 2, height - 50);
    
    // 繪製動態進度條 (來回跑動的效果)
    let barWidth = width * 0.5;
    let barHeight = 15;
    let barX = width / 2 - barWidth / 2;
    let barY = height - 40;
    
    stroke(50);
    noFill();
    rect(barX, barY, barWidth, barHeight, 10); // 畫進度條外框
    
    noStroke();
    fill(100, 200, 255);
    // 利用 sin 函數加上 frameCount 製造進度條動畫
    let progress = map(sin(frameCount * 0.05), -1, 1, 0, 1);
    rect(barX, barY, barWidth * progress, barHeight, 10); // 畫會動的進度條
  } else if (predictions.length === 0) {
    // 模型已啟動，但沒有偵測到臉部
    fill(255, 0, 0); // 紅色警告文字
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("未偵測到臉部，請確保您的臉部在鏡頭範圍內", width / 2, height - 30);
  }
}

// 繪製耳環的輔助函數
function drawEarring(earlobePoint) {
  if (!earlobePoint) return; // 防呆機制：若 AI 沒抓到該點則直接跳過，避免程式崩潰

  // 將影像上的座標映射到縮放後的影片尺寸範圍內
  // 新版 ml5.js 中，座標變成物件的 .x 與 .y 屬性
  let x = map(earlobePoint.x, 0, video.width, -width * 0.25, width * 0.25);
  let y = map(earlobePoint.y, 0, video.height, -height * 0.25, height * 0.25);
  
  let imgSize = 40; // 可自行調整耳環的顯示大小
  
  // 使用比率計算往外與往上的偏移量
  let offsetXRatio = 0.02; // 設定往外移動的比例 (例如畫布寬度的 2%)
  let offsetYRatio = 0.01; // 設定往上移動的比例 (例如畫布高度的 1%)
  
  // x > 0 代表畫面右側 (往外需增加 x)，x < 0 代表畫面左側 (往外需減少 x)
  let outX = (x > 0 ? 1 : -1) * (width * offsetXRatio);
  let upY = -(height * offsetYRatio); // Y 軸往上是減
  
  let img = earringImgs[currentEarringIndex];
  if (img) {
    image(img, x + outX, y + upY, imgSize, imgSize);
  }
}

// 計算伸出手指數量的輔助函數
function countFingers(hand) {
  let count = 0;
  let keypoints = hand.keypoints;
  
  // 判斷食指、中指、無名指、小指是否伸直 (指尖 Y 座標小於第二關節 Y 座標，假設手朝上)
  if (keypoints[8].y < keypoints[6].y) count++;
  if (keypoints[12].y < keypoints[10].y) count++;
  if (keypoints[16].y < keypoints[14].y) count++;
  if (keypoints[20].y < keypoints[18].y) count++;
  
  // 判斷大拇指 (利用指尖與食指根部的距離，大於大拇指根部與食指根部的距離)
  let dThumbTip = dist(keypoints[4].x, keypoints[4].y, keypoints[5].x, keypoints[5].y);
  let dThumbBase = dist(keypoints[2].x, keypoints[2].y, keypoints[5].x, keypoints[5].y);
  if (dThumbTip > dThumbBase * 1.1) count++; // 稍微調低閾值，讓大拇指更好偵測
  
  return count;
}