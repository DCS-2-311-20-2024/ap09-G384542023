//
// 応用プログラミング 第9,10回 自由課題 (ap0901.js)
// G384542023 髙橋 遥翔
//
"use strict"; // 厳格モード

// ライブラリをモジュールとして読み込む
import * as THREE from "three";
import { GUI } from "ili-gui";
import { MeshPhongMaterial } from 'three';

// ３Ｄページ作成関数の定義
function init() {
  // 制御変数の定義
  const param = { //カメラの設定値
    fov: 60, // 視野角
    x: 0,
    y: 25,
    z: 10,
    nRow: 1, /* ブロックの行数 */
    nCol: 1, /* ブロックの列数 */
    axes: false, // 座標軸
  };

  // GUIコントローラの設定
  const gui = new GUI();
  gui.add(param, "axes").name("座標軸");

  // シーン作成
  const scene = new THREE.Scene();
  
  //背景の設定
  const loader = new THREE.TextureLoader();
  const texture = loader.load('地上.jpeg'); // 地上背景画像を指定
  scene.background = texture;

  // 座標軸の設定
  const axes = new THREE.AxesHelper(18);
  scene.add(axes);

  //ブロック数のカウント
  let nBrick = 0

  //スコア表示
  let level = 1;
  let score = 0;
  let life = 5;
  function setScore(score) {
    document.getElementById("score").innerText
      = String(Math.round(score)).padStart(8, "0");
    document.getElementById("life").innerText
      = (life > 0) ? "○○○○○".substring(0, life) : "-- Game Over --";
  }

  // Geometry の分割数
  const nSeg = 24;
  const pi = Math.PI;

  // ボール ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
  // ボールの作成
  const ballR = 0.3;
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(ballR, nSeg, nSeg),
    new THREE.MeshPhongMaterial({ color: 0x808080, shininess: 100, specular: 0xa0a0a0 })
  );
  ball.geometry.computeBoundingSphere();
  scene.add(ball);

   // ボールの移動
   const vBall = new THREE.Vector3();
   let vx = Math.sin(pi / 4);
   let vz = -Math.cos(pi / 4);
 
   function moveBall(delta) {
     if (ballLive) {
       vBall.set(vx, 0, vz)
       ball.position.addScaledVector(vBall, delta * speed);
     }
     else{
       ball.position.x = paddle.position.x;
       ball.position.z = paddle.position.z - (paddleR + ballR);
     }
   }

   // ボールの死活
  let ballLive = false;
  let speed = 0;

  // ボールを停止する
  function stopBall() {
    ballLive = false;
  }

  // ボールを動かす
  function startBall() {
    if(level == 1){
      speed = 5;
    }
    if(level > 1 && level <= 3 && nBrick == 0){
      speed = speed*2
    }else if(level > 3 && level <= 6 && nBrick == 0){
      speed += 3; // ボールの速度を増加
    }else if(level > 6 && level <= 9 && nBrick == 0){
      speed += 2;
    }else if(level == 1 && nBrick == 0){
      speed = speed*1.5;
    }
    ballLive = true;
    if(life <= 0){
      remakeBricks();
      score = 0;
      life = 5;
      level = 1;
    }
  }

  // マウスクリックでスタートする
  window.addEventListener("mousedown", () => {
    if (!ballLive) { startBall(); }
  }, false);

  // 外枠 ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
  // 枠の作成
  //   大きさの定義
  const hFrameW = 22;  const hFrameH = 2;  const hFrameD = 1;
  const vFrameW = 0.5;  const vFrameH = 1.2;  const vFrameD = 22;
  {
    //   上の枠
    const tFrame = new THREE.Mesh(
      new THREE.BoxGeometry(hFrameW, hFrameH, hFrameD),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    tFrame.position.z = -(vFrameD + hFrameD) / 2;
    scene.add(tFrame);
    //   下の枠
    const bFrame = tFrame.clone();
    bFrame.position.z = (vFrameD + hFrameD) / 2;
    scene.add(bFrame);
    //   左の枠
    const lFrame = new THREE.Mesh(
      new THREE.BoxGeometry(vFrameW, vFrameH, vFrameD),
      new MeshPhongMaterial({ color: 0xB3B3B3 })
    );
    lFrame.position.x = -(-vFrameW +hFrameW) / 2;
    scene.add(lFrame);

    //   右の枠
    const rFrame = lFrame.clone();
    rFrame.position.x =  (-vFrameW + hFrameW) / 2;
    scene.add(rFrame);

  }

  // 壁で反射させる
  const hLimit = hFrameW / 2 - vFrameW;
  const vLimit = vFrameD / 2;
  function frameCheck() {
    // 右
    if (ball.position.x + ballR > hLimit) {
      ball.position.x = hLimit - ballR;
      vx = -Math.abs(vx);
    }

    // 左
    if (-ball.position.x - ballR > hLimit) {
      ball.position.x = -hLimit + ballR;
      vx = Math.abs(vx);
    }

    // 上
    if (-ball.position.z - ballR > vLimit) {
      ball.position.z = -vLimit + ballR;
      vz = Math.abs(vz);
    }

    // 下
    if (ball.position.z + ballR > vLimit) {
      life = life-1;
      stopBall();
    }
  }

  // パドル ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
  // パドルの作成
  const paddleR = 0.3;
  const paddleL = 1.5;
  const paddle = new THREE.Group(); // パドルグループ
  {
    // パドル中央
    const center = new THREE.Mesh(
      new THREE.CylinderGeometry(paddleR, paddleR, paddleL, nSeg),
      new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 100, specular: 0x404040 })
    );
    center.rotation.z = Math.PI/2;
    paddle.add(center);

    // パドル端
    const sideGeometry
      = new THREE.SphereGeometry(paddleR, nSeg, nSeg, Math.PI / 2, Math.PI);
    const sideMaterial
      = new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 100, specular: 0xa0a0a0 })
    // パドル端(右)
    const right = new THREE.Mesh(sideGeometry,sideMaterial);
    right.position.x = paddleL/2;
    paddle.add(right);

    // パドル端(左)
    const left = right.clone();
    left.rotation.z = Math.PI/2;
    left.position.x = -paddleL/2;
    paddle.add(left);


    // パドルの配置
    paddle.position.z = 0.4 * vFrameD;
    scene.add(paddle)

  }
  

  // パドル操作
  {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const intersects = new THREE.Vector3();
    function paddleMove(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, intersects);
      const offset = hFrameW / 2 - vFrameW - paddleL / 2 - paddleR;
      if(intersects.x < -offset){
        intersects.x = -offset;
      }
      else if (intersects.x > offset){
        intersects.x = offset;
      }
      paddle.position.x = intersects.x;
    }
    window.addEventListener("mousemove", paddleMove, false);
  }

  // パドルの衝突検出
  function paddleCheck() {
    if ( Math.abs(ball.position.z - paddle.position.z) < paddleR + ballR &&
         Math.abs(ball.position.x - paddle.position.x) < (paddleL/2) + ballR) {
      //中央部分と衝突
      if ( ball.position.z < paddle.position.z) {
        vz = -Math.abs(vz);
      }
      //右側部分と衝突
      if ( ball.position.x > paddle.position.x + paddleL/2){
        vx = Math.abs(vx);
      }
      //左側部分と衝突
      else if ( ball.position.x < paddle.position.x - paddleL/2) {
        vx = -Math.abs(vx)
      }
      if(nBrick <= 0) {
        resetBrick();
      }
    }
  
  }

  // ブロック ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
  // ブロックの生成
  const bricks = new THREE.Group();
  function makeBricks() {
    const color = ["white", "red", "yellow", "blue", "purple", "green","pink"];
    const h = 0.8; /* ブロックの高さ */
    const d = 0.4; /* ブロックの奥行 */
    const gapX = 0.1; /* 横方向の隙間 */
    const gapZ = 0.3; /* 縦方向の隙間 */

    // ブロックの幅
    const w = (hFrameW - 2 * vFrameW - (param.nCol + 1) * gapX) / param.nCol;
    // ブロックを並べる
    for (let r = 0; r < param.nRow; r++) {
      for (let c = 0; c < param.nCol; c++){
        const brick = new THREE.Mesh(
          new THREE.BoxGeometry(w,h,d),
          new THREE.MeshLambertMaterial({color: color[r % color.length]})
        );
        brick.position.set(
          (w + gapX) * ((param.nCol-1)/2 - c),
          0,
          -(d + gapZ) * r
        )
        brick.geometry.computeBoundingBox();
        bricks.add(brick);
        nBrick++;
      }
    }

    // ブロック全体を奥に移動する
    bricks.position.z = -4;
    scene.add(bricks);

  }
  makeBricks();

  function remakeBricks() {
    stopBall(); //ボールを止めて
    scene.remove(bricks); //シーンからブロックを削除する
    bricks.clear(); //ブロックのグループを空にして
    nBrick = 0;
    makeBricks();  //新しい数のブロックを作り
    scene.add(bricks);  //シーンに追加する
  }

  // ブロックの衝突検出
  function brickCheck() {
    let hit = false;
    const sphere = ball.geometry.boundingSphere.clone();
    sphere.translate(ball.position);
    bricks.children.forEach((brick) => {
      if (!hit && brick.visible) {
        let box = brick.geometry.boundingBox.clone();
        box.translate(bricks.position);
        box.translate(brick.position);
        if (box.intersectsSphere(sphere)){
          hit = true;
          brick.visible = false;
          nBrick--;
          score += (-brick.position.z + 1) * 100;
          if(nBrick == 0){
            increaseLevel();
          }
          vz = -vz;
        }
      }
    });
  }

  //レベル設定
  function increaseLevel() {
    level++
    document.getElementById("level").innerText = level;
    if(level <= 10){
      param.nRow = Math.min(10, param.nRow + 1); // 行数を増加
      param.nCol = Math.min(10, param.nCol + 1); // 列数を増加
      makeBricks();
      score += 1000*(level-1); // レベルアップ時にスコアボーナス
      if(level <= 3){
        speed = speed*2
      }else if(level<=6){
        speed += 3; // ボールの速度を増加
        const loader = new THREE.TextureLoader();
        const texture = loader.load('海.jpg'); // 海背景画像を指定
        scene.background = texture;
      }else if(level <= 9){
        speed += 2;
        const loader = new THREE.TextureLoader();
        const texture = loader.load('空.png'); // 空背景画像を指定
        scene.background = texture;
      }else if(level == 10){
        // 背景画像
        speed = speed*1.5;
        const loader = new THREE.TextureLoader();
        const texture = loader.load('宇宙.jpg'); // 宇宙背景画像を指定
        scene.background = texture;
      }
    }//else{
    // //   //レベルやボールをリセットさせる
    // }
  }

  // ブロックの再表示
  function resetBrick() {
    nBrick = 0;
    bricks.children.forEach((brick) => {
      brick.visible = true;
      nBrick++;
    });
  }

  // 光源の設定
  const light = new THREE.SpotLight(0xffffff, 1000);
  light.position.set(0, 15, -10);
  scene.add(light);

  // カメラの作成
  const camera = new THREE.PerspectiveCamera(
    param.fov, window.innerWidth/window.innerHeight, 0.1, 1000);

  // レンダラの設定
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, innerHeight);
  renderer.setClearColor(0x305070);
  document.getElementById("WebGL-output").appendChild(renderer.domElement);

  // 描画処理
  const clock = new THREE.Clock(); // 時間の管理
  // 描画関数
  function render(time) {
    camera.fov = param.fov;
    camera.position.x = param.x;
    camera.position.y = param.y;
    camera.position.z = param.z;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    // 座標軸の表示
    axes.visible = param.axes;
    // ゲーム画面の更新
    let delta = clock.getDelta(); // 経過時間の取得
    frameCheck(); // 枠の衝突判定
    paddleCheck(); // パドルの衝突判定
    brickCheck(); // ブロックの衝突判定
    moveBall(delta); // ボールの移動
    setScore(score); // スコア更新
    // 再描画
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  // 描画開始
  render();
}

init();