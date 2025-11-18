// 獲取 canvas 元素和 2D 繪圖上下文
const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

// 設定畫布尺寸為全視窗
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 角色 1 動畫相關的常數
const SPRITE_SHEET_SRC_1 = 'character/combination_character.png';
const SPRITE_WIDTH_1 = 583;
const SPRITE_HEIGHT_1 = 110;
const NUM_FRAMES_1 = 7;
const FRAME_WIDTH_1 = SPRITE_WIDTH_1 / NUM_FRAMES_1;
const FRAME_HEIGHT_1 = SPRITE_HEIGHT_1;

// 角色 2 動畫相關的常數
const SPRITE_SHEET_SRC_2 = 'character 2/combination_character 2.png';
const SPRITE_WIDTH_2 = 940;
const SPRITE_HEIGHT_2 = 110;
const NUM_FRAMES_2 = 7;
const FRAME_WIDTH_2 = SPRITE_WIDTH_2 / NUM_FRAMES_2;
const FRAME_HEIGHT_2 = SPRITE_HEIGHT_2;

// 動畫狀態
let currentFrame = 0;
// animationSpeed 將變為動態
let lastTime = 0;
let animationStarted = false;

// Web Audio API 相關設定
let audioCtx;
let analyser;
let dataArray;
const AUDIO_FILE_PATH = 'audio/street-fighter-theme.mp3';

// 獲取 HTML 元素
const playButton = document.getElementById('playButton');
const overlay = document.getElementById('overlay');


// 建立圖片物件
const spriteImage1 = new Image();
spriteImage1.src = SPRITE_SHEET_SRC_1;

const spriteImage2 = new Image();
spriteImage2.src = SPRITE_SHEET_SRC_2;

// 圖片載入管理
let imagesLoaded = 0;
const totalImages = 2;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        // 圖片載入完成後，按鈕變為可用
        playButton.disabled = false;
        playButton.textContent = '播放音樂並開始';
    }
}

// 設定 Web Audio
function setupAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256; // 分析的精細度
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    // 使用 fetch 載入音訊檔案
    fetch(AUDIO_FILE_PATH)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = true; // 讓音樂循環播放

            // 連接節點：source -> analyser -> speakers
            source.connect(analyser);
            analyser.connect(audioCtx.destination);

            source.start();
            animationStarted = true;
            requestAnimationFrame(animate); // 開始動畫循環
        })
        .catch(e => {
            console.error("載入音訊時出錯:", e);
            alert("無法載入音訊檔案，請檢查檔案路徑或格式。");
        });
}

// 主要動畫循環函數
function animate(timestamp) {
    if (!animationStarted) return;

    // 從分析器獲取振幅數據
    analyser.getByteTimeDomainData(dataArray);

    // 計算平均振幅 (RMS - 均方根)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        // 將數據從 0-255 範圍轉換到 -1.0 到 1.0
        const normSample = (dataArray[i] / 128.0) - 1.0;
        sum += normSample * normSample;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    // 將振幅 (0 到 ~0.7) 映射到動畫速度 (例如 500ms 到 50ms)
    // 振幅越大 -> rms 越大 -> animationSpeed 越小 -> 動畫越快
    const maxSpeed = 500; // 最慢速度 (ms/幀)
    const minSpeed = 50;  // 最快速度 (ms/幀)
    // 使用 Math.min 確保 rms 不會超出預期範圍
    const dynamicAnimationSpeed = maxSpeed - (Math.min(rms, 1) * (maxSpeed - minSpeed));

    // 計算時間差，以控制動畫速度
    const deltaTime = timestamp - lastTime;

    // 清除上一幀的畫布 (背景色由 CSS 設定)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (deltaTime > dynamicAnimationSpeed) {
        // 更新當前幀數 (兩個角色共用幀數，因為都是7幀)
        currentFrame = (currentFrame + 1) % NUM_FRAMES_1;
        lastTime = timestamp;
    }

    // --- 繪製角色 1 ---
    // 計算兩個角色並排後的總寬度，並讓它們整體居中
    const characterSpacing = 50; // 角色之間的間距
    const totalCharactersWidth = FRAME_WIDTH_1 + FRAME_WIDTH_2 + characterSpacing;
    const startX = (canvas.width / 2) - (totalCharactersWidth / 2);
 
    const drawX1 = startX;
    const drawY1 = (canvas.height / 2) - (FRAME_HEIGHT_1 / 2); // 垂直居中
 
    ctx.drawImage(
        spriteImage1,
        currentFrame * FRAME_WIDTH_1, // 從 sprite sheet 切割的 X 座標
        0,
        FRAME_WIDTH_1,
        FRAME_HEIGHT_1,
        drawX1, // 在 canvas 上繪製的 X 座標
        drawY1,
        FRAME_WIDTH_1,
        FRAME_HEIGHT_1
    );
 
    // --- 繪製角色 2 ---
    const drawX2 = drawX1 + FRAME_WIDTH_1 + characterSpacing;
    const drawY2 = (canvas.height / 2) - (FRAME_HEIGHT_2 / 2); // 垂直居中
 
    ctx.drawImage(
        spriteImage2,
        currentFrame * FRAME_WIDTH_2, // 從 sprite sheet 切割的 X 座標
        0,
        FRAME_WIDTH_2,
        FRAME_HEIGHT_2,
        drawX2, // 在 canvas 上繪製的 X 座標
        drawY2,
        FRAME_WIDTH_2,
        FRAME_HEIGHT_2
    );
 
    // 請求瀏覽器在下一次重繪之前呼叫 animate 函數，以產生連續動畫
    requestAnimationFrame(animate);
}

// 為兩張圖片設定載入完成後的回呼函數
playButton.disabled = true;
playButton.textContent = '載入中...';
spriteImage1.onload = onImageLoad;
spriteImage2.onload = onImageLoad;

// 監聽按鈕點擊事件
playButton.addEventListener('click', () => {
    // 確保 AudioContext 在用戶互動後啟動
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    setupAudio();
    // 隱藏按鈕和覆蓋層
    overlay.style.display = 'none';
});

// 監聽視窗大小變化，動態調整畫布尺寸
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
