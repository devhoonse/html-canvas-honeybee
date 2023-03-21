var canvas = document.getElementById('myCanvas');

// returns a drawing context on the canvas,
// or null if the context identifier is not supported,
// or the canvas has already been set to a different context mode.
var context = canvas.getContext('2d');

/* -------------------------------------------
  Example : 꿀벌 모험 게임
 -------------------------------------------*/

// 캔버스 배경 이미지
var backgroundImage = new Image();
backgroundImage.src = 'images/background.png';

// 꿀벌 이미지
var beeImage = new Image();
beeImage.src = 'images/bee.png';

// 꽃 이미지
var flowerImage = new Image();
flowerImage.src = 'images/flower.png';

// 꿀벌이 꽃에 충돌했을 때 사운드
var collisionSound = new Audio('sounds/hit.mp3');

// 게임 상태관리
var lastUpdateTime = 0; // 마지막으로 프레임을 업데이트한 시간
var acDelta = 0; // 마지막 프레임 업데이트로부터 몇 밀리초가 지났는지 기록
var msPerFrame = 1000; // 마지막 프레임 업데이트로부터 몇 밀리초가 지나야 프레임을 갱신할 지 시간 간격
var keysPressed = {}; // 누른 키 목록
var backgroundImageReady = false; // 배경 이미지 준비 상태
var score = 0; // 게임 점수
var bee = { // 꿀벌 상태
    ready: false, // 꿀벌 이미지 준비 상태
    speed: 5, // 꿀벌 이동 속도
    offset: 0, // 꿀벌 이동 방향
    frame: 0, // 꿀벌 애니메이션 프레임
    x: canvas.width / 2, // 꿀벌 위치 X 좌표
    y: canvas.height / 2 // 꿀벌 위치 Y 좌표
};
var flower = { // 꽃 상태
    ready: false, // 꽃 이미지 준비 상태
    x: 0, // 꽃 위치 X 좌표
    y: 0 // 꽃 위치 Y 좌표
};

// 캔버스 배경 이미지 로드에 성공하면
backgroundImage.onload = function () {
    backgroundImageReady = true;
};

// 꿀벌 이미지 로드에 성공하면
beeImage.onload = function () {
    bee.ready = true;
};

// 꽃 이미지 로드에 성공하면
flowerImage.onload = function () {
    flower.ready = true;
};

// 키보드 입력이 감지되면 어떤 키를 눌렀는지 기록합니다.
document.addEventListener('keydown', function (event) {
    keysPressed[event.keyCode] = true;
}, false);

// 키보드 입력이 해제될 때 키 입력 기록을 제거합니다.
document.addEventListener('keyup', function (event) {
    delete keysPressed[event.keyCode];
}, false);

// 게임을 시작합니다.
resetFlower();
main();

/**
 * 게임 프레임 상황을 업데이트 합니다.
 */
function main() {
    update();
    render();
    requestAnimationFrame(main);
}

/**
 * 입력된 키에 따라 꿀벌의 위치와 향하는 방향을 변경합니다.
 */
function update() {
    if (38 in keysPressed) { // up
        bee.offset = 144;
        bee.y -= bee.speed;
    } else if (40 in keysPressed) { // down
        bee.offset = 0;
        bee.y += bee.speed;
    } else if (37 in keysPressed) { // left
        bee.offset = 48;
        bee.x -= bee.speed;
    } else if (39 in keysPressed) { // right
        bee.offset = 96;
        bee.x += bee.speed;
    }

    // 캔버스 영역을 벗어나지 않도록 이동 가능 위치 제한
    if (bee.x <= 0) bee.x = 0;
    if (bee.x >= canvas.width - 32) bee.x = canvas.width - 32;
    if (bee.y <= 0) bee.y = 0;
    if (bee.y >= canvas.height - 48) bee.y = canvas.height - 48;

    // 꿀벌이 꽃에 충돌하면 꽃의 위치를 랜덤하게 재배치합니다.
    if (checkCollision()) {
        score++; // 점수를 1점 추가합니다.
        collisionSound.play(); // 꿀벌과 꽃의 충돌 사운드를 재생합니다.
        resetFlower(); // 꽃을 다른 위치로 랜덤하게 재배치합니다.
    }
}

/**
 * 게임 화면을 새로 그립니다.
 */
function render() {
    const delta = Date.now() - lastUpdateTime; // 마지막 프레임 업데이트로부터 몇 밀리초가 지나서 실행되는 건지 계산

    // 마지막 프레임 업데이트로부터 충분한 시간(msPerFrame)이 경과되었으면 프레임을 업데이트 합니다.
    if (acDelta > msPerFrame) {
        acDelta = 0; // 지금 프레임 업데이트를 할 것이므로, 마지막 프레임 업데이트로부터의 경과 시간 기록을 초기화합니다.

        // 게임 프레임을 다시 그립니다.
        if (backgroundImageReady) drawBackgroundImage(); // 배경 이미지
        if (bee.ready) drawBeeImage(); // 꿀벌 이미지
        if (flower.ready) drawFlower(); // 꽃 이미지
        drawScore(); // 점수판 이미지

        // 다음 프레임에서의 꿀벌 모습을 다음 프레임 이미지로 바꿉니다.
        bee.frame++;
        if (bee.frame >= 3) bee.frame = 0; // 모든 프레임을 재생했다면, 첫 프레임부터 돌아가서 재생합니다.

    } else {
        // 마지막 프레임 업데이트로부터 아직 충분한 시간(msPerFrame)이 경과되지 않았다면 조금 더 기다립니다.
        acDelta += delta; // 마지막 프레임 업데이트로부터 지난 시간을 업데이트 합니다.
    }
}

/**
 * 꿀벌과 꽃의 충돌 여부를 반환합니다.
 */
function checkCollision() {
    return (
      flower.x - 16 <= bee.x && bee.x <= flower.x + 16
      && flower.y - 24 <= bee.y && bee.y <= flower.y + 24
    );
}

/**
 * 꽃의 위치를 랜덤하게 재배치합니다.
 */
function resetFlower() {
    flower.x = 32 + (Math.random()*(canvas.width - 64));
    flower.y = 32 + (Math.random()*(canvas.height - 64));
}

/**
 * 캔버스에 배경 이미지를 그립니다.
 */
function drawBackgroundImage() {
    context.drawImage(backgroundImage, 0, 0); // image, dx, dy
}

/**
 * 캔버스에 꿀벌 스프라이트로부터 잘라낸 이미지를 그립니다.
 */
function drawBeeImage() {
    context.drawImage(beeImage, 32*bee.frame, bee.offset, 32, 48, bee.x, bee.y, 32, 48); // image, dx, dy
}

/**
 * 캔버스에 꽃 이미지를 그립니다.
 */
function drawFlower() {
    context.drawImage(flowerImage, flower.x, flower.y);
}

function drawScore() {
    context.fillStyle = 'rgb(250, 250, 250)';
    context.font = 'bold 20px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText(`SCORE: ${score}`, canvas.width/2, 10); // string, x, y
}
