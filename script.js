let quiz = [];
let currentQuiz = [];

let current = 0;
let score = 0;

let questionTime = 10;
let timer;
let timeLeft;

let answering = false;
let wrongQuestions = [];

// --------------------
// Fisher-Yatesシャッフル
// --------------------
function shuffle(array) {
    let newArray = [...array];

    for (let i = newArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }

    return newArray;
}

// --------------------
// quiz.jsonから取得
// --------------------
function loadQuiz() {
    console.log("スタート押された");

    fetch("./quiz.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("quiz.jsonの読み込みに失敗しました");
            }
            return response.json();
        })
        .then(data => {
            console.log(data);

            quiz = data;

            if (!Array.isArray(quiz) || quiz.length === 0) {
                alert("問題がありません");
                return;
            }

            startGame();
        })
        .catch(error => {
            console.error(error);
            alert(error.message);
        });
}

// --------------------
// ゲーム開始
// --------------------
function startGame() {
    document.getElementById("startButton").style.display = "none";

    currentQuiz = shuffle(quiz);

    current = 0;
    score = 0;
    wrongQuestions = [];

    showQuestion();
    console.log(currentQuiz);
}

// --------------------
// 問題表示
// --------------------
function showQuestion() {
    answering = false;

    if (!currentQuiz[current]) {
        finishGame();
        return;
    }

    let q = currentQuiz[current];
    console.log("現在の問題データ:", q);

    let rawChoices = q.choices;

    if (typeof rawChoices === "string") {
        try {
            rawChoices = JSON.parse(rawChoices.replace(/'/g, '"'));
        } catch (e) {
            rawChoices = rawChoices.split(",");
        }
    }

    if (!Array.isArray(rawChoices)) {
        alert("エラー：選択肢データが正しい配列になっていません。");
        console.error("不正なデータ:", q);
        return;
    }

    let choices = rawChoices.map((choice, index) => ({
        text: choice,
        correct: index === Number(q.answer)
    }));

    choices = shuffle(choices);

    q.shuffledChoices = choices.map(c => c.text);
    q.shuffledAnswer = choices.findIndex(c => c.correct);

    document.getElementById("question").innerHTML = `
        第 ${current + 1} 問<br><br>
        ${q.question}
    `;

    document.getElementById("status").innerHTML = `
        残り問題 : ${currentQuiz.length - current - 1} 問
    `;

    document.getElementById("result").innerHTML = "";

let html = "";
for (let i = 0; i < q.shuffledChoices.length; i++) {
    html += `
        <button class="choiceButton" onclick="checkAnswer(${i})">
            ${q.shuffledChoices[i]}
        </button><br>
    `;
}

    document.getElementById("choices").innerHTML = html;

    startQuestionTimer();
}

// --------------------
// タイマー
// --------------------
function startQuestionTimer() {
    clearInterval(timer);
    timeLeft = questionTime;

    document.getElementById("timer").innerText = timeLeft;
    document.getElementById("timer").style.color = "black";

    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").innerText = timeLeft;

        if (timeLeft <= 3) {
            document.getElementById("timer").style.color = "red";
        } else {
            document.getElementById("timer").style.color = "black";
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            timeUp();
        }
    }, 1000);
}

// --------------------
// 時間切れ
// --------------------
function timeUp() {
    if (answering) return;
    answering = true;

    const wrongSound = document.getElementById("wrongSound");
    if (wrongSound) wrongSound.play().catch(() => {});

    document.getElementById("result").innerHTML = `
        <h2>時間切れ！</h2>
    `;

    wrongQuestions.push(currentQuiz[current]);

    current++;

    setTimeout(() => {
        if (current >= currentQuiz.length) {
            finishGame();
        } else {
            showQuestion();
        }
    }, 1000);
}

// --------------------
// 回答チェック
// --------------------
function checkAnswer(choice) {
    clearInterval(timer);

    if (answering) return;
    answering = true;

    let q = currentQuiz[current];
    const correct = q.shuffledAnswer;

    document.getElementById("choices").innerHTML = "";

    if (choice === correct) {
        score++;
        const correctSound = document.getElementById("correctSound");
        if (correctSound) correctSound.play().catch(() => {});

        document.getElementById("result").innerHTML = `
            <h1 style="color:green;">○</h1>
            <p>正解！</p>
        `;
    } else {
        wrongQuestions.push(q);

        const wrongSound = document.getElementById("wrongSound");
        if (wrongSound) wrongSound.play().catch(() => {});

        document.getElementById("result").innerHTML = `
            <h1 style="color:red;">×</h1>
            <p>不正解</p>
            <p>正解：${q.shuffledChoices[correct]}</p>
        `;
    }

    current++;

    setTimeout(() => {
        if (current >= currentQuiz.length) {
            finishGame();
        } else {
            showQuestion();
        }
    }, 1000);
}

// --------------------
// 終了
// --------------------
function finishGame() {
    clearInterval(timer);

    let rate = Math.floor((score / currentQuiz.length) * 100);

    document.getElementById("question").innerHTML = "終了！";
    document.getElementById("choices").innerHTML = "";
    document.getElementById("status").innerHTML = "";
    document.getElementById("timer").innerHTML = "";

    document.getElementById("result").innerHTML = `
        <h1>得点 ${score} / ${currentQuiz.length}</h1>
        <h2>正答率 ${rate}%</h2>

        <button onclick="startReview()">復習する</button>
        <button onclick="location.reload()">もう一回</button>
    `;
}

// --------------------
// 復習
// --------------------
function startReview() {
    if (wrongQuestions.length === 0) {
        alert("復習なし！");
        return;
    }

    currentQuiz = shuffle(wrongQuestions);

    wrongQuestions = [];
    current = 0;
    score = 0;

    showQuestion();
}

window.loadQuiz = loadQuiz;