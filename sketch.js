/*
----- Coding Tutorial by Patt Vira ----- 
Name: Interactive Falling Coins (with ml5.js handPose) 
Video Tutorial: https://youtu.be/Fp7nkcKi5Dw

Connect with Patt: @pattvira
https://www.pattvira.com/
----------------------------------------
*/

let grid = [];
let cols, rows;
let size = 10;

let handPose;
let video;
let hands = [];
let options = { flipped: true };

let score = 0; // 分數
let leftBasketX, rightBasketX; // 左右籃子的位置
let basketWidth = 80;
let basketHeight = 20;

let particles = []; // 用於存放彩帶粒子
let gameOver = false; // 遊戲是否結束

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2); // 水平速度
    this.vy = random(-5, -1); // 垂直速度
    this.size = random(5, 10); // 粒子大小
    this.color = color(random(255), random(255), random(255)); // 隨機顏色
    this.alpha = 255; // 透明度
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5; // 漸漸消失
  }

  draw() {
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha);
    ellipse(this.x, this.y, this.size);
  }

  isFinished() {
    return this.alpha <= 0; // 當透明度為 0 時，粒子消失
  }
}

function preload() {
  handPose = ml5.handPose(options);
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);

  cols = floor(width / size);
  rows = floor(height / size);
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0;
    }
  }

  leftBasketX = width / 4; // 左籃子初始位置
  rightBasketX = (3 * width) / 4; // 右籃子初始位置
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);

  // 檢查分數是否達到 500 並且遊戲尚未結束
  if (score >= 500 && !gameOver) {
    gameOver = true; // 標記遊戲結束

    // 顯示成功畫面
    fill(0, 255, 0); // 綠色文字
    textSize(48);
    textAlign(CENTER, CENTER);
    text("遊戲結束", width / 2, height / 2);

    // 生成大量彩帶粒子
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle(random(width), random(height)));
    }
  }

  // 如果遊戲結束，繼續繪製粒子
  if (gameOver) {
    // 顯示遊戲結束文字
    fill(0, 255, 0); // 綠色文字
    textSize(48);
    textAlign(CENTER, CENTER);
    text("遊戲結束", width / 2, height / 2);

    // 更新並繪製粒子
    updateParticles();
    drawParticles();
    return; // 停止執行其他遊戲邏輯
  }

  // 繪製籃子
  fill(255);
  rectMode(CENTER);
  rect(leftBasketX, height - 30, basketWidth, basketHeight); // 左籃子
  rect(rightBasketX, height - 30, basketWidth, basketHeight); // 右籃子

  // 在籃子上方顯示文字
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("教育科技學系", leftBasketX, height - 50); // 左籃子文字
  text("教育科技學系", rightBasketX, height - 50); // 右籃子文字

  // 顯示分數
  rectMode(CORNER); // 恢復 rectMode 為默認值
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP); // 確保分數對齊方式為左上角
  text(`Score: ${score}`, 10, 10);

  // 更新籃子位置（根據手勢）
  if (hands.length > 0) {
    let hand = hands[0];
    let indexFinger = hand.keypoints[8]; // 食指
    leftBasketX = constrain(indexFinger.x, basketWidth / 2, width / 2 - basketWidth / 2);
  }
  if (hands.length > 1) {
    let hand = hands[1];
    let indexFinger = hand.keypoints[8]; // 食指
    rightBasketX = constrain(indexFinger.x, width / 2 + basketWidth / 2, width - basketWidth / 2);
  }

  // 隨機生成金幣、愛心或炸彈
  if (frameCount % 30 === 0) { // 每 30 幀生成一次
    let x = floor(random(cols));
    let randomItem = random();
    if (randomItem < 0.4) {
      grid[x][0] = (frameCount % 205) + 50; // 金幣
    } else if (randomItem < 0.8) {
      grid[x][0] = -(frameCount % 205) - 50; // 愛心
    } else {
      grid[x][0] = 999; // 炸彈
    }
  }

  // 掉落物邏輯
  updateGrid(); // 更新物體狀態
  drawRect();   // 繪製物體

  // 更新並繪製彩帶粒子
  updateParticles();
  drawParticles();
}

function drawRect() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] > 0 && grid[i][j] !== 999) {
        // 繪製金幣
        noStroke();
        fill(255, 223, 0); // 金幣顏色
        ellipse(i * size + size / 2, j * size + size / 2, size * 2, size * 2);

        // 檢查是否被左籃子接住
        if (j === rows - 1 && abs(i * size + size / 2 - leftBasketX) < basketWidth / 2) {
          score += 10; // 金幣加 10 分
          grid[i][j] = 0; // 移除金幣
          continue;
        }

        // 檢查是否被右籃子接住
        if (j === rows - 1 && abs(i * size + size / 2 - rightBasketX) < basketWidth / 2) {
          score += 10; // 金幣加 10 分
          grid[i][j] = 0; // 移除金幣
          continue;
        }
      } else if (grid[i][j] < 0) {
        // 繪製愛心
        noStroke();
        fill(255, 0, 0); // 愛心顏色
        drawHeart(i * size + size / 2, j * size + size / 2, size);

        // 檢查是否被左籃子接住
        if (j === rows - 1 && abs(i * size + size / 2 - leftBasketX) < basketWidth / 2) {
          score += 20; // 愛心加 20 分
          grid[i][j] = 0; // 移除愛心
          continue;
        }

        // 檢查是否被右籃子接住
        if (j === rows - 1 && abs(i * size + size / 2 - rightBasketX) < basketWidth / 2) {
          score += 20; // 愛心加 20 分
          grid[i][j] = 0; // 移除愛心
          continue;
        }
      } else if (grid[i][j] === 999) {
        // 繪製炸彈
        noStroke();
        fill(50);
        ellipse(i * size + size / 2, j * size + size / 2, size * 2, size * 2);

        // 在炸彈上方顯示文字
        fill(255);
        textSize(12);
        textAlign(CENTER, BOTTOM);
        text("教育科技學系", i * size + size / 2, j * size + size / 2 - size);

        // 檢查是否被左籃子接住
        if (j === rows - 1 && abs(i * size + size / 2 - leftBasketX) < basketWidth / 2) {
          score -= 30; // 被炸彈扣 30 分
          grid[i][j] = 0; // 移除炸彈
          continue;
        }

        // 檢查是否被右籃子接住
        if (j === rows - 1 && abs(i * size + size / 2 - rightBasketX) < basketWidth / 2) {
          score -= 30; // 被炸彈扣 30 分
          grid[i][j] = 0; // 移除炸彈
          continue;
        }
      }
    }
  }
}

function drawHeart(x, y, size) {
  size *= 1.5; // 放大愛心 1.5 倍（比之前小）
  beginShape();
  vertex(x, y);
  bezierVertex(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size);
  bezierVertex(x + size, y + size / 3, x + size / 2, y - size / 2, x, y);
  endShape(CLOSE);
}

function updateGrid() {
  let nextGrid = [];
  for (let i = 0; i < cols; i++) {
    nextGrid[i] = [];
    for (let j = 0; j < rows; j++) {
      nextGrid[i][j] = 0;
    }
  }

  for (let i = 0; i < cols; i++) {
    for (let j = rows - 1; j >= 0; j--) { // 從底部開始檢查
      let state = grid[i][j];
      if (state !== 0) {
        if (j + 1 < rows) { // 確保不超出邊界
          let below = grid[i][j + 1];
          if (below === 0) {
            nextGrid[i][j + 1] = state; // 向下移動
          } else {
            nextGrid[i][j] = state; // 保持原位
          }
        } else {
          nextGrid[i][j] = state; // 保持原位
        }
      }
    }
  }

  grid = nextGrid;
}

function updateParticles() {
  // 更新粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    if (p.isFinished()) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  // 繪製粒子
  for (let p of particles) {
    p.draw();
  }
}

function gotHands(results) {
  hands = results;
}

function keyPressed() {
  if (key === 'R' || key === 'r') {
    // 重置遊戲
    score = 0;
    grid = [];
    for (let i = 0; i < cols; i++) {
      grid[i] = [];
      for (let j = 0; j < rows; j++) {
        grid[i][j] = 0;
      }
    }
    particles = []; // 清空粒子
    gameOver = false; // 重置遊戲結束狀態
    loop(); // 恢復 draw 的循環
  }
}





